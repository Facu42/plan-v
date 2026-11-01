import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { CareError } from '../care/errors.js';

const { call, setOverride } = vi.hoisted(() => ({ call: vi.fn(), setOverride: vi.fn() }));
vi.mock('./repository.js', async importOriginal => ({
  ...await importOriginal<typeof import('./repository.js')>(),
  call: (...args: unknown[]) => call(...args),
  isAdmin: async () => true,
  setOverride: (...args: unknown[]) => setOverride(...args),
}));
vi.mock('../db/supabase-client.js', async importOriginal => ({
  ...await importOriginal<typeof import('../db/supabase-client.js')>(),
  isSupabaseEnabled: () => true,
}));
const { registerAdminRoutes } = await import('./routes.js');
const token = `header.${Buffer.from(JSON.stringify({ aal: 'aal2' })).toString('base64url')}.signature`;
function app() {
  const instance = new Hono();
  instance.use('*', async (c, next) => { c.set('auth', { userId: 'admin-test' }); await next(); });
  instance.onError((error, c) => c.json({ error: 'validación' }, error instanceof CareError ? error.status : 500));
  registerAdminRoutes(instance);
  return instance;
}
beforeEach(() => { vi.clearAllMocks(); call.mockResolvedValue(null); setOverride.mockResolvedValue({ id: 'n-1' }); });

describe('auditoría con la validación real de las rutas', () => {
  it.each([
    ['suspended', 'nutritionist.suspend'],
    ['waived', 'nutritionist.waive'],
    ['none', 'nutritionist.restore'],
  ])('distingue %s sin copiar la nota', async (override, action) => {
    const response = await app().request('/api/admin/nutritionists/00000000-0000-4000-a000-000000000001/override', {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ override, note: 'texto clínico privado' }),
    });
    expect(response.status).toBe(200);
    expect(call.mock.calls.map(([, args]) => [args.input_action, args.input_outcome])).toEqual([[action, 'started'], [action, 'succeeded']]);
    expect(JSON.stringify(call.mock.calls)).not.toContain('clínico');
    expect(setOverride).toHaveBeenCalledTimes(1);
  });

  it.each([{ override: 'desconocido' }, { override: { suspended: true } }, { note: 'suspended' }])('un enum inválido no se registra como suspensión: %j', async body => {
    const response = await app().request('/api/admin/nutritionists/00000000-0000-4000-a000-000000000001/override', {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
    });
    expect(response.status).toBe(400);
    expect(call.mock.calls.map(([, args]) => [args.input_action, args.input_outcome])).toEqual([['nutritionist.override', 'started'], ['nutritionist.override', 'failed']]);
    expect(setOverride).not.toHaveBeenCalled();
  });
});
