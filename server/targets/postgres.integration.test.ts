import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { calculateTarget, defaultsForGoal, type TargetInput } from '../../src/lib/nutrition-target.js';

let db: PGlite;
let ownerId: string;
const owner = '00000000-0000-4000-a000-000000000091';
const outsider = '00000000-0000-4000-a000-000000000092';
const patientUser = '00000000-0000-4000-a000-000000000093';
const otherPatientUser = '00000000-0000-4000-a000-000000000094';
const patient = '10000000-0000-4000-a000-000000000091';
const otherPatient = '10000000-0000-4000-a000-000000000092';
const inputs: TargetInput = { sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera', ...defaultsForGoal('bajar') };
const body = { sex: 'femenino', birth_date: '1990-05-10', height_cm: 165, weight_kg: 65 };
const tables = ['nutrition_targets', 'patient_body_data', 'patient_body_data_requests'] as const;

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
async function rpc<T = Record<string, unknown>>(user: string, name: string, args: unknown[] = []) {
  return (await asUser<{ result: T }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args))[0].result;
}
async function seedHealth() {
  await rpc(patientUser, 'save_my_body_data', [body]);
  await rpc(owner, 'request_body_data', [patient]);
  await rpc(owner, 'save_nutrition_target', [patient, inputs, calculateTarget(inputs), true]);
}
async function assertClosed() {
  const before = await db.query('select result, updated_at from public.nutrition_targets where patient_id=$1', [patient]);
  await expect(rpc(patientUser, 'save_my_body_data', [{ ...body, weight_kg: 70 }])).rejects.toMatchObject({ code: '42501' });
  await expect(rpc(owner, 'request_body_data', [patient])).rejects.toMatchObject({ code: '42501' });
  await expect(rpc(owner, 'save_nutrition_target', [patient, inputs, calculateTarget(inputs), true])).rejects.toMatchObject({ code: '42501' });
  for (const user of [owner, patientUser]) {
    for (const table of tables) expect(await asUser(user, `select patient_id from public.${table} where patient_id=$1`, [patient])).toEqual([]);
  }
  expect((await db.query('select result, updated_at from public.nutrition_targets where patient_id=$1', [patient])).rows).toEqual(before.rows);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  for (const [id, email] of [[owner, 'owner@example.test'], [outsider, 'outsider@example.test'], [patientUser, 'patient@example.test'], [otherPatientUser, 'other-patient@example.test']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  ownerId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutricionista ficticia') as id", [owner])).rows[0].id;
  const otherOwnerId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Otra ficticia') as id", [outsider])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente ficticia','waived'),($4,$5,$6,'Otra ficticia','waived')", [patient, ownerId, patientUser, otherPatient, otherOwnerId, otherPatientUser]);
}, 60000);
beforeEach(async () => {
  await db.exec('delete from public.privacy_export_packages; delete from public.privacy_requests; delete from public.patient_body_data_requests; delete from public.patient_body_data; delete from public.nutrition_targets; update public.patients set deactivated_at=null,anonymized_at=null,deletion_requested_at=null;');
});
afterAll(async () => { await db?.close(); });

