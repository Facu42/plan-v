import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { registerFoodRoutes } from './routes.js';
const mocks = vi.hoisted(() => ({ enabled: true, actor: vi.fn(), list: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => mocks.enabled }));
vi.mock('../db/supabase-repo.js', () => ({ sbGetActor: mocks.actor }));
vi.mock('./repository.js', () => ({ listFoods: mocks.list, filterFoods: (items: unknown[]) => items, saveFood: vi.fn() }));
function api() {
  const app = new Hono(); app.use('*', async (c, next) => { c.set('auth', { userId: 'user-test' }); await next(); });
  app.onError((e, c) => e instanceof CareError ? c.json({ error: e.message }, e.status) : c.json({ error: 'error' }, 500));
  registerFoodRoutes(app); return app;
}
it('rechaza paciente y actor ausente sin consultar el catálogo', async () => {
  mocks.enabled = true; mocks.list.mockClear();
  mocks.actor.mockResolvedValue({ role: 'paciente' });
  expect((await api().request('/api/foods')).status).toBe(403);
  mocks.actor.mockResolvedValue(null);
  expect((await api().request('/api/foods')).status).toBe(403);
  expect(mocks.list).not.toHaveBeenCalled();
});
it('deriva la propiedad del actor y nunca cae a demo cuando no hay base', async () => {
  mocks.enabled = true; mocks.actor.mockResolvedValue({ role: 'nutri', nutritionistId: 'nutri-a' }); mocks.list.mockResolvedValue([]);
  expect((await api().request('/api/foods')).status).toBe(200);
  expect(mocks.list).toHaveBeenLastCalledWith('nutri-a', true);
  mocks.enabled = false; mocks.list.mockClear();
  expect((await api().request('/api/foods')).status).toBe(503);
  expect(mocks.list).not.toHaveBeenCalled();
});
