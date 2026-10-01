import type { ServiceNutritionist, ServicePaymentMethod, ServiceSubscription } from './types/service';

/** Días después del vencimiento en que todavía se la cuenta como "vencida" y no "cortada". */
export const SERVICE_GRACE_DAYS = 7;
/** Aviso previo al vencimiento. */
export const SERVICE_SOON_DAYS = 7;

export type ServiceState = 'prueba' | 'activa' | 'por_vencer' | 'vencida' | 'cortada' | 'sin_cargo' | 'suspendida';

export const SERVICE_STATE_LABELS: Record<ServiceState, string> = {
  prueba: 'En prueba',
  activa: 'Activa',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
  cortada: 'Sin pagar',
  sin_cargo: 'Sin cargo',
  suspendida: 'Suspendida',
};

export const SERVICE_METHOD_LABELS: Record<ServicePaymentMethod, string> = {
  transferencia: 'Transferencia',
  mercado_pago: 'Mercado Pago',
  efectivo: 'Efectivo',
  otro: 'Otro',
};

function days(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

export interface ServiceSummary {
  state: ServiceState;
  /** Hasta cuándo tiene el servicio (prueba o pago); null si es sin cargo o suspendida. */
  until: string | null;
  /** Días que faltan (negativo: días vencida). */
  days_left: number | null;
}

export function summarizeService(subscription: ServiceSubscription, today: string): ServiceSummary {
  if (subscription.override === 'waived') return { state: 'sin_cargo', until: null, days_left: null };
  if (subscription.override === 'suspended') return { state: 'suspendida', until: null, days_left: null };
  const paid = subscription.paid_until && subscription.paid_until > subscription.trial_ends_on ? subscription.paid_until : null;
  const until = paid ?? subscription.trial_ends_on;
  const left = days(today, until);
  if (left < -SERVICE_GRACE_DAYS) return { state: 'cortada', until, days_left: left };
  if (left < 0) return { state: 'vencida', until, days_left: left };
  if (!paid) return { state: 'prueba', until, days_left: left };
  if (left <= SERVICE_SOON_DAYS) return { state: 'por_vencer', until, days_left: left };
  return { state: 'activa', until, days_left: left };
}

export interface ServiceTotals {
  activas: number;
  prueba: number;
  vencidas: number;
  sin_cargo: number;
  cobrado_mes: number;
  /** Cuentas de prueba: no suman en ningún otro número. */
  cuentas_prueba: number;
}

export function serviceTotals(nutritionists: ServiceNutritionist[], today: string): ServiceTotals {
  const month = today.slice(0, 7);
  const totals: ServiceTotals = { activas: 0, prueba: 0, vencidas: 0, sin_cargo: 0, cobrado_mes: 0, cuentas_prueba: 0 };
  for (const nutritionist of nutritionists) {
    if (nutritionist.is_test) {
      totals.cuentas_prueba += 1;
      continue;
    }
    const { state } = summarizeService(nutritionist.subscription, today);
    if (state === 'activa' || state === 'por_vencer') totals.activas += 1;
    else if (state === 'prueba') totals.prueba += 1;
    else if (state === 'vencida' || state === 'cortada' || state === 'suspendida') totals.vencidas += 1;
    else totals.sin_cargo += 1;
    for (const payment of nutritionist.payments) {
      if (payment.status === 'confirmed' && payment.paid_on.startsWith(month)) totals.cobrado_mes += payment.amount;
    }
  }
  return totals;
}

/** Misma regla que la base: un pago dentro de la gracia sigue desde el vencimiento; si no, desde el día que pagó. */
export function servicePaidUntil(trialEndsOn: string, payments: Pick<ServiceNutritionist['payments'][number], 'paid_on' | 'months' | 'status' | 'created_at'>[]): string | null {
  let covered: string | null = null;
  const ordered = payments
    .filter((payment) => payment.status === 'confirmed')
    .sort((a, b) => a.paid_on.localeCompare(b.paid_on) || a.created_at.localeCompare(b.created_at));
  for (const payment of ordered) {
    let start: string = covered ?? trialEndsOn;
    if (days(start, payment.paid_on) > SERVICE_GRACE_DAYS) start = payment.paid_on;
    covered = addMonths(start, payment.months);
  }
  return covered;
}

export function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

/** Como Postgres: 31/01 + 1 mes = 28 o 29/02. */
export function addMonths(date: string, amount: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + amount, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}
