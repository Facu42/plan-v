import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PatientExerciseView } from '../../src/types/exercise.js';

let db: PGlite;
let dir: string;
let nutriAId = '';
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';
const walk = '11111111-1111-4111-a111-000000000004';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}

async function rpc(user: string, name: string, args: unknown[] = []) {
  const rows = await asUser<{ result: unknown }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args);
  return rows[0].result;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-exercise-'));
  db = new PGlite(dir);
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant select,insert,delete on storage.objects to authenticated;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(new URL(file, migrations), 'utf8')); }
    catch (error) { console.error(file, JSON.stringify(error)); throw error; }
  }
  for (const [id, email] of [
    [nutriA, 'nutri-a@example.test'],
    [nutriB, 'nutri-b@example.test'],
    [patientAUser, 'paciente-a@example.test'],
    [patientBUser, 'paciente-b@example.test'],
  ] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
     values ($1,$2,$3,'Paciente A','waived'),($4,$5,$6,'Paciente B','waived')`,
    [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-35 ejercicio en PostgreSQL descartable', () => {
  it('exige habilitación verificada, aísla Nutri B y persiste activity_logs', async () => {
    const items = JSON.stringify([{ exercise_id: walk, sets: 1, reps: 1, rest_seconds: 0 }]);
    await expect(asUser(nutriA, 'select public.assign_exercise_routine($1,$2,$3::jsonb) as result', [patientA, 'Caminar', items])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, 'insert into public.professional_habilitations(nutritionist_id,kind,verified_at,verified_by) values ($1,$2,now(),$3)', [
      nutriAId, 'exercise_prescription', nutriA,
    ])).rejects.toMatchObject({ code: '42501' });

    await db.query(
      `insert into public.professional_habilitations(nutritionist_id,kind,verified_at,verified_by)
       values ($1,'exercise_prescription',now(),$2)`,
      [nutriAId, nutriA],
    );

    const assigned = (await asUser<{ result: PatientExerciseView }>(nutriA, 'select public.assign_exercise_routine($1,$2,$3::jsonb) as result', [patientA, 'Caminar', items]))[0].result;
    expect(assigned.can_assign).toBe(true);
    expect(assigned.assignments[0].title).toBe('Caminar');
    expect(assigned.assignments[0].items[0].exercise_id).toBe(walk);
    expect(assigned.library.some((entry) => entry.id === walk)).toBe(true);

    await expect(asUser(patientAUser, 'select public.assign_exercise_routine($1,$2,$3::jsonb)', [patientA, 'No', items])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriB, 'select public.assign_exercise_routine($1,$2,$3::jsonb)', [patientA, 'Ajeno', items])).rejects.toMatchObject({ code: '42501' });

    const logged = await rpc(patientAUser, 'log_patient_activity', [patientA, 'Caminata', 30, 'suave', 'Patio', null, null, null]) as PatientExerciseView;
    expect(logged.activities[0].activity).toBe('Caminata');
    expect(logged.activities[0].duration_minutes).toBe(30);
    expect(JSON.stringify(logged)).not.toMatch(/kcal|calorías/i);

    await expect(rpc(nutriB, 'get_patient_exercise', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'get_patient_exercise', [patientA])).rejects.toMatchObject({ code: '42501' });
    const other = await rpc(patientBUser, 'get_patient_exercise', [patientB]) as PatientExerciseView;
    expect(other.activities).toEqual([]);
    expect(other.assignments).toEqual([]);

    const assignmentId = assigned.assignments[0].id;
    const feedback = await rpc(patientAUser, 'save_routine_feedback', [patientA, assignmentId, 1, 1, 'Ok']) as PatientExerciseView;
    expect(feedback.assignments[0].feedback?.note).toBe('Ok');
  });

  it('sin RPC falla cerrado', async () => {
    await db.exec('drop function public.get_patient_exercise(uuid)');
    await expect(rpc(patientAUser, 'get_patient_exercise', [patientA])).rejects.toMatchObject({ code: '42883' });
  });
});
