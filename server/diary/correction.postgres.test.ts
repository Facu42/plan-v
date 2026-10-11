import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_CATALOG } from '../intake/consent.js';

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
  dir = await mkdtemp(join(tmpdir(), 'plan-v-correct-'));
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
}, 120000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('corrección propia en Postgres descartable', () => {
  it('la paciente corrige o borra su comida pendiente y no la revisada', async () => {
    const saved = await rpc(patientAUser, 'save_meal_log', [{
      patient_id: patientA,
      client_id: '55555555-5555-4555-8555-555555555551',
      slot: 'Almuerzo',
      description: 'Milanesa sola',
      photo_path: null,
    }]) as { log: { id: string } };
    const mealId = saved.log.id;
    const corrected = await rpc(patientAUser, 'correct_own_meal', [{
      patient_id: patientA, meal_id: mealId, slot: 'Cena', description: 'Milanesa con ensalada',
    }]) as { description: string; slot: string; status: string };
    expect(corrected).toMatchObject({ description: 'Milanesa con ensalada', slot: 'Cena', status: 'pending_review' });
    await expect(rpc(patientBUser, 'correct_own_meal', [{
      patient_id: patientA, meal_id: mealId, slot: 'Cena', description: 'Ajena',
    }])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriA, 'correct_own_meal', [{
      patient_id: patientA, meal_id: mealId, slot: 'Cena', description: 'Desde el consultorio',
    }])).rejects.toMatchObject({ code: '42501' });
    await asUser(patientAUser, 'update public.meal_logs set description=$2 where id=$1', [mealId, 'directo']);
    expect(await asUser<{ description: string }>(nutriA, 'select description from public.meal_logs where id=$1', [mealId])).toEqual([{ description: 'Milanesa con ensalada' }]);

    const extra = await rpc(patientAUser, 'save_meal_log', [{
      patient_id: patientA,
      client_id: '55555555-5555-4555-8555-555555555552',
      slot: 'Desayuno',
      description: 'Café',
      photo_path: null,
    }]) as { log: { id: string } };
    expect(await rpc(patientAUser, 'delete_own_meal', [{ patient_id: patientA, meal_id: extra.log.id }])).toMatchObject({ deleted: true });
    expect(await asUser(patientAUser, 'select id from public.get_patient_meal_logs($1) where id=$2', [patientA, extra.log.id])).toEqual([]);

    await rpc(nutriA, 'review_meal_log', [{ meal_id: mealId, status: 'confirmed' }]);
    await expect(rpc(patientAUser, 'correct_own_meal', [{
      patient_id: patientA, meal_id: mealId, slot: 'Almuerzo', description: 'Cambio tardío',
    }])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(patientAUser, 'delete_own_meal', [{ patient_id: patientA, meal_id: mealId }])).rejects.toMatchObject({ code: 'PT409' });
    const clientId = '55555555-5555-4555-8555-555555555553';
    const asked = await rpc(patientAUser, 'request_meal_correction', [{
      patient_id: patientA, meal_id: mealId, note: 'Faltó la ensalada', client_id: clientId,
    }]) as { requested: boolean; duplicate: boolean };
    expect(asked).toEqual({ requested: true, duplicate: false });
    const again = await rpc(patientAUser, 'request_meal_correction', [{
      patient_id: patientA, meal_id: mealId, note: 'Otro texto que no debe duplicar', client_id: clientId,
    }]) as { duplicate: boolean };
    expect(again.duplicate).toBe(true);
    const messages = await asUser<{ body: string }>(nutriA, 'select body from public.messages where patient_id=$1 and body like $2', [patientA, 'Quiero corregir una comida ya revisada%']);
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toMatch(/Quiero corregir una comida ya revisada \(Cena, \d{2}\/\d{2}\/\d{4}\): Faltó la ensalada/);
    const kept = await asUser<{ description: string; status: string }>(nutriA, 'select description, status::text as status from public.meal_logs where id=$1', [mealId]);
    expect(kept).toEqual([{ description: 'Milanesa con ensalada', status: 'confirmed' }]);
    await expect(rpc(patientAUser, 'request_meal_correction', [{
      patient_id: patientB, meal_id: mealId, note: 'Cruce', client_id: '55555555-5555-4555-8555-555555555554',
    }])).rejects.toMatchObject({ code: 'PT404' });
  });

  it('la paciente corrige su medida sin revisar y no la de otro consultorio ni la ya revisada', async () => {
    const consent = CONSENT_CATALOG.find((item) => item.purpose === 'measurement')!;
    await rpc(patientAUser, 'record_patient_consent', [patientA, consent.purpose, consent.text_version, consent.text_hash, 'granted']);
    const recordId = '20000000-0000-4000-a000-0000000000c1';
    await rpc(patientAUser, 'save_care_record', [patientA, recordId, '2026-09-10', { kind: 'weight', value: 64.5, note: '', unit: 'kg', source: 'patient' }]);
    expect(await rpc(patientAUser, 'correct_own_measurement', [{ patient_id: patientA, record_id: recordId, value: 63.2 }])).toMatchObject({ corrected: true, value: 63.2 });
    await expect(rpc(patientBUser, 'correct_own_measurement', [{ patient_id: patientA, record_id: recordId, value: 50 }])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriA, 'delete_own_measurement', [{ patient_id: patientA, record_id: recordId }])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, "update public.care_records set data=jsonb_set(data,'{value}','70') where id=$1", [recordId])).rejects.toMatchObject({ code: '42501' });

    await rpc(nutriA, 'review_care_record', [patientA, recordId]);
    await expect(rpc(patientAUser, 'correct_own_measurement', [{ patient_id: patientA, record_id: recordId, value: 70 }])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(patientAUser, 'delete_own_measurement', [{ patient_id: patientA, record_id: recordId }])).rejects.toMatchObject({ code: 'PT409' });
    const clientId = '55555555-5555-4555-8555-555555555555';
    expect(await rpc(patientAUser, 'request_measurement_correction', [{
      patient_id: patientA, record_id: recordId, note: 'La balanza estaba mal', client_id: clientId,
    }])).toMatchObject({ requested: true, duplicate: false });
    expect(await rpc(patientAUser, 'request_measurement_correction', [{
      patient_id: patientA, record_id: recordId, note: 'La balanza estaba mal', client_id: clientId,
    }])).toMatchObject({ duplicate: true });
    const note = await asUser<{ body: string }>(nutriA, 'select body from public.messages where patient_id=$1 and body like $2', [patientA, 'Quiero corregir una medida ya revisada%']);
    expect(note).toHaveLength(1);
    expect(note[0].body).toContain('Peso, 10/09/2026');
    expect(note[0].body).toContain('La balanza estaba mal');
    const value = await asUser<{ value: string }>(nutriA, "select data->>'value' as value from public.care_records where id=$1", [recordId]);
    expect(Number(value[0].value)).toBe(63.2);

    const professionalId = '20000000-0000-4000-a000-0000000000c2';
    await rpc(nutriA, 'save_care_record', [patientA, professionalId, '2026-09-09', { kind: 'hip', value: 98, note: '', unit: 'cm', source: 'professional' }]);
    await expect(rpc(patientAUser, 'correct_own_measurement', [{ patient_id: patientA, record_id: professionalId, value: 90 }])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'delete_own_measurement', [{ patient_id: patientA, record_id: professionalId }])).rejects.toMatchObject({ code: '42501' });
  });
});
