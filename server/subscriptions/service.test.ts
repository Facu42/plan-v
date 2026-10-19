import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSubscription, processQueued, reconcileOne } from './service.js';

const mem = vi.hoisted(() => ({
  plans: [] as Array<Record<string, unknown>>,
  subs: [] as Array<Record<string, unknown>>,
  ledger: [] as Array<Record<string, unknown>>,
  notices: [] as Array<Record<string, unknown>>,
  queue: [] as Array<Record<string, unknown>>,
  preapprovals: [] as Array<{ token: string; key: string; body: Record<string, unknown> }>,
  updates: [] as Array<{ id: string; body: Record<string, unknown> }>,
  reads: { payment: 0, preapproval: 0 },
  account: 'acc-1' as string | null,
  payment: {} as Record<string, unknown>,
  inserts: 0,
  voids: 0,
}));

vi.mock('../push/push.js', () => ({ notifyPatientPush: () => undefined }));
vi.mock('../messages/repository.js', () => ({ sendThreadMessage: async () => ({ message: {}, duplicate: false }) }));
vi.mock('../scheduling/repository.js', () => ({ disconnect: async () => undefined }));
vi.mock('../scheduling/payments.js', () => ({ applyVerifiedPayment: async () => ({ applied: true }) }));
vi.mock('../ops/log.js', () => ({ writeOpsLog: () => undefined }));
vi.mock('./mp.js', () => ({
  MpCallError: class MpCallError extends Error {
    constructor(readonly httpStatus: number) {
      super('Mercado Pago no confirmó la operación.');
    }
  },
  nutriToken: async () => ({ token: 'token-oauth-de-la-nutri', accountId: 'acc-1' }),
  mercadoPago: {
    createPreapproval: async (token: string, key: string, body: Record<string, unknown>) => {
      mem.preapprovals.push({ token, key, body });
      return { id: 'pre-1', status: 'pending', init_point: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=pre-1' };
    },
    updatePreapproval: async (_token: string, id: string, body: Record<string, unknown>) => {
      mem.updates.push({ id, body });
      return { id, ...body };
    },
    getPreapproval: async () => {
      mem.reads.preapproval += 1;
      return { id: 'pre-1', status: 'pending' };
    },
    searchPreapproval: async () => [],
    getAuthorizedPayment: async () => ({}),
    searchAuthorizedPayments: async () => [],
    getPayment: async () => {
      mem.reads.payment += 1;
      return mem.payment;
    },
    searchPayments: async () => [],
  },
}));

vi.mock('./repository.js', () => ({
  getPlan: async (id: string) => mem.plans.find(plan => plan.id === id) ?? null,
  connectionAccount: async () => mem.account,
  patientOwned: async (_nutritionistId: string, patientId: string) => ({ id: patientId, nutritionist_id: 'nutri-1', full_name: 'Lola', anonymized_at: null }),
  findLive: async () => null,
  findByClientRequest: async (_nutritionistId: string, clientRequestId: string) => mem.subs.find(sub => sub.client_request_id === clientRequestId) ?? null,
  nutritionistCard: async () => ({ id: 'nutri-1', user_id: 'user-1', display_name: 'Ana' }),
  insertSubscription: async (values: Record<string, unknown>) => {
    const row = { create_idempotency_key: 'idem-fija', revision: 1, provider_preapproval_id: null, init_point: null, provider_last_modified: null, cancelled_by: null, manual_fee_paused: false, payment_state: null, plan: { name: 'Seguimiento mensual' }, ...values };
    mem.subs.push(row);
    return row;
  },
  publicSlug: async () => 'ana',
  patchSubscription: async (id: string, patch: Record<string, unknown>) => {
    const row = mem.subs.find(sub => sub.id === id);
    if (!row) return null;
    Object.assign(row, patch);
    return { ...row };
  },
  getSubscription: async (id: string) => mem.subs.find(sub => sub.id === id) ?? null,
  integrationsByAccount: async (accountId: string) => accountId === 'acc-1' ? [{ nutritionist_id: 'nutri-1', account_id: 'acc-1' }] : [],
  claimNotices: async () => mem.queue.splice(0, 1),
  finishNotice: async (id: string, patch: Record<string, unknown>) => {
    mem.notices.push({ id, ...patch });
  },
  findSubscriptionById: async (id: string, nutritionistId: string) => mem.subs.find(sub => sub.id === id && sub.nutritionist_id === nutritionistId) ?? null,
  findSubscriptionByProvider: async () => null,
  checkoutIntent: async () => null,
  upsertInstallment: async () => ({ id: 'inst-1', ledger_payment_id: null }),
  findLedger: async (providerPaymentId: string) => mem.ledger.find(row => row.provider_payment_id === providerPaymentId) ?? null,
  insertLedger: async (values: Record<string, unknown>) => {
    mem.inserts += 1;
    if (mem.ledger.some(row => row.provider_payment_id === values.provider_payment_id)) {
      return { id: mem.ledger[0]?.id, created: false };
    }
    const id = `ledger-${mem.ledger.length + 1}`;
    mem.ledger.push({ id, status: 'confirmed', ...values });
    return { id, created: true };
  },
  setInstallmentLedger: async () => undefined,
  voidLedger: async (id: string, note: string) => {
    mem.voids += 1;
    const row = mem.ledger.find(item => item.id === id);
    if (row && row.status === 'confirmed') Object.assign(row, { status: 'voided', note });
  },
}));

const PLAN = '11111111-1111-4111-8111-111111111111';
const PATIENT = '22222222-2222-4222-8222-222222222222';
const REQUEST = '33333333-3333-4333-8333-333333333333';
const SUB = '44444444-4444-4444-8444-444444444444';

function reset() {
  mem.plans = [{ id: PLAN, name: 'Seguimiento mensual', status: 'active', amount_cents: 5_400_000, public_visible: false }];
  mem.subs = [];
  mem.ledger = [];
  mem.notices = [];
  mem.queue = [];
  mem.preapprovals = [];
  mem.updates = [];
  mem.reads = { payment: 0, preapproval: 0 };
  mem.account = 'acc-1';
  mem.payment = {};
  mem.inserts = 0;
  mem.voids = 0;
}

describe('alta con el token de la nutricionista', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('arma el débito mensual sin comisión y no lo crea dos veces', async () => {
    reset();
    vi.stubEnv('PATIENT_SUBSCRIPTIONS_ENABLED', '1');
    vi.stubEnv('PUBLIC_SITE_URL', 'https://planv.app');
    const input = {
      plan_id: PLAN,
      patient_id: PATIENT,
      payer_email: 'lola@correo.com',
      source: 'panel' as const,
      client_request_id: REQUEST,
      contact_name: null,
      contact_phone: null,
    };
    const created = await createSubscription('nutri-1', input);
    await createSubscription('nutri-1', input);
    expect(created.status).toBe('pending');
    expect(created.init_point).toMatch(/^https:\/\//);
    expect(mem.preapprovals).toHaveLength(1);
    expect(mem.preapprovals[0]?.token).toBe('token-oauth-de-la-nutri');
    expect(mem.preapprovals[0]?.key).toBe('idem-fija');
    expect(mem.preapprovals[0]?.body).toMatchObject({
      status: 'pending',
      external_reference: created.id,
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: 54_000, currency_id: 'ARS' },
    });
    expect(mem.preapprovals[0]?.body).not.toHaveProperty('marketplace_fee');
    expect(mem.preapprovals[0]?.body).not.toHaveProperty('start_date');
    expect(mem.preapprovals[0]?.body).not.toHaveProperty('end_date');
  });
});

