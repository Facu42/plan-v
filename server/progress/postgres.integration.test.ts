import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { progressWindows } from './derive.js';
import type { PatientProgressView } from '../../src/types/progress.js';

let db: PGlite;
let dir: string;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';

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
  dir = await mkdtemp(join(tmpdir(), 'plan-v-progress-'));
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
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
     values ($1,$2,$3,'Paciente A','waived'),($4,$5,$6,'Paciente B','waived')`,
    [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser],
  );
  await rpc(patientAUser, 'save_patient_intake', [patientA, 1, 'allergies', {
    preferred_name: 'Ana',
    allergies: { state: 'none', items: [] },
    restrictions: { state: 'none', items: [] },
  }]);
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-34 progreso en PostgreSQL descartable', () => {
  it('aísla Nutri B/Paciente B y no mezcla unidades ni ranking', async () => {
    const catalog = CONSENT_CATALOG.find((entry) => entry.purpose === 'measurement')!;
    await rpc(patientAUser, 'record_patient_consent', [patientA, catalog.purpose, catalog.text_version, catalog.text_hash, 'granted']);
    const windows = progressWindows(7);
    await rpc(patientAUser, 'save_care_record', [patientA, randomUUID(), windows.current.end, {
      kind: 'weight', value: 64.5, unit: 'kg', source: 'patient', note: '',
    }]);
    await rpc(nutriA, 'save_care_record', [patientA, randomUUID(), windows.previous.end, {
      kind: 'weight', value: 65, unit: 'kg', source: 'professional', note: '',
    }]);
    await rpc(patientAUser, 'save_care_record', [patientA, randomUUID(), windows.current.start, {
      kind: 'weight', value: 140, unit: 'lb', source: 'patient', note: '',
    }]);
    await asUser(patientAUser, `insert into public.meal_logs(id,patient_id,slot_label,status,logged_at)
      values ($1,$2,'Almuerzo','pending_review',$3::timestamptz)`, [
      randomUUID(), patientA, `${windows.current.end}T15:00:00-03:00`,
    ]);
    await asUser(nutriA, `insert into public.meal_logs(id,patient_id,slot_label,status,logged_at)
      values ($1,$2,'Cena','confirmed',$3::timestamptz)`, [
      randomUUID(), patientA, `${windows.previous.end}T20:00:00-03:00`,
    ]);

    const view = await rpc(patientAUser, 'get_patient_progress', [patientA, 7]) as PatientProgressView;
    expect(view.timezone).toBe('America/Argentina/Buenos_Aires');
    expect(view.measurements_included).toBe(true);
    const kg = view.series.find((row) => row.kind === 'weight' && row.unit === 'kg')!;
    const lb = view.series.find((row) => row.kind === 'weight' && row.unit === 'lb')!;
    expect(Number(kg.current[0].value)).toBe(64.5);
    expect(kg.current[0].source).toBe('patient');
    expect(Number(kg.previous[0].value)).toBe(65);
    expect(kg.previous[0].source).toBe('professional');
    expect(lb.previous).toEqual([]);
    expect(Number(view.meals.current.pending)).toBe(1);
    expect(Number(view.meals.previous.reviewed)).toBe(1);
    expect(JSON.stringify(view)).not.toMatch(/mejoró|empeoró|ranking/i);

    await expect(rpc(nutriB, 'get_patient_progress', [patientA, 7])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'get_patient_progress', [patientA, 7])).rejects.toMatchObject({ code: '42501' });
    const other = await rpc(patientBUser, 'get_patient_progress', [patientB, 7]) as PatientProgressView;
    expect(other.series).toEqual([]);
    expect(Number(other.meals.current.logged)).toBe(0);
    await expect(rpc(patientAUser, 'get_patient_progress', [patientA, 14])).rejects.toMatchObject({ code: '22023' });
  });

  it('sin consentimiento omite medidas; sin RPC falla cerrado', async () => {
    const catalog = CONSENT_CATALOG.find((entry) => entry.purpose === 'measurement')!;
    await rpc(patientAUser, 'record_patient_consent', [patientA, catalog.purpose, catalog.text_version, catalog.text_hash, 'withdrawn']);
    const hidden = await rpc(nutriA, 'get_patient_progress', [patientA, 7]) as PatientProgressView;
    expect(hidden.measurements_included).toBe(false);
    expect(hidden.series).toEqual([]);
    expect(Number(hidden.meals.current.pending)).toBeGreaterThanOrEqual(0);
    await db.exec('drop function public.get_patient_progress(uuid, integer)');
    await expect(rpc(patientAUser, 'get_patient_progress', [patientA, 7])).rejects.toMatchObject({ code: '42883' });
  });
});
