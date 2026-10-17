import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
const nutriA = '00000000-0000-4000-a000-000000000091';
const nutriB = '00000000-0000-4000-a000-000000000092';
const patientUser = '00000000-0000-4000-a000-000000000093';
const patient = '10000000-0000-4000-a000-000000000091';
const priorGoal = 'Organizar las cenas';

const rollbackSql = `
  drop view if exists public.goal_updates_patient_view;
  drop view if exists public.patient_goal_patient_view;
  drop function if exists public.set_patient_goal(uuid, text, text, integer, text);
  drop function if exists private.patient_goal_updates();
  drop function if exists private.patient_goal_projection();
  drop table if exists public.goal_history;
  alter table public.patients drop constraint if exists patients_goal_status_check;
  alter table public.patients drop constraint if exists patients_goal_progress_check;
  alter table public.patients drop column if exists goal_status;
  alter table public.patients drop column if exists goal_progress;
  alter table public.patients drop column if exists goal_updated_at;
`;

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

describe('objetivo de seguimiento en Postgres descartable', () => {
  it('la profesional guarda estado, avance y nota; la paciente ve el cambio sin la nota', async () => {
    await asUser(nutriA, `select public.set_patient_goal($1, $2, 'paused', 40, 'Nota privada del consultorio')`, [patient, priorGoal]);
    const saved = await db.query<{ goal: string; goal_status: string; goal_progress: number }>(
      'select goal, goal_status, goal_progress from public.patients where id = $1',
      [patient],
    );
    expect(saved.rows).toEqual([{ goal: priorGoal, goal_status: 'paused', goal_progress: 40 }]);

    const note = await asUser(nutriA, 'select note from public.goal_history where patient_id = $1', [patient]);
    expect(note).toEqual([{ note: 'Nota privada del consultorio' }]);

    const patientGoal = await asUser(patientUser, 'select goal_status, goal_progress from public.patient_goal_patient_view');
    expect(patientGoal).toEqual([{ goal_status: 'paused', goal_progress: 40 }]);
    const updates = await asUser(patientUser, 'select goal, status, progress from public.goal_updates_patient_view');
    expect(updates).toEqual([{ goal: priorGoal, status: 'paused', progress: 40 }]);
    const updateColumns = (await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'goal_updates_patient_view'",
    )).rows.map((row) => row.column_name);
    expect(updateColumns).not.toContain('note');
    expect(await asUser(patientUser, 'select goal from public.patients_patient_view')).toEqual([{ goal: priorGoal }]);
  });

  it('otra nutricionista y la paciente no leen la nota ni reescriben el objetivo', async () => {
    expect(await asUser(nutriB, 'select note from public.goal_history')).toEqual([]);
    expect(await asUser(patientUser, 'select note from public.goal_history')).toEqual([]);
    await expect(asUser(nutriB, `select public.set_patient_goal($1, 'Otra meta', 'active', 1, 'no')`, [patient])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientUser, `select public.set_patient_goal($1, 'Otra meta', 'active', 1, 'no')`, [patient])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser('', 'select id from public.patient_goal_patient_view', [], 'anon')).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, `select public.set_patient_goal($1, 'Meta de prueba', 'cerrado', 40, null)`, [patient])).rejects.toMatchObject({ code: '22023' });
  });

  it('el retroceso borra el seguimiento nuevo y conserva el texto del objetivo', async () => {
    const before = (await db.query('select id, goal from public.patients where id = $1', [patient])).rows;
    await db.exec(rollbackSql);
    expect((await db.query('select id, goal from public.patients where id = $1', [patient])).rows).toEqual(before);
    expect((await db.query("select column_name from information_schema.columns where table_name = 'patients' and column_name = 'goal_status'")).rows).toEqual([]);
    expect((await db.query("select to_regclass('public.goal_history') as name")).rows).toEqual([{ name: null }]);
    expect(await asUser(patientUser, 'select goal from public.patients_patient_view')).toEqual([{ goal: priorGoal }]);
  });
});