describe('cobros, devoluciones y conciliación', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('anota el cobro aprobado una sola vez y la devolución lo anula', async () => {
    reset();
    vi.stubEnv('PATIENT_SUBSCRIPTIONS_ENABLED', '1');
    mem.subs.push({
      id: SUB,
      nutritionist_id: 'nutri-1',
      plan_id: PLAN,
      patient_id: PATIENT,
      provider_account_id: 'acc-1',
      payer_email: 'lola@correo.com',
      status: 'authorized',
      amount_cents: 5_400_000,
      manual_fee_paused: true,
      plan: { name: 'Seguimiento mensual' },
    });
    mem.payment = {
      id: 88,
      status: 'approved',
      collector_id: 'acc-1',
      external_reference: SUB,
      transaction_amount: 54_000,
      date_approved: '2026-11-10T13:00:00.000Z',
    };
    const event = { id: 'e1', topic: 'payment', provider_user_id: 'acc-1', resource_id: '88', attempts: 1 };
    mem.queue.push(event, { ...event, id: 'e2' });
    await processQueued(1);
    await processQueued(1);
    expect(mem.inserts).toBe(1);
    expect(mem.ledger).toHaveLength(1);
    expect(mem.ledger[0]).toMatchObject({
      source: 'subscription',
      provider: 'mercado_pago',
      provider_payment_id: '88',
      method: 'mercado_pago',
      amount: 54_000,
      status: 'confirmed',
    });
    expect(String(mem.ledger[0]?.note)).toContain('Débito automático');

    mem.payment = { ...mem.payment, status: 'refunded' };
    mem.queue.push({ ...event, id: 'e3' }, { ...event, id: 'e4' });
    await processQueued(1);
    await processQueued(1);
    expect(mem.inserts).toBe(1);
    expect(mem.voids).toBe(1);
    expect(mem.ledger[0]).toMatchObject({ status: 'voided', note: 'Anulado por devolución' });
    expect(mem.notices.every(notice => notice.status === 'processed')).toBe(true);
  });

  it('vence el link a los 7 días y no toca otra cuenta de Mercado Pago', async () => {
    reset();
    vi.stubEnv('PATIENT_SUBSCRIPTIONS_ENABLED', '1');
    const pending = {
      id: SUB,
      nutritionist_id: 'nutri-1',
      plan_id: PLAN,
      patient_id: PATIENT,
      provider_account_id: 'acc-1',
      provider_preapproval_id: 'pre-1',
      payer_email: 'lola@correo.com',
      status: 'pending',
      amount_cents: 5_400_000,
      created_at: '2020-01-01T15:00:00.000Z',
      expires_at: '2020-01-08T15:00:00.000Z',
      next_payment_date: null,
      pending_amount_on: null,
      plan: { name: 'Seguimiento mensual' },
    };
    mem.subs.push(pending);
    expect(await reconcileOne(pending as never)).toBe('expire_link');
    expect(mem.updates).toEqual([{ id: 'pre-1', body: { status: 'cancelled' } }]);
    expect(mem.subs[0]).toMatchObject({ status: 'expired', cancelled_by: 'system' });

    mem.updates.length = 0;
    mem.account = 'otra-cuenta';
    const active = { ...pending, id: '55555555-5555-4555-8555-555555555555', status: 'authorized', expires_at: null };
    mem.subs.push(active);
    expect(await reconcileOne(active as never)).toBe('skip_other_account');
    expect(mem.updates).toHaveLength(0);
    expect(active).toMatchObject({ account_mismatch: true });
  });

  it('un aviso de una cuenta que no está en la lista no se manda a Mercado Pago', async () => {
    reset();
    vi.stubEnv('PATIENT_SUBSCRIPTIONS_ENABLED', '1');
    vi.stubEnv('PATIENT_SUBSCRIPTIONS_ALLOWLIST', 'otra-nutri');
    mem.queue.push({ id: 'e9', topic: 'subscription_preapproval', provider_user_id: 'acc-1', resource_id: 'pre-1', attempts: 1 });
    await processQueued(1);
    expect(mem.reads.preapproval).toBe(0);
    expect(mem.notices[0]).toMatchObject({ status: 'ignored' });
  });
});
