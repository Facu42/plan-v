import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { checkout, planForNutritionist, receiveWebhook } from './service.js';

const mem = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  events: new Set<string>(),
  payments: [] as Array<Record<string, unknown>>,
  fetches: [] as string[],
}));

vi.mock('./repository.js', () => ({
  nutritionistCreatedAt: async () => Date.parse('2026-10-01T12:00:00.000Z'),
  usageOf: async () => ({ active_patients: 0, nutritionists: 1, ai_photos: 0 }),
  listPayments: async () => mem.payments,
  founderSeatsLeft: async () => 30,
  payerEmail: async () => 'nutri@example.test',
  findByClientRequest: async (_id: string, key: string) => [...mem.rows.values()].find((row) => row.client_request_id === key) ?? null,
  findOpenSubscription: async () => [...mem.rows.values()].find((row) => ['pending', 'authorized', 'paused', 'past_due'].includes(String(row.status))) ?? null,
  findSubscription: async (id: string) => mem.rows.get(id) ?? null,
  findByPreapproval: async (id: string) => [...mem.rows.values()].find((row) => row.provider_preapproval_id === id) ?? null,
  claimFounder: async () => true,
  releaseFounder: async () => undefined,
  insertSubscription: async (input: Record<string, unknown>) => {
    const row = {
      id: '11111111-1111-4111-8111-111111111111', revision: 1, provider_preapproval_id: null, init_point: null,
      organization_id: null, founder_until: null, current_period_end: null, past_due_since: null, canceled_at: null,
      cancel_reason: null, create_idempotency_key: input.client_request_id, ...input,
    };
    mem.rows.set(String(row.id), row);
    return row;
  },
  casUpdate: async (id: string, revision: number, patch: Record<string, unknown>) => {
    const row = mem.rows.get(id);
    if (!row || row.revision !== revision) return null;
    Object.assign(row, patch, { revision: Number(revision) + 1 });
    return row;
  },
  upsertPayment: async (row: Record<string, unknown>) => { mem.payments.push(row); },
  findEvent: async (requestId: string, dataId: string, topic: string) => mem.events.has(`${requestId}:${dataId}:${topic}`),
  saveEvent: async (requestId: string, dataId: string, topic: string) => {
    const key = `${requestId}:${dataId}:${topic}`;
    if (mem.events.has(key)) return 'duplicate';
    mem.events.add(key);
    return 'saved';
  },
  logBilling: () => undefined,
}));

const SUB = '11111111-1111-4111-8111-111111111111';

function signature(id: string, requestId: string, now: number) {
  const ts = String(Math.floor(now / 1000));
  const mac = createHmac('sha256', 'platform-secret').update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return { ts, header: `ts=${ts},v1=${mac}` };
}

