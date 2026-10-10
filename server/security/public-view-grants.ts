import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Excepciones de security_invoker. No perdonan INSERT, UPDATE ni DELETE:
// si una vista de esta lista gana escritura, el control falla igual.
// Cada reason es obligatorio y tiene que decir por qué la vista puede
// quedar con los permisos del dueño.
// Vacía: la ficha y el acceso leen por funciones privadas y ya tienen
// security_invoker. Una vista nueva sin esa opción vuelve a fallar el control.
export const publicViewInvokerAllowlist: { name: string; reason: string }[] = [];

const WRITE_PRIVILEGES = ['INSERT', 'UPDATE', 'DELETE'] as const;
const COLUMN_PRIVILEGES = ['INSERT', 'UPDATE'] as const;
const ROLES = ['anon', 'authenticated'] as const;

const INSPECT_SQL = `
select c.relname as name,
       coalesce(c.reloptions, array[]::text[]) as reloptions,
       has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
       has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
       has_table_privilege('anon', c.oid, 'DELETE') as anon_delete,
       has_table_privilege('authenticated', c.oid, 'INSERT') as authenticated_insert,
       has_table_privilege('authenticated', c.oid, 'UPDATE') as authenticated_update,
       has_table_privilege('authenticated', c.oid, 'DELETE') as authenticated_delete,
       has_any_column_privilege('anon', c.oid, 'INSERT') as anon_column_insert,
       has_any_column_privilege('anon', c.oid, 'UPDATE') as anon_column_update,
       has_any_column_privilege('authenticated', c.oid, 'INSERT') as authenticated_column_insert,
       has_any_column_privilege('authenticated', c.oid, 'UPDATE') as authenticated_column_update
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by c.relname
`;

export type PublicViewRow = {
  name: string;
  securityInvoker: boolean;
  grants: string[];
};

type Queryable = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

function enabled(value: unknown) {
  return value === true || value === 't' || value === 'true';
}

function optionList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase());
  return [];
}

function isSecurityInvoker(reloptions: unknown) {
  return optionList(reloptions).some((option) => option === 'security_invoker=true' || option === 'security_invoker=on');
}

function writeGrants(row: Record<string, unknown>) {
  const grants: string[] = [];
  for (const role of ROLES) {
    for (const privilege of WRITE_PRIVILEGES) {
      if (enabled(row[`${role}_${privilege.toLowerCase()}`])) grants.push(`${role} ${privilege}`);
    }
    for (const privilege of COLUMN_PRIVILEGES) {
      const tableKey = `${role}_${privilege.toLowerCase()}`;
      const columnKey = `${role}_column_${privilege.toLowerCase()}`;
      if (!enabled(row[tableKey]) && enabled(row[columnKey])) grants.push(`${role} ${privilege} por columna`);
    }
  }
  return grants;
}

export function problemsForPublicViews(rows: PublicViewRow[], allowlist = publicViewInvokerAllowlist) {
  const problems: string[] = [];
  const allowed = new Map<string, string>();
  for (const entry of allowlist) {
    const reason = entry.reason?.trim() ?? '';
    if (!reason) problems.push(`La lista de public.${entry.name} no explica por qué puede quedar sin security_invoker.`);
    if (allowed.has(entry.name)) problems.push(`La lista repite public.${entry.name}.`);
    allowed.set(entry.name, reason);
  }
  const present = new Set(rows.map((row) => row.name));
  for (const name of allowed.keys()) {
    if (!present.has(name)) problems.push(`La lista permite public.${name}, pero esa vista no existe.`);
  }
  for (const row of rows) {
    if (row.grants.length) {
      problems.push(`public.${row.name} concede ${row.grants.join(', ')}.`);
    }
    if (!row.securityInvoker && !allowed.has(row.name)) {
      problems.push(`public.${row.name} no tiene security_invoker=true.`);
    }
  }
  return problems;
}

export async function inspectPublicViews(db: Queryable): Promise<PublicViewRow[]> {
  const { rows } = await db.query(INSPECT_SQL);
  return rows.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      name: String(row.name),
      securityInvoker: isSecurityInvoker(row.reloptions),
      grants: writeGrants(row),
    };
  });
}

export async function publicViewGrantProblems(db: Queryable) {
  return problemsForPublicViews(await inspectPublicViews(db));
}

export function formatPublicViewGrantReport(problems: string[]) {
  if (!problems.length) {
    if (publicViewInvokerAllowlist.length === 0) {
      return 'Vistas públicas revisadas. Sin escritura para anon ni authenticated. security_invoker en todas.';
    }
    const names = publicViewInvokerAllowlist.map((entry) => entry.name).join(', ');
    return `Vistas públicas revisadas. Sin escritura para anon ni authenticated. security_invoker en todas, salvo la lista (${names}).`;
  }
  return ['Hay vistas públicas que vuelven a abrir la escritura o el permiso del dueño:', ...problems].join('\n');
}

// Misma base temporal que el CI: permisos por defecto de Supabase y después
// todas las migraciones. No abre ningún proyecto hospedado.
export async function openMigratedDatabase() {
  const db = new PGlite();
  await db.exec(await readFile(new URL('../../supabase/disposable/bootstrap.sql', import.meta.url), 'utf8'));
  await db.exec(`
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  `);
  const dir = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, dir), 'utf8'));
  }
  return db;
}

export function assertLocalDatabaseUrl(raw: string) {
  if (process.env.APP_MODE === 'production') {
    throw new Error('No se revisan vistas con la aplicación en producción.');
  }
  if (raw.includes('wvosvlxpfytokwfbcero')) {
    throw new Error('No se revisan vistas en la base de producción.');
  }
  const url = new URL(raw);
  if (url.search || url.hash || !['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('La revisión solo acepta una URL de Postgres.');
  }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('La revisión contra una base ya migrada solo acepta un servidor local.');
  }
  return raw;
}
