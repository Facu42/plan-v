import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
const owner = '00000000-0000-4000-a000-000000000051';
const patientUser = '00000000-0000-4000-a000-000000000052';
const patient = '10000000-0000-4000-a000-000000000051';

async function asUser(user: string, aal: string, sql: string) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
    await tx.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: user, aal })]);
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
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    if (file.endsWith('_invoker_patient_profile_projections.sql')) continue;
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  for (const [id, email] of [[owner, 'owner@example.test'], [patientUser, 'patient@example.test']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  const nid = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Ficticia') as id", [owner])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Ficticia','waived')", [patient, nid, patientUser]);
}, 60000);

afterAll(async () => { await db.close(); });

describe('regla de segundo paso en la base', () => {
  const read = "select count(*)::int as n from public.patients";

  it('viene apagada: la nutri con token aal1 sigue leyendo', async () => {
    expect((await asUser(owner, 'aal1', read))[0]).toEqual({ n: 1 });
  });

  it('prendida, la nutri con token aal1 no ve nada y con aal2 sí', async () => {
    await db.exec('update private.mfa_enforcement set enabled = true');
    expect((await asUser(owner, 'aal1', read))[0]).toEqual({ n: 0 });
    expect((await asUser(owner, 'aal2', read))[0]).toEqual({ n: 1 });
  });

  it('prendida, la regla no frena a la paciente (la consulta no falla)', async () => {
    const rows = await asUser(patientUser, 'aal1', 'select count(*)::int as n from public.patients') as { n: number }[];
    expect(rows).toHaveLength(1);
  });

  it('el interruptor no es visible ni editable para authenticated', async () => {
    await expect(asUser(owner, 'aal2', 'select * from private.mfa_enforcement')).rejects.toThrow();
  });

  it('apagarla devuelve el acceso', async () => {
    await db.exec('update private.mfa_enforcement set enabled = false');
    expect((await asUser(owner, 'aal1', read))[0]).toEqual({ n: 1 });
  });
});
