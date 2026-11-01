import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// La lista GET /api/patients/:id/consultations lee consultation_sessions con la
// sesión de la profesional. Esa lectura devolvía 42501 aunque los tres
// consentimientos estuvieran dados y el procesamiento (service_role) siguiera.

const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientUser = '00000000-0000-4000-a000-0000000000a2';
const patient = '10000000-0000-4000-a000-0000000000a1';
const sessionId = '20000000-0000-4000-a000-0000000000a1';
const taskId = '30000000-0000-4000-a000-0000000000a1';

let db: PGlite;

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
  for (const [id, email] of [[nutriA, 'a@example.test'], [nutriB, 'b@example.test'], [patientUser, 'pa@example.test']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  await db.query("select public.provision_nutritionist($1,'Nutri B')", [nutriB]);
  await db.query(
    "insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente A','waived')",
    [patient, nutriAId, patientUser],
  );
  await db.query(
    `insert into public.consent_events(patient_id,purpose,text_version,text_hash,decision,actor_id)
     select $1,purpose,text_version,text_hash,'granted',$2 from public.consent_catalog
     where purpose in ('care_relationship','consultation_recording','ai_consultation')`,
    [patient, patientUser],
  );
  await db.query(
    `insert into public.consultation_sessions(id,patient_id,nutritionist_id,requested_by,source,status,transcript)
     values ($1,$2,$3,$4,'capture','finished','Transcripción ficticia en curso')`,
    [sessionId, patient, nutriAId, nutriA],
  );
  await db.query(
    `insert into public.consultation_tasks(id,session_id,patient_id,nutritionist_id,requested_by,kind,revision,status,consent_version)
     values ($1,$2,$3,$4,$5,'summary',1,'running','ai_consultation.v1')`,
    [taskId, sessionId, patient, nutriAId, nutriA],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
});

describe('lista de consultas de la profesional', () => {
  it('con los tres consentimientos lee la consulta y la tarea en proceso', async () => {
    const granted = await db.query<{ purpose: string }>(
      `select purpose from public.consent_events where patient_id=$1 and decision='granted' order by purpose`,
      [patient],
    );
    expect(granted.rows.map((row) => row.purpose)).toEqual(['ai_consultation', 'care_relationship', 'consultation_recording']);

    const sessions = await asUser<{ id: string }>(nutriA, 'select id from public.consultation_sessions where patient_id=$1', [patient]);
    expect(sessions.map((row) => row.id)).toEqual([sessionId]);

    const tasks = await asUser<{ tasks: Array<{ id: string; status: string }> }>(nutriA, 'select public.consultation_list_tasks($1) as tasks', [patient]);
    expect(tasks[0].tasks).toEqual([expect.objectContaining({ id: taskId, status: 'running' })]);
  });

  it('otra profesional y la paciente no ven la nota privada', async () => {
    expect(await asUser(nutriB, 'select id from public.consultation_sessions where patient_id=$1', [patient])).toEqual([]);
    expect(await asUser(patientUser, 'select id from public.consultation_sessions where patient_id=$1', [patient])).toEqual([]);
    await expect(asUser(nutriB, 'select public.consultation_list_tasks($1)', [patient])).rejects.toMatchObject({ code: '42501' });
  });

  it('el helper interno de cuidado sigue cerrado para la sesión', async () => {
    await expect(asUser(nutriA, 'select public.can_care_for_patient($1)', [patient])).rejects.toMatchObject({ code: '42501' });
    const visible = await db.query<{ anon: boolean; user: boolean }>(
      `select has_function_privilege('anon','public.consultation_session_visible(uuid)','execute') as anon,
              has_function_privilege('authenticated','public.consultation_session_visible(uuid)','execute') as user`,
    );
    expect(visible.rows[0]).toEqual({ anon: false, user: true });
  });
});
