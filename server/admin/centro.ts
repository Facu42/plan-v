import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { localBillingDate } from '../../src/billing.js';
import { SERVICE_GRACE_DAYS, SERVICE_STATE_LABELS, serviceTotals, summarizeService } from '../../src/service.js';
import type { ServiceBoard, ServiceNutritionist } from '../../src/types/service.js';
import type {
  CentroAlerta,
  CentroCobros,
  CentroMigraciones,
  CentroMfaEstado,
  CentroNutri,
  CentroPacientes,
  CentroResumen,
  CentroSalud,
  CentroSeguridad,
} from '../../src/types/centro.js';
import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { processQueue } from '../jobs/queue.js';
import { evaluateReadiness, releaseSha, workerLabel } from '../ops/readiness.js';
import { mfaEnforced } from '../security/mfa.js';
import { getBoard } from './repository.js';

function realNutris(board: ServiceBoard): ServiceNutritionist[] {
  return board.nutritionists.filter((row) => row.is_test !== true);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function weekKey(iso: string, today: string): number {
  const day = Date.parse(`${iso.slice(0, 10)}T12:00:00Z`);
  const now = Date.parse(`${today}T12:00:00Z`);
  if (Number.isNaN(day) || Number.isNaN(now)) return -1;
  return Math.floor((now - day) / (7 * 86_400_000));
}

function sparkAltas(rows: ServiceNutritionist[], today: string): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    const week = weekKey(row.created_at, today);
    if (week >= 0 && week < 8) buckets[7 - week] += 1;
  }
  return buckets;
}

function sparkIngresos(rows: ServiceNutritionist[], today: string): number[] {
  const months: string[] = [];
  const [year, month] = today.split('-').map(Number);
  for (let i = 7; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - i, 1));
    months.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return months.map((key) => {
    let sum = 0;
    for (const row of rows) {
      for (const payment of row.payments) {
        if (payment.status === 'confirmed' && monthKey(payment.paid_on) === key) sum += payment.amount;
      }
    }
    return sum;
  });
}

function cobradoMes(row: ServiceNutritionist, today: string): number {
  const month = today.slice(0, 7);
  return row.payments
    .filter((payment) => payment.status === 'confirmed' && payment.paid_on.startsWith(month))
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function buildResumen(board: ServiceBoard, today: string): CentroResumen {
  const rows = realNutris(board);
  const totals = serviceTotals(board.nutritionists, today);
  const price = board.settings.monthly_price;
  const alertas: CentroAlerta[] = [];
  let porVencer = 0;
  let enGracia = 0;
  for (const row of rows) {
    const summary = summarizeService(row.subscription, today);
    if (summary.state === 'por_vencer') porVencer += 1;
    if (summary.state === 'vencida') enGracia += 1;
  }
  if (totals.vencidas) {
    alertas.push({
      tone: 'coral',
      title: `${totals.vencidas} ${totals.vencidas === 1 ? 'cuenta vencida o cortada' : 'cuentas vencidas o cortadas'}`,
      sub: 'Hay consultorios sin el servicio al día.',
    });
  }
  if (enGracia) {
    alertas.push({
      tone: 'gold',
      title: `${enGracia} ${enGracia === 1 ? 'cuenta en gracia' : 'cuentas en gracia'}`,
      sub: `Siguen visibles ${SERVICE_GRACE_DAYS} días después del vencimiento.`,
    });
  }
  if (porVencer) {
    alertas.push({
      tone: 'sky',
      title: `${porVencer} ${porVencer === 1 ? 'cuenta por vencer' : 'cuentas por vencer'}`,
      sub: 'Conviene avisar antes de que se corte el mes.',
    });
  }
  if (!alertas.length) {
    alertas.push({ tone: 'green', title: 'Nada urgente', sub: 'Las cuentas del servicio están al día.' });
  }
  const altas = [...rows]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8)
    .map((row) => ({
      id: row.id,
      name: row.display_name,
      email: row.email,
      created_at: row.created_at,
      state: summarizeService(row.subscription, today).state,
    }));
  return {
    nutris_activas: totals.activas,
    nutris_prueba: totals.prueba,
    nutris_vencidas: totals.vencidas,
    nutris_total: rows.length,
    pacientes_activos: rows.reduce((sum, row) => sum + row.patients_active, 0),
    ingresos_mes: totals.cobrado_mes,
    mrr: (price ?? 0) * totals.activas,
    precio_mensual: price,
    altas_recientes: altas,
    alertas,
    spark_altas: sparkAltas(rows, today),
    spark_ingresos: sparkIngresos(rows, today),
  };
}

