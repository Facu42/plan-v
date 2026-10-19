import { subscriptionsEnabled } from './flag.js';
import { reconcileDue } from './logic.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { processQueued, reconcileLive } from './service.js';

let lastReconcile = 0;
let reconciling = false;

/** Solo para pruebas: la próxima corrida vuelve a medir desde cero. */
export function resetSubscriptionSchedule() {
  lastReconcile = 0;
  reconciling = false;
}

/** El worker llama esto cada segundo. Los avisos se drenan siempre; la conciliación, cada 6 horas. */
export async function tickPatientSubscriptions(now = Date.now()) {
  if (!subscriptionsEnabled() || !isSupabaseEnabled()) return;
  await processQueued(10);
  if (!reconcileDue(lastReconcile, now) || reconciling) return;
  reconciling = true;
  lastReconcile = now;
  try {
    await reconcileLive();
  } finally {
    reconciling = false;
  }
}
