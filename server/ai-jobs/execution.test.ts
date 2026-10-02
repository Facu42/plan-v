import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ consent: vi.fn(), generate: vi.fn(), rpc: vi.fn(), save: vi.fn() }));
vi.mock('../care/consents.js', () => ({ requireCareConsent: mocks.consent }));
vi.mock('../ai/recipe-draft.js', () => ({ generateRecipeDraft: mocks.generate }));
vi.mock('../recipes/repository.js', () => ({ resetRecipeMemory: vi.fn(), listProfessionalRecipes: vi.fn().mockResolvedValue([]), saveRecipeDraft: mocks.save }));
vi.mock('../db/supabase-client.js', () => ({ getRequestDb: () => ({ rpc: mocks.rpc }) }));

import { enqueueAiJob, runAiJob, applyAiJob, resetAiJobMemory, CareError } from './repository.js';
import { buildRecipeJobContext, hashAiContext } from '../ai/context.js';
import { emptyIntakePayload } from '../intake/payload.js';
import { DEMO_NUTRITIONIST_ID, resetStore } from '../store.js';

let intake: ReturnType<typeof emptyIntakePayload>;
let row: Record<string, unknown>;
const patientId = 'pat-sofia';
const result = { source: 'ai', recipe: { id: '30000000-0000-4000-a000-000000000001', title: 'Prueba sintética', yield_portions: 1, steps: ['Revisar'], items: [{ name: 'Ingrediente', quantity: 1, unit: 'u' }] }, warnings: [] };

beforeEach(() => {
  vi.resetAllMocks(); resetStore(); resetAiJobMemory();
  vi.stubEnv('APP_MODE', 'test'); vi.stubEnv('AI_MODE', 'demo');
  intake = { ...emptyIntakePayload(), allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } };
  mocks.consent.mockImplementation(async () => ({ intake: { payload: intake }, consents: [] }));
  mocks.generate.mockResolvedValue(result);
  row = { id: '20000000-0000-4000-a000-000000000001', patient_id: patientId, job_type: 'recipe_draft', status: 'queued', model: 'demo', prompt_version: 'recipe_draft.v1', context_hash: hashAiContext(buildRecipeJobContext({ intake })), request: {}, created_at: new Date().toISOString(), artifact: null };
  mocks.rpc.mockImplementation(async (name: string, args: { payload?: Record<string, unknown> }) => {
    if (name === 'get_ai_job') return { data: row, error: null };
    if (name === 'claim_ai_job') return { data: { ...row, status: 'running', run_token: '40000000-0000-4000-a000-000000000001' }, error: null };
    if (name === 'finish_ai_job') { row = { ...row, ...args.payload }; return { data: row, error: null }; }
    throw new Error(`Unexpected synthetic RPC: ${name}`);
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('ejecución de jobs sin proveedores externos', () => {
  it('termina fallido el intento si recuperar contexto falla antes del proveedor', async () => {
    mocks.consent.mockRejectedValueOnce(new CareError(403, 'Permiso retirado'));
    await expect(runAiJob(DEMO_NUTRITIONIST_ID, String(row.id), true)).rejects.toMatchObject({ status: 403 });
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith('finish_ai_job', { payload: expect.objectContaining({ status: 'failed', run_token: '40000000-0000-4000-a000-000000000001', artifact: null }) });
  });

  it.each([false, true])('descarta generación si el permiso se retira durante la llamada (persistente=%s)', async persistent => {
    const job = persistent ? row : await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patientId, job_type: 'recipe_draft' }, false);
    mocks.generate.mockImplementationOnce(async () => { mocks.consent.mockRejectedValue(new CareError(403, 'Permiso retirado')); return result; });
    await expect(runAiJob(DEMO_NUTRITIONIST_ID, String(job.id), persistent)).rejects.toMatchObject({ status: 403 });
    if (persistent) expect(row).toMatchObject({ status: 'failed', artifact: null });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([false, true])('marca stale si cambian alergias mientras genera (persistente=%s)', async persistent => {
    const job = persistent ? row : await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patientId, job_type: 'recipe_draft' }, false);
    mocks.generate.mockImplementationOnce(async () => { intake.allergies = { state: 'reported', items: ['Maní'] }; return result; });
    expect(await runAiJob(DEMO_NUTRITIONIST_ID, String(job.id), persistent)).toMatchObject({ status: 'stale', artifact: null });
  });

  it.each([false, true])('no aplica una propuesta cuyo contexto cambió (persistente=%s)', async persistent => {
    const job = persistent ? row : await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patientId, job_type: 'recipe_draft' }, false);
    await runAiJob(DEMO_NUTRITIONIST_ID, String(job.id), persistent);
    intake.allergies = { state: 'reported', items: ['Maní'] };
    await expect(applyAiJob(DEMO_NUTRITIONIST_ID, String(job.id), persistent)).rejects.toMatchObject({ status: 409 });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.rpc.mock.calls.some(([name]) => name === 'apply_ai_job')).toBe(false);
  });

  it('registra el modelo seleccionado y rechaza períodos inválidos sin contexto ni proveedor', async () => {
    vi.stubEnv('AI_MODE', 'live'); vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only'); vi.stubEnv('OPENROUTER_MODEL', 'synthetic/model:free');
    const job = await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patientId, job_type: 'recipe_draft' }, false);
    expect(job.model).toBe('synthetic/model:free');
    mocks.consent.mockClear();
    await expect(enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patientId, job_type: 'menu_draft', period_start: '2026-10-01', period_end: '2026-11-01' }, false)).rejects.toMatchObject({ status: 400 });
    expect(mocks.consent).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });

  it('no acepta un resultado que llega después de vencer la reserva', async () => {
    vi.useFakeTimers();
    const job = await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patientId, job_type: 'recipe_draft' }, false);
    mocks.generate.mockImplementationOnce(async () => { vi.setSystemTime(Date.now() + 121_000); return result; });
    expect(await runAiJob(DEMO_NUTRITIONIST_ID, job.id, false)).toMatchObject({ status: 'failed', error_code: 'job_expired', artifact: null });
  });
});
