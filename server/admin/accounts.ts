import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  bindActorClient,
  createActorClient,
  createAnonClient,
  getRequestDb,
  privilegedDb,
} from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { writeOpsLog } from '../ops/log.js';
import { PROFESSIONAL_SIGNUP_FLAG, PUBLIC_SIGNUP_ROLE } from '../../src/context/auth-policy.js';
import { seedDemoContent } from '../demo/content.js';
import type {
  ServiceNutritionist,
  ServiceNutritionistCreateInput,
  ServiceTestAccount,
  ServiceTestAccountsInput,
  ServiceTestAccountsResult,
  ServiceTestRole,
} from '../../src/types/service.js';
import {
  CareError,
  call,
  getBoard,
  memoryAddNutritionist,
  memoryAudit,
  memoryEmailTaken,
  memoryFind,
  memoryTestAccounts,
} from './repository.js';

/**
 * Altas desde el panel del administrador: nutricionistas nuevas, reenvío de acceso y el par de
 * cuentas de prueba. Las cuentas se crean con la API de Auth (clave de servicio, sólo en el
 * servidor); la base sólo guarda lo suyo con las funciones del panel, que vuelven a validar que
 * quien llama es administrador. Nunca se devuelven ni se registran claves, enlaces ni mails completos.
 */

const TEST_FLAG = 'plan_v_test_account';
export const TEST_NUTRI_NAME = '[Prueba] Nutricionista';
export const TEST_PATIENT_NAME = '[Prueba] Paciente';
const TEST_ALIASES: Record<ServiceTestRole, string> = { nutricionista: 'plan-v-nutri', paciente: 'plan-v-paciente' };

type AuthUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type AuthFailure = { code?: string; status?: number; message?: string } | null;

/** Dónde aterrizan los enlaces de los mails: el sitio publicado. */
export function siteUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  const candidates = [env.PUBLIC_SITE_URL, ...(env.CORS_ORIGINS ?? '').split(',')];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') return url.origin;
    } catch {
      // Sigue con la próxima.
    }
  }
  return undefined;
}

/** Alias de Gmail sobre el mail base: nombre+alias@dominio (si ya traía un alias, se reemplaza). */
export function testAliasEmail(base: string, role: ServiceTestRole): string {
  const [local, domain] = base.trim().toLowerCase().split('@');
  return `${local.split('+')[0]}+${TEST_ALIASES[role]}@${domain}`;
}

/** Para el registro de operaciones: nunca el mail completo. */
function maskedDomain(email: string): string {
  return email.split('@')[1] ?? 'desconocido';
}

function isDuplicate(error: AuthFailure): boolean {
  if (!error) return false;
  if (error.code === 'email_exists' || error.code === 'user_already_exists') return true;
  return /already (been )?registered|already exists/i.test(error.message ?? '');
}

function authFailure(error: AuthFailure, step: string): never {
  if (isDuplicate(error)) throw new CareError(409, 'Ya existe una cuenta con ese mail.');
  writeOpsLog('warn', 'admin_account_failed', { step, code: error?.code ?? String(error?.status ?? 'unknown') });
  if (error?.status === 429) throw new CareError(429, 'Demasiados intentos. Esperá un minuto y reintentá.');
  if (error?.code === 'weak_password') throw new CareError(422, 'La clave es muy débil. Probá con otra más larga.');
  throw new CareError(503, 'No se pudo crear la cuenta. Reintentá en un momento.');
}

async function findAuthUserByEmail(email: string): Promise<AuthUser | null> {
  const admin = privilegedDb();
  const wanted = email.toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) authFailure(error, 'list_users');
    const users = (data?.users ?? []) as AuthUser[];
    const found = users.find((user) => user.email?.toLowerCase() === wanted);
    if (found) return found;
    if (users.length < 200) return null;
  }
  return null;
}

async function listTestUsers(): Promise<AuthUser[]> {
  const admin = privilegedDb();
  const found: AuthUser[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) authFailure(error, 'list_users');
    const users = (data?.users ?? []) as AuthUser[];
    found.push(...users.filter((user) => typeof user.app_metadata?.[TEST_FLAG] === 'string'));
    if (users.length < 200) break;
  }
  return found;
}

