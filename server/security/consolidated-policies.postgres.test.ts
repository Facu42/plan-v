import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
let restrictivePolicies: Record<string, unknown>[];
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientA = '10000000-0000-4000-a000-0000000000a1';

async function asRole(user: string, role: 'anon' | 'authenticated', sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query(sql, params)).rows;
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
    if (file === '20261031120000_consolidate_policies.sql') {
      restrictivePolicies = (await db.query<Record<string, unknown>>("select * from pg_policies where permissive='RESTRICTIVE' order by schemaname,tablename,policyname")).rows;
    }
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

}, 60000);
afterAll(async () => { await db?.close(); });

describe('políticas consolidadas', () => {
  it('cada rol y comando tienen una sola política permisiva aplicable', async () => {
    const duplicates = await db.query(`
      select p.schemaname, p.tablename, roles.role, commands.command, count(*)
      from pg_policies p
      cross join (values ('anon'), ('authenticated')) roles(role)
      cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) commands(command)
      where p.schemaname in ('public', 'storage') and p.permissive = 'PERMISSIVE'
        and (p.cmd = 'ALL' or p.cmd = commands.command)
        and ('public' = any(p.roles) or roles.role::name = any(p.roles))
      group by 1, 2, 3, 4 having count(*) > 1
    `);
    expect(duplicates.rows).toEqual([]);
  });

  it('conserva las políticas restrictivas y sus predicados', async () => {
    expect((await db.query<Record<string, unknown>>("select * from pg_policies where permissive='RESTRICTIVE' order by schemaname,tablename,policyname")).rows)
      .toEqual(restrictivePolicies);
  });

  it('anon no inserta hábitos ni aunque reciba un grant accidental de tabla', async () => {
    await expect(asRole('', 'anon', 'insert into public.habit_logs(patient_id,date) values($1,$2)', [patientA, '2026-10-01']))
      .rejects.toMatchObject({ code: '42501' });
    await db.exec('grant insert on public.habit_logs to anon');
    try {
      await expect(asRole('', 'anon', 'insert into public.habit_logs(patient_id,date) values($1,$2)', [patientA, '2026-10-01']))
        .rejects.toMatchObject({ code: '42501' });
    } finally {
      await db.exec('revoke insert on public.habit_logs from anon');
    }
    expect((await db.query("select * from public.habit_logs where date='2026-10-01'")).rows).toEqual([]);
  });

  it('la paciente registra, lee y actualiza sus hábitos; su nutri también', async () => {
    await asRole(patientAUser, 'authenticated', 'insert into public.habit_logs(patient_id,date,hydration) values($1,$2,3)', [patientA, '2026-10-02']);
    await asRole(patientAUser, 'authenticated', 'update public.habit_logs set hydration=4 where patient_id=$1', [patientA]);
    expect(await asRole(patientAUser, 'authenticated', 'select hydration from public.habit_logs where patient_id=$1', [patientA]))
      .toEqual([{ hydration: 4 }]);
    await asRole(nutriA, 'authenticated', 'update public.habit_logs set hydration=5 where patient_id=$1', [patientA]);
    expect(await asRole(nutriA, 'authenticated', 'select hydration from public.habit_logs where patient_id=$1', [patientA]))
      .toEqual([{ hydration: 5 }]);
  });

  it('una nutri ajena no lee, cambia ni agrega hábitos de otra cartera', async () => {
    expect(await asRole(nutriB, 'authenticated', 'select * from public.habit_logs where patient_id=$1', [patientA])).toEqual([]);
    expect(await asRole(nutriB, 'authenticated', 'update public.habit_logs set hydration=0 where patient_id=$1 returning id', [patientA])).toEqual([]);
    await expect(asRole(nutriB, 'authenticated', 'insert into public.habit_logs(patient_id,date) values($1,$2)', [patientA, '2026-10-03']))
      .rejects.toMatchObject({ code: '42501' });
  });
  it('una paciente sin acceso no puede registrar hábitos', async () => {
    await db.query("update public.patients set billing_status='pending',billing_until=null where id=$1", [patientA]);
    try {
      await expect(asRole(patientAUser, 'authenticated', 'insert into public.habit_logs(patient_id,date) values($1,$2)', [patientA, '2026-10-04']))
        .rejects.toMatchObject({ code: '42501' });
    } finally {
      await db.query("update public.patients set billing_status='waived' where id=$1", [patientA]);
    }
  });
});
