import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allowPreMfaProfessionalBootstrap, createAuthMiddleware } from '../middleware/auth.js';
import { hasVerifiedTotp, isMfaExemptPath, isPreMfaProfessionalPath, mfaEnforced, tokenAal, verifiedTotpCount } from './mfa.js';

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

  it('limita el bootstrap profesional previo a MFA a setup y la cola', () => {
    expect(isPreMfaProfessionalPath('/api/nutritionist/setup')).toBe(true);
    expect(isPreMfaProfessionalPath('/api/crm/work-queue')).toBe(true);
    expect(isPreMfaProfessionalPath('/api/crm/progress-global')).toBe(false);
    expect(isPreMfaProfessionalPath('/api/patients')).toBe(false);
  });

  it('cuenta solo los TOTP ya verificados', () => {
    expect(verifiedTotpCount([
      { factor_type: 'totp', status: 'verified' },
      { factor_type: 'totp', status: 'unverified' },
      { factor_type: 'phone', status: 'verified' },
    ])).toBe(1);
    expect(verifiedTotpCount(null)).toBe(0);
    expect(verifiedTotpCount({ totp: [] })).toBe(0);
  });
});

describe('consulta de factores a Supabase', () => {
  it('pide la lista con el token de la sesión y reconoce un TOTP verificado', async () => {
    const seen: RequestInit[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen.push({ ...init, headers: init?.headers });
      expect(url).toBe('https://auth.example/auth/v1/factors');
      return new Response(JSON.stringify([{ factor_type: 'totp', status: 'verified' }]), { status: 200 });
    }) as typeof fetch;
    await expect(hasVerifiedTotp('Bearer token-de-sesion', {
      SUPABASE_URL: 'https://auth.example/',
      SUPABASE_ANON_KEY: 'anon-publica',
    }, fetchImpl)).resolves.toBe(true);
    expect(new Headers(seen[0]?.headers).get('Authorization')).toBe('Bearer token-de-sesion');
    expect(new Headers(seen[0]?.headers).get('apikey')).toBe('anon-publica');
  });

  it('sin código verificado, o si Auth no responde, no obliga', async () => {
    const vacio = (async () => new Response(JSON.stringify([]), { status: 200 })) as typeof fetch;
    await expect(hasVerifiedTotp('Bearer t', { SUPABASE_URL: 'https://auth.example', SUPABASE_ANON_KEY: 'a' }, vacio)).resolves.toBe(false);
    const caido = (async () => { throw new Error('red'); }) as typeof fetch;
    await expect(hasVerifiedTotp('Bearer t', { SUPABASE_URL: 'https://auth.example', SUPABASE_ANON_KEY: 'a' }, caido)).resolves.toBe(false);
    await expect(hasVerifiedTotp(undefined, { SUPABASE_URL: 'https://auth.example', SUPABASE_ANON_KEY: 'a' }, vacio)).resolves.toBe(false);
  });
});

describe('middleware con segundo paso', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:1');
    vi.stubEnv('SUPABASE_ANON_KEY', 'anon');
  });
  afterEach(() => vi.unstubAllEnvs());

  function app(options: { needsSecondStep: boolean }) {
    const instance = new Hono();
    instance.use('/api/*', createAuthMiddleware({
      isSupabaseEnabled: () => true,
      verifyAuthToken: async () => ({ userId: 'u1' }),
      allowDemo: () => false,
      mfa: {
        needsSecondStep: async () => options.needsSecondStep,
      },
    }));
    instance.get('/api/patients', (c) => c.json({ ok: true }));
    instance.get('/api/auth/recover', (c) => c.json({ ok: true }));
    instance.get('/api/nutritionist/setup', (c) => c.json({ ok: true, bootstrap: c.get('preMfaProfessional') }));
    instance.get('/api/crm/work-queue', (c) => c.json({ ok: true, bootstrap: c.get('preMfaProfessional') }));
    return instance;
  }
  const headers = (aal: string) => ({ Authorization: jwt({ aal }) });

  it('quien ya activó el código y entra sin él recibe 403, también en el alta del consultorio', async () => {
    for (const path of ['/api/patients', '/api/nutritionist/setup', '/api/crm/work-queue']) {
      const res = await app({ needsSecondStep: true }).request(path, { headers: headers('aal1') });
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ code: 'mfa_required' });
    }
  });

  it('con el segundo paso hecho entra', async () => {
    const res = await app({ needsSecondStep: true }).request('/api/patients', { headers: headers('aal2') });
    expect(res.status).toBe(200);
  });

  it('sin código dado de alta la nutricionista entra: es opcional', async () => {
    const res = await app({ needsSecondStep: false }).request('/api/patients', { headers: headers('aal1') });
    expect(res.status).toBe(200);
  });

  it('las rutas de ingreso quedan libres aunque el código esté activado', async () => {
    const res = await app({ needsSecondStep: true }).request('/api/auth/recover', { headers: headers('aal1') });
    expect(res.status).toBe(200);
  });
});

describe('alcance del bootstrap profesional previo a MFA', () => {
  const nutri = { role: 'nutri' as const, userId: 'u1', nutritionistId: 'n1' };

  it('admite setup para nutri y la cola solamente si no tiene pacientes', async () => {
    const base = {
      getRole: async () => 'nutri' as const,
      getActor: async () => nutri,
      hasPatients: async () => false,
    };
    expect(await allowPreMfaProfessionalBootstrap('u1', '/api/nutritionist/setup', base)).toBe(true);
    expect(await allowPreMfaProfessionalBootstrap('u1', '/api/crm/work-queue', base)).toBe(true);
    expect(await allowPreMfaProfessionalBootstrap('u1', '/api/patients', base)).toBe(false);
    expect(await allowPreMfaProfessionalBootstrap('u1', '/api/crm/work-queue', { ...base, hasPatients: async () => true })).toBe(false);
  });

  it('no habilita pacientes ni identidades sin consultorio profesional', async () => {
    const patient = {
      getRole: async () => 'paciente' as const,
      getActor: async () => ({ role: 'paciente' as const, userId: 'u1', patientId: 'p1' }),
      hasPatients: async () => false,
    };
    expect(await allowPreMfaProfessionalBootstrap('u1', '/api/nutritionist/setup', patient)).toBe(false);
    expect(await allowPreMfaProfessionalBootstrap('u1', '/api/crm/work-queue', patient)).toBe(false);
  });
});
