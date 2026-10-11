import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { clientAddress } from './client-address.js';
import { createRateLimits } from './http.js';
import { createRateLimitMiddleware, resetRateLimits } from '../ops/rate-limit.js';

const railway = { TRUST_PROXY: 'railway', RAILWAY_ENVIRONMENT_ID: 'platform-environment', RATE_LIMIT_ENABLED: '1', RATE_LIMIT_AUTH_MAX: '1' };
const socket = { incoming: { socket: { remoteAddress: '10.0.0.1', remotePort: 1234, remoteFamily: 'IPv4' } } };

describe('client identity behind the deployment edge', () => {
  it('ignores supplied forwarded headers unless Railway trust is explicitly configured', async () => {
    for (const env of [{}, { TRUST_PROXY: 'railway' }, railway]) {
      const app = new Hono();
      app.get('/', c => c.text(clientAddress(c, env)));
      const response = await app.request('/', { headers: { 'X-Real-IP': '192.0.2.1', 'X-Forwarded-For': '203.0.113.1' } }, socket);
      expect(await response.text()).toBe(env === railway ? '192.0.2.1' : '10.0.0.1');
    }
  });

  it('uses the native socket for malformed or missing edge addresses, never a forwarded chain', async () => {
    const app = new Hono();
    app.get('/', c => c.text(clientAddress(c, railway)));
    for (const value of ['', '192.0.2.1,203.0.113.1', 'invented-address']) {
      expect(await (await app.request('/', { headers: { 'X-Real-IP': value, 'X-Forwarded-For': '203.0.113.1' } }, socket)).text()).toBe('10.0.0.1');
    }
  });

  it('keeps recovery quotas separate for edge clients and ignores spoofed forwarded chains in both limiters', async () => {
    for (const oldLimiter of [false, true]) {
      resetRateLimits();
      const app = new Hono();
      app.use('/api/*', oldLimiter ? createRateLimitMiddleware(railway) : createRateLimits({ enabled: () => true, sensitiveLimit: 1, clientAddress: c => clientAddress(c, railway) }).public);
      app.post('/api/auth/recover', c => c.json({ ok: true }));
      const request = (real: string, spoofed: string) => app.request('/api/auth/recover', { method: 'POST', headers: { 'X-Real-IP': real, 'X-Forwarded-For': spoofed } }, socket);
      expect((await request('192.0.2.1', '203.0.113.1')).status).toBe(200);
      expect((await request('192.0.2.2', '203.0.113.1')).status).toBe(200);
      expect((await request('192.0.2.1', '203.0.113.2')).status).toBe(429);
    }
    resetRateLimits();
  });
});
