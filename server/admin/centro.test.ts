import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthMiddleware } from '../middleware/auth.js';
import { CareError } from '../care/errors.js';
import type { ServiceBoard, ServiceNutritionist } from '../../src/types/service.js';

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(async (): Promise<boolean> => false),
  getBoard: vi.fn(async (): Promise<ServiceBoard> => ({ settings: { monthly_price: 25000, trial_days: 30 }, nutritionists: [], events: [] })),
}));

vi.mock('../db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  getRequestDb: () => ({ rpc: vi.fn() }),
  privilegedDb: () => ({
    from: () => ({ select: async () => ({ data: [], error: null }) }),
    auth: { admin: { listUsers: async () => ({ data: { users: [] }, error: null }) } },
    schema: () => ({ from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) }) }),
  }),
  createActorClient: () => ({}),
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
  createAnonClient: () => null,
  getSupabaseAdmin: () => ({}),
  verifyAuthToken: async () => null,
}));

vi.mock('./repository.js', async (original) => {
  const actual = await original<typeof import('./repository.js')>();
  return {
    ...actual,
    isAdmin: () => mocks.isAdmin(),
    getBoard: () => mocks.getBoard(),
  };
});

const { registerAdminRoutes } = await import('./routes.js');

const jwt = (aal: string) => `Bearer h.${Buffer.from(JSON.stringify({ aal })).toString('base64url')}.s`;

function app() {
  const instance = new Hono();
  instance.onError((error, c) => {
    if (error instanceof CareError) return c.json({ error: error.message }, error.status);
    throw error;
  });
  instance.use('/api/*', createAuthMiddleware({
    isSupabaseEnabled: () => true,
    verifyAuthToken: async (token) => token ? { userId: 'admin-1' } : null,
    allowDemo: () => false,
    mfa: { enforced: () => false, needsSecondStep: async () => false },
  }));
  registerAdminRoutes(instance);
  return instance;
}

const PATHS = [
  '/api/admin/centro/resumen',
  '/api/admin/centro/nutris',
  '/api/admin/centro/pacientes',
  '/api/admin/centro/cobros',
  '/api/admin/centro/salud',
  '/api/admin/centro/seguridad',
] as const;

const nutri = (id: string): ServiceNutritionist => ({
  id,
  display_name: 'Ana Gómez',
  email: 'ana@x.test',
  created_at: '2026-09-01T10:00:00Z',
  last_sign_in_at: '2026-10-28T10:00:00Z',
  is_test: false,
  patients_active: 4,
  patients_total: 5,
  subscription: { trial_ends_on: '2026-08-01', paid_until: '2027-01-15', override: 'none', note: '' },
  payments: [
    { id: 'p1', amount: 25000, months: 1, paid_on: '2026-10-12', method: 'transferencia', note: '', status: 'confirmed', created_at: '2026-10-12T10:00:00Z' },
  ],
});

const board: ServiceBoard = {
  settings: { monthly_price: 25000, trial_days: 30 },
  nutritionists: [nutri('ana')],
  events: [],
};

beforeEach(() => {
  // El pago del fixture pertenece a octubre; el mes consultado no depende de hoy.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-28T15:00:00Z'));
  mocks.isAdmin.mockReset();
  mocks.getBoard.mockReset();
  mocks.isAdmin.mockResolvedValue(false);
  mocks.getBoard.mockResolvedValue(board);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe.each(PATHS)('%s', (path) => {
  it('401 sin sesión', async () => {
    expect((await app().request(path)).status).toBe(401);
  });

  it('403 sin admin', async () => {
    mocks.isAdmin.mockResolvedValue(false);
    const res = await app().request(path, { headers: { Authorization: jwt('aal2') } });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'No tenés permiso para esta acción.' });
  });

  it('403 sin aal2 aunque MFA_ENFORCE esté apagado', async () => {
    mocks.isAdmin.mockResolvedValue(true);
    const res = await app().request(path, { headers: { Authorization: jwt('aal1') } });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'Falta la verificación en dos pasos.' });
  });

  it('200 con admin y aal2', async () => {
    mocks.isAdmin.mockResolvedValue(true);
    const res = await app().request(path, { headers: { Authorization: jwt('aal2') } });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.source).toBe('supabase');
    if (path.endsWith('/resumen')) expect(body.resumen).toMatchObject({ nutris_activas: 1, pacientes_activos: 4 });
    if (path.endsWith('/nutris')) expect(body.nutris).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'ana', state: 'activa' })]));
    if (path.endsWith('/pacientes')) expect(body.pacientes).toMatchObject({ activos: 4, total: 5, consultorios: 1 });
    if (path.endsWith('/cobros')) expect(body.cobros).toMatchObject({ cobrado_mes: 25000, mrr: 25000 });
    if (path.endsWith('/salud')) expect(body.salud).toMatchObject({ api: expect.objectContaining({ supabase: true }), jobs: expect.any(Object) });
    if (path.endsWith('/seguridad')) expect(body.seguridad).toMatchObject({ mfa_enforce: false, cuentas: expect.any(Array) });
  });
});
