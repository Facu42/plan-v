import { createHmac } from 'node:crypto';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { MpCallError } from '../subscriptions/mp.js';
import { registerPlatformBillingRoutes } from './routes.js';

const calls = { findEvent: 0, saveEvent: 0, loadRemote: 0 };
const { loadRemote } = vi.hoisted(() => ({
  loadRemote: vi.fn(async () => ({ kind: 'payment', id: '88', status: 'rejected', amountCents: 2_490_000, paidAt: '2026-11-01T12:00:00.000Z', statusDetail: 'cc_rejected', externalReference: '11111111-1111-4111-8111-111111111111' })),
}));

vi.mock('./repository.js', () => ({
  findEvent: async () => { calls.findEvent += 1; return calls.findEvent > 1; },
  saveEvent: async () => { calls.saveEvent += 1; return 'saved'; },
  findSubscription: async () => ({
    id: '11111111-1111-4111-8111-111111111111', revision: 1, status: 'pending', billing_cycle: 'monthly', founder: false,
    founder_until: null, current_amount_cents: 2_490_000, current_period_end: null, past_due_since: null, canceled_at: null,
  }),
  findByPreapproval: async () => null,
  listPayments: async () => [],
  upsertPayment: async () => undefined,
  casUpdate: async () => ({ id: '11111111-1111-4111-8111-111111111111', revision: 2 }),
  logBilling: () => undefined,
}));

vi.mock('./mp-platform.js', async () => {
  const actual = await vi.importActual<typeof import('./mp-platform.js')>('./mp-platform.js');
  return {
    ...actual,
    loadRemote: () => { calls.loadRemote += 1; return loadRemote(); },
    minimalRaw: (row: Record<string, unknown>) => row,
  };
});

function signature(id: string, requestId: string, ts: string, secret = 'platform-secret') {
  const mac = createHmac('sha256', secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return `ts=${ts},v1=${mac}`;
}

function app() {
  const hono = new Hono();
  hono.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'fail' }, 500));
  registerPlatformBillingRoutes(hono);
  return hono;
}

describe('aviso de Mercado Pago de la plataforma', () => {
  afterEach(() => {
    calls.findEvent = 0; calls.saveEvent = 0; calls.loadRemote = 0;
    loadRemote.mockReset();
    loadRemote.mockResolvedValue({ kind: 'payment', id: '88', status: 'rejected', amountCents: 2_490_000, paidAt: '2026-11-01T12:00:00.000Z', statusDetail: 'cc_rejected', externalReference: '11111111-1111-4111-8111-111111111111' });
    vi.unstubAllEnvs();
  });

  it('con la bandera apagada no escribe', async () => {
    const response = await app().request('/api/public/billing/mp/webhook', { method: 'POST', body: '{}' });
    expect(response.status).toBe(404);
    expect(calls.saveEvent).toBe(0);
  });

  it('sin secreto responde 501 y una firma inválida o vencida no toca la base', async () => {
    vi.stubEnv('PLATFORM_BILLING_ENABLED', '1');
    const missing = await app().request('/api/public/billing/mp/webhook', { method: 'POST', body: '{}' });
    expect(missing.status).toBe(501);
    expect(calls.findEvent).toBe(0);
    vi.stubEnv('MP_PLATFORM_WEBHOOK_SECRET', 'platform-secret');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'TEST-sandbox');
    const ts = String(Math.floor(Date.now() / 1000));
    const bad = await app().request('/api/public/billing/mp/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-1', 'x-signature': `ts=${ts},v1=${'ab'.repeat(32)}` },
      body: JSON.stringify({ type: 'payment', data: { id: '88' }, status: 'approved', transaction_amount: 1 }),
    });
    expect(bad.status).toBe(401);
    expect(calls.findEvent).toBe(0);
    const old = String(Math.floor(Date.now() / 1000) - 600);
    const expired = await app().request('/api/public/billing/mp/webhook/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-1', 'x-signature': signature('88', 'req-1', old) },
      body: JSON.stringify({ type: 'payment', data: { id: '88' } }),
    });
    expect(expired.status).toBe(401);
    expect(calls.saveEvent).toBe(0);
  });

  it('procesa una vez lo que dice Mercado Pago y el repetido no vuelve a escribir', async () => {
    vi.stubEnv('PLATFORM_BILLING_ENABLED', '1');
    vi.stubEnv('MP_PLATFORM_WEBHOOK_SECRET', 'platform-secret');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'TEST-sandbox');
    const ts = String(Math.floor(Date.now() / 1000));
    const headers = { 'content-type': 'application/json', 'x-request-id': 'req-1', 'x-signature': signature('88', 'req-1', ts) };
    const body = JSON.stringify({ type: 'payment', data: { id: '88' }, status: 'approved', transaction_amount: 1 });
    const first = await app().request('/api/public/billing/mp/webhook', { method: 'POST', headers, body });
    const second = await app().request('/api/public/billing/mp/webhook/', { method: 'POST', headers, body });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(calls.saveEvent).toBe(1);
    expect(calls.loadRemote).toBe(1);
  });

  it('si Mercado Pago no responde, contesta 503 y no marca el aviso', async () => {
    vi.stubEnv('PLATFORM_BILLING_ENABLED', '1');
    vi.stubEnv('MP_PLATFORM_WEBHOOK_SECRET', 'platform-secret');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'TEST-sandbox');
    loadRemote.mockRejectedValueOnce(new MpCallError(503));
    const ts = String(Math.floor(Date.now() / 1000));
    const response = await app().request('/api/public/billing/mp/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-2', 'x-signature': signature('88', 'req-2', ts) },
      body: JSON.stringify({ type: 'payment', data: { id: '88' } }),
    });
    expect(response.status).toBe(503);
    expect(calls.saveEvent).toBe(0);
  });
});
