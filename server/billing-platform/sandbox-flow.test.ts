import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyMpSignature } from '../scheduling/logic.js';
import { MpCallError } from '../subscriptions/mp.js';
import { GRACE_DAYS, GRACE_MS } from './pricing.js';
import {
  classifyPlatformMpEnv,
  normalizeBillingTopic,
  parseBillingNotice,
  platformMpTokenAllowed,
  platformMpTokenKind,
  signPlatformWebhook,
} from './sandbox.js';
import { receiveWebhook } from './service.js';
import { platformMercadoPago } from './mp-platform.js';
import { accessMode } from './state.js';

const SUB_ID = '11111111-1111-4111-8111-111111111111';
const SECRET = 'platform-sandbox-secret';

const store = vi.hoisted(() => ({
  events: new Set<string>(),
  payments: [] as Array<Record<string, unknown>>,
  sub: null as null | Record<string, unknown>,
  remote: async (): Promise<unknown> => null,
}));

vi.mock('./repository.js', () => ({
  findEvent: async (requestId: string, dataId: string, topic: string) => store.events.has(`${requestId}:${dataId}:${topic}`),
  saveEvent: async (requestId: string, dataId: string, topic: string) => {
    store.events.add(`${requestId}:${dataId}:${topic}`);
    return 'saved';
  },
  findSubscription: async (id: string) => store.sub?.id === id ? store.sub : null,
  findByPreapproval: async (id: string) => store.sub?.provider_preapproval_id === id ? store.sub : null,
  listPayments: async () => store.payments,
  upsertPayment: async (row: Record<string, unknown>) => { store.payments.push(row); },
  casUpdate: async (id: string, revision: number, patch: Record<string, unknown>) => {
    if (!store.sub || store.sub.id !== id || store.sub.revision !== revision) return null;
    Object.assign(store.sub, patch, { revision: revision + 1 });
    return store.sub;
  },
  logBilling: () => undefined,
}));

vi.mock('./mp-platform.js', async () => {
  const actual = await vi.importActual<typeof import('./mp-platform.js')>('./mp-platform.js');
  return {
    ...actual,
    loadRemote: () => store.remote(),
    minimalRaw: (row: Record<string, unknown>) => row,
  };
});

function resetSub() {
  store.events.clear();
  store.payments.length = 0;
  store.sub = {
    id: SUB_ID,
    revision: 1,
    status: 'pending',
    billing_cycle: 'monthly',
    founder: false,
    founder_until: null,
    current_amount_cents: 2_490_000,
    current_period_end: null,
    past_due_since: null,
    canceled_at: null,
    provider_preapproval_id: 'pre-1',
    init_point: 'https://sandbox.mercadopago.com.ar/subscriptions/checkout?preapproval_id=pre-1',
  };
}

function signedNotice(id: string, requestId: string, topic = 'payment', now = Date.parse('2026-11-01T12:00:00.000Z')) {
  const { signature } = signPlatformWebhook(id, requestId, SECRET, now);
  return { dataId: id, requestId, signature, topic, now };
}

