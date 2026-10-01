import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
const owner = '00000000-0000-4000-a000-000000000041';
const patientUser = '00000000-0000-4000-a000-000000000042';
const outsider = '00000000-0000-4000-a000-000000000043';
const patient = '10000000-0000-4000-a000-000000000041';
const note = 'NOTA PROFESIONAL FICTICIA';
const corrective = new URL('../../supabase/migrations/20261001193156_close_legacy_patient_row_access.sql', import.meta.url);

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
});