async function boardRow(nutritionistId: string): Promise<ServiceNutritionist> {
  const row = (await getBoard(true)).nutritionists.find((entry) => entry.id === nutritionistId);
  if (!row) throw new CareError(503, 'La cuenta se creó pero todavía no aparece en el panel. Recargá en un momento.');
  return row;
}

/** Auditoría de altas: si la migración de altas no está instalada, la alta igual queda hecha. */
async function auditBestEffort(target: string, action: 'service.nutritionist_created' | 'service.access_sent', mode?: string): Promise<void> {
  try {
    await call('admin_log_service_event', { target, input_action: action, input_mode: mode ?? null });
  } catch (error) {
    writeOpsLog('warn', 'admin_audit_failed', { action, status: error instanceof CareError ? String(error.status) : 'unknown' });
  }
}

// ---------- Alta de nutricionistas ----------

export async function createNutritionist(input: ServiceNutritionistCreateInput, persistent: boolean): Promise<ServiceNutritionist> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!persistent) {
    if (memoryEmailTaken(email) || memoryTestAccounts.some((account) => account.email === email)) {
      throw new CareError(409, 'Ya existe una cuenta con ese mail.');
    }
    const row = memoryAddNutritionist({ id: `nutri-${randomUUID()}`, name, email });
    memoryAudit('service.nutritionist_created', row.id, { mode: input.mode });
    return row;
  }

  const admin = privilegedDb();
  // Lo mismo que guarda el registro "Soy nutricionista". Sin aceptación legal: la persona la
  // acepta en "Antes de seguir" la primera vez que entra.
  const metadata = { full_name: name, role: PUBLIC_SIGNUP_ROLE, [PROFESSIONAL_SIGNUP_FLAG]: true };
  let userId: string;
  if (input.mode === 'invite') {
    const redirectTo = siteUrl();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: metadata, ...(redirectTo ? { redirectTo } : {}) });
    if (error || !data.user) authFailure(error, 'invite');
    userId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password: input.password, email_confirm: true, user_metadata: metadata });
    if (error || !data.user) authFailure(error, 'create_user');
    userId = data.user.id;
  }

  // El consultorio se abre ya (con su prueba de 30 días) para que aparezca en el panel; al entrar,
  // la app ve el rol de nutricionista y no repite el alta.
  let nutritionistId: string;
  try {
    nutritionistId = await sb.sbProvisionNutritionist({ userId, displayName: name });
  } catch {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    writeOpsLog('warn', 'admin_account_failed', { step: 'provision', code: 'rolled_back' });
    throw new CareError(503, 'No se pudo abrir el consultorio. Reintentá en un momento.');
  }
  await auditBestEffort(nutritionistId, 'service.nutritionist_created', input.mode);
  writeOpsLog('info', 'admin_nutritionist_created', { mode: input.mode, domain: maskedDomain(email) });
  return boardRow(nutritionistId);
}

// ---------- Reenvío de acceso ----------

export async function sendAccess(nutritionistId: string, persistent: boolean): Promise<{ sent: true }> {
  if (!persistent) {
    memoryFind(nutritionistId);
    memoryAudit('service.access_sent', nutritionistId, {});
    return { sent: true };
  }
  const row = (await getBoard(true)).nutritionists.find((entry) => entry.id === nutritionistId);
  if (!row || !row.email) throw new CareError(400, 'Revisá los datos cargados.');
  const redirectTo = siteUrl();
  // Mail de "recuperar clave": sirve tanto para quien nunca eligió clave como para quien la olvidó.
  const { error } = await privilegedDb().auth.resetPasswordForEmail(row.email, redirectTo ? { redirectTo } : undefined);
  if (error) authFailure(error, 'send_access');
  await auditBestEffort(nutritionistId, 'service.access_sent');
  writeOpsLog('info', 'admin_access_sent', { domain: maskedDomain(row.email) });
  return { sent: true };
}

// ---------- Cuentas de prueba ----------