describe('flujo de prueba de Mercado Pago, sin cobro real', () => {
  beforeEach(() => {
    mem.rows.clear();
    mem.events.clear();
    mem.payments.length = 0;
    mem.fetches.length = 0;
    vi.stubEnv('PUBLIC_SITE_URL', 'https://plan-v.example');
    vi.stubEnv('MP_PLATFORM_WEBHOOK_SECRET', 'platform-secret');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'TEST-sandbox');
    vi.stubGlobal('fetch', (async (url: string, init?: RequestInit) => {
      mem.fetches.push(`${init?.method ?? 'GET'} ${url}`);
      const auth = new Headers(init?.headers).get('Authorization') ?? '';
      if (!auth.startsWith('Bearer TEST-')) return new Response('no', { status: 401 });
      if (url.endsWith('/preapproval') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { auto_recurring?: { transaction_amount?: number } };
        expect(body.auto_recurring?.transaction_amount).toBe(14940);
        return Response.json({ id: 'pre-1', init_point: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=pre-1' });
      }
      if (url.endsWith('/preapproval/pre-1')) return Response.json({ id: 'pre-1', status: 'authorized' });
      if (url.endsWith('/v1/payments/88')) {
        return Response.json({ id: 88, status: 'approved', transaction_amount: 14940, date_approved: '2026-10-15T12:00:00.000Z', external_reference: SUB });
      }
      if (url.endsWith('/v1/payments/1')) {
        return Response.json({ id: 1, status: 'approved', transaction_amount: 1, date_approved: '2026-10-15T12:00:00.000Z', external_reference: SUB });
      }
      return new Response('no', { status: 404 });
    }) as typeof fetch);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rechaza una clave de producción y no llama a Mercado Pago', async () => {
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'APP_USR-no');
    await expect(checkout({ nutritionistId: 'nutri-1', userId: 'user-1', planCode: 'arranque', cycle: 'monthly', clientRequestId: 'pedido-1234' }))
      .rejects.toBeInstanceOf(CareError);
    expect(mem.fetches).toEqual([]);
    expect(mem.rows.size).toBe(0);
  });

  it('elige el plan, cobra el monto del servidor y el aviso deja la cuenta activa', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-15T12:00:00.000Z'));
    const started = await checkout({ nutritionistId: 'nutri-1', userId: 'user-1', planCode: 'arranque', cycle: 'monthly', clientRequestId: 'pedido-1234' });
    expect(started.init_point).toContain('mercadopago.com');
    expect(mem.rows.get(SUB)?.status).toBe('pending');
    expect(mem.fetches[0]).toContain('https://api.mercadopago.com/preapproval');

    const earlyNow = Date.parse('2026-10-15T12:01:00.000Z');
    const savedId = mem.rows.get(SUB)?.provider_preapproval_id;
    mem.rows.get(SUB)!.provider_preapproval_id = null;
    const early = signature('pre-1', 'aviso-temprano', earlyNow);
    expect(await receiveWebhook({ dataId: 'pre-1', requestId: 'aviso-temprano', signature: early.header, topic: 'subscription_preapproval', now: earlyNow })).toBe(503);
    expect(mem.events.size).toBe(0);
    mem.rows.get(SUB)!.provider_preapproval_id = savedId;

    const planNow = Date.parse('2026-10-15T12:02:00.000Z');
    const planNotice = signature('pre-1', 'aviso-plan', planNow);
    expect(await receiveWebhook({ dataId: 'pre-1', requestId: 'aviso-plan', signature: planNotice.header, topic: 'subscription_preapproval', now: planNow })).toBe(200);
    expect(mem.rows.get(SUB)?.status).toBe('pending');

    const payNow = Date.parse('2026-10-15T12:03:00.000Z');
    const cheap = signature('1', 'aviso-barato', payNow);
    expect(await receiveWebhook({ dataId: '1', requestId: 'aviso-barato', signature: cheap.header, topic: 'payment', now: payNow })).toBe(200);
    expect(mem.rows.get(SUB)?.status).toBe('pending');

    const paidNow = Date.parse('2026-10-15T12:04:00.000Z');
    const paid = signature('88', 'aviso-pago', paidNow);
    expect(await receiveWebhook({ dataId: '88', requestId: 'aviso-pago', signature: paid.header, topic: 'payment', now: paidNow })).toBe(200);
    expect(await receiveWebhook({ dataId: '88', requestId: 'aviso-pago', signature: paid.header, topic: 'payment', now: paidNow })).toBe(200);
    expect(mem.rows.get(SUB)?.status).toBe('authorized');
    expect(mem.payments).toHaveLength(2);
    const view = await planForNutritionist('nutri-1');
    expect(view.subscription?.status).toBe('authorized');
    expect(view.subscription?.read_only).toBe(false);
  });

  it('sin pago, a los 30 días la cuenta queda en solo lectura', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-31T12:00:00.000Z'));
    const view = await planForNutritionist('nutri-1');
    expect(view.subscription).toBeNull();
    expect(view.signup_grace).toMatchObject({ days_left: 0, read_only: true });
  });
});
