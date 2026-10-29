import { summarizeLedger } from '../fees';
import type { PatientLedger } from '../types/fees';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Título en español del mes de la cuota, por ejemplo «Cuota de octubre 2026». */
export function feeMonthTitle(dueOn: string): string {
  const [year, month] = dueOn.split('-').map(Number);
  const name = MONTHS[(month ?? 1) - 1] ?? '';
  const label = name ? name.charAt(0).toLocaleUpperCase('es-AR') + name.slice(1) : dueOn;
  return `Cuota de ${label} ${year ?? ''}`.trim();
}

/** Cuerpo de la preferencia de Checkout Pro. Sin comisión para Nutridash. */
export function feePreferenceBody(input: { id: string; title: string; amountPesos: number; notificationUrl: string; patientId: string }) {
  return {
    items: [{ id: input.id, title: input.title.slice(0, 120), quantity: 1, currency_id: 'ARS', unit_price: input.amountPesos }],
    external_reference: input.id,
    notification_url: input.notificationUrl,
    metadata: { planv_fee_checkout: input.id, planv_patient: input.patientId },
  };
}

export type FeeCheckoutSnapshot = {
  id: string;
  due_on: string;
  amount: number;
  status: 'creating' | 'ready' | 'paid' | 'expired';
};

export type FeeBookResult = 'ignore' | 'confirm' | 'duplicate' | 'void' | 'skip';

/** Qué hacer con un aviso de pago. Un segundo cobro del mismo mes no se anota de nuevo. */
export function feeBookResult(input: {
  checkout: FeeCheckoutSnapshot | null;
  payment: { status: string; transaction_amount: number; currency_id?: string; collector_id?: string };
  accountId: string;
  existing: { status: string } | null;
  monthPaid: boolean;
}): FeeBookResult {
  if (!input.checkout) return 'ignore';
  if (input.payment.collector_id != null && String(input.payment.collector_id) !== input.accountId) return 'skip';
  if (input.payment.currency_id && input.payment.currency_id !== 'ARS') return 'skip';
  if (!Number.isFinite(input.payment.transaction_amount) || Math.round(input.payment.transaction_amount) !== input.checkout.amount) return 'skip';
  if (input.payment.status === 'refunded' || input.payment.status === 'charged_back') {
    return input.existing?.status === 'confirmed' ? 'void' : 'skip';
  }
  if (input.payment.status !== 'approved') return 'skip';
  if (input.existing || input.checkout.status === 'paid' || input.monthPaid) return 'duplicate';
  return 'confirm';
}

/** Cuotas mensuales abiertas, con lo que falta pagar de cada mes. */
export function payableFeeCharges(ledger: PatientLedger, today: string) {
  const summary = summarizeLedger(ledger, today);
  return summary.charges
    .filter(charge => charge.status === 'open' && charge.kind !== 'extra' && charge.paid < charge.amount)
    .map(charge => ({ id: charge.id, due_on: charge.due_on, amount: charge.amount - charge.paid, title: feeMonthTitle(charge.due_on) }));
}

export function monthIsCovered(ledger: PatientLedger, dueOn: string, today: string): boolean {
  const summary = summarizeLedger(ledger, today);
  const charge = summary.charges.find(item => item.due_on === dueOn && item.status === 'open' && item.kind !== 'extra');
  if (!charge) return true;
  return charge.paid >= charge.amount;
}
