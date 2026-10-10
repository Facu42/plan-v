import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
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
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

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
const consent = (decision: 'granted' | 'withdrawn') => {
  const catalog = CONSENT_CATALOG.find((entry) => entry.purpose === 'measurement')!;
  return rpc(patientAUser, 'record_patient_consent', [patientA, catalog.purpose, catalog.text_version, catalog.text_hash, decision]);
};
const item = (kind: string, value: number, id = randomUUID()) => ({ id, kind, value });

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-body-metrics-'));
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
  for (const [id, email] of [[nutriA, 'nutri-a@example.test'], [nutriB, 'nutri-b@example.test'], [patientAUser, 'paciente-a@example.test'], [patientBUser, 'paciente-b@example.test']] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
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

describe('mediciones del cuerpo en PostgreSQL descartable', () => {
  it('sin permiso de medidas no guarda nada', async () => {
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [item('body_fat_pct', 27.5)]])).rejects.toMatchObject({ code: '42501' });
    expect((await db.query('select count(*)::int as n from public.measurements')).rows[0]).toEqual({ n: 0 });
  });

  it('la profesional asignada carga varias métricas con la misma fecha y unidades fijadas por la base', async () => {
    await consent('granted');
    const first = item('body_fat_pct', 27.5);
    const saved = await rpc(nutriA, 'save_body_metrics', [patientA, today, [first, item('thigh', 55.5), item('bmr', 1450), item('metabolic_age', 41)]]) as Array<Record<string, unknown>>;
    expect(saved).toHaveLength(4);
    expect(saved.find((row) => row.kind === 'body_fat_pct')).toMatchObject({ id: first.id, unit: '%', source: 'professional', captured_on: today });
    expect(saved.find((row) => row.kind === 'thigh')).toMatchObject({ unit: 'cm' });
    expect(saved.find((row) => row.kind === 'bmr')).toMatchObject({ unit: 'kcal' });
    expect(saved.find((row) => row.kind === 'metabolic_age')).toMatchObject({ unit: 'años' });
  });

  it('reintentar la misma carga no duplica; el mismo id con otro valor se rechaza', async () => {
    const same = item('chest', 98, randomUUID());
    await rpc(nutriA, 'save_body_metrics', [patientA, today, [same]]);
    await rpc(nutriA, 'save_body_metrics', [patientA, today, [same]]);
    expect((await db.query("select count(*)::int as n from public.measurements where id=$1", [same.id])).rows[0]).toEqual({ n: 1 });
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [{ ...same, value: 99 }]])).rejects.toMatchObject({ code: 'PT409' });
  });

  it('es todo o nada: un valor inválido no deja guardada la primera fila', async () => {
    const good = item('arm', 31);
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [good, item('body_water_pct', 5)]])).rejects.toMatchObject({ code: '23514' });
    expect((await db.query("select count(*)::int as n from public.measurements where id=$1", [good.id])).rows[0]).toEqual({ n: 0 });
  });

  it('rechaza peso, cintura y cadera, métricas repetidas, campos de más, listas vacías y fechas futuras', async () => {
    for (const kind of ['weight', 'waist', 'hip', 'other', 'inventada']) {
      await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [item(kind, 60)]])).rejects.toMatchObject({ code: '22023' });
    }
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [item('arm', 30), item('arm', 31)]])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [{ ...item('arm', 30), unit: 'in' }]])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, []])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, '2999-01-01', [item('arm', 30)]])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, { kind: 'arm' }])).rejects.toMatchObject({ code: '22023' });
  });

  it('exige enteros en nivel, metabolismo basal y edad metabólica', async () => {
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [item('visceral_fat', 7.5)]])).rejects.toMatchObject({ code: '23514' });
  });

  it('otra nutricionista, la paciente y la otra paciente no pueden cargar medidas ajenas', async () => {
    await expect(rpc(nutriB, 'save_body_metrics', [patientA, today, [item('arm', 30)]])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'save_body_metrics', [patientA, today, [item('arm', 30)]])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'save_body_metrics', [patientA, today, [item('arm', 30)]])).rejects.toMatchObject({ code: '42501' });
  });

  it('las filas nuevas las leen la paciente y su profesional, no la otra consultorio, y se cortan al retirar el permiso', async () => {
    const own = await asUser<{ kind: string }>(patientAUser, 'select kind from public.measurements');
    expect(own.map((row) => row.kind)).toContain('body_fat_pct');
    expect((await asUser(nutriA, 'select id from public.measurements')).length).toBeGreaterThan(0);
    expect(await asUser(nutriB, 'select id from public.measurements')).toEqual([]);
    expect(await asUser(patientBUser, 'select id from public.measurements')).toEqual([]);
    await consent('withdrawn');
    expect(await asUser(nutriA, 'select id from public.measurements')).toEqual([]);
    await expect(rpc(nutriA, 'save_body_metrics', [patientA, today, [item('arm', 30)]])).rejects.toMatchObject({ code: '42501' });
    await consent('granted');
  });

  it('la función no es ejecutable por usuarios anónimos y las tablas siguen cerradas a escrituras directas', async () => {
    await expect(db.transaction(async (tx) => {
      await tx.exec('set local role anon');
      await tx.query('select public.save_body_metrics($1,$2,$3::jsonb)', [patientA, today, JSON.stringify([item('arm', 30)])]);
    })).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, "insert into public.measurements(id,patient_id,nutritionist_id,kind,value_numeric,unit,source,captured_on) select gen_random_uuid(), id, nutritionist_id, 'arm', 30, 'cm', 'professional', current_date from public.patients where id=$1", [patientA])).rejects.toBeTruthy();
  });

  it('las filas anteriores de peso, cintura y cadera siguen siendo válidas', async () => {
    await rpc(nutriA, 'save_care_record', [patientA, randomUUID(), today, { kind: 'weight', value: 64.5, unit: 'kg', source: 'professional', note: '' }]);
    await rpc(nutriA, 'save_care_record', [patientA, randomUUID(), today, { kind: 'waist', value: 80, unit: 'cm', source: 'professional', note: '' }]);
    const kinds = (await asUser<{ kind: string }>(nutriA, 'select kind from public.measurements')).map((row) => row.kind);
    expect(kinds).toEqual(expect.arrayContaining(['weight', 'waist']));
  });
});
