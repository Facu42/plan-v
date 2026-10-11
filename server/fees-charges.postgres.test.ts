import { productFixtureArgs } from './testing/product-rpc-fixture';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { summarizeLedger } from '../src/fees.js';
import type { BillingBoard, PatientLedger } from '../src/types/fees.js';

// Cobranzas: cuota, cuotas generadas, pagos y avisos "Ya pagué". JWT shim, sin Auth live.
let db: PGlite;
let dir: string;
let nutriAId = '';

const nutriA = '00000000-0000-4000-a000-0000000000f1';
const nutriB = '00000000-0000-4000-a000-0000000000f2';
const patientAUser = '00000000-0000-4000-a000-0000000000f3';
const patientBUser = '00000000-0000-4000-a000-0000000000f4';
const patientA = '10000000-0000-4000-a000-0000000000f1';
const patientB = '10000000-0000-4000-a000-0000000000f2';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
async function rpc<T = unknown>(user: string, name: string, args: unknown[] = []) {
  args = await productFixtureArgs(db, name, args);
  const rows = await asUser<{ result: T }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args);
  return rows[0].result;
}
async function today(): Promise<string> {
  return (await db.query<{ d: string }>("select to_char(current_date, 'YYYY-MM-DD') as d")).rows[0].d;
}
async function shift(days: number): Promise<string> {
  return (await db.query<{ d: string }>(`select to_char(current_date + $1::int, 'YYYY-MM-DD') as d`, [days])).rows[0].d;
}
async function monthsAgo(months: number): Promise<string> {
  return (await db.query<{ d: string }>(`select to_char((current_date - make_interval(months => $1::int))::date, 'YYYY-MM-DD') as d`, [months])).rows[0].d;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-charges-'));
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
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente A','pending')`,
    [patientA, nutriAId, patientAUser],
  );
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente B','waived')`,
    [patientB, nutriBId, patientBUser],
  );
}, 60000);
afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('cobros por paciente (PGlite): nuevo cobro y programas', () => {
  it('«Nuevo cobro» agrega un cobro suelto y suma a la deuda', async () => {
    const ledger = await rpc<PatientLedger>(nutriA, 'add_patient_charge', [patientA, 18000, await shift(-1), 'Consulta de control']);
    expect(ledger.charges).toHaveLength(1);
    expect(ledger.charges[0]).toMatchObject({ amount: 18000, kind: 'extra', concept: 'Consulta de control', status: 'open' });
    expect(summarizeLedger(ledger, await today()).owed).toBe(18000);
    const again = await rpc<PatientLedger>(nutriA, 'add_patient_charge', [patientA, 5000, await shift(-1), 'Pesaje']);
    expect(again.charges).toHaveLength(2);
  });

  it('la paciente ve sus cobros sueltos con el concepto', async () => {
    const view = await rpc<PatientLedger>(patientAUser, 'get_patient_ledger', [patientA]);
    expect(view.charges.map((charge) => charge.concept).sort()).toEqual(['Consulta de control', 'Pesaje']);
  });

  it('rechaza cobros inválidos', async () => {
    const bad: unknown[][] = [
      [patientA, 0, await today(), 'x'],
      [patientA, 100, await today(), ''],
      [patientA, 100, await today(), 'x'.repeat(81)],
      [patientA, 100, await shift(5000), 'x'],
      [patientA, 100, null, 'x'],
    ];
    for (const args of bad) await expect(rpc(nutriA, 'add_patient_charge', args)).rejects.toMatchObject({ code: '22023' });
  });

  it('crea programas, actualiza el del mismo nombre y los lista en el tablero', async () => {
    const first = await rpc<Array<{ id: string; name: string; amount: number }>>(nutriA, 'save_billing_program', ['Plan trimestral', 45000]);
    expect(first).toEqual([expect.objectContaining({ name: 'Plan trimestral', amount: 45000 })]);
    const second = await rpc<Array<{ amount: number }>>(nutriA, 'save_billing_program', ['plan TRIMESTRAL', 48000]);
    expect(second).toHaveLength(1);
    expect(second[0].amount).toBe(48000);
    const board = await rpc<BillingBoard>(nutriA, 'get_billing_board');
    expect(board.programs).toHaveLength(1);
  });

  it('asignar un programa fija la cuota y conserva los cobros sueltos', async () => {
    const [program] = await rpc<Array<{ id: string }>>(nutriA, 'save_billing_program', ['Plan trimestral', 48000]);
    await rpc(nutriA, 'add_patient_charge', [patientA, 9000, await shift(10), 'Taller futuro']);
    const ledger = await rpc<PatientLedger>(nutriA, 'assign_patient_program', [patientA, program.id, await today()]);
    expect(ledger.fee).toMatchObject({ amount: 48000, program_name: 'Plan trimestral' });
    expect(ledger.charges.some((charge) => charge.concept === 'Taller futuro')).toBe(true);
    expect(ledger.charges.filter((charge) => charge.kind === 'fee').length).toBeGreaterThan(0);
    // Cambiar la cuota a mano también respeta los cobros sueltos y limpia el nombre del programa.
    const manual = await rpc<PatientLedger>(nutriA, 'set_patient_fee', [patientA, 30000, await today()]);
    expect(manual.fee?.program_name ?? '').toBe('');
    expect(manual.charges.some((charge) => charge.concept === 'Taller futuro')).toBe(true);
  });

  it('borrar un programa no cambia la cuota de quienes lo tienen', async () => {
    const [program] = await rpc<Array<{ id: string }>>(nutriA, 'save_billing_program', ['Plan trimestral', 48000]);
    await rpc(nutriA, 'assign_patient_program', [patientA, program.id, await today()]);
    const left = await rpc<unknown[]>(nutriA, 'delete_billing_program', [program.id]);
    expect(left).toEqual([]);
    const ledger = await rpc<PatientLedger>(nutriA, 'get_patient_ledger', [patientA]);
    expect(ledger.fee?.amount).toBe(48000);
    const cleared = await rpc<PatientLedger>(nutriA, 'assign_patient_program', [patientA, null, null]);
    expect(cleared.fee).toBeNull();
  });

  it('los permisos: nadie ajeno crea cobros, programas ni asigna', async () => {
    const [program] = await rpc<Array<{ id: string }>>(nutriA, 'save_billing_program', ['Privado A', 1000]);
    await expect(rpc(nutriB, 'add_patient_charge', [patientA, 100, await today(), 'x'])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'add_patient_charge', [patientA, 100, await today(), 'x'])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'save_billing_program', ['Mío', 1])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'assign_patient_program', [patientA, program.id, await today()])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'assign_patient_program', [patientA, program.id, await today()])).rejects.toMatchObject({ code: '42501' });
    // Los programas de A no sirven a B ni se pueden borrar desde B.
    await expect(rpc(nutriB, 'delete_billing_program', [program.id])).rejects.toMatchObject({ code: '42501' });
    const boardB = await rpc<BillingBoard>(nutriB, 'get_billing_board');
    expect(boardB.programs).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.nutritionist_programs')).toEqual([]);
    await expect(asUser(nutriA, "insert into public.nutritionist_programs(nutritionist_id,name,amount) values (gen_random_uuid(),'x',1)")).rejects.toMatchObject({ code: '42501' });
  });
});
