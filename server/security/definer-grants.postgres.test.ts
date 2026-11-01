import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// Permisos de las funciones con permisos de dueño (security definer), con los
// permisos por defecto que Supabase da en producción: toda función nueva del
// esquema public nace ejecutable por anon y authenticated. Sin ese detalle las
// otras pruebas no veían que 34 funciones internas quedaban abiertas.

// Firmas completas, incluidos helpers privados para vistas invoker. Cada permiso
// nuevo requiere una decisión explícita y una prueba de autorización.
import ALLOWED from './definer-allowlist.json';

let db: PGlite;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientA = '10000000-0000-4000-a000-0000000000a1';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  for (const [id, email] of [[nutriA, 'a@example.test'], [nutriB, 'b@example.test'], [patientAUser, 'pa@example.test']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  await db.query("select public.provision_nutritionist($1,'Nutri B')", [nutriB]);
  await db.query(
    "insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente A','waived')",
    [patientA, nutriAId, patientAUser],
  );
  await db.query(
    "insert into public.messages(nutritionist_id,patient_id,author_id,body,sent_at) values ($1,$2,$3,'Dato privado',now())",
    [nutriAId, patientA, nutriA],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
});

describe('funciones con permisos de dueño (permisos como en Supabase)', () => {
  async function executable(role: string) {
    const rows = await db.query<{ signature: string }>(
      `select n.nspname || '.' || p.proname || '(' || oidvectortypes(p.proargtypes) || ')' as signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('public', 'private') and p.prosecdef and has_function_privilege($1, p.oid, 'execute')
       order by 1`,
      [role],
    );
    return rows.rows.map((row) => row.signature);
  }

  it('anon no ejecuta ninguna', async () => {
    expect(await executable('anon')).toEqual([]);
  });

  it('authenticated sólo ejecuta las de la lista permitida', async () => {
    expect(await executable('authenticated')).toEqual([...ALLOWED].sort());
  });

  it('todas las definer tienen una ruta de búsqueda fija', async () => {
    const result = await db.query(`select n.nspname, p.proname from pg_proc p
      join pg_namespace n on n.oid=p.pronamespace
      where n.nspname in ('public','private') and p.prosecdef
      and not exists (select 1 from unnest(p.proconfig) setting where setting like 'search_path=%')`);
    expect(result.rows).toEqual([]);
  });

  it('los helpers sin llamadas cliente quedan cerrados', async () => {
    for (const signature of ['public.set_recipe_cover(uuid,text,text,text)', 'public.scheduling_can_read_shared(uuid)']) {
      const result = await db.query(`select has_function_privilege('anon',$1,'execute') a,
        has_function_privilege('authenticated',$1,'execute') u`, [signature]);
      expect(result.rows).toEqual([{ a: false, u: false }]);
    }
  });

  it('la reapertura expone un wrapper invoker y un helper privado autorizado con ruta de búsqueda vacía',async()=>{
    const routines = await db.query<{schema:string;prosecdef:boolean;allowed:boolean;anonymous:boolean;proconfig:string[]}>(
      "select n.nspname as schema,p.prosecdef,has_function_privilege('authenticated',p.oid,'execute') as allowed,has_function_privilege('anon',p.oid,'execute') as anonymous,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='reopen_patient_intake' order by n.nspname",
    );
    expect(routines.rows).toEqual([{schema:'private',prosecdef:true,allowed:true,anonymous:false,proconfig:['search_path=""']},{schema:'public',prosecdef:false,allowed:true,anonymous:false,proconfig:['search_path=""']}]);
  });

  it('el guardado antiguo no permite saltar la revisión de la meta', async () => {
    const result = await db.query<{ allowed: boolean }>(
      "select has_function_privilege('authenticated', p.oid, 'execute') as allowed from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_nutrition_target'",
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.every(row => !row.allowed)).toBe(true);
  });

  it('una nutricionista ajena no lee un mensaje por su id', async () => {
    const [{ id }] = (await db.query<{ id: string }>('select id from public.messages limit 1')).rows;
    await expect(asUser(nutriB, 'select public.thread_message_json($1, true)', [id])).rejects.toMatchObject({ code: '42501' });
  });

  it('la dueña sigue leyendo sus mensajes por la función pública', async () => {
    const rows = await asUser<{ r: Array<{ text: string }> | { items?: Array<{ text: string }> } }>(nutriA, 'select public.list_thread_messages($1, false) as r', [patientA]);
    expect(JSON.stringify(rows[0].r)).toContain('Dato privado');
  });

  it('una función nueva nace cerrada', async () => {
    await db.exec("create function public.nueva_prueba() returns int language sql security definer set search_path = '' as 'select 1'");
    const ok = await db.query<{ a: boolean; u: boolean }>(
      "select has_function_privilege('anon','public.nueva_prueba()','execute') a, has_function_privilege('authenticated','public.nueva_prueba()','execute') u",
    );
    expect(ok.rows[0]).toEqual({ a: false, u: false });
    await db.exec('drop function public.nueva_prueba()');
  });
});
