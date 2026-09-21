import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let db: PGlite;
let dir: string;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';
const clientId = '55555555-5555-4555-8555-555555555555';

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

function savePayload(overrides: Record<string, unknown> = {}) {
  return {
    patient_id: patientA,
    client_id: clientId,
    slot: 'Almuerzo',
    description: 'Milanesa con ensalada',
    photo_path: null,
    ...overrides,
  };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-diary-'));
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
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-22 diario en PostgreSQL descartable', () => {
  it('guarda, no duplica, conserva el registro si el análisis falla y aísla corridas/revisiones', async () => {
    const saved = await rpc(patientAUser, 'save_meal_log', [savePayload()]) as { log: { id: string; analysis_status: string; description: string }; duplicate: boolean };
    expect(saved.duplicate).toBe(false);
    expect(saved.log.analysis_status).toBe('pending');
    expect(saved.log.description).toBe('Milanesa con ensalada');
    expect(saved.log).not.toHaveProperty('client_id');

    const replayed = await rpc(patientAUser, 'save_meal_log', [savePayload({ description: 'otra' })]) as { log: { id: string; description: string }; duplicate: boolean };
    expect(replayed.duplicate).toBe(true);
    expect(replayed.log.id).toBe(saved.log.id);
    expect(replayed.log.description).toBe('Milanesa con ensalada');

    const failed = await rpc(patientAUser, 'record_meal_analysis', [{
      meal_id: saved.log.id,
      status: 'failed',
      foods: [],
      macros: null,
      confidence: 0,
      note_for_nutri: 'La estimación automática no está disponible.',
      error_code: 'AI_UNAVAILABLE',
    }]) as { id: string; analysis_status: string; foods: unknown[]; macros: null; description: string };
    expect(failed).toMatchObject({
      id: saved.log.id,
      analysis_status: 'failed',
      foods: [],
      macros: null,
      description: 'Milanesa con ensalada',
    });

    expect(await asUser(patientAUser, 'select id from public.meal_analysis_runs')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.meal_reviews')).toEqual([]);
    await expect(rpc(patientAUser, 'review_meal_log', [{ meal_id: saved.log.id, status: 'confirmed' }])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'save_meal_log', [savePayload({ client_id: '66666666-6666-4666-8666-666666666666' })])).rejects.toMatchObject({ code: '42501' });

    const reviewed = await rpc(nutriA, 'review_meal_log', [{
      meal_id: saved.log.id,
      status: 'adjusted',
      foods: [{ name: 'milanesa', portion_est: 150, portion_unit: 'g', confidence: 0.9 }],
      macros: { kcal: 420, protein_g: 32, carbs_g: 20, fat_g: 18 },
    }]) as { status: string; foods: Array<{ name: string }> };
    expect(reviewed.status).toBe('adjusted');
    expect(reviewed.foods[0].name).toBe('milanesa');
    expect(await asUser(nutriA, 'select status from public.meal_reviews where meal_log_id=$1', [saved.log.id])).toEqual([{ status: 'adjusted' }]);
    await expect(rpc(nutriB, 'review_meal_log', [{ meal_id: saved.log.id, status: 'confirmed' }])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(nutriB, 'select id from public.meal_analysis_runs')).toEqual([]);
  });

  it('sin RPC de diario el persistente falla cerrado', async () => {
    await db.exec('alter function public.save_meal_log(jsonb) rename to save_meal_log_pv22_hidden');
    try {
      await expect(rpc(patientAUser, 'save_meal_log', [savePayload({ client_id: '77777777-7777-4777-8777-777777777777' })])).rejects.toMatchObject({ code: '42883' });
    } finally {
      await db.exec('alter function public.save_meal_log_pv22_hidden(jsonb) rename to save_meal_log');
    }
  });
});
