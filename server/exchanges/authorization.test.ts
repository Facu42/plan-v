import { Hono } from 'hono';
import { beforeEach, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { registerExchangeRoutes } from './routes.js';

const mocks = vi.hoisted(() => ({ enabled: true, actor: vi.fn(), list: vi.fn(), save: vi.fn(), archive: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => mocks.enabled }));
vi.mock('../db/supabase-repo.js', () => ({ sbGetActor: mocks.actor }));
vi.mock('./repository.js', () => ({ listExchanges: mocks.list, saveExchange: mocks.save, archiveExchange: mocks.archive }));

const id = '11111111-1111-4111-8111-111111111111';
const body = { id, kind: 'group', expected_revision: 0, name: 'Lácteos', foods: [{ food_id: null, name: 'Yogur' }] };
function api() {
  const app = new Hono();
  app.use('*', async (c, next) => { c.set('auth', { userId: 'user-test' }); await next(); });
  app.onError((e, c) => (e instanceof CareError ? c.json({ error: e.message }, e.status) : c.json({ error: 'error' }, 500)));
  registerExchangeRoutes(app);
  return app;
}
const post = (path: string, data: unknown) => api().request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(() => { mocks.enabled = true; mocks.list.mockReset(); mocks.save.mockReset(); mocks.archive.mockReset(); });

it('rechaza paciente, administradora sin consultorio y actor ausente antes de tocar el catálogo', async () => {
  for (const actor of [{ role: 'paciente' }, { role: 'admin' }, null]) {
    mocks.actor.mockResolvedValue(actor);
    expect((await api().request('/api/exchanges')).status).toBe(403);
    expect((await post('/api/exchanges', body)).status).toBe(403);
    expect((await post(`/api/exchanges/${id}/archive`, { expected_revision: 1 })).status).toBe(403);
  }
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.archive).not.toHaveBeenCalled();
});
it('deriva el consultorio del actor, nunca del cuerpo, y no cae a demo cuando falta la base', async () => {
  mocks.actor.mockResolvedValue({ role: 'nutri', nutritionistId: 'nutri-a' });
  mocks.list.mockResolvedValue([]);
  mocks.save.mockResolvedValue({ id });
  expect((await api().request('/api/exchanges')).status).toBe(200);
  expect(mocks.list).toHaveBeenLastCalledWith('nutri-a', true);
  expect((await post('/api/exchanges', { ...body, owner_id: 'nutri-b' })).status).toBe(400);
  expect((await post('/api/exchanges', body)).status).toBe(200);
  expect(mocks.save).toHaveBeenLastCalledWith('nutri-a', expect.objectContaining({ id, kind: 'group' }), true);
  mocks.enabled = false; mocks.list.mockClear();
  expect((await api().request('/api/exchanges')).status).toBe(503);
  expect(mocks.list).not.toHaveBeenCalled();
});
it('valida el cuerpo y el identificador al archivar', async () => {
  mocks.actor.mockResolvedValue({ role: 'nutri', nutritionistId: 'nutri-a' });
  expect((await post('/api/exchanges/no-es-uuid/archive', { expected_revision: 1 })).status).toBe(400);
  expect((await post(`/api/exchanges/${id}/archive`, { expected_revision: -1 })).status).toBe(400);
  mocks.archive.mockResolvedValue({ id });
  expect((await post(`/api/exchanges/${id}/archive`, { expected_revision: 3 })).status).toBe(200);
  expect(mocks.archive).toHaveBeenCalledWith('nutri-a', id, 3, true);
});