describe('credenciales y firma de sandbox', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('solo acepta TEST- fuera de producción y nunca un APP_USR- en sandbox', () => {
    expect(platformMpTokenKind('TEST-abc')).toBe('test');
    expect(platformMpTokenKind('APP_USR-abc')).toBe('production');
    expect(platformMpTokenKind('skill-placeholder')).toBe('other');
    expect(platformMpTokenKind('')).toBe('missing');
    expect(platformMpTokenAllowed('TEST-abc', {})).toBe(true);
    expect(platformMpTokenAllowed('APP_USR-abc', {})).toBe(false);
    expect(platformMpTokenAllowed('APP_USR-abc', { APP_MODE: 'production' })).toBe(true);
    expect(platformMpTokenAllowed('APP_USR-abc', { APP_MODE: 'production', PLATFORM_BILLING_SANDBOX: '1' })).toBe(false);
    expect(platformMpTokenAllowed('otro', { APP_MODE: 'production' })).toBe(false);
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'APP_USR-no-usar');
    vi.stubEnv('PLATFORM_BILLING_SANDBOX', '1');
    expect(classifyPlatformMpEnv(process.env).token).toBe('production');
    expect(classifyPlatformMpEnv(process.env).sandboxForced).toBe(true);
  });

  it('firma y verifica el aviso con la misma plantilla, y normaliza el tema', () => {
    const now = Date.parse('2026-11-01T15:00:00.000Z');
    const signed = signPlatformWebhook('88', 'req-sandbox', SECRET, now);
    expect(verifyMpSignature({ id: '88', requestId: 'req-sandbox', signature: signed.signature, secret: SECRET, now })).toBe(true);
    expect(verifyMpSignature({ id: '88', requestId: 'req-sandbox', signature: signed.signature, secret: 'otro', now })).toBe(false);
    expect(normalizeBillingTopic('payment.updated')).toBe('payment');
    expect(normalizeBillingTopic('subscription_preapproval.created')).toBe('subscription_preapproval');
    expect(normalizeBillingTopic('subscription_authorized_payment.updated')).toBe('subscription_authorized_payment');
    expect(parseBillingNotice({
      query: { topic: 'payment', id: '99' },
      payload: { action: 'payment.updated' },
      requestId: 'r',
      signature: 's',
      now,
    })).toMatchObject({ dataId: '99', topic: 'payment' });
  });

  it('el cliente de Mercado Pago rechaza un token de producción en sandbox', async () => {
    vi.stubEnv('PLATFORM_BILLING_SANDBOX', '1');
    vi.stubEnv('APP_MODE', 'production');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'APP_USR-no-usar');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(platformMercadoPago.getPayment('1')).rejects.toMatchObject({ httpStatus: 501 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('flujo simulado: elegir plan, pago, webhook y gracia', () => {
  beforeEach(() => {
    resetSub();
    vi.stubEnv('MP_PLATFORM_WEBHOOK_SECRET', SECRET);
    store.remote = async () => ({
      kind: 'payment',
      id: 'pay-ok',
      status: 'approved',
      amountCents: 2_490_000,
      paidAt: '2026-11-01T12:00:00.000Z',
      statusDetail: 'accredited',
      externalReference: SUB_ID,
    });
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('un aviso firmado con pago aprobado deja la cuenta activa', async () => {
    const status = await receiveWebhook(signedNotice('pay-ok', 'req-ok'));
    expect(status).toBe(200);
    expect(store.sub?.status).toBe('authorized');
    expect(store.sub?.past_due_since).toBeNull();
    expect(store.payments).toHaveLength(1);
    expect(store.payments[0]?.status).toBe('approved');
    expect(accessMode({
      status: store.sub!.status as 'authorized',
      past_due_since: store.sub!.past_due_since as string | null,
      current_period_end: store.sub!.current_period_end as string | null,
    }, Date.parse('2026-11-01T12:00:00.000Z'))).toBe('full');
  });

  it('una firma inválida responde 401 y no escribe', async () => {
    const status = await receiveWebhook({
      dataId: 'pay-ok',
      requestId: 'req-bad',
      signature: 'ts=1730462400,v1=' + 'ab'.repeat(32),
      topic: 'payment',
      now: Date.parse('2026-11-01T12:00:00.000Z'),
    });
    expect(status).toBe(401);
    expect(store.sub?.status).toBe('pending');
    expect(store.events.size).toBe(0);
    expect(store.payments).toHaveLength(0);
  });

  it('un pago rechazado abre 30 días de gracia y después queda solo lectura', async () => {
    expect(await receiveWebhook(signedNotice('pay-ok', 'req-ok'))).toBe(200);
    store.remote = async () => ({
      kind: 'payment',
      id: 'pay-fail',
      status: 'rejected',
      amountCents: 2_490_000,
      paidAt: '2026-12-01T12:00:00.000Z',
      statusDetail: 'cc_rejected_other_reason',
      externalReference: SUB_ID,
    });
    expect(await receiveWebhook(signedNotice('pay-fail', 'req-fail', 'payment.updated', Date.parse('2026-12-01T12:00:00.000Z')))).toBe(200);
    expect(store.sub?.status).toBe('past_due');
    const since = Date.parse(String(store.sub?.past_due_since));
    expect(accessMode({ status: 'past_due', past_due_since: store.sub!.past_due_since as string, current_period_end: null }, since)).toBe('full');
    expect(accessMode({ status: 'past_due', past_due_since: store.sub!.past_due_since as string, current_period_end: null }, since + GRACE_MS - 1)).toBe('full');
    expect(GRACE_DAYS).toBe(30);
    expect(accessMode({ status: 'past_due', past_due_since: store.sub!.past_due_since as string, current_period_end: null }, since + GRACE_MS)).toBe('read_only');
  });

  it('el mismo aviso dos veces no duplica el cobro, y si Mercado Pago no responde no marca el evento', async () => {
    expect(await receiveWebhook(signedNotice('pay-ok', 'req-dup'))).toBe(200);
    expect(await receiveWebhook(signedNotice('pay-ok', 'req-dup'))).toBe(200);
    expect(store.payments).toHaveLength(1);
    store.remote = async () => { throw new MpCallError(503); };
    expect(await receiveWebhook(signedNotice('pay-down', 'req-down'))).toBe(503);
    expect(store.events.has('req-down:pay-down:payment')).toBe(false);
  });
});
