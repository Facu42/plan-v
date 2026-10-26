import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

const state = vi.hoisted(() => ({ allowed: true, assign: vi.fn(), push: vi.fn(), patient: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true }));
vi.mock('../security/authorization.js', () => ({ authorizePatientAction: async () => state.allowed ? { role: 'nutri', nutritionistId: 'clinic' } : null }));
vi.mock('../db/supabase-repo.js', () => ({ sbGetActor: vi.fn(), sbGetPatientResource: vi.fn(), sbGetPatientById: state.patient }));
vi.mock('../push/push.js', () => ({ notifyPatientPush: state.push }));
vi.mock('./repository.js', async importOriginal => ({ ...await importOriginal<typeof import('./repository.js')>(), assignEditorialResource: state.assign }));
import { registerResourceRoutes } from './routes.js';
import { CareError } from './repository.js';

const app = new Hono();
app.use('*', async (context, next) => { context.set('auth', { userId: 'synthetic-owner' }); await next(); });
app.onError((error, context) => context.json({ error: error.message }, error instanceof CareError ? error.status : 500));
registerResourceRoutes(app);
const assign = (patientId: string) => app.request('/api/resources/assign', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resource_id: 'recurso-prueba', patient_ids: [patientId] }),
});

describe('Biblioteca: conexión de asignación al push de recurso', () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.allowed = true;
    state.patient.mockImplementation(async (id: string) => ({ id }));
  });
  it('un alta nueva dispara el push resource, sin duplicarlo si otra ya existía', async () => {
    state.assign.mockResolvedValueOnce({ patients: [], assigned_count: 0, existing_count: 1 });
    state.assign.mockResolvedValueOnce({ patients: [], assigned_count: 1, existing_count: 0 });
    expect((await assign('already-assigned')).status).toBe(200);
    expect(state.push).not.toHaveBeenCalled();
    expect((await assign('newly-assigned')).status).toBe(200);
    expect(state.push).toHaveBeenCalledExactlyOnceWith('newly-assigned', 'resource');
    expect(state.assign).toHaveBeenLastCalledWith('recurso-prueba', ['newly-assigned'], true, true, 'clinic');
  });
  it('sin permiso o con error de escritura no dispara ningún push', async () => {
    state.allowed = false;
    expect((await assign('foreign-patient')).status).toBe(403);
    expect(state.assign).not.toHaveBeenCalled();
    state.allowed = true;
    state.assign.mockRejectedValue(new CareError(503, 'Fallo simulado'));
    expect((await assign('newly-assigned')).status).toBe(503);
    expect(state.push).not.toHaveBeenCalled();
  });
});
