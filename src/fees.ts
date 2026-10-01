import { localBillingDate } from './billing';
import type { PatientCharge, PatientLedger, PaymentMethod } from './types/fees';

export type FeeState = 'sin_cuota' | 'al_dia' | 'por_vencer' | 'debe';

export type ChargeProgress = PatientCharge & { paid: number; due: boolean };

export type FeeSummary = {
  state: FeeState;
  /** Lo vencido que falta pagar (0 si está al día). */
  owed: number;
  /** Pagado de más, a cuenta de las próximas cuotas. */
  credit: number;
  /** Vencimiento de la cuota impaga más vieja. */
  debt_since: string | null;
  /** Próxima cuota sin pagar que todavía no venció. */
  next_due: { due_on: string; amount: number } | null;
  /** Avisos de pago de la paciente que esperan confirmación. */
  pending_reports: number;
  paid_this_month: number;
  charges: ChargeProgress[];
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercado_pago: 'Mercado Pago',
  otro: 'Otro',
};

export const FEE_STATE_LABELS: Record<FeeState, string> = {
  sin_cuota: 'Sin cuota',
  al_dia: 'Al día',
  por_vencer: 'Por vencer',
  debe: 'Debe',
};

const SOON_DAYS = 7;

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localBillingDate(value);
}

/** Aplica los pagos confirmados a las cuotas, de la más vieja a la más nueva. */
export function summarizeLedger(ledger: PatientLedger, today = localBillingDate()): FeeSummary {
  const confirmed = ledger.payments.filter((payment) => payment.status === 'confirmed');
  let pool = confirmed.reduce((sum, payment) => sum + payment.amount, 0);
  const open = [...ledger.charges].sort((a, b) => a.due_on.localeCompare(b.due_on));
  const charges: ChargeProgress[] = open.map((charge) => {
    if (charge.status === 'waived') return { ...charge, paid: 0, due: charge.due_on <= today };
    const paid = Math.min(pool, charge.amount);
    pool -= paid;
    return { ...charge, paid, due: charge.due_on <= today };
  });

  const unpaid = charges.filter((charge) => charge.status === 'open' && charge.paid < charge.amount);
  const overdue = unpaid.filter((charge) => charge.due);
  const owed = overdue.reduce((sum, charge) => sum + charge.amount - charge.paid, 0);
  const upcoming = unpaid.find((charge) => !charge.due) ?? null;
  const month = today.slice(0, 7);

  let state: FeeState;
  if (owed > 0) state = 'debe';
  else if (upcoming && upcoming.due_on <= addDays(today, SOON_DAYS)) state = 'por_vencer';
  else if (!ledger.fee && !charges.length) state = 'sin_cuota';
  else state = 'al_dia';

  return {
    state,
    owed,
    credit: pool,
    debt_since: overdue[0]?.due_on ?? null,
    next_due: upcoming ? { due_on: upcoming.due_on, amount: upcoming.amount - upcoming.paid } : null,
    pending_reports: ledger.payments.filter((payment) => payment.status === 'reported').length,
    paid_this_month: confirmed.filter((payment) => payment.paid_on.startsWith(month)).reduce((sum, payment) => sum + payment.amount, 0),
    charges,
  };
}

export function formatPesos(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
}

export function formatFeeDate(date: string): string {
  return date.split('-').reverse().join('/');
}

/** Mensaje de recordatorio para mandar por WhatsApp (la paciente elige el contacto). */
export function reminderWhatsAppHref(input: { patientName: string; owed: number; alias?: string; paymentLink?: string }): string {
  const firstName = input.patientName.split(' ')[0] || input.patientName;
  const parts = [`Hola ${firstName}, te recuerdo que tenés pendiente la cuota de ${formatPesos(input.owed)}.`];
  if (input.alias) parts.push(`Podés transferir al alias ${input.alias}.`);
  if (input.paymentLink) parts.push(`O pagar desde este link: ${input.paymentLink}`);
  parts.push('Cuando pagues, avisame desde Plan V con "Ya pagué". ¡Gracias!');
  return `https://wa.me/?text=${encodeURIComponent(parts.join(' '))}`;
}
