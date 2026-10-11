import type { BillingStatus } from './types';

export type BillingSnapshot = {
  billing_status: BillingStatus;
  billing_until: string | null;
};

export function localBillingDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveBillingStatus(
  billing: BillingSnapshot,
  today = localBillingDate(),
): BillingStatus {
  if (billing.billing_status !== 'active') return billing.billing_status;
  if (!billing.billing_until || billing.billing_until < today) return 'past_due';
  return 'active';
}

/** Lo marca la profesional. Una cuota impaga del libro de cobranzas no entra acá y no bloquea la app. */
export function hasFullPatientAccess(
  billing: BillingSnapshot,
  today = localBillingDate(),
): boolean {
  const status = resolveBillingStatus(billing, today);
  return status === 'active' || status === 'waived';
}
