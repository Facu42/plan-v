import { beforeEach, describe, expect, it, vi } from 'vitest';

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetProfileRole: vi.fn(),
  sbAcceptInvite: vi.fn(),
  sbProvisionNutritionist: vi.fn(),
  sbRequestPasswordRecovery: vi.fn(),
  SchemaUnavailableError: class SchemaUnavailableError extends Error {
    constructor() {
      super('Persistent invite schema is not available');
      this.name = 'SchemaUnavailableError';
    }
  },
  UniqueInviteError: class UniqueInviteError extends Error {
    constructor() {
      super('Ya existe una invitación para ese email');
      this.name = 'UniqueInviteError';
    }
  },
}));

const authMocks = vi.hoisted(() => ({
  getAuthAccount: vi.fn(),
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
  getAuthAccount: authMocks.getAuthAccount,
}));

import { app } from './index.js';

function authedJson(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
    body: JSON.stringify(body),
  });
}

describe('PV-09 supabase invite acceptance and provisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sbMocks.sbGetProfileRole.mockResolvedValue('paciente');
    authMocks.getAuthAccount.mockResolvedValue({ email: 'ana@example.com', emailConfirmed: true });
  });

  it('accepts a pending invite for a verified matching patient', async () => {
    sbMocks.sbAcceptInvite.mockResolvedValue('pat-1');
    const response = await authedJson('/api/invites/accept', { invite_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ patient_id: 'pat-1', source: 'supabase' });
    expect(sbMocks.sbAcceptInvite).toHaveBeenCalledWith('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
  });

  it('asks to confirm email before calling the accept RPC', async () => {
    authMocks.getAuthAccount.mockResolvedValue({ email: 'ana@example.com', emailConfirmed: false });
    const response = await authedJson('/api/invites/accept', { invite_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Confirmá tu email para aceptar la invitación' });
    expect(sbMocks.sbAcceptInvite).not.toHaveBeenCalled();
  });

  it('hides expired or foreign invites behind a generic conflict', async () => {
    sbMocks.sbAcceptInvite.mockRejectedValue(Object.assign(new Error('invite unavailable'), { code: 'invite_unavailable' }));
    const response = await authedJson('/api/invites/accept', { invite_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Invitación no disponible' });
  });

  it('does not let an authenticated user self-provision as nutritionist', async () => {
    const response = await authedJson('/api/ops/nutritionists', {
      user_id: 'user-1',
      display_name: 'Auto Nutri',
    });
    expect(response.status).toBe(401);
    expect(sbMocks.sbProvisionNutritionist).not.toHaveBeenCalled();
  });
});
