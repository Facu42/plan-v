import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createAuthMiddleware } from './auth.js';

function testApp(options: {
  supabaseEnabled: boolean;
  verifiedUserId?: string | null;
  allowDemo?: boolean;
  onProtected?: () => void;
}) {
  const app = new Hono();
  app.use('/api/*', createAuthMiddleware({
    isSupabaseEnabled: () => options.supabaseEnabled,
    verifyAuthToken: async () => options.verifiedUserId ? { userId: options.verifiedUserId } : null,
    allowDemo: () => options.allowDemo ?? false,
  }));
  app.get('/api/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/patients', (c) => {
    options.onProtected?.();
    return c.json({ auth: c.get('auth') });
  });
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

  it('keeps demo access only when demo is explicitly allowed', async () => {
    const response = await testApp({ supabaseEnabled: false, allowDemo: true }).request('/api/patients');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ auth: { demo: true } });
  });

  it('returns 503 when the database is absent and demo is forbidden', async () => {
    const onProtected = vi.fn();
    const response = await testApp({
      supabaseEnabled: false,
      allowDemo: false,
      onProtected,
    }).request('/api/patients');

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Servicio no disponible' });
    expect(onProtected).not.toHaveBeenCalled();
  });
});
