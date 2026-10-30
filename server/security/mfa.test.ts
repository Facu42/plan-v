import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allowPreMfaProfessionalBootstrap, createAuthMiddleware } from '../middleware/auth.js';
import { isMfaExemptPath, isPreMfaProfessionalPath, mfaEnforced, tokenAal } from './mfa.js';

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
});

describe('middleware con segundo paso', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:1');
    vi.stubEnv('SUPABASE_ANON_KEY', 'anon');
  });
  afterEach(() => vi.unstubAllEnvs());

  function app(options: { enforced: boolean; needsSecondStep: boolean; allowProfessionalBootstrap?: boolean }) {
    const instance = new Hono();
    instance.use('/api/*', createAuthMiddleware({
      isSupabaseEnabled: () => true,
      verifyAuthToken: async () => ({ userId: 'u1' }),
      allowDemo: () => false,
      mfa: {
        enforced: () => options.enforced,
        needsSecondStep: async () => options.needsSecondStep,
        allowProfessionalBootstrap: async () => options.allowProfessionalBootstrap ?? false,
      },
    }));
    instance.get('/api/patients', (c) => c.json({ ok: true }));
    instance.get('/api/auth/recover', (c) => c.json({ ok: true }));
    instance.get('/api/nutritionist/setup', (c) => c.json({ ok: true, bootstrap: c.get('preMfaProfessional') }));
    instance.get('/api/crm/work-queue', (c) => c.json({ ok: true, bootstrap: c.get('preMfaProfessional') }));
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

  it('deja iniciar setup y consultar una cola vacía si el servidor confirma el bootstrap profesional', async () => {
    for (const path of ['/api/nutritionist/setup', '/api/crm/work-queue']) {
      const res = await app({ enforced: true, needsSecondStep: true, allowProfessionalBootstrap: true })
        .request(path, { headers: headers('aal1') });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ bootstrap: true });
    }
  });

  it('no abre otras rutas ni permite el bootstrap si el rol o el estado no califican', async () => {
    const blockedQueue = await app({ enforced: true, needsSecondStep: true, allowProfessionalBootstrap: false })
      .request('/api/crm/work-queue', { headers: headers('aal1') });
    const blockedPatients = await app({ enforced: true, needsSecondStep: true, allowProfessionalBootstrap: true })
      .request('/api/patients', { headers: headers('aal1') });
    expect(blockedQueue.status).toBe(403);
    expect(blockedPatients.status).toBe(403);
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
