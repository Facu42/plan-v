import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthMiddleware } from '../middleware/auth.js';
import { CareError } from '../care/errors.js';
import type { ServiceBoard } from '../../src/types/service.js';
import { resetHubMemory } from './hub-memory.js';

const flags = vi.hoisted(() => ({
  supabase: true,
  isAdmin: async (): Promise<boolean> => true,
}));

const board: ServiceBoard = {
  settings: { monthly_price: 25000, trial_days: 30 },
  nutritionists: [{
    id: '11111111-1111-4111-8111-111111111111',
    display_name: 'Ana Gómez',
    email: 'ana@x.test',
    created_at: '2026-10-02T10:00:00Z',
    last_sign_in_at: '2026-10-28T10:00:00Z',
    is_test: false,
    patients_active: 4,
    patients_total: 5,
    subscription: { trial_ends_on: '2026-08-01', paid_until: '2027-01-15', override: 'none', note: '' },
    payments: [],
  }],
  events: [],
};

vi.mock('../db/supabase-client.js', () => ({
  isSupabaseEnabled: () => flags.supabase,
  getRequestDb: () => ({ rpc: async () => ({ data: null, error: null }) }),
  privilegedDb: () => ({
    from: () => ({
      select: () => ({
        limit: async () => ({ data: null, error: { message: 'missing' } }),
        eq: () => ({ limit: async () => ({ data: null, error: { message: 'missing' } }) }),
      }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'missing' } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'missing' } }) }) }) }),
    }),
    auth: { admin: { listUsers: async () => ({ data: { users: [] }, error: null }) } },
    schema: () => ({ from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) }) }),
  }),
  createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
  createAnonClient: () => null,
  getSupabaseAdmin: () => ({}),
  verifyAuthToken: async () => null,
}));

vi.mock('./repository.js', async (original) => {
  const actual = await original<typeof import('./repository.js')>();
  return { ...actual, isAdmin: () => flags.isAdmin(), getBoard: async () => board };
});

const { registerAdminRoutes } = await import('./routes.js');

const jwt = (aal: string) => `Bearer h.${Buffer.from(JSON.stringify({ aal })).toString('base64url')}.s`;

function app(supabase = true) {
  flags.supabase = supabase;
  const instance = new Hono();
  instance.onError((error, c) => {
    if (error instanceof CareError) return c.json({ error: error.message }, error.status);
    throw error;
  });
  instance.use('/api/*', createAuthMiddleware({
    isSupabaseEnabled: () => flags.supabase,
    verifyAuthToken: async (token) => token ? { userId: 'admin-1' } : null,
    allowDemo: () => !flags.supabase,
    mfa: { needsSecondStep: async () => false },
  }));
  registerAdminRoutes(instance);
  return instance;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-28T15:00:00Z'));
  flags.supabase = true;
  flags.isAdmin = async () => true;
  resetHubMemory();
});

afterEach(() => {
  vi.useRealTimers();
  resetHubMemory();
});

describe('hub con sesión real', () => {
  it('pide admin y el segundo paso', async () => {
    expect((await app().request('/api/admin/hub/inicio')).status).toBe(401);
    flags.isAdmin = async () => false;
    const forbidden = await app().request('/api/admin/hub/leads', { headers: { Authorization: jwt('aal2') } });
    expect(forbidden.status).toBe(403);
    flags.isAdmin = async () => true;
    const mfa = await app().request('/api/admin/hub/facturacion', { headers: { Authorization: jwt('aal1') } });
    expect(mfa.status).toBe(403);
    expect(await mfa.json()).toMatchObject({ error: 'Falta la verificación en dos pasos.' });
  });

  it('no inventa suscripciones si la tabla no responde y no guarda un lead', async () => {
    const headers = { Authorization: jwt('aal2') };
    const inicio = await app().request('/api/admin/hub/inicio', { headers });
    expect(inicio.status).toBe(200);
    const body = await inicio.json() as { inicio: { mrr_pesos: number; mrr_nota: string; cobrado_mes_pesos: number } };
    expect(body.inicio.mrr_pesos).toBe(25000);
    expect(body.inicio.cobrado_mes_pesos).toBe(0);
    expect(body.inicio.mrr_nota).toMatch(/no se leen/i);
    const leads = await app().request('/api/admin/hub/leads', { headers });
    expect(await leads.json()).toMatchObject({ disponible: false, leads: [] });
    const created = await app().request('/api/admin/hub/leads', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lola', contact: '@lola', source: 'ig', next_step: 'Escribirle' }),
    });
    expect(created.status).toBe(503);
  });
});

describe('hub en memoria, sin base', () => {
  it('crea un lead, una nota y un lead desde un mensaje', async () => {
    const api = app(false);
    const created = await api.request('/api/admin/hub/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lola Ruiz', contact: '@lola', source: 'wa', next_step: 'Pasar la demo' }),
    });
    expect(created.status).toBe(201);
    const lead = (await created.json() as { lead: { id: string; stage: string } }).lead;
    const moved = await api.request(`/api/admin/hub/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'demo' }),
    });
    expect(moved.status).toBe(200);
    expect(await moved.json()).toMatchObject({ lead: { stage: 'demo' } });

    const nota = await api.request('/api/admin/hub/nutris/11111111-1111-4111-8111-111111111111/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Pidió precios.' }),
    });
    expect(nota.status).toBe(201);
    expect(await nota.json()).toMatchObject({ ficha: { notas: [expect.objectContaining({ body: 'Pidió precios.' })] } });

    const mensaje = await api.request('/api/admin/hub/bandeja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'instagram', contact_name: 'Mia', contact_handle: '@mia', body: 'Quiero el plan.' }),
    });
    const hilo = (await mensaje.json() as { bandeja: { hilos: { id: string }[] } }).bandeja.hilos[0];
    const desde = await api.request(`/api/admin/hub/bandeja/${hilo.id}/lead`, { method: 'POST' });
    expect(desde.status).toBe(201);
    const armado = await desde.json() as { lead: { id: string; name: string; source: string; stage: string }; bandeja: { hilos: { lead_id: string | null }[] } };
    expect(armado.lead.name).toBe('Mia');
    expect(armado.lead.source).toBe('ig');
    expect(armado.lead.stage).toBe('lead');
    expect(armado.bandeja.hilos[0].lead_id).toBe(armado.lead.id);

    const conexiones = await api.request('/api/admin/hub/conexiones');
    const canales = await conexiones.json() as { conexiones: { conectores: { estado: string }[] } };
    expect(canales.conexiones.conectores.every((row) => row.estado === 'proximamente')).toBe(true);
  });
});
