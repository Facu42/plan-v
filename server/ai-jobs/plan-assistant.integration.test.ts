import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { memoryJobContext } from './repository.js';

const patient = 'pat-sofia';
const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

async function prepare(allergies: string[]) {
  const text = CONSENT_CATALOG.find((entry) => entry.purpose === 'ai_menu_draft')!;
  await post(`/api/patients/${patient}/consents`, { purpose: text.purpose, text_version: text.text_version, text_hash: text.text_hash, decision: 'granted' });
  const first = await (await app.request(`/api/patients/${patient}/intake`)).json() as { intake: { revision: number } };
  await post(`/api/patients/${patient}/intake`, {
    expected_revision: first.intake.revision, step: 'allergies',
    payload: { preferred_name: 'Sofi', allergies: { state: allergies.length ? 'reported' : 'none', items: allergies }, restrictions: { state: 'none', items: [] } },
  }, 'PATCH');
}

const weekly = { patient_id: patient, job_type: 'menu_draft', period_start: '2026-10-19', period_end: '2026-10-25', slots: ['Desayuno', 'Almuerzo', 'Cena'] };

describe('asistente de planes semanales', () => {
  beforeEach(() => { resetStore(); });
  afterEach(() => vi.unstubAllEnvs());

  it('apagado: el contexto del borrador no lleva referencias nuevas', async () => {
    await prepare([]);
    const created = await (await post('/api/ai/jobs', weekly)).json() as { job: { id: string; status: string } };
    expect(created.job.status).toBe('succeeded');
    expect(memoryJobContext(created.job.id)).not.toHaveProperty('assistant');
  });

  it('encendido: suma alimentos de SARA 2 sin los alérgenos y deja el borrador sin publicar', async () => {
    vi.stubEnv('AI_PLAN_ASSISTANT', 'on');
    await prepare(['huevo']);
    const response = await post('/api/ai/jobs', weekly);
    expect(response.status).toBe(202);
    const created = await response.json() as { job: { id: string; status: string; artifact: { kind: string } | null } };
    expect(created.job.status).toBe('succeeded');
    expect(created.job.artifact?.kind).toBe('menu_draft');
    const context = memoryJobContext(created.job.id) as { assistant?: { foods: Array<{ name: string }> } } | null;
    expect(context?.assistant?.foods.length).toBeGreaterThan(40);
    expect(context?.assistant?.foods.some((food) => /huevo/i.test(food.name))).toBe(false);
  });

  it('corta en el servidor cuando el peor caso pasaría el tope de gasto del mes', async () => {
    vi.stubEnv('AI_PLAN_ASSISTANT', 'on');
    vi.stubEnv('AI_PRICE_INPUT_USD_PER_MTOK', '3');
    vi.stubEnv('AI_PRICE_OUTPUT_USD_PER_MTOK', '1000');
    await prepare([]);
    const response = await post('/api/ai/jobs', weekly);
    expect(response.status).toBe(429);
    const jobs = await (await app.request(`/api/patients/${patient}/ai/jobs`)).json() as { jobs: Array<{ status: string }> };
    expect(jobs.jobs.every((job) => job.status === 'failed')).toBe(true);
  });
});
