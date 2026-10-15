import { beforeEach, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { CareError } from '../care/errors.js';
const state = vi.hoisted(() => ({ role: 'nutri', nutritionist: 'owner', patientOwner: 'owner', exported: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true }));
vi.mock('../db/supabase-repo.js', () => ({
  sbGetActor: async () => ({ role: state.role, nutritionistId: state.nutritionist }),
  sbGetPatientResource: async () => ({ nutritionistId: state.patientOwner }),
  sbGetPatientById: vi.fn(),
}));
vi.mock('./repository.js', () => ({ exportImportedClinical: state.exported }));
import { registerClinicalWorkspaceRoutes } from './routes.js';
const app = new Hono();
app.use('*', async (c, next) => { c.set('auth', { userId: 'current-user' }); await next(); });
app.onError((error, c) => c.json({ error: error.message }, error instanceof CareError ? error.status : 500));
registerClinicalWorkspaceRoutes(app);
const url = '/api/patients/patient/clinical-workspace/imported-export';
beforeEach(() => { state.role = 'nutri'; state.nutritionist = 'owner'; state.patientOwner = 'owner'; state.exported.mockReset(); });
it('verifica titular actual antes de pedir la proyección histórica y no permite roles operativos', async () => {
  for (const role of ['patient', 'admin', 'reception']) { state.role = role; expect((await app.request(url)).status).toBe(403); }
  state.role = 'nutri'; state.patientOwner = 'another';
  expect((await app.request(url)).status).toBe(403);
  expect(state.exported).not.toHaveBeenCalled();
});
it('entrega sólo la proyección autorizada y propaga el retiro sin falso éxito', async () => {
  const pkg = { patient: { id: 'patient', name: 'Ficha ficticia' }, imported_history: [], imported_measurements: [], brand: null };
  state.exported.mockResolvedValueOnce(pkg);
  expect(await (await app.request(url)).json()).toEqual(pkg);
  expect(state.exported).toHaveBeenCalledWith('patient', 'owner', true);
  state.exported.mockRejectedValueOnce(new CareError(403, 'Autorización retirada'));
  const response = await app.request(url);
  expect(response.status).toBe(403); expect(await response.json()).not.toHaveProperty('patient');
});
