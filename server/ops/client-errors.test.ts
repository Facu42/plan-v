import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { registerClientErrorRoutes } from './client-errors.js';
import { resetOpsAlerts, recentOpsAlerts } from './alerts.js';
import { resetRateLimits } from './rate-limit.js';

const app = () => { const hono = new Hono(); registerClientErrorRoutes(hono); return hono; };
const post = (hono: Hono, body: unknown) => hono.request('/api/client-errors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('avisos de fallas del navegador', () => {
  afterEach(() => { vi.restoreAllMocks(); resetRateLimits(); resetOpsAlerts(); });

  it('registra la falla sin mails, ids ni la búsqueda de la ruta', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const response = await post(app(), { kind: 'render', path: '/app/plan?token=abc', message: 'TypeError: falla de ana@mail.com en 6f1c2b3a-1d2e-4f5a-8b9c-0d1e2f3a4b5c' });
    expect(response.status).toBe(204);
    const line = warn.mock.calls.map(call => String(call[0])).find(text => text.includes('client_error')) ?? '';
    expect(line).toContain('/app/plan');
    expect(line).not.toContain('token=');
    expect(line).not.toContain('ana@mail.com');
    expect(line).not.toContain('6f1c2b3a');
    expect(recentOpsAlerts().map(alert => alert.kind)).toContain('client_error');
  });

  it('rechaza datos de más o mal formados', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect((await post(app(), { kind: 'render', path: '/app', message: 'x', extra: 'datos' })).status).toBe(400);
    expect((await post(app(), { kind: 'otro', path: '/app', message: 'x' })).status).toBe(400);
    expect((await post(app(), { kind: 'error', path: '/app', message: 'x'.repeat(301) })).status).toBe(400);
  });

  it('un error suelto se registra pero no dispara alerta; un bucle no pasa de diez por minuto', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const hono = app();
    for (let i = 0; i < 15; i += 1) expect((await post(hono, { kind: 'error', path: '/app', message: 'x' })).status).toBe(204);
    expect(warn.mock.calls.filter(call => String(call[0]).includes('client_error'))).toHaveLength(10);
    expect(recentOpsAlerts()).toHaveLength(0);
  });
});
