import { beforeEach, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { registerModelRoutes } from './routes';
import * as repo from './repository';

vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true }));
vi.mock('../db/supabase-repo.js', () => ({
  sbGetActor: async (userId: string) => ({ role: 'nutri', userId, nutritionistId: userId }),
  sbGetPatientResource: async (id: string) => ({ id, nutritionistId: id === 'paciente-a' ? 'nutri-a' : 'nutri-b', billing_status: 'active', billing_until: '2099-01-01' }),
}));
vi.mock('./repository.js', () => ({ saveModel: vi.fn(async () => ({})), applyModel: vi.fn(async () => ({})), listModels: vi.fn(), modelAction: vi.fn() }));
const app = new Hono();
app.use('*', async (c, next) => { c.set('auth', { userId: c.req.header('x-user')! }); await next(); });
app.onError((error, c) => c.json({ error: error.message }, (error as { status?: 403 }).status ?? 500));
registerModelRoutes(app);
const post = (path: string, user: string, data: unknown) => app.request(path, { method: 'POST', headers: { 'x-user': user, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(() => vi.clearAllMocks());
it.each(['nutri-a', 'nutri-b'])('sólo %s puede guardar plantilla desde su propia paciente', async user => {
  const input = { id: crypto.randomUUID(), expected_revision: null, kind: 'plan', title: 'Semana', description: '', source: { patient_id: user === 'nutri-a' ? 'paciente-a' : 'paciente-b', version: 1, revision: crypto.randomUUID() } };
  expect((await post('/api/models', user, input)).status).toBe(200);
  vi.clearAllMocks();
  input.source.patient_id = user === 'nutri-a' ? 'paciente-b' : 'paciente-a';
  expect((await post('/api/models', user, input)).status).toBe(403);
  expect(repo.saveModel).not.toHaveBeenCalled();
});
it('rechaza aplicar un modelo a paciente ajena antes de escribir', async () => {
  const response = await post(`/api/models/${crypto.randomUUID()}/apply`, 'nutri-a', { patient_id: 'paciente-b', expected_revision: crypto.randomUUID(), expected_version: 1, expected_plan_revision: null, period_start: '2026-10-26', reviewed: true });
  expect(response.status).toBe(403);
  expect(repo.applyModel).not.toHaveBeenCalled();
});
