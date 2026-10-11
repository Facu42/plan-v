import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Altas con la base real, con Auth y la base simuladas: qué se le pide a Supabase y qué vuelve.
const authAdmin = {
  inviteUserByEmail: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(async () => ({ error: null })),
  listUsers: vi.fn(),
  updateUserById: vi.fn(),
};
const resetPasswordForEmail = vi.fn();
const rpc = vi.fn();

vi.mock('../db/supabase-client.js', () => ({
  privilegedDb: () => ({ auth: { admin: authAdmin, resetPasswordForEmail } }),
  getRequestDb: () => ({ rpc }),
  createAnonClient: () => null,
  createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
  isSupabaseEnabled: () => true,
  getSupabaseAdmin: () => null,
}));

const provision = vi.fn();
vi.mock('../db/supabase-repo.js', () => ({ sbProvisionNutritionist: (...args: unknown[]) => provision(...args) }));

const { createNutritionist, sendAccess } = await import('./accounts.js');

const row = (id: string, email: string) => ({
  id, display_name: 'Laura Díaz', email, created_at: '', last_sign_in_at: null, is_test: false, patients_active: 0, patients_total: 0,
  subscription: { trial_ends_on: '2026-10-31', paid_until: null, override: 'none', note: '' }, payments: [],
});

afterAll(() => { delete process.env.PUBLIC_SITE_URL; });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PUBLIC_SITE_URL = 'https://planv.example';
  rpc.mockImplementation(async (name: string) => name === 'admin_get_service_board'
    ? { data: { settings: {}, nutritionists: [row('n-1', 'laura@example.test')], events: [] }, error: null }
    : { data: null, error: null });
  provision.mockResolvedValue('n-1');
});

describe('alta de nutricionistas con Supabase', () => {
  it('invita con los mismos datos que "Soy nutricionista", sin aceptación legal, y abre el consultorio', async () => {
    authAdmin.inviteUserByEmail.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    const result = await createNutritionist({ name: 'Laura Díaz', email: 'Laura@Example.test', mode: 'invite' }, true);
    expect(authAdmin.inviteUserByEmail).toHaveBeenCalledWith('laura@example.test', {
      data: { full_name: 'Laura Díaz', role: 'paciente', professional_signup: true },
      redirectTo: 'https://planv.example',
    });
    const metadata = JSON.stringify(authAdmin.inviteUserByEmail.mock.calls[0]);
    expect(metadata).not.toContain('legal');
    expect(provision).toHaveBeenCalledWith({ userId: 'u-1', displayName: 'Laura Díaz' });
    expect(rpc).toHaveBeenCalledWith('admin_log_service_event', { target: 'n-1', input_action: 'service.nutritionist_created', input_mode: 'invite' });
    expect(result.id).toBe('n-1');
  });

  it('con clave crea la cuenta ya confirmada', async () => {
    authAdmin.createUser.mockResolvedValue({ data: { user: { id: 'u-2' } }, error: null });
    await createNutritionist({ name: 'Laura Díaz', email: 'laura@example.test', mode: 'password', password: 'una-clave-larga' }, true);
    expect(authAdmin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'laura@example.test', password: 'una-clave-larga', email_confirm: true,
      user_metadata: { full_name: 'Laura Díaz', role: 'paciente', professional_signup: true },
    }));
  });

  it('mail ya registrado => 409', async () => {
    authAdmin.createUser.mockResolvedValue({ data: { user: null }, error: { code: 'email_exists', status: 422, message: 'A user with this email address has already been registered' } });
    await expect(createNutritionist({ name: 'Laura', email: 'laura@example.test', mode: 'password', password: 'una-clave-larga' }, true)).rejects.toMatchObject({ status: 409 });
    expect(provision).not.toHaveBeenCalled();
  });

  it('si no se puede abrir el consultorio, borra la cuenta recién creada', async () => {
    authAdmin.createUser.mockResolvedValue({ data: { user: { id: 'u-3' } }, error: null });
    provision.mockRejectedValue(new Error('x'));
    await expect(createNutritionist({ name: 'Laura', email: 'laura@example.test', mode: 'password', password: 'una-clave-larga' }, true)).rejects.toMatchObject({ status: 503 });
    expect(authAdmin.deleteUser).toHaveBeenCalledWith('u-3');
  });

  it('si falta la migración de altas, el alta igual queda hecha', async () => {
    authAdmin.inviteUserByEmail.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    rpc.mockImplementation(async (name: string) => name === 'admin_get_service_board'
      ? { data: { settings: {}, nutritionists: [row('n-1', 'laura@example.test')], events: [] }, error: null }
      : { data: null, error: { code: 'PGRST202' } });
    await expect(createNutritionist({ name: 'Laura Díaz', email: 'laura@example.test', mode: 'invite' }, true)).resolves.toMatchObject({ id: 'n-1' });
  });

  it('reenvía el acceso con el mail de recuperar clave al sitio', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    expect(await sendAccess('n-1', true)).toEqual({ sent: true });
    expect(resetPasswordForEmail).toHaveBeenCalledWith('laura@example.test', { redirectTo: 'https://planv.example' });
    expect(rpc).toHaveBeenCalledWith('admin_log_service_event', { target: 'n-1', input_action: 'service.access_sent', input_mode: null });
    await expect(sendAccess('otra', true)).rejects.toMatchObject({ status: 400 });
  });
});