export function buildNutris(board: ServiceBoard, today: string): CentroNutri[] {
  return [...board.nutritionists]
    .sort((a, b) => a.display_name.localeCompare(b.display_name, 'es'))
    .map((row) => {
      const summary = summarizeService(row.subscription, today);
      return {
        id: row.id,
        display_name: row.display_name,
        email: row.email,
        created_at: row.created_at,
        last_sign_in_at: row.last_sign_in_at,
        is_test: row.is_test === true,
        patients_active: row.patients_active,
        patients_total: row.patients_total,
        state: summary.state,
        until: summary.until,
        days_left: summary.days_left,
        precio_mensual: board.settings.monthly_price,
      };
    });
}

export function buildPacientes(board: ServiceBoard): CentroPacientes {
  const rows = realNutris(board);
  const por_nutri = [...rows]
    .map((row) => ({
      nutritionist_id: row.id,
      name: row.display_name,
      activos: row.patients_active,
      total: row.patients_total,
    }))
    .sort((a, b) => b.activos - a.activos || a.name.localeCompare(b.name, 'es'));
  return {
    activos: por_nutri.reduce((sum, row) => sum + row.activos, 0),
    total: por_nutri.reduce((sum, row) => sum + row.total, 0),
    consultorios: por_nutri.length,
    por_nutri,
  };
}

