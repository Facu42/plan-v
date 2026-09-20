import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';

describe('health y readiness de la cola', () => {
  beforeEach(() => {
    resetStore();
  });

  it('expone recuentos de jobs y deja /api/ready público', async () => {
    const health = await app.request('/api/health');
    expect(health.status).toBe(200);
    expect(health.headers.get('Cache-Control')).toBe('no-store');
    const body = await health.json() as { status: string; jobs: { queued: number; succeeded: number } };
    expect(body.status).toBe('ok');
    expect(body.jobs).toMatchObject({ queued: 0, succeeded: 0 });
    const ready = await app.request('/api/ready');
    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({ status: 'ready', worker: 'test' });
  });
});
