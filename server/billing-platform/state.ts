import { GRACE_MS, type BillingCycle } from './pricing.js';

export type PlatformStatus = 'pending' | 'authorized' | 'paused' | 'past_due' | 'canceled';
export type PaymentStatus = 'approved' | 'pending' | 'rejected' | 'refunded' | 'charged_back';

export type SubscriptionSnap = {
  status: PlatformStatus;
  billing_cycle: BillingCycle;
  founder: boolean;
  founder_until: string | null;
  current_amount_cents: number;
  current_period_end: string | null;
  past_due_since: string | null;
  canceled_at: string | null;
  last_payment_at: string | null;
};

export type RemoteFact =
  | { kind: 'preapproval'; id: string; status: string }
  | { kind: 'payment'; id: string; status: string; amountCents: number; paidAt: string | null; statusDetail: string | null; externalReference: string | null };

export function addMonths(iso: string, months: number): string {
  const date = new Date(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString();
}

export function accessMode(sub: { status: PlatformStatus; past_due_since: string | null; current_period_end: string | null } | null, now: number): 'full' | 'read_only' {
  if (!sub) return 'read_only';
  if (sub.status === 'authorized') return 'full';
  if (sub.status === 'past_due') {
    const since = sub.past_due_since ? Date.parse(sub.past_due_since) : now;
    return now >= since + GRACE_MS ? 'read_only' : 'full';
  }
  if (sub.status === 'canceled' && sub.current_period_end && Date.parse(sub.current_period_end) > now) return 'full';
  return 'read_only';
}

export function graceUntil(sub: { status: PlatformStatus; past_due_since: string | null } | null): string | null {
  if (sub?.status !== 'past_due' || !sub.past_due_since) return null;
  return new Date(Date.parse(sub.past_due_since) + GRACE_MS).toISOString();
}

function paymentRank(status: string): PaymentStatus | null {
  if (status === 'approved' || status === 'authorized') return 'approved';
  if (status === 'pending' || status === 'in_process' || status === 'in_mediation') return 'pending';
  if (status === 'rejected' || status === 'cancelled') return 'rejected';
  if (status === 'refunded') return 'refunded';
  if (status === 'charged_back') return 'charged_back';
  return null;
}

function olderThan(incoming: string | null, previous: string | null): boolean {
  if (!incoming || !previous) return false;
  return Date.parse(incoming) < Date.parse(previous);
}

/** Aplica lo que dice Mercado Pago. Un aviso viejo no pisa un cobro más nuevo. */
export function reduceBilling(sub: SubscriptionSnap, fact: RemoteFact, nowIso: string): { sub: SubscriptionSnap; payment: { status: PaymentStatus; amountCents: number; paidAt: string | null; statusDetail: string | null; id: string } | null } {
  if (fact.kind === 'preapproval') {
    const status = fact.status;
    if (status === 'pending' && (sub.status === 'authorized' || sub.status === 'past_due' || sub.status === 'paused')) {
      return { sub, payment: null };
    }
    if (status === 'paused' && sub.status !== 'canceled') return { sub: { ...sub, status: 'paused' }, payment: null };
    if ((status === 'cancelled' || status === 'canceled') && sub.status !== 'canceled') {
      return { sub: { ...sub, status: 'canceled', canceled_at: sub.canceled_at ?? nowIso }, payment: null };
    }
    return { sub, payment: null };
  }
  const status = paymentRank(fact.status);
  if (!status) return { sub, payment: null };
  const payment = { status, amountCents: fact.amountCents, paidAt: fact.paidAt, statusDetail: fact.statusDetail, id: fact.id };
  if (olderThan(fact.paidAt, sub.last_payment_at) && status !== 'approved') return { sub, payment };
  if (status === 'approved') {
    const months = sub.billing_cycle === 'annual' ? 12 : 1;
    const paidAt = fact.paidAt ?? nowIso;
    return {
      sub: {
        ...sub,
        status: 'authorized',
        past_due_since: null,
        current_period_end: addMonths(paidAt, months),
        last_payment_at: paidAt,
        founder_until: sub.founder ? (sub.founder_until ?? addMonths(paidAt, 12)) : null,
      },
      payment,
    };
  }
  if (status === 'rejected' || status === 'refunded' || status === 'charged_back') {
    if (sub.status === 'canceled') return { sub, payment };
    return { sub: { ...sub, status: 'past_due', past_due_since: sub.past_due_since ?? nowIso, last_payment_at: fact.paidAt ?? sub.last_payment_at }, payment };
  }
  return { sub, payment };
}

export function admission(input: { mode: 'full' | 'read_only'; active: number; incoming: number; max: number | null; kind: 'patient' | 'nutritionist' }): { ok: true } | { ok: false; status: 403 | 409; message: string } {
  if (input.mode === 'read_only') {
    return { ok: false, status: 403, message: 'Tu plan está en solo lectura. Podés ver a tus pacientes y exportar tus datos. Regularizá el pago para volver a cargar. Tus pacientes no pierden el acceso.' };
  }
  if (input.max != null && input.active + input.incoming > input.max) {
    return { ok: false, status: 409, message: input.kind === 'nutritionist' ? 'Llegaste al límite de nutricionistas de tu plan.' : 'Llegaste al límite de tu plan.' };
  }
  return { ok: true };
}

export function photoAllowed(used: number, max: number | null): boolean {
  return max == null || used < max;
}