export function buildCobros(board: ServiceBoard, today: string): CentroCobros {
  const rows = realNutris(board);
  const totals = serviceTotals(board.nutritionists, today);
  const price = board.settings.monthly_price;
  let vencidos = 0;
  let en_gracia = 0;
  const cuentas = rows.map((row) => {
    const summary = summarizeService(row.subscription, today);
    if (summary.state === 'vencida') en_gracia += 1;
    if (summary.state === 'vencida' || summary.state === 'cortada') vencidos += 1;
    return {
      id: row.id,
      name: row.display_name,
      state: summary.state,
      until: summary.until,
      days_left: summary.days_left,
      cobrado_mes: cobradoMes(row, today),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const month = today.slice(0, 7);
  const pagos_mes = rows.flatMap((row) =>
    row.payments
      .filter((payment) => payment.paid_on.startsWith(month))
      .map((payment) => ({
        id: payment.id,
        nutritionist_id: row.id,
        nutritionist_name: row.display_name,
        amount: payment.amount,
        paid_on: payment.paid_on,
        method: payment.method,
        status: payment.status,
      })),
  ).sort((a, b) => b.paid_on.localeCompare(a.paid_on));
  return {
    mrr: (price ?? 0) * totals.activas,
    cobrado_mes: totals.cobrado_mes,
    vencidos,
    en_gracia,
    precio_mensual: price,
    cuentas,
    pagos_mes,
  };
}

async function loadMigraciones(persistent: boolean): Promise<CentroMigraciones> {
  if (!persistent) {
    return { available: false, count: null, latest: null, note: 'En el modo local no se lee el historial aplicado.' };
  }
  try {
    const db = privilegedDb() as unknown as {
      schema?: (name: string) => { from: (table: string) => { select: (cols: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: { version?: string }[] | null; error: { message?: string } | null }> } } };
    };
    if (db.schema) {
      const { data, error } = await db.schema('supabase_migrations').from('schema_migrations').select('version').order('version', { ascending: false });
      if (!error && data) {
        return {
          available: true,
          count: data.length,
          latest: data[0]?.version ? String(data[0].version) : null,
          note: '',
        };
      }
    }
  } catch {
    /* sigue con el recuento de archivos */
  }
  try {
    const files = (await readdir(join(process.cwd(), 'supabase/migrations')))
      .filter((name) => name.endsWith('.sql'))
      .sort();
    return {
      available: false,
      count: files.length,
      latest: files.length ? files[files.length - 1] : null,
      note: 'No se pudo leer el historial aplicado. Se cuenta lo que hay en el repositorio.',
    };
  } catch {
    return { available: false, count: null, latest: null, note: 'No se pudo leer el historial de migraciones.' };
  }
}

function integrationsMissingCount(): number {
  const env = process.env;
  let missing = 0;
  for (const key of ['SCHEDULING_TOKEN_KEY', 'MP_SCHEDULING_CLIENT_ID', 'MP_SCHEDULING_CLIENT_SECRET', 'MP_SCHEDULING_WEBHOOK_SECRET', 'SCHEDULING_PUBLIC_BASE_URL']) {
    if (!env[key]?.trim()) missing += 1;
  }
  return missing;
}

export async function buildSalud(): Promise<CentroSalud> {
  const jobs = await processQueue.counts();
  const snapshot = await processQueue.snapshot();
  const failed = snapshot.filter((job) => job.status === 'failed').length;
  const errores = snapshot
    .filter((job) => job.status === 'dead' || job.status === 'failed' || Boolean(job.last_error))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 12)
    .map((job) => ({
      id: job.id,
      kind: job.kind,
      status: job.status,
      last_error: job.last_error,
      updated_at: job.updated_at,
    }));
  const ready = evaluateReadiness(process.env, jobs);
  return {
    api: {
      status: ready.status === 'ready' ? 'ok' : 'degradado',
      supabase: isSupabaseEnabled(),
      sha: releaseSha(),
      mode: process.env.APP_MODE ?? null,
    },
    worker: workerLabel(),
    jobs: { ...jobs, failed },
    errores_recientes: errores,
    migraciones: await loadMigraciones(isSupabaseEnabled()),
    integraciones_faltantes: integrationsMissingCount(),
  };
}

type AuthUserLite = {
  id: string;
  email?: string;
  factors?: { status?: string }[];
};

async function listAuthUsers(): Promise<AuthUserLite[]> {
  const admin = privilegedDb();
  const found: AuthUserLite[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = (data?.users ?? []) as AuthUserLite[];
    found.push(...users);
    if (users.length < 200) break;
  }
  return found;
}

function mfaFromUser(user: AuthUserLite | undefined): CentroMfaEstado {
  if (!user) return 'sin_dato';
  const factors = user.factors;
  if (!Array.isArray(factors)) return 'sin_dato';
  return factors.some((factor) => factor.status === 'verified') ? 'activo' : 'sin_alta';
}

function enforceWarnings(): CentroAlerta[] {
  if (mfaEnforced()) return [];
  return [{
    tone: 'gold',
    title: 'El interruptor de MFA está apagado',
    sub: 'El centro de mando igual pide el segundo paso. El resto de la app no lo exige hasta que se prenda MFA_ENFORCE.',
  }];
}

export async function buildSeguridad(board: ServiceBoard, persistent: boolean): Promise<CentroSeguridad> {
  const advertencias = enforceWarnings();
  const nutris = realNutris(board);
  if (!persistent) {
    advertencias.unshift({
      tone: 'sky',
      title: 'Modo local',
      sub: 'El estado de MFA y los administradores de plataforma se ven con el servicio real.',
    });
    return {
      mfa_enforce: mfaEnforced(),
      admins: [],
      cuentas: nutris.map((row) => ({
        id: row.id,
        name: row.display_name,
        email: row.email,
        role: 'nutri' as const,
        mfa: 'sin_dato' as const,
      })),
      advertencias,
    };
  }

  let users: AuthUserLite[] = [];
  try {
    users = await listAuthUsers();
  } catch {
    advertencias.push({ tone: 'gold', title: 'No se pudo leer el MFA de las cuentas', sub: 'Auth no respondió. Se muestra el resto igual.' });
  }
  const byEmail = new Map(users.filter((user) => user.email).map((user) => [user.email!.toLowerCase(), user]));
  const byId = new Map(users.map((user) => [user.id, user]));

  let adminRows: { user_id: string; created_at: string }[] = [];
  const names = new Map<string, string>();
  try {
    const db = privilegedDb();
    const admins = await db.from('platform_admins').select('user_id, created_at');
    if (!admins.error && admins.data) adminRows = admins.data as { user_id: string; created_at: string }[];
    const profiles = await db.from('profiles').select('id, full_name');
    if (!profiles.error && profiles.data) {
      for (const row of profiles.data as { id: string; full_name: string }[]) names.set(row.id, row.full_name);
    }
  } catch {
    advertencias.push({ tone: 'gold', title: 'No se pudieron leer los administradores', sub: 'La tabla de administradores no respondió.' });
  }

  const adminIds = new Set(adminRows.map((row) => row.user_id));
  const admins = adminRows.map((row) => {
    const user = byId.get(row.user_id);
    return {
      user_id: row.user_id,
      name: names.get(row.user_id) || user?.email || 'Administrador',
      email: user?.email ?? null,
      created_at: row.created_at,
    };
  });

  const cuentas: CentroSeguridad['cuentas'] = nutris.map((row) => {
    const user = byEmail.get(row.email.toLowerCase());
    const isAdmin = user ? adminIds.has(user.id) : false;
    return {
      id: row.id,
      name: row.display_name,
      email: row.email,
      role: isAdmin ? 'ambos' : 'nutri',
      mfa: mfaFromUser(user),
    };
  });
  for (const admin of admins) {
    if (cuentas.some((row) => row.email && admin.email && row.email.toLowerCase() === admin.email.toLowerCase())) continue;
    cuentas.push({
      id: admin.user_id,
      name: admin.name,
      email: admin.email ?? '',
      role: 'admin',
      mfa: mfaFromUser(byId.get(admin.user_id)),
    });
  }

  const withoutMfa = cuentas.filter((row) => row.mfa === 'sin_alta').length;
  if (withoutMfa) {
    advertencias.push({
      tone: 'coral',
      title: `${withoutMfa} ${withoutMfa === 1 ? 'cuenta sin el segundo paso' : 'cuentas sin el segundo paso'}`,
      sub: 'Conviene que den de alta el código, sobre todo quienes administran.',
    });
  }
  if (!admins.length) {
    advertencias.push({
      tone: 'coral',
      title: 'No hay administradores de plataforma',
      sub: 'Nadie figura en la lista de quien puede ver este centro.',
    });
  }

  return { mfa_enforce: mfaEnforced(), admins, cuentas, advertencias };
}

export async function loadResumen(persistent: boolean): Promise<CentroResumen> {
  return buildResumen(await getBoard(persistent), localBillingDate());
}

export async function loadNutris(persistent: boolean): Promise<CentroNutri[]> {
  return buildNutris(await getBoard(persistent), localBillingDate());
}

export async function loadPacientes(persistent: boolean): Promise<CentroPacientes> {
  return buildPacientes(await getBoard(persistent));
}

export async function loadCobros(persistent: boolean): Promise<CentroCobros> {
  return buildCobros(await getBoard(persistent), localBillingDate());
}

export async function loadSalud(): Promise<CentroSalud> {
  return buildSalud();
}

export async function loadSeguridad(persistent: boolean): Promise<CentroSeguridad> {
  return buildSeguridad(await getBoard(persistent), persistent);
}

export { SERVICE_STATE_LABELS };
