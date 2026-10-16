import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
const nutriA = '00000000-0000-4000-a000-000000000191';
const nutriB = '00000000-0000-4000-a000-000000000192';
const patientUser = '00000000-0000-4000-a000-000000000193';
const patient = '10000000-0000-4000-a000-000000000191';
const priorGoal = 'Organizar las cenas';

async function asUser(user: string, sql: string, params: unknown[] = [], role = 'authenticated') {
  return db.transaction(async (tx) => {
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
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1, '/') $$;
  `);
  const dir = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, dir), 'utf8'));
  }
  for (const [id, email] of [[nutriA, 'nutri-a@example.test'], [nutriB, 'nutri-b@example.test'], [patientUser, 'paciente@example.test']] as const) {
    await db.query('insert into auth.users(id, email, email_confirmed_at) values ($1, $2, now())', [id, email]);
  }
  await db.query("select public.provision_nutritionist($1, 'Consultorio A')", [nutriA]);
  await db.query("select public.provision_nutritionist($1, 'Consultorio B')", [nutriB]);
  const nutritionist = (await db.query<{ id: string }>('select id from public.nutritionists where user_id = $1', [nutriA])).rows[0].id;
  await db.query(
    `insert into public.patients(id, nutritionist_id, user_id, full_name, billing_status, goal)
     values ($1, $2, $3, 'Paciente ficticia', 'waived', $4)`,
    [patient, nutritionist, patientUser, priorGoal],
  );
}, 60000);

afterAll(async () => { await db?.close(); });

const habit = (date: string, hydration: number) => db.query(
  'insert into public.habit_logs(patient_id, date, hydration) values ($1, $2, $3)', [patient, date, hydration]);

describe('meta de agua por paciente en Postgres descartable', () => {
  it('la nutri elige la meta y la paciente la ve solo en su fila', async () => {
    expect(await asUser(patientUser, 'select water_goal_glasses from public.patient_water_goal_view')).toEqual([{ water_goal_glasses: null }]);
    await asUser(nutriA, 'update public.patients set water_goal_glasses = 12 where id = $1', [patient]);
    expect(await asUser(patientUser, 'select id, water_goal_glasses from public.patient_water_goal_view')).toEqual([{ id: patient, water_goal_glasses: 12 }]);
    expect(await asUser(nutriB, 'select id from public.patient_water_goal_view')).toEqual([]);
  });

  it('otra nutri no la cambia, una meta fuera de 4 a 16 se rechaza y sin sesión no se lee', async () => {
    await asUser(nutriB, 'update public.patients set water_goal_glasses = 4 where id = $1', [patient]);
    expect((await db.query('select water_goal_glasses from public.patients where id = $1', [patient])).rows).toEqual([{ water_goal_glasses: 12 }]);
    await expect(asUser(nutriA, 'update public.patients set water_goal_glasses = 3 where id = $1', [patient])).rejects.toMatchObject({ code: '23514' });
    await expect(asUser(nutriA, 'update public.patients set water_goal_glasses = 17 where id = $1', [patient])).rejects.toMatchObject({ code: '23514' });
    await expect(asUser('', 'select id from public.patient_water_goal_view', [], 'anon')).rejects.toMatchObject({ code: '42501' });
  });

  it('la paciente puede anotar hasta 16 vasos por día, no más', async () => {
    await habit('2026-10-10', 12);
    await habit('2026-10-11', 16);
    await expect(habit('2026-10-12', 17)).rejects.toMatchObject({ code: '23514' });
  });

  it('la migración es repetible', async () => {
    const file = (await readdir(new URL('../supabase/migrations/', import.meta.url))).find((name) => name.endsWith('_water_goal.sql'))!;
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
    expect((await db.query('select water_goal_glasses from public.patients where id = $1', [patient])).rows).toEqual([{ water_goal_glasses: 12 }]);
  });
});
