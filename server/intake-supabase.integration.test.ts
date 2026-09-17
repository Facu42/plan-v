import { beforeEach, describe, expect, it, vi } from 'vitest';

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetProfileRole: vi.fn(),
}));

vi.mock('./db/supabase-repo.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./db/supabase-repo.js')>();
  return { ...actual, ...sbMocks };
});

vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-1' } : null),
  getSupabaseAdmin: () => ({}),
  createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
  getAuthAccount: async () => ({ email: 'ana@example.com', emailConfirmed: true }),
  getRequestDb: () => ({
    rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'function not found' } }),
  }),
}));

import { app } from './index.js';

describe('PV-12 supabase gap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    sbMocks.sbGetPatientResource.mockResolvedValue({
      id: 'pat-1',
      nutritionistId: 'nutri-1',
      billing_status: 'pending',
      billing_until: null,
    });
    sbMocks.sbGetProfileRole.mockResolvedValue('paciente');
  });

  it('maps a missing intake schema to an explicit 501', async () => {
    const response = await app.request('/api/patients/pat-1/intake', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({ error: 'El ingreso todavía no está habilitado en este entorno.' });
  });

  it('still serves the versioned consent catalog from code', async () => {
    const response = await app.request('/api/consents/catalog', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(response.status).toBe(200);
    const body = await response.json() as { consents: Array<{ purpose: string; text_hash: string }> };
    expect(body.consents.some((entry) => entry.purpose === 'care_relationship' && entry.text_hash.length === 64)).toBe(true);
  });
});
