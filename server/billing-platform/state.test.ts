import { describe, expect, it } from 'vitest';
import { accessMode, admission, photoAllowed, platformWriteAccess, reduceBilling, signupGraceDaysLeft, type SubscriptionSnap } from './state.js';

const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

const base = (): SubscriptionSnap => ({
  status: 'pending', billing_cycle: 'monthly', founder: true, founder_until: null,
  current_amount_cents: 1_494_000, current_period_end: null, past_due_since: null, canceled_at: null, last_payment_at: null,
});

describe('estado del cobro', () => {
  it('el primer pago aprobado autoriza y un rechazo posterior deja past_due', () => {
    const approved = reduceBilling(base(), { kind: 'payment', id: 'p1', status: 'approved', amountCents: 1_494_000, paidAt: '2026-10-01T12:00:00.000Z', statusDetail: null, externalReference: 'sub' }, '2026-10-01T12:00:00.000Z');
    expect(approved.sub.status).toBe('authorized');
    expect(approved.sub.founder_until).toBeTruthy();
    const rejected = reduceBilling(approved.sub, { kind: 'payment', id: 'p2', status: 'rejected', amountCents: 1_494_000, paidAt: '2026-11-01T12:00:00.000Z', statusDetail: 'cc_rejected', externalReference: 'sub' }, '2026-11-01T12:00:00.000Z');
    expect(rejected.sub.status).toBe('past_due');
    const back = reduceBilling(rejected.sub, { kind: 'payment', id: 'p3', status: 'approved', amountCents: 1_494_000, paidAt: '2026-11-02T12:00:00.000Z', statusDetail: null, externalReference: 'sub' }, '2026-11-02T12:00:00.000Z');
    expect(back.sub.status).toBe('authorized');
    expect(back.sub.past_due_since).toBeNull();
  });

  it('un aviso viejo no pisa un cobro más nuevo y la gracia dura 7 días', () => {
    const approved = reduceBilling(base(), { kind: 'payment', id: 'p1', status: 'approved', amountCents: 100, paidAt: '2026-11-02T12:00:00.000Z', statusDetail: null, externalReference: 'sub' }, '2026-11-02T12:00:00.000Z');
    const stale = reduceBilling(approved.sub, { kind: 'payment', id: 'old', status: 'rejected', amountCents: 100, paidAt: '2026-10-01T12:00:00.000Z', statusDetail: null, externalReference: 'sub' }, '2026-11-03T12:00:00.000Z');
    expect(stale.sub.status).toBe('authorized');
    const pending = reduceBilling(approved.sub, { kind: 'preapproval', id: 'pre', status: 'pending' }, '2026-11-03T12:00:00.000Z');
    expect(pending.sub.status).toBe('authorized');
    const since = '2026-11-01T00:00:00.000Z';
    const due = { status: 'past_due' as const, past_due_since: since, current_period_end: null };
    expect(accessMode(due, Date.parse(since) + SIETE_DIAS - 1)).toBe('full');
    expect(accessMode(due, Date.parse(since) + SIETE_DIAS)).toBe('read_only');
    expect(accessMode({ status: 'canceled', past_due_since: null, current_period_end: '2026-12-01T00:00:00.000Z' }, Date.parse('2026-11-15T00:00:00.000Z'))).toBe('full');
    expect(accessMode({ status: 'canceled', past_due_since: null, current_period_end: '2026-11-01T00:00:00.000Z' }, Date.parse('2026-11-15T00:00:00.000Z'))).toBe('read_only');
    expect(accessMode(null, Date.now())).toBe('read_only');
  });

  it('frena el alta cuando se pasa el tope y deja la foto manual fuera de la IA', () => {
    expect(admission({ mode: 'full', active: 25, incoming: 1, max: 25, kind: 'patient' }).ok).toBe(false);
    expect(admission({ mode: 'full', active: 24, incoming: 1, max: 25, kind: 'patient' }).ok).toBe(true);
    expect(admission({ mode: 'full', active: 3, incoming: 1, max: 3, kind: 'nutritionist' }).ok).toBe(false);
    expect(admission({ mode: 'read_only', active: 0, incoming: 1, max: 25, kind: 'patient' })).toMatchObject({ ok: false, status: 403 });
    expect(photoAllowed(150, 150)).toBe(false);
    expect(photoAllowed(149, 150)).toBe(true);
    expect(photoAllowed(10_000, null)).toBe(true);
  });

  it('sin suscripción el día 0 y el 29 son acceso completo; el 31 es solo lectura', () => {
    const created = Date.parse('2026-10-01T12:00:00.000Z');
    const day = (n: number) => created + n * 86_400_000;
    expect(platformWriteAccess(null, created, day(0))).toBe('full');
    expect(platformWriteAccess(null, created, day(29))).toBe('full');
    expect(platformWriteAccess(null, created, day(30) - 1)).toBe('full');
    expect(platformWriteAccess(null, created, day(30))).toBe('read_only');
    expect(platformWriteAccess(null, created, day(31))).toBe('read_only');
    expect(signupGraceDaysLeft(created, day(0))).toBe(30);
    expect(signupGraceDaysLeft(created, day(29))).toBe(1);
    expect(signupGraceDaysLeft(created, day(31))).toBe(0);
    expect(accessMode(null, day(0))).toBe('read_only');
    expect(platformWriteAccess({ status: 'authorized', past_due_since: null, current_period_end: null }, created, day(31))).toBe('full');
  });
});

it('el alta no extiende la gracia de deuda ni reactiva un plan pausado', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  const created = now - 20 * 86_400_000;
  for (const status of ['past_due', 'paused', 'canceled'] as const) {
    expect(platformWriteAccess({ status, past_due_since: '2026-10-01T12:00:00Z', current_period_end: null }, created, now)).toBe('read_only');
  }
  expect(platformWriteAccess({ status: 'pending', past_due_since: null, current_period_end: null }, created, now)).toBe('full');
  expect(platformWriteAccess(null, null, now)).toBe('read_only');
});
