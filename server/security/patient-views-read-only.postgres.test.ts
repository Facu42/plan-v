import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// Las vistas *_patient_view son proyecciones de lectura para la paciente.
// La app escribe por funciones con guardas; ninguna vista debe aceptar
// escrituras ni permisos de más, aunque la RLS de las tablas las frene.
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL('../../supabase/disposable/bootstrap.sql', import.meta.url), 'utf8'));
  // Reproduce los permisos heredados de Supabase, que no están en el arranque local.
  await db.exec('alter default privileges in schema public grant all on tables to anon,authenticated,service_role; alter default privileges in schema public grant all on functions to anon,authenticated,service_role;');
  const dir = new URL('../../supabase/migrations/', import.meta.url);
  for (const f of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(f, dir), 'utf8'));
}, 120000);
afterAll(async () => { await db?.close(); });

const EXTRA = ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES'];

async function patientViews() {
  return (await db.query<{ relname: string }>(
    "select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and c.relname like '%\\_patient\\_view' order by 1",
  )).rows.map(r => r.relname);
}

async function privileges(role: string, view: string) {
  const out: string[] = [];
  for (const p of ['SELECT', ...EXTRA]) {
    const r = await db.query<{ ok: boolean }>('select has_table_privilege($1, $2, $3) as ok', [role, `public.${view}`, p]);
    if (r.rows[0].ok) out.push(p);
  }
  return out;
}

describe('vistas de la paciente: solo lectura', () => {
  it('incluye las vistas de turnos, ingreso, mensajes y comidas', async () => {
    const views = await patientViews();
    for (const v of ['appointments_patient_view', 'intake_patient_view', 'messages_patient_view', 'meal_logs_patient_view']) {
      expect(views).toContain(v);
    }
  });

  it('anon no tiene ningún permiso sobre ninguna vista de la paciente', async () => {
    for (const v of await patientViews()) expect({ v, privs: await privileges('anon', v) }).toEqual({ v, privs: [] });
  });

  it('authenticated solo puede leer cada vista de la paciente', async () => {
    for (const v of await patientViews()) expect({ v, privs: await privileges('authenticated', v) }).toEqual({ v, privs: ['SELECT'] });
  });
});
