import { afterEach, describe, expect, it, vi } from 'vitest';
import { RECONCILE_EVERY_MS } from './logic.js';
import { resetSubscriptionSchedule, tickPatientSubscriptions } from './worker.js';

const processed = vi.hoisted(() => ({ queued: 0, reconciled: 0 }));

vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true }));
vi.mock('./service.js', () => ({
  processQueued: async () => {
    processed.queued += 1;
    return 0;
  },
  reconcileLive: async () => {
    processed.reconciled += 1;
    return 0;
  },
}));

describe('tarea del worker', () => {
  afterEach(() => {
    processed.queued = 0;
    processed.reconciled = 0;
    vi.unstubAllEnvs();
    resetSubscriptionSchedule();
  });

  it('no hace nada con la bandera apagada y concilia cada 6 horas cuando está prendida', async () => {
    resetSubscriptionSchedule();
    await tickPatientSubscriptions(RECONCILE_EVERY_MS);
    expect(processed).toEqual({ queued: 0, reconciled: 0 });

    vi.stubEnv('PATIENT_SUBSCRIPTIONS_ENABLED', '1');
    await tickPatientSubscriptions(RECONCILE_EVERY_MS);
    await tickPatientSubscriptions(RECONCILE_EVERY_MS + 60_000);
    await tickPatientSubscriptions(RECONCILE_EVERY_MS * 2);
    expect(processed.queued).toBe(3);
    expect(processed.reconciled).toBe(2);
  });
});
