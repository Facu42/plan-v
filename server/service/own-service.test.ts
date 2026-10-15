import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import type { OwnService } from '../../src/types/service.js';
import { createOwnServiceCache, createServiceReadOnlyGuard, READ_ONLY_MESSAGE, registerOwnServiceRoutes } from './own-service.js';

const service = (state: OwnService['state'], read_only: boolean, until: string | null = '2026-10-30'): OwnService => ({ state, until, days_left: -10, monthly_price: 20000, read_only });

function appFor(lookup: (userId: string) => Promise<OwnService | null>, onAdminChange = vi.fn()) {
  const app = new Hono();
  app.use('*', async (c, next) => { const user = c.req.header('x-user'); c.set('auth', user ? { userId: user } : { demo: true }); return next(); });
  app.use('/api/*', createServiceReadOnlyGuard(lookup, onAdminChange));
  for (const path of ['/api/patients/p1/plan', '/api/me/professional', '/api/admin/service-payments', '/api/auth/recover']) {
    app.post(path, c => c.json({ ok: true }));
  }
  app.get('/api/patients/p1', c => c.json({ ok: true }));
  registerOwnServiceRoutes(app, lookup);
  return { app, onAdminChange };
}
const post = (app: Hono, path: string, user = 'nutri') => app.request(path, { method: 'POST', headers: { 'x-user': user } });

describe('Solo lectura cuando el administrador suspende a la nutricionista', () => {
  it('frena escrituras con la cuenta suspendida y explica qué pasa', async () => {
    const { app } = appFor(async () => service('suspendida', true, null));
    const response = await post(app, '/api/patients/p1/plan');
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ code: 'service_read_only', error: 'Tu cuenta de Plan V está suspendida: podés ver todo, pero no cargar ni cambiar nada. Escribile a Plan V para reactivarla.' });
  });

  it('deja leer todo aunque esté suspendida', async () => {
    const { app } = appFor(async () => service('suspendida', true, null));
    expect((await app.request('/api/patients/p1', { headers: { 'x-user': 'nutri' } })).status).toBe(200);
  });

  it('deja escribir en prueba, vencida dentro de la gracia, activa y sin cargo', async () => {
    for (const state of ['prueba', 'vencida', 'cortada', 'activa', 'por_vencer', 'sin_cargo'] as const) {
      const { app } = appFor(async () => service(state, false));
      expect((await post(app, '/api/patients/p1/plan')).status).toBe(200);
    }
  });

  it('nunca frena a una paciente ni al modo demo (no tienen servicio)', async () => {
    const { app } = appFor(async () => null);
    expect((await post(app, '/api/patients/p1/plan', 'paciente')).status).toBe(200);
    const demo = appFor(async () => service('suspendida', true, null)).app;
    expect((await demo.request('/api/patients/p1/plan', { method: 'POST' })).status).toBe(200);
  });

  it('mantiene abiertas la cuenta, la sesión y el panel del administrador', async () => {
    const { app, onAdminChange } = appFor(async () => service('suspendida', true, null));
    expect((await post(app, '/api/me/professional')).status).toBe(200);
    expect((await post(app, '/api/auth/recover')).status).toBe(200);
    expect((await post(app, '/api/admin/service-payments')).status).toBe(200);
    expect(onAdminChange).toHaveBeenCalledTimes(1);
  });

  it('si no puede consultar el estado, no bloquea', async () => {
    const { app } = appFor(async () => { throw new Error('base caída'); });
    expect((await post(app, '/api/patients/p1/plan')).status).toBe(200);
  });

  it('la nutricionista consulta su propio servicio', async () => {
    const { app } = appFor(async user => user === 'nutri' ? service('prueba', false) : null);
    expect(await (await app.request('/api/me/service', { headers: { 'x-user': 'nutri' } })).json()).toEqual({ service: service('prueba', false) });
    expect(await (await app.request('/api/me/service')).json()).toEqual({ service: null });
  });
});

describe('memoria del estado', () => {
  it('consulta una vez por minuto y se borra a pedido', async () => {
    let now = 0;
    const lookup = vi.fn(async () => service('activa', false));
    const cache = createOwnServiceCache(lookup, () => now);
    await cache.get('a'); await cache.get('a');
    expect(lookup).toHaveBeenCalledTimes(1);
    now = 61_000; await cache.get('a');
    expect(lookup).toHaveBeenCalledTimes(2);
    cache.clear(); await cache.get('a');
    expect(lookup).toHaveBeenCalledTimes(3);
  });
});

describe('mensaje', () => {
  it('suspendida pide escribir a Plan V', () => {
    expect(READ_ONLY_MESSAGE).toContain('Escribile a Plan V');
  });
});
