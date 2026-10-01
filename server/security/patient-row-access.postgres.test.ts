import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
const owner = '00000000-0000-4000-a000-000000000041';
const patientUser = '00000000-0000-4000-a000-000000000042';
const outsider = '00000000-0000-4000-a000-000000000043';
const patient = '10000000-0000-4000-a000-000000000041';
const note = 'NOTA PROFESIONAL FICTICIA';
const corrective = new URL('../../supabase/migrations/20261001195127_close_legacy_patient_row_access.sql', import.meta.url);
const viewBoundary = new URL('../../supabase/migrations/20261001222659_explicit_patient_view_boundary.sql', import.meta.url);

async function asUser(user: string, sql: string) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
    return (await tx.query(sql)).rows;
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const migrations = new URL('../../supabase/migrations/',import.meta.url);
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file,migrations),'utf8'));
  }
  for (const [id,email] of [[owner,'owner@example.test'],[patientUser,'patient@example.test'],[outsider,'other@example.test']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);
  }
  const nid = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Ficticia') as id",[owner])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status,adherence_why) values($1,$2,$3,'Ficticia','waived',$4)",[patient,nid,patientUser,note]);
},60000);

afterAll(async () => { await db?.close(); });

describe('cierre de lectura cruda de paciente en esquema legacy', () => {
  it('reproduce la exposición y la cierra conservando la vista de paciente y la lectura profesional',async () => {
    const raw = "select adherence_why from public.patients where id='" + patient + "'";
    await db.exec(await readFile(new URL('../../supabase/auth-isolation/live-policy-snapshot.sql',import.meta.url),'utf8'));
    // Evidencia anterior: la misma identidad lee la nota profesional al existir la policy legacy.
    expect(await asUser(patientUser,raw)).toEqual([{ adherence_why: note }]);
    await db.exec(await readFile(corrective,'utf8'));
    expect(await asUser(patientUser,raw)).toEqual([]);
    expect(await asUser(outsider,raw)).toEqual([]);
    expect(await asUser(owner,raw)).toEqual([{ adherence_why: note }]);
    expect(await asUser(patientUser,'select id from public.patients_patient_view')).toEqual([{ id: patient }]);
    expect(await asUser(patientUser,'select id from public.patient_access_view')).toEqual([{ id: patient }]);
  });

  it('puede aplicarse nuevamente sin abrir permisos ni cambiar los datos',async () => {
    await db.exec(await readFile(corrective,'utf8'));
    expect((await db.query("select adherence_why from public.patients where id=$1",[patient])).rows).toEqual([{ adherence_why: note }]);
    expect((await db.query("select policyname from pg_policies where schemaname='public' and tablename='patients' order by policyname")).rows).toEqual([{ policyname:'patients_nutri_all' }]);
  });

  it('reproduce las vistas invoker publicadas y recupera la ficha sin exponer filas ni columnas privadas',async () => {
    const nid = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Otra ficticia') as id",[outsider])).rows[0].id;
    const otherPatient = '10000000-0000-4000-a000-000000000043';
    await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status,adherence_why) values($1,$2,$3,'Otra ficticia','waived',$4)",[otherPatient,nid,outsider,note]);
    await db.exec(await readFile(new URL('../../supabase/auth-isolation/live-view-options.sql',import.meta.url),'utf8'));
    expect(await asUser(patientUser,'select id from public.patients_patient_view')).toEqual([]);
    expect(await asUser(patientUser,'select id from public.patient_access_view')).toEqual([]);
    // Simula ACL heredadas de tabla y columna, no eliminadas por CREATE OR REPLACE.
    await db.exec(`
      grant all on public.patients_patient_view,public.patient_access_view to authenticated;
      grant update(billing_status),select(id) on public.patients_patient_view,public.patient_access_view to authenticated,anon;
      grant update(user_id) on public.patients_patient_view to public;
    `);
    await db.exec(await readFile(viewBoundary,'utf8'));
    expect(await asUser(patientUser,'select id from public.patients_patient_view')).toEqual([{id:patient}]);
    expect(await asUser(patientUser,'select id from public.patient_access_view')).toEqual([{id:patient}]);
    expect(await asUser(owner,'select id from public.patient_access_view')).toEqual([{id:patient}]);
    expect(await asUser(patientUser,'select id from public.patients')).toEqual([]);
    expect(await asUser(patientUser,"select id from public.patients_patient_view where id='"+otherPatient+"'")).toEqual([]);
    expect(await asUser(patientUser,"select id from public.patient_access_view where id='"+otherPatient+"'")).toEqual([]);
    const columns = (await db.query<{column_name:string}>("select column_name from information_schema.columns where table_schema='public' and table_name in ('patients_patient_view','patient_access_view')")).rows.map(row=>row.column_name);
    for (const field of ['adherence_why','next_focus','plan_b','sensitive_hours']) expect(columns).not.toContain(field);
    expect((await db.query("select has_table_privilege('anon','public.patients_patient_view','SELECT') as patient,has_table_privilege('anon','public.patient_access_view','SELECT') as access")).rows).toEqual([{patient:false,access:false}]);
    await db.exec(await readFile(viewBoundary,'utf8'));
    expect((await db.query('select adherence_why from public.patients where id=$1',[patient])).rows).toEqual([{adherence_why:note}]);
  });

  it('niega escrituras de paciente y profesional en ambas vistas sin alterar filas ni vínculos',async () => {
    const before = (await db.query('select id,user_id,nutritionist_id,billing_status,adherence_why from public.patients order by id')).rows;
    for (const view of ['patients_patient_view','patient_access_view']) {
      const privileges = (await db.query(`select privilege,
        has_table_privilege('authenticated','public.${view}',privilege) as allowed
        from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege`)).rows;
      expect(privileges).toEqual(['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'].map(privilege=>({privilege,allowed:privilege==='SELECT'})));
      const acls = (await db.query(`select attname from pg_attribute where attrelid='public.${view}'::regclass and attacl is not null`)).rows;
      expect(acls).toEqual([]);
      expect((await db.query(`select has_column_privilege('anon','public.${view}','id','SELECT') as allowed`)).rows).toEqual([{allowed:false}]);
      for (const user of [patientUser,owner]) {
        for (const sql of [
          `update public.${view} set billing_status='pending' where id='${patient}'`,
          `update public.${view} set ${view==='patients_patient_view'?'user_id':'nutritionist_id'}='${outsider}' where id='${patient}'`,
          `insert into public.${view}(id,billing_status) values(gen_random_uuid(),'waived')`,
          `delete from public.${view} where id='${patient}'`,
        ]) await expect(asUser(user,sql)).rejects.toMatchObject({code:'42501'});
      }
    }
    expect((await db.query('select id,user_id,nutritionist_id,billing_status,adherence_why from public.patients order by id')).rows).toEqual(before);
  });
});

