import { beforeEach, describe, expect, it, vi } from 'vitest';

const sbMocks = vi.hoisted(() => ({
  sbGetProfileRole: vi.fn(),
  sbUserHasPatientLink: vi.fn(),
  sbProvisionNutritionist: vi.fn(),
  sbEnsureNutritionist: vi.fn(),
}));

vi.mock('./db/supabase-repo.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./db/supabase-repo.js')>();
  return { ...actual, ...sbMocks };
});

vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-9' } : null),
  getSupabaseAdmin: () => ({}),
  createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
  getAuthAccount: async () => ({ email: 'nueva@example.com', emailConfirmed: true }),
  getRequestDb: () => ({}),
}));

import { app } from './index.js';

const claim = (body: unknown, token = 'test-token') => app.request('/api/me/professional', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});

describe('PV-47 alta propia de nutricionistas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sbMocks.sbGetProfileRole.mockResolvedValue('paciente');
    sbMocks.sbUserHasPatientLink.mockResolvedValue(false);
    sbMocks.sbProvisionNutritionist.mockResolvedValue('nutri-9');
    sbMocks.sbEnsureNutritionist.mockResolvedValue('nutri-9');
  });

  it('una cuenta nueva sin paciente vinculada abre su consultorio', async () => {
    const response = await claim({ display_name: ' Lic. Ana Gómez ' });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ nutritionist_id: 'nutri-9' });
    expect(sbMocks.sbProvisionNutritionist).toHaveBeenCalledWith({ userId: 'user-9', displayName: 'Lic. Ana Gómez' });
  });

  it('una cuenta ya vinculada como paciente no se vuelve profesional', async () => {
    sbMocks.sbUserHasPatientLink.mockResolvedValue(true);
    const response = await claim({ display_name: 'Ana' });
    expect(response.status).toBe(409);
    expect(sbMocks.sbProvisionNutritionist).not.toHaveBeenCalled();
  });

  it('repetir el pedido siendo ya nutricionista no duplica nada', async () => {
    sbMocks.sbGetProfileRole.mockResolvedValue('nutri');
    const response = await claim({ display_name: 'Ana' });
    expect(response.status).toBe(200);
    expect(sbMocks.sbEnsureNutritionist).toHaveBeenCalledWith('user-9', 'Ana');
    expect(sbMocks.sbProvisionNutritionist).not.toHaveBeenCalled();
  });

  it('exige sesión y un nombre', async () => {
    expect((await claim({ display_name: 'Ana' }, '')).status).toBe(401);
    expect((await claim({ display_name: ' ' })).status).toBe(400);
    expect(sbMocks.sbProvisionNutritionist).not.toHaveBeenCalled();
  });
});
