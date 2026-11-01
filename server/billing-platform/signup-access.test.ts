import { Hono } from 'hono';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createPlatformReadOnlyGuard } from './guard.js';
import { assertCanAdd } from './limits.js';

const mocks = vi.hoisted(() => ({
  nutritionistForUser: vi.fn(), nutritionistCreatedAt: vi.fn(), findOpenSubscription: vi.fn(), usageOf: vi.fn(),
}));
vi.mock('./repository.js', () => ({ ...mocks, logBilling: vi.fn(), schemaMissing: () => false }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true }));
const created = Date.parse('2026-10-01T12:00:00Z');

beforeEach(() => {
  vi.stubEnv('PLATFORM_BILLING_ENABLED', '1');
  mocks.nutritionistForUser.mockResolvedValue({ id: 'nutri-1', created_at: new Date(created).toISOString() });
  mocks.nutritionistCreatedAt.mockResolvedValue(created);
  mocks.findOpenSubscription.mockResolvedValue(null);
  mocks.usageOf.mockResolvedValue({ active_patients: 25, nutritionists: 1 });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

function app() {
  const hono = new Hono();
  hono.use('*', async (c, next) => { c.set('auth' as never, { userId: 'user-1' } as never); await next(); });
  hono.use('*', createPlatformReadOnlyGuard());
  hono.all('*', c => c.json({ ok: true }));
  return hono;
}
it.each([0, 29, 30, 31])('día %i: guardia y alta aplican el mismo vencimiento', async day => {
  vi.spyOn(Date, 'now').mockReturnValue(created + day * 86_400_000);
  expect((await app().request('/api/patients', { method: 'POST' })).status).toBe(day < 30 ? 200 : 403);
  if (day < 30) await expect(assertCanAdd('nutri-1', 'patient', 1)).resolves.toBeUndefined();
  else await expect(assertCanAdd('nutri-1', 'patient', 1)).rejects.toMatchObject({ status: 403 });
  expect(mocks.findOpenSubscription).toHaveBeenCalledWith('nutri-1');
  expect((await app().request('/api/patients')).status).toBe(200);
  expect((await app().request('/api/billing/checkout', { method: 'POST' })).status).toBe(200);
});
it('la paciente sin perfil profesional puede escribir y la bandera apagada no limita', async () => {
  mocks.nutritionistForUser.mockResolvedValue(null);
  expect((await app().request('/api/messages', { method: 'POST' })).status).toBe(200);
  vi.stubEnv('PLATFORM_BILLING_ENABLED', '0');
  await expect(assertCanAdd('nutri-1', 'patient', 1)).resolves.toBeUndefined();
  expect((await app().request('/api/patients', { method: 'POST' })).status).toBe(200);
});
it('el plan pago conserva su tope durante los primeros 30 días', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(created);
  mocks.findOpenSubscription.mockResolvedValue({ status: 'authorized', plan_code: 'arranque', past_due_since: null, current_period_end: null });
  await expect(assertCanAdd('nutri-1', 'patient', 1)).rejects.toMatchObject({ status: 409 });
});
