import { createHmac } from 'node:crypto';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { registerPatientSubscriptionRoutes } from './routes.js';

const notices: Array<Record<string, unknown>> = [];

vi.mock('../db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  privilegedDb: () => { throw new Error('sin base'); },
  getRequestDb: () => { throw new Error('sin base'); },
}));

vi.mock('./repository.js', () => ({
  saveNotice: async (row: Record<string, unknown>) => {
    const key = `${row.topic}:${row.resource_id}:${row.provider_notification_id}`;
    if (row.signature_valid && notices.some(item => `${item.topic}:${item.resource_id}:${item.provider_notification_id}` === key)) return 'duplicate';
    notices.push(row);
    return 'saved';
  },
}));

function signature(id: string, requestId: string, ts: string) {
  const mac = createHmac('sha256', 'super-secret').update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return `ts=${ts},v1=${mac}`;
}

function app() {
  const hono = new Hono();
  hono.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'fail' }, 500));
  registerPatientSubscriptionRoutes(hono);
  return hono;
}

const payload = { id: 'notice-1', type: 'payment', user_id: 42, live_mode: false, data: { id: 'AbC-12' }, action: 'payment.created' };

describe('webhook general', () => {
  afterEach(() => {
    notices.length = 0;
    vi.unstubAllEnvs();
  });

  it('responde 404 con la bandera apagada, en las dos rutas', async () => {
    vi.stubEnv('MP_SCHEDULING_WEBHOOK_SECRET', 'super-secret');
    for (const path of ['/api/public/scheduling/mp/webhook', '/api/public/scheduling/mp/webhook/']) {
      expect((await app().request(path, { method: 'POST', body: '{}' })).status).toBe(404);
    }
    expect(notices).toHaveLength(0);
  });

  it('rechaza una firma inválida y acepta la válida una sola vez, con y sin barra final', async () => {
    vi.stubEnv('PATIENT_SUBSCRIPTIONS_ENABLED', '1');
    vi.stubEnv('MP_SCHEDULING_WEBHOOK_SECRET', 'super-secret');
    const ts = String(Math.floor(Date.now() / 1000));
    const headers = {
      'content-type': 'application/json',
      'x-request-id': 'req-plan-v',
      'x-signature': signature('AbC-12', 'req-plan-v', ts),
    };
    const bad = await app().request('/api/public/scheduling/mp/webhook', {
      method: 'POST',
      headers: { ...headers, 'x-signature': `ts=${ts},v1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` },
      body: JSON.stringify(payload),
    });
    expect(bad.status).toBe(401);
    expect(notices[0]).toMatchObject({ signature_valid: false, status: 'ignored' });
    const first = await app().request('/api/public/scheduling/mp/webhook', { method: 'POST', headers, body: JSON.stringify(payload) });
    const second = await app().request('/api/public/scheduling/mp/webhook/', { method: 'POST', headers, body: JSON.stringify(payload) });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(notices.filter(row => row.status === 'queued')).toHaveLength(1);
  });
});
