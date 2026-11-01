import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const m = vi.hoisted(() => ({ actor: vi.fn(), patient: vi.fn(), consent: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true, getRequestDb: () => ({ rpc: vi.fn() }) }));
vi.mock('../db/supabase-repo.js', () => ({ sbGetActor: m.actor, sbGetPatientResource: m.patient }));
vi.mock('../care/consents.js', () => ({ requireCareConsent: m.consent }));
import { registerLabDraftRoutes } from './draft-routes.js';

const fixture = readFileSync(new URL('./fixtures/informe-anonimo.txt', import.meta.url), 'utf8');
function send(text = fixture) {
  const app = new Hono();
  app.use('*', async (c, next) => { c.set('auth', { userId: 'owner' }); await next(); });
  app.onError((error, c) => c.json({ error: error.message }, 'status' in error ? error.status as 400 : 500));
  registerLabDraftRoutes(app);
  return app.request('/api/patients/patient/clinical-workspace/lab-reading/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
}

beforeEach(() => {
  vi.stubEnv('LAB_DRAFT_ENABLED', 'true');
  m.actor.mockResolvedValue({ role: 'nutri', nutritionistId: 'clinic' });
  m.patient.mockResolvedValue({ nutritionistId: 'clinic' });
  m.consent.mockResolvedValue({});
});
afterEach(() => vi.unstubAllEnvs());

describe('ruta del borrador de laboratorio', () => {
  it('apagada no lee la ficha y otro consultorio no entra', async () => {
    vi.stubEnv('LAB_DRAFT_ENABLED', 'false');
    expect((await send()).status).toBe(503);
    expect(m.patient).not.toHaveBeenCalled();
    vi.stubEnv('LAB_DRAFT_ENABLED', 'true');
    m.patient.mockResolvedValue({ nutritionistId: 'other' });
    expect((await send()).status).toBe(403);
  });
  it('devuelve el borrador sin revisión y sin guardarlo', async () => {
    const response = await send();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.reviewed).toBe(false);
    expect(body.values[0]).toMatchObject({ name: 'Glucemia', reviewed: false });
    expect(m.consent).toHaveBeenCalledWith('patient', true, 'care_relationship');
  });
});
