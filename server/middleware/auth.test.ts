import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createAuthMiddleware } from './auth.js';

function testApp(options: {
  supabaseEnabled: boolean;
  verifiedUserId?: string | null;
}) {
  const app = new Hono();
  app.use('/api/*', createAuthMiddleware({
    isSupabaseEnabled: () => options.supabaseEnabled,
    verifyAuthToken: async () => options.verifiedUserId ? { userId: options.verifiedUserId } : null,
  }));
  app.get('/api/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/patients', (c) => c.json({ auth: c.get('auth') }));
  return app;
}

describe('auth middleware', () => {
  it('returns 401 instead of exposing demo data when Supabase is enabled', async () => {
    const response = await testApp({ supabaseEnabled: true }).request('/api/patients');

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'No autorizado' });
  });

  it('allows the public health endpoint without a token', async () => {
    const response = await testApp({ supabaseEnabled: true }).request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('passes a verified user through to protected routes', async () => {
    const response = await testApp({ supabaseEnabled: true, verifiedUserId: 'user-1' }).request('/api/patients');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ auth: { userId: 'user-1' } });
  });

  it('keeps demo access when no Supabase service role is configured', async () => {
    const response = await testApp({ supabaseEnabled: false }).request('/api/patients');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ auth: { demo: true } });
  });
});