export async function listTestAccounts(persistent: boolean): Promise<ServiceTestAccount[]> {
  if (!persistent) return structuredClone(memoryTestAccounts);
  return (await listTestUsers())
    .map((user) => ({
      email: user.email ?? '',
      name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '',
      role: user.app_metadata?.[TEST_FLAG] === 'nutricionista' ? 'nutricionista' as const : 'paciente' as const,
    }))
    .sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email));
}

/** Crea la cuenta, o la reutiliza si ya es una cuenta de prueba (con la clave nueva). */
async function ensureTestUser(email: string, password: string, role: ServiceTestRole, name: string): Promise<{ user: AuthUser; created: boolean }> {
  const admin = privilegedDb();
  const metadata = { full_name: name, role: PUBLIC_SIGNUP_ROLE };
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    // Un mail real que no es de prueba no se toca nunca.
    if (existing.app_metadata?.[TEST_FLAG] !== role) throw new CareError(409, 'Ese mail ya es una cuenta real.');
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) authFailure(error, 'update_test_user');
    return { user: existing, created: false };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: metadata, app_metadata: { [TEST_FLAG]: role },
  });
  if (error || !data.user) authFailure(error, 'create_test_user');
  return { user: data.user as AuthUser, created: true };
}

/** Entra con la cuenta (como lo haría ella) para usar las mismas rutas y reglas de acceso. */
async function signIn(email: string, password: string): Promise<{ token: string; client: SupabaseClient; close: () => Promise<void> }> {
  const anon = createAnonClient();
  if (!anon) throw new CareError(503, 'No se pudo entrar con la cuenta de prueba.');
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) authFailure(error, 'sign_in');
  const token = data.session.access_token;
  const client = createActorClient(token);
  if (!client) throw new CareError(503, 'No se pudo entrar con la cuenta de prueba.');
  return { token, client, close: async () => { await anon.auth.signOut({ scope: 'local' }).catch(() => undefined); } };
}

/**
 * Vincula la paciente de prueba con la nutricionista de prueba por el camino de siempre (alta de
 * paciente con invitación, envío y aceptación), pero hecho por cada cuenta y sin pasos manuales.
 * Devuelve la ficha de la paciente si la vinculó ahora; null si ya estaba vinculada.
 */
async function linkTestPatient(
  nutri: { client: SupabaseClient; userId: string },
  patient: { client: SupabaseClient },
  patientEmail: string,
): Promise<string | null> {
  const asNutri = <T>(run: () => Promise<T>) => bindActorClient(nutri.client, run);
  const nutritionistId = await asNutri(() => sb.sbGetNutritionistId(nutri.userId));
  if (!nutritionistId) throw new CareError(503, 'No se pudo abrir el consultorio de prueba.');

  const { data, error } = await asNutri(async () => getRequestDb().from('patient_invites')
    .select('id, patient_id, status').eq('email', patientEmail).order('created_at', { ascending: false }).limit(10));
  if (error) throw new CareError(503, 'No se pudo vincular la paciente de prueba.');
  const invites = (data ?? []) as Array<{ id: string; patient_id: string; status: string }>;
  if (invites.some((invite) => invite.status === 'accepted')) return null;

  const invite = invites.length
    ? await asNutri(() => sb.sbRenewPatientInvite(invites[0].patient_id, nutritionistId))
    : await asNutri(async () => {
      const created = await sb.sbCreatePatient({ nutritionistId, name: TEST_PATIENT_NAME, email: patientEmail, goal: 'Cuenta de prueba' });
      return sb.sbSendInvite(created.invite.id);
    });
  if (!invite) return null;

  await bindActorClient(patient.client, () => sb.sbAcceptInvite(invite.id));
  // Habilitada sin cargo: ve toda la app desde el primer ingreso.
  const billing = await asNutri(async () => getRequestDb().rpc('set_patient_billing', { target: invite.patient_id, next_status: 'waived', until: null }));
  if (billing.error) writeOpsLog('warn', 'admin_test_billing_failed', { code: billing.error.code ?? 'unknown' });
  return invite.patient_id;
}