describe('metas y datos corporales por acceso directo a PostgreSQL', () => {
  it('guarda datos propios y mantiene el borrador oculto a la paciente', async () => {
    await rpc(patientUser, 'save_my_body_data', [body]);
    const draft = await rpc(owner, 'save_nutrition_target', [patient, inputs, calculateTarget(inputs), false]);
    expect(draft.result).toEqual(calculateTarget(inputs));
    expect(await asUser(patientUser, 'select result from public.nutrition_targets')).toEqual([]);
    await rpc(owner, 'save_nutrition_target', [patient, inputs, calculateTarget(inputs), true]);
    expect(await asUser(patientUser, 'select result from public.nutrition_targets')).toEqual([{ result: calculateTarget(inputs) }]);
    expect(await asUser(otherPatientUser, 'select result from public.nutrition_targets')).toEqual([]);
    expect(await asUser(outsider, 'select weight_kg from public.patient_body_data')).toEqual([]);
  });

  it('bloquea escrituras y lecturas después de pedir y completar el borrado', async () => {
    await seedHealth();
    const request = await rpc<{ id: string }>(patientUser, 'request_privacy_action', [{ patient_id: patient, kind: 'delete' }]);
    await assertClosed();
    await rpc(patientUser, 'complete_privacy_delete', [request.id]);
    await assertClosed();
    expect(await rpc(patientUser, 'list_privacy_requests', [patient])).toEqual(expect.arrayContaining([expect.objectContaining({ id: request.id, status: 'completed' })]));
  });

  it('bloquea escrituras y lecturas después de anonimizar, aunque se conserve el vínculo', async () => {
    await seedHealth();
    await db.query('update public.patients set anonymized_at=clock_timestamp() where id=$1', [patient]);
    await assertClosed();
  });

  it('cada rol hace solo lo suyo y una sesión sin identidad no puede guardar', async () => {
    for (const user of [patientUser, otherPatientUser, outsider, '']) {
      await expect(rpc(user, 'save_nutrition_target', [patient, inputs, calculateTarget(inputs), true])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'request_body_data', [patient])).rejects.toMatchObject({ code: '42501' });
    }
    for (const user of [owner, outsider, '']) await expect(rpc(user, 'save_my_body_data', [body])).rejects.toMatchObject({ code: '42501' });
    await rpc(otherPatientUser, 'save_my_body_data', [body]);
    expect((await db.query('select patient_id from public.patient_body_data')).rows).toEqual([{ patient_id: otherPatient }]);
  });

  it('rechaza resultados vacíos, nulos y números enviados como texto', async () => {
    for (const result of [{}, { kcal: null }, { ...calculateTarget(inputs), kcal: '1800' }, { ...calculateTarget(inputs), warnings: null }]) {
      await expect(rpc(owner, 'save_nutrition_target', [patient, inputs, result, true])).rejects.toMatchObject({ code: '22023' });
    }
    expect((await db.query('select count(*)::int as n from public.nutrition_targets')).rows[0]).toEqual({ n: 0 });
  });

  it('recalcula las cifras en la base aunque se envíe un resultado manipulado', async () => {
    const stored = await rpc(owner, 'save_nutrition_target', [patient, inputs, { ...calculateTarget(inputs), kcal: 5000, protein_g: 999, warnings: ['ficticia'] }, true]);
    expect(stored.result).toEqual(calculateTarget(inputs));
  });

  it('rechaza entradas fuera de rango, incompletas, con claves extra o de tipos incorrectos', async () => {
    for (const input of [{}, null, { ...inputs, age: 14 }, { ...inputs, age: 30.5 }, { ...inputs, weight_kg: '65' }, { ...inputs, weight_kg: null }, { ...inputs, activity: 'falsa' }, { ...inputs, extra: 1 }]) {
      await expect(rpc(owner, 'save_nutrition_target', [patient, input, calculateTarget(inputs), true])).rejects.toMatchObject({ code: '22023' });
    }
  });

  it('rechaza fechas inválidas, edades fuera de rango y formatos corporales no válidos', async () => {
    for (const data of [{ ...body, birth_date: '2030-01-01' }, { ...body, birth_date: '1990-02-31' }, { ...body, birth_date: '2026-01-01' }, { ...body, birth_date: '1900-01-01' }, { ...body, weight_kg: '65' }, { ...body, sex: null }, { ...body, extra: true }]) {
      await expect(rpc(patientUser, 'save_my_body_data', [data])).rejects.toMatchObject({ code: '22023' });
    }
    expect((await db.query('select count(*)::int as n from public.patient_body_data')).rows[0]).toEqual({ n: 0 });
  });

  it('coincide con el cálculo de la API para ambos sexos, actividad, ajustes y avisos', async () => {
    const variants: TargetInput[] = [inputs, { ...inputs, sex: 'masculino' }, { ...inputs, age: 16 }, { ...inputs, age: 100, height_cm: 120, weight_kg: 30, adjust_pct: -30 }, { ...inputs, weight_kg: 300, activity: 'sedentaria', protein_g_per_kg: 3, adjust_pct: -30 }, { ...inputs, weight_kg: 65.5, height_cm: 165.8, protein_g_per_kg: 1.45 }];
    for (const activity of ['sedentaria', 'ligera', 'moderada', 'intensa', 'muy_intensa'] as const) variants.push({ ...inputs, activity });
    for (const goal of ['bajar', 'mantener', 'subir'] as const) variants.push({ ...inputs, ...defaultsForGoal(goal) });
    for (const input of variants) expect((await rpc(owner, 'save_nutrition_target', [patient, input, calculateTarget(input), true])).result).toEqual(calculateTarget(input));
  });

  it('el cálculo interno no es público y las tablas no admiten escritura directa', async () => {
    await expect(asUser(owner, 'select public.calculate_nutrition_target($1)', [inputs])).rejects.toMatchObject({ code: '42501' });
    for (const table of tables) {
      for (const role of ['anon', 'authenticated']) {
        expect((await db.query('select has_table_privilege($1,$2,\'insert\') as ins,has_table_privilege($1,$2,\'update\') as upd,has_table_privilege($1,$2,\'delete\') as del', [role, `public.${table}`])).rows[0]).toEqual({ ins: false, upd: false, del: false });
      }
      await expect(asUser(owner, `delete from public.${table} where patient_id=$1`, [patient])).rejects.toMatchObject({ code: '42501' });
    }
    expect(await asUser<{ result: boolean }>(outsider, 'select private.nutrition_patient_is_active($1) as result', [patient])).toEqual([{ result: false }]);
    expect(await asUser<{ result: boolean }>(patientUser, 'select private.nutrition_patient_is_active($1) as result', [patient])).toEqual([{ result: true }]);
  });
});
