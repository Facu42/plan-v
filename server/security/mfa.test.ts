import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthMiddleware } from '../middleware/auth.js';
import { isMfaExemptPath, mfaEnforced, tokenAal } from './mfa.js';

const jwt = (claims: object) => `Bearer h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`;

describe('verificación en dos pasos', () => {
  it('lee el nivel del token y trata cualquier cosa rara como aal1', () => {
    expect(tokenAal(jwt({ aal: 'aal2' }))).toBe('aal2');
    expect(tokenAal(jwt({ aal: 'aal1' }))).toBe('aal1');
    expect(tokenAal(jwt({}))).toBe('aal1');
    expect(tokenAal('Bearer basura')).toBe('aal1');
    expect(tokenAal(undefined)).toBe('aal1');
  });

  it('está apagada salvo que MFA_ENFORCE sea 1', () => {
    expect(mfaEnforced({})).toBe(false);
    expect(mfaEnforced({ MFA_ENFORCE: '0' })).toBe(false);
    expect(mfaEnforced({ MFA_ENFORCE: '1' })).toBe(true);
  });

  it('deja libres el ingreso y el aviso del menú de administración', () => {
    expect(isMfaExemptPath('/api/auth/recover')).toBe(true);
    expect(isMfaExemptPath('/api/admin/me')).toBe(true);
    expect(isMfaExemptPath('/api/admin/accounts')).toBe(false);
  });
});

describe('middleware con segundo paso', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:1');
    vi.stubEnv('SUPABASE_ANON_KEY', 'anon');
  });
  afterEach(() => vi.unstubAllEnvs());

  function app(options: { enforced: boolean; needsSecondStep: boolean }) {
    const instance = new Hono();
    instance.use('/api/*', createAuthMiddleware({
      isSupabaseEnabled: () => true,
      verifyAuthToken: async () => ({ userId: 'u1' }),
      allowDemo: () => false,
      mfa: { enforced: () => options.enforced, needsSecondStep: async () => options.needsSecondStep },
    }));
    instance.get('/api/patients', (c) => c.json({ ok: true }));
    instance.get('/api/auth/recover', (c) => c.json({ ok: true }));
    return instance;
  }
  const headers = (aal: string) => ({ Authorization: jwt({ aal }) });

  it('una nutri sin segundo paso recibe 403 cuando está prendido', async () => {
    const res = await app({ enforced: true, needsSecondStep: true }).request('/api/patients', { headers: headers('aal1') });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'mfa_required' });
  });

  it('con el segundo paso hecho entra', async () => {
    const res = await app({ enforced: true, needsSecondStep: true }).request('/api/patients', { headers: headers('aal2') });
    expect(res.status).toBe(200);
  });

  it('una paciente entra sin segundo paso', async () => {
    const res = await app({ enforced: true, needsSecondStep: false }).request('/api/patients', { headers: headers('aal1') });
    expect(res.status).toBe(200);
  });

  it('apagado no cambia nada para nadie', async () => {
    const res = await app({ enforced: false, needsSecondStep: true }).request('/api/patients', { headers: headers('aal1') });
    expect(res.status).toBe(200);
  });

  it('las rutas de ingreso quedan libres', async () => {
    const res = await app({ enforced: true, needsSecondStep: true }).request('/api/auth/recover', { headers: headers('aal1') });
    expect(res.status).toBe(200);
  });
});
