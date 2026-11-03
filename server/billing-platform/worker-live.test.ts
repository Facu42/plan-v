import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ raise: 0, logs: [] as string[] }));

vi.mock('./service.js', () => ({
  raiseFounderPrices: async () => { calls.raise += 1; },
}));
vi.mock('../db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
}));
vi.mock('../ops/log.js', () => ({
  writeOpsLog: (_level: string, message: string) => { calls.logs.push(message); },
}));

describe('worker del cobro de la plataforma', () => {
  beforeEach(() => {
    calls.raise = 0;
    calls.logs.length = 0;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function tick(token: string, live = false) {
    vi.stubEnv('PLATFORM_BILLING_ENABLED', '1');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', token);
    vi.stubEnv('MP_PLATFORM_LIVE', live ? '1' : '');
    const { tickPlatformBilling } = await import('./worker.js');
    await tickPlatformBilling(1_700_000_000_000);
  }

  it('en prueba no ajusta precios con una clave APP_USR-', async () => {
    await tick('APP_USR-no');
    expect(calls.raise).toBe(0);
    expect(calls.logs).toContain('platform_billing_worker_failed');
  });

  it('en prueba ajusta precios con una clave TEST-', async () => {
    await tick('TEST-sandbox');
    expect(calls.raise).toBe(1);
    expect(calls.logs).toEqual([]);
  });

  it('en vivo ajusta precios con una clave APP_USR-', async () => {
    await tick('APP_USR-live', true);
    expect(calls.raise).toBe(1);
    expect(calls.logs).toEqual([]);
  });

  it('en vivo no ajusta precios con la clave vacía ni con TEST-', async () => {
    await tick('   ', true);
    expect(calls.raise).toBe(0);
    expect(calls.logs).toContain('platform_billing_worker_failed');

    calls.raise = 0;
    calls.logs.length = 0;
    vi.resetModules();
    await tick('TEST-sandbox', true);
    expect(calls.raise).toBe(0);
    expect(calls.logs).toContain('platform_billing_worker_failed');
  });
});
