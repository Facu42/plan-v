import { writeOpsLog } from '../ops/log.js';

type MailError = { code?: string; status?: number; message?: string } | null;
type RecoverySender = (email: string, options?: { redirectTo: string }) => Promise<{ error: MailError }>;
type Log = typeof writeOpsLog;

/** El reconocimiento público no depende de que exista la cuenta ni del proveedor. */
export async function requestAccountRecovery(email: string, redirectTo: string | undefined, send: RecoverySender, log: Log = writeOpsLog): Promise<void> {
  try {
    const { error } = await send(email, redirectTo ? { redirectTo } : undefined);
    if (!error) { log('info', 'auth_recovery_requested', { status: 'accepted' }); return; }
    const status = error.status === 429 || error.code === 'over_email_send_rate_limit' ? 'rate_limited'
      : error.code === 'email_address_not_authorized' ? 'delivery_unavailable' : 'provider_failed';
    log('warn', 'auth_recovery_failed', { status });
  } catch { log('warn', 'auth_recovery_failed', { status: 'transport_failed' }); }
}
