import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';

describe('health y readiness de la cola', () => {
  beforeEach(() => {
    resetStore();
    vi.stubEnv('MP_PLATFORM_LIVE', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('expone recuentos de jobs y deja /api/ready público', async () => {
    const health = await app.request('/api/health');
    expect(health.status).toBe(200);
    expect(health.headers.get('Cache-Control')).toBe('no-store');
    const body = await health.json() as { status: string; jobs: { queued: number; succeeded: number }; mp_platform_mode: string };
    expect(body.status).toBe('ok');
    expect(body.mp_platform_mode).toBe('test');
    expect(body.jobs).toMatchObject({ queued: 0, succeeded: 0 });
    const ready = await app.request('/api/ready');
    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({ status: 'ready', worker: 'test' });
  });

  it('informa mp_platform_mode sin la clave de Mercado Pago', async () => {
    vi.stubEnv('MP_PLATFORM_LIVE', '1');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'APP_USR-no-mostrar');
    const live = await app.request('/api/health');
    const liveBody = await live.json() as { mp_platform_mode: string };
    expect(liveBody.mp_platform_mode).toBe('live');
    const encoded = JSON.stringify(liveBody);
    expect(encoded).not.toContain('APP_USR');
    expect(encoded).not.toContain('no-mostrar');
    expect(encoded).not.toContain('MP_PLATFORM');

    vi.stubEnv('MP_PLATFORM_LIVE', 'true');
    const stillTest = await app.request('/api/health');
    expect((await stillTest.json() as { mp_platform_mode: string }).mp_platform_mode).toBe('test');
  });
});
