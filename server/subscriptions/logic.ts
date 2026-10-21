import { createHmac, timingSafeEqual } from 'node:crypto';
import { verifyMpSignature } from '../scheduling/logic.js';

export const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const UNCERTAIN_AFTER_MS = 10 * 60 * 1000;
export const INSTALLMENT_GRACE_MS = 2 * 24 * 60 * 60 * 1000;
export const PRICE_NOTICE_MS = 10 * 24 * 60 * 60 * 1000;
export const RECONCILE_EVERY_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function subscriptionGuestToken(nutritionistId: string, subscriptionId: string, secret: string): string {
  return createHmac('sha256', secret).update(`subscription:${nutritionistId}:${subscriptionId}`).digest('base64url');
}

export function guestTokenMatches(expected: string, received: string): boolean {
  if (!received || received.length > 200 || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export function argentinaDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(iso));
}

export function pesosFromCents(amountCents: number): number {
  if (!Number.isInteger(amountCents) || amountCents % 100 !== 0) return NaN;
  return amountCents / 100;
}

export function buildPreapprovalBody(input: {
  id: string;
  planName: string;
  nutritionistName: string;
  payerEmail: string;
  amountCents: number;
  backUrl: string;
}): Record<string, unknown> {
  const amount = pesosFromCents(input.amountCents);
  return {
    reason: `${input.planName} · ${input.nutritionistName}`.slice(0, 120),
    external_reference: input.id,
    payer_email: input.payerEmail,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: amount,
      currency_id: 'ARS',
    },
    back_url: input.backUrl,
    status: 'pending',
  };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'correo oculto';
  return `${local.slice(0, 1)}***@${domain}`;
}

export function ledgerNote(planName: string, paidAt: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit' }).format(paidAt).split('-');
  const month = MONTHS[Number(parts[1]) - 1] ?? '';
  return `Débito automático · ${planName} · ${month} ${parts[0]}`.slice(0, 280);
}

export function voidNote(reason: 'refunded' | 'charged_back'): string {
  return reason === 'refunded' ? 'Anulado por devolución' : 'Anulado por contracargo';
}

export function isStaleProviderUpdate(incoming: string | null, stored: string | null): boolean {
  if (!incoming || !stored) return false;
  const next = Date.parse(incoming);
  const previous = Date.parse(stored);
  return Number.isFinite(next) && Number.isFinite(previous) && next < previous;
}

export type LedgerStatus = 'confirmed' | 'voided';
export type LedgerRow = { id: string; providerPaymentId: string; status: LedgerStatus; note: string };
export type LedgerCommand =
  | { kind: 'confirm'; providerPaymentId: string; amountCents: number; paidAt: string; note: string }
  | { kind: 'void'; providerPaymentId: string; reason: 'refunded' | 'charged_back' }
  | { kind: 'none' };

export function ledgerCommand(paymentStatus: string | null, providerPaymentId: string | null, amountCents: number, paidAt: string | null, note: string): LedgerCommand {
  if (!providerPaymentId) return { kind: 'none' };
  if (paymentStatus === 'approved') return { kind: 'confirm', providerPaymentId, amountCents, paidAt: paidAt ?? new Date().toISOString(), note };
  if (paymentStatus === 'refunded' || paymentStatus === 'charged_back') return { kind: 'void', providerPaymentId, reason: paymentStatus };
  return { kind: 'none' };
}

/** Un mismo cobro confirma una sola vez. Una devolución anula esa fila y no la vuelve a crear. */
export function applyLedger(rows: LedgerRow[], command: LedgerCommand): { rows: LedgerRow[]; createdId: string | null; voidedId: string | null } {
  if (command.kind === 'none') return { rows, createdId: null, voidedId: null };
  const existing = rows.find(row => row.providerPaymentId === command.providerPaymentId);
  if (command.kind === 'confirm') {
    if (existing) return { rows, createdId: null, voidedId: null };
    const id = `pay-${command.providerPaymentId}`;
    return { rows: [...rows, { id, providerPaymentId: command.providerPaymentId, status: 'confirmed', note: command.note }], createdId: id, voidedId: null };
  }
  if (!existing || existing.status === 'voided') return { rows, createdId: null, voidedId: null };
  return {
    rows: rows.map(row => row.providerPaymentId === command.providerPaymentId ? { ...row, status: 'voided' as const, note: voidNote(command.reason) } : row),
    createdId: null,
    voidedId: existing.id,
  };
}

export type ReconcileAction =
  | { type: 'search_external_reference' }
  | { type: 'expire_link' }
  | { type: 'read_installments' }
  | { type: 'apply_pending_price' }
  | { type: 'skip_other_account' }
  | { type: 'none' };

export function reconcileAction(sub: {
  status: string;
  createdAt: string;
  expiresAt: string | null;
  nextPaymentDate: string | null;
  providerAccountId: string;
  connectedAccountId: string | null;
  pendingAmountOn: string | null;
}, now: number): ReconcileAction {
  if (sub.connectedAccountId && sub.connectedAccountId !== sub.providerAccountId) return { type: 'skip_other_account' };
  if ((sub.status === 'creating' || sub.status === 'uncertain') && now - Date.parse(sub.createdAt) >= UNCERTAIN_AFTER_MS) return { type: 'search_external_reference' };
  if (sub.status === 'pending') {
    const expiry = sub.expiresAt ? Date.parse(sub.expiresAt) : Date.parse(sub.createdAt) + LINK_TTL_MS;
    if (now >= expiry) return { type: 'expire_link' };
  }
  if (sub.status === 'authorized' && sub.pendingAmountOn && Date.parse(sub.pendingAmountOn) <= now) return { type: 'apply_pending_price' };
  if (sub.status === 'authorized' && sub.nextPaymentDate && now >= Date.parse(sub.nextPaymentDate) + INSTALLMENT_GRACE_MS) return { type: 'read_installments' };
  return { type: 'none' };
}

export function reconcileDue(lastRunAt: number, now: number): boolean {
  return now - lastRunAt >= RECONCILE_EVERY_MS;
}

export function nextRetryDelay(attempts: number): number | null {
  if (attempts >= 8) return null;
  return RETRY_MS[Math.min(Math.max(attempts, 1) - 1, RETRY_MS.length - 1)] ?? null;
}

export function webhookSignatureOk(input: { id: string; requestId: string; signature: string; secret: string; now?: number }): boolean {
  return verifyMpSignature(input);
}

export function mapInstallment(status: string, paymentStatus: string | null): 'ok' | 'retrying' | 'rejected' | null {
  if (status === 'recycling') return 'retrying';
  if (status === 'processed' && paymentStatus === 'approved') return 'ok';
  if (status === 'processed' && paymentStatus === 'rejected') return 'rejected';
  return null;
}

export function preapprovalStatus(value: unknown): 'pending' | 'authorized' | 'paused' | 'cancelled' | null {
  return value === 'pending' || value === 'authorized' || value === 'paused' || value === 'cancelled' ? value : null;
}
