import { isSupabaseEnabled } from '../db/supabase-client.js';
import { billingEnabled } from './flag.js';
import { raiseFounderPrices } from './service.js';
import { writeOpsLog } from '../ops/log.js';

let nextCheck = 0;

/** Una vez por hora sube el precio de fundadora al de lista, cuando ya pasaron los 12 meses. */
export async function tickPlatformBilling(now = Date.now()) {
  if (!billingEnabled() || !isSupabaseEnabled() || now < nextCheck) return;
  nextCheck = now + 60 * 60 * 1000;
  try {
    await raiseFounderPrices(now);
  } catch {
    writeOpsLog('warn', 'platform_billing_worker_failed', { status: 'retry_pending' });
  }
}
