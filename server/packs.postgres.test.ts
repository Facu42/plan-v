import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PatientPack } from '../src/types/packs.js';
import type { PatientLedger } from '../src/types/fees.js';

// Paquetes de consultas contra las migraciones reales (JWT shim, sin Auth live).
let db: PGlite;
let dir: string;
let nutriAId = '';

const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000a2';
const patientAUser = '00000000-0000-4000-a000-0000000000a3';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000a2';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
async function rpc<T = unknown>(user: string, name: string, args: unknown[] = []) {
  const rows = await asUser<{ result: T }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args);
  return rows[0].result;
}
async function shift(days: number): Promise<string> {
  return (await db.query<{ d: string }>(`select to_char(current_date + $1::int, 'YYYY-MM-DD') as d`, [days])).rows[0].d;
}
async function appointment(patient: string, nutritionist: string, daysAgo: number): Promise<string> {
  return (await db.query<{ id: string }>(
    `insert into public.appointments(nutritionist_id,patient_id,starts_at,channel,status) values ($1,$2,now() - make_interval(days => $3::int),'presencial','done') returning id`,
    [nutritionist, patient, daysAgo],
  )).rows[0].id;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-packs-'));
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
  `);
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  for (const [id, email] of [[nutriA, 'pa@example.test'], [nutriB, 'pb@example.test'], [patientAUser, 'pc@example.test']] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(`insert into public.patients(id,nutritionist_id,user_id,full_name) values ($1,$2,$3,'Paciente A')`, [patientA, nutriAId, patientAUser]);
  await db.query(`insert into public.patients(id,nutritionist_id,full_name) values ($1,$2,'Paciente B')`, [patientB, nutriBId]);
}, 60000);
afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('paquetes de consultas (PGlite)', () => {
  it('vender un paquete con cobro lo deja en Cobranzas como cobro suelto', async () => {
    const packs = await rpc<PatientPack[]>(nutriA, 'sell_patient_pack', [patientA, 'Paquete de 3 seguimientos', 3, 81000, await shift(0), 90, true]);
    expect(packs).toHaveLength(1);
    expect(packs[0]).toMatchObject({ name: 'Paquete de 3 seguimientos', sessions: 3, amount: 81000, expires_on: await shift(90), uses: [] });
    expect(packs[0].charge_id).toBeTruthy();
    const ledger = await rpc<PatientLedger>(nutriA, 'get_patient_ledger', [patientA]);
    expect(ledger.charges).toEqual([expect.objectContaining({ amount: 81000, kind: 'extra', concept: 'Paquete: Paquete de 3 seguimientos' })]);
  });

  it('descuenta a mano, no pasa del total y deshacer devuelve la consulta', async () => {
    let packs = await rpc<PatientPack[]>(nutriA, 'use_patient_pack', [patientA, null, await shift(0), 'Primera del paquete']);
    expect(packs[0].uses).toHaveLength(1);
    packs = await rpc<PatientPack[]>(nutriA, 'use_patient_pack', [patientA, packs[0].id, await shift(0), '']);
    packs = await rpc<PatientPack[]>(nutriA, 'use_patient_pack', [patientA, null, await shift(0), '']);
    expect(packs[0].uses).toHaveLength(3);
    await expect(rpc(nutriA, 'use_patient_pack', [patientA, null, await shift(0), ''])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(nutriA, 'use_patient_pack', [patientA, packs[0].id, await shift(0), ''])).rejects.toMatchObject({ code: 'PT409' });
    packs = await rpc<PatientPack[]>(nutriA, 'void_patient_pack_use', [packs[0].uses[2].id]);
    expect(packs[0].uses).toHaveLength(2);
    const kept = await db.query<{ n: number }>('select count(*)::int as n from public.patient_pack_uses where voided_at is not null');
    expect(kept.rows[0].n).toBe(1);
  });

  it('marcar una consulta realizada descuenta una sola vez y desmarcarla la devuelve', async () => {
    const a = await appointment(patientA, nutriAId, 1);
    let packs = await rpc<PatientPack[]>(nutriA, 'pack_sync_appointment', [patientA, a, true]);
    expect(packs[0].uses).toHaveLength(3);
    expect(packs[0].uses.some((use) => use.appointment_id === a)).toBe(true);
    packs = await rpc<PatientPack[]>(nutriA, 'pack_sync_appointment', [patientA, a, true]);
    expect(packs[0].uses).toHaveLength(3);
    packs = await rpc<PatientPack[]>(nutriA, 'pack_sync_appointment', [patientA, a, false]);
    expect(packs[0].uses).toHaveLength(2);
  });

  it('sin paquete con lugar, la consulta realizada no falla ni descuenta', async () => {
    const [pack] = await rpc<PatientPack[]>(nutriA, 'get_patient_packs', [patientA]);
    await rpc(nutriA, 'close_patient_pack', [pack.id]);
    const a = await appointment(patientA, nutriAId, 2);
    const packs = await rpc<PatientPack[]>(nutriA, 'pack_sync_appointment', [patientA, a, true]);
    expect(packs[0].closed_at).toBeTruthy();
    expect(packs[0].uses).toHaveLength(2);
    await expect(rpc(nutriA, 'use_patient_pack', [patientA, pack.id, await shift(0), ''])).rejects.toMatchObject({ code: 'PT409' });
  });

  it('un paquete vencido no descuenta y el siguiente toma la consulta', async () => {
    await rpc(nutriA, 'sell_patient_pack', [patientA, 'Viejo', 2, 0, await shift(-40), 30, false]);
    const packs = await rpc<PatientPack[]>(nutriA, 'sell_patient_pack', [patientA, 'Nuevo', 2, 50000, await shift(0), null, false]);
    const nuevo = packs.find((p) => p.name === 'Nuevo')!;
    expect(nuevo.expires_on).toBeNull();
    const after = await rpc<PatientPack[]>(nutriA, 'use_patient_pack', [patientA, null, await shift(0), '']);
    expect(after.find((p) => p.name === 'Nuevo')!.uses).toHaveLength(1);
    expect(after.find((p) => p.name === 'Viejo')!.uses).toHaveLength(0);
  });

  it('rechaza datos inválidos', async () => {
    const bad: unknown[][] = [
      [patientA, '', 3, 1000, await shift(0), null, false],
      [patientA, 'x', 0, 1000, await shift(0), null, false],
      [patientA, 'x', 51, 1000, await shift(0), null, false],
      [patientA, 'x', 3, 0, await shift(0), null, true],
      [patientA, 'x', 3, 1000, await shift(400), null, false],
      [patientA, 'x', 3, 1000, await shift(0), 0, false],
    ];
    for (const args of bad) await expect(rpc(nutriA, 'sell_patient_pack', args)).rejects.toMatchObject({ code: '22023' });
  });

  it('otra nutricionista y la paciente no pueden ver ni tocar los paquetes', async () => {
    await expect(rpc(nutriB, 'get_patient_packs', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'sell_patient_pack', [patientA, 'x', 3, 1000, await shift(0), null, false])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'use_patient_pack', [patientA, null, await shift(0), ''])).rejects.toMatchObject({ code: '42501' });
    const [pack] = await rpc<PatientPack[]>(nutriA, 'get_patient_packs', [patientA]);
    await expect(rpc(nutriB, 'close_patient_pack', [pack.id])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(nutriB, 'select id from public.patient_packs')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.patient_packs')).toEqual([]);
    await expect(asUser(nutriA, "insert into public.patient_packs(patient_id,nutritionist_id,name,sessions,amount,starts_on) values ($1,$2,'x',1,0,current_date)", [patientA, nutriAId])).rejects.toBeTruthy();
    await expect(rpc(nutriA, 'pack_open_for', [patientA, await shift(0)])).rejects.toBeTruthy();
  });

  it('la cuenta de otra paciente queda sin paquetes', async () => {
    expect(await rpc(nutriB, 'get_patient_packs', [patientB])).toEqual([]);
  });
});