type Fetcher = (path: string, init?: RequestInit) => Response | Promise<Response>;

/** Contenido de ejemplo sólo para la paciente de prueba: primero como nutricionista, si no le toca, como paciente. */
async function seedTestContent(fetcher: Fetcher, patientId: string, nutriToken: string, patientToken: string): Promise<void> {
  const as = (token: string, path: string, init?: RequestInit) => fetcher(path, {
    ...init,
    headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}`, 'x-forwarded-for': 'plan-v-test-seed' },
  });
  const steps = await seedDemoContent(async (path, init) => {
    const response = await as(nutriToken, path, init);
    return response.status === 403 ? as(patientToken, path, init) : response;
  }, new Date(), { patientId });
  const failed = steps.filter((step) => !step.ok);
  writeOpsLog(failed.length ? 'warn' : 'info', 'admin_test_content', { steps: String(steps.length), failed: String(failed.length) });
}

export async function createTestAccounts(input: ServiceTestAccountsInput, persistent: boolean, fetcher?: Fetcher): Promise<ServiceTestAccountsResult> {
  const nutriEmail = testAliasEmail(input.email_base, 'nutricionista');
  const patientEmail = testAliasEmail(input.email_base, 'paciente');

  if (!persistent) {
    const before = memoryTestAccounts.length;
    if (!memoryTestAccounts.some((account) => account.email === nutriEmail)) {
      if (memoryEmailTaken(nutriEmail)) throw new CareError(409, 'Ese mail ya es una cuenta real.');
      const row = memoryAddNutritionist({ id: `nutri-prueba-${randomUUID()}`, name: TEST_NUTRI_NAME, email: nutriEmail, isTest: true, patients: 1 });
      memoryTestAccounts.push({ email: nutriEmail, name: TEST_NUTRI_NAME, role: 'nutricionista' });
      memoryAudit('service.test_accounts_created', row.id, {});
    }
    if (!memoryTestAccounts.some((account) => account.email === patientEmail)) {
      memoryTestAccounts.push({ email: patientEmail, name: TEST_PATIENT_NAME, role: 'paciente' });
    }
    return { nutritionist: { email: nutriEmail }, patient: { email: patientEmail }, created: memoryTestAccounts.length > before };
  }

  const nutri = await ensureTestUser(nutriEmail, input.password, 'nutricionista', TEST_NUTRI_NAME);
  const patient = await ensureTestUser(patientEmail, input.password, 'paciente', TEST_PATIENT_NAME);
  const nutritionistId = await sb.sbProvisionNutritionist({ userId: nutri.user.id, displayName: TEST_NUTRI_NAME });
  // Marca de prueba (fuera de los números del panel) y auditoría.
  await call('admin_mark_test_account', { target: nutritionistId });

  const nutriSession = await signIn(nutriEmail, input.password);
  const patientSession = await signIn(patientEmail, input.password);
  try {
    const linked = await linkTestPatient({ client: nutriSession.client, userId: nutri.user.id }, { client: patientSession.client }, patientEmail);
    if (linked && fetcher) {
      // Recetas, plan, medidas, comidas y hábitos por las rutas reales; no demora la respuesta.
      void seedTestContent(fetcher, linked, nutriSession.token, patientSession.token)
        .catch(() => writeOpsLog('warn', 'admin_test_content', { steps: '0', failed: 'all' }))
        .finally(() => { void nutriSession.close(); void patientSession.close(); });
    } else {
      await nutriSession.close();
      await patientSession.close();
    }
  } catch (error) {
    await nutriSession.close();
    await patientSession.close();
    if (error instanceof CareError) throw error;
    writeOpsLog('warn', 'admin_account_failed', { step: 'link_test_patient', code: 'unknown' });
    throw new CareError(503, 'Las cuentas se crearon pero no se pudo vincular la paciente. Reintentá.');
  }
  writeOpsLog('info', 'admin_test_accounts', { created: String(nutri.created || patient.created), domain: maskedDomain(nutriEmail) });
  return { nutritionist: { email: nutriEmail }, patient: { email: patientEmail }, created: nutri.created || patient.created };
}
