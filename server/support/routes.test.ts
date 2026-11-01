import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { registerSupportRoutes } from './routes.js';

function app() {
  const hono = new Hono();
  registerSupportRoutes(hono);
  return hono;
}

describe('mail de soporte público', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('sin variable no inventa un Gmail', async () => {
    vi.stubEnv('SUPPORT_EMAIL', '');
    vi.stubEnv('VITE_SUPPORT_EMAIL', '');
    const response = await app().request('/api/public/support');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ email: null });
    expect(JSON.stringify(body)).not.toMatch(/gmail/i);
  });

  it('expone el mail de la variable de entorno', async () => {
    vi.stubEnv('SUPPORT_EMAIL', 'panel@nutridash.example');
    vi.stubEnv('VITE_SUPPORT_EMAIL', '');
    expect(await (await app().request('/api/public/support')).json()).toEqual({ email: 'panel@nutridash.example' });
  });
});
