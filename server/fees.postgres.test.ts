import { productFixtureArgs } from './testing/product-rpc-fixture';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { summarizeLedger } from '../src/fees.js';
import type { BillingBoard, PatientLedger, PatientLedgerView } from '../src/types/fees.js';

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
  dir = await mkdtemp(join(tmpdir(), 'plan-v-fees-'));
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

describe('cobranzas de pacientes (PGlite)', () => {
  it('genera las cuotas vencidas y la próxima, y calcula la deuda', async () => {
    const first = await monthsAgo(2);
    const ledger = await rpc<PatientLedger>(nutriA, 'set_patient_fee', [patientA, 30000, first]);
    expect(ledger.fee).toEqual({ amount: 30000, first_due_on: first, program_name: '' });
    // Dos meses atrás, el mes pasado, este mes y la próxima por vencer.
    expect(ledger.charges.length).toBeGreaterThanOrEqual(3);
    expect(ledger.charges.filter((charge) => charge.due_on <= first)).toHaveLength(1);
    const summary = summarizeLedger(ledger, await today());
    expect(summary.state).toBe('debe');
    expect(summary.debt_since).toBe(first);
    expect(summary.next_due?.amount).toBe(30000);
  });

  it('la nutricionista registra un pago y la deuda baja', async () => {
    const ledger = await rpc<PatientLedger>(nutriA, 'record_patient_payment', [patientA, 30000, await today(), 'transferencia', 'Septiembre']);
    expect(ledger.payments[0]).toMatchObject({ amount: 30000, status: 'confirmed', reported_by_patient: false });
    const before = summarizeLedger({ ...ledger, payments: [] }, await today());
    const after = summarizeLedger(ledger, await today());
    expect(after.owed).toBe(before.owed - 30000);
    const events = await db.query<{ title: string }>("select title from public.timeline_events where patient_id=$1 and kind='billing'", [patientA]);
    expect(events.rows.map((row) => row.title)).toContain('Pago registrado');
  });

  it('la paciente ve su cuenta y los datos de pago, avisa que pagó y la nutricionista confirma', async () => {
    await rpc(nutriA, 'set_payment_settings', [25000, 'nutri.a.mp', 'https://mpago.la/abc', 'Pagá antes del 10.']);
    const view = await rpc<PatientLedgerView>(patientAUser, 'get_patient_ledger', [patientA]);
    expect(view.payment_info).toEqual({ nutritionist_name: 'Nutri A', alias: 'nutri.a.mp', payment_link: 'https://mpago.la/abc', instructions: 'Pagá antes del 10.' });

    // Con el acceso pendiente, igual puede avisar el pago.
    const reported = await rpc<PatientLedgerView>(patientAUser, 'report_patient_payment', [patientA, 30000, await today(), 'mercado_pago', '']);
    const report = reported.payments.find((payment) => payment.status === 'reported')!;
    expect(report).toMatchObject({ reported_by_patient: true, amount: 30000 });
    expect(summarizeLedger(reported, await today()).pending_reports).toBe(1);

    const confirmed = await rpc<PatientLedger>(nutriA, 'review_patient_payment', [report.id, 'confirm']);
    expect(confirmed.payments.find((payment) => payment.id === report.id)?.status).toBe('confirmed');
    await expect(rpc(nutriA, 'review_patient_payment', [report.id, 'confirm'])).rejects.toMatchObject({ code: '22023' });

    const voided = await rpc<PatientLedger>(nutriA, 'review_patient_payment', [report.id, 'void']);
    expect(voided.payments.find((payment) => payment.id === report.id)?.status).toBe('voided');
  });

  it('cambiar la cuota no reescribe las cuotas ya vencidas', async () => {
    const before = await rpc<PatientLedger>(nutriA, 'get_patient_ledger', [patientA]);
    const past = before.charges.filter((charge) => charge.due_on <= (before.charges[before.charges.length - 2]?.due_on ?? ''));
    const after = await rpc<PatientLedger>(nutriA, 'set_patient_fee', [patientA, 35000, before.fee!.first_due_on]);
    for (const charge of past) {
      expect(after.charges.find((row) => row.id === charge.id)?.amount).toBe(30000);
    }
    const upcoming = after.charges.filter((charge) => charge.due_on > (past[past.length - 1]?.due_on ?? ''));
    expect(upcoming.every((charge) => charge.amount === 35000)).toBe(true);
    expect(new Set(after.charges.map((charge) => charge.due_on)).size).toBe(after.charges.length);
  });

  it('perdonar una cuota la saca de la deuda', async () => {
    const ledger = await rpc<PatientLedger>(nutriA, 'get_patient_ledger', [patientA]);
    const oldest = ledger.charges[0];
    const waived = await rpc<PatientLedger>(nutriA, 'set_patient_charge_waived', [oldest.id, true]);
    expect(waived.charges[0].status).toBe('waived');
    expect(summarizeLedger(waived, await today()).owed).toBeLessThan(summarizeLedger(ledger, await today()).owed);
  });

  it('el tablero trae a sus pacientes con la cuota y la configuración', async () => {
    const board = await rpc<BillingBoard>(nutriA, 'get_billing_board');
    expect(board.settings).toEqual({ default_fee: 25000, alias: 'nutri.a.mp', payment_link: 'https://mpago.la/abc', instructions: 'Pagá antes del 10.' });
    expect(board.patients.map((patient) => patient.full_name)).toEqual(['Paciente A']);
    expect(board.patients[0].charges.length).toBeGreaterThan(0);
  });

  it('nadie ajeno lee ni escribe la cuenta', async () => {
    await expect(rpc(nutriB, 'get_patient_ledger', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'get_patient_ledger', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'record_patient_payment', [patientA, 100, await today(), 'efectivo', ''])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'report_patient_payment', [patientA, 100, await today(), 'efectivo', ''])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'record_patient_payment', [patientA, 100, await today(), 'efectivo', ''])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'set_patient_fee', [patientA, 1, await today()])).rejects.toMatchObject({ code: '42501' });
    const payment = (await asUser<{ id: string }>(nutriA, 'select id from public.patient_payments limit 1'))[0];
    await expect(rpc(nutriB, 'review_patient_payment', [payment.id, 'void'])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'get_billing_board')).rejects.toMatchObject({ code: '42501' });

    expect(await asUser(nutriB, 'select id from public.patient_payments')).toEqual([]);
    expect(await asUser(patientBUser, 'select id from public.patient_charges')).toEqual([]);
    expect((await asUser(patientAUser, 'select id from public.patient_charges')).length).toBeGreaterThan(0);
    expect(await asUser(patientAUser, 'select * from public.nutritionist_payment_settings')).toEqual([]);
    await expect(asUser(nutriA, "update public.patient_payments set amount=1")).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, `insert into public.patient_fees(patient_id,nutritionist_id,amount,first_due_on) values('${patientA}','${nutriAId}',1,current_date)`)).rejects.toMatchObject({ code: '42501' });
  });

  it('rechaza datos inválidos', async () => {
    await expect(rpc(nutriA, 'record_patient_payment', [patientA, 0, await today(), 'efectivo', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriA, 'record_patient_payment', [patientA, 100, await today(), 'bitcoin', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriA, 'record_patient_payment', [patientA, 100, await shift(10), 'efectivo', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriA, 'set_payment_settings', [null, '', 'http://inseguro.test', ''])).rejects.toMatchObject({ code: '22023' });
    for (let i = 0; i < 5; i += 1) await rpc(patientAUser, 'report_patient_payment', [patientA, 100, await today(), 'efectivo', '']);
    await expect(rpc(patientAUser, 'report_patient_payment', [patientA, 100, await today(), 'efectivo', ''])).rejects.toMatchObject({ code: '22023' });
  });

  it('quitar la cuota corta las próximas pero deja lo vencido', async () => {
    const ledger = await rpc<PatientLedger>(nutriA, 'set_patient_fee', [patientA, null, null]);
    expect(ledger.fee).toBeNull();
    const now = await today();
    expect(ledger.charges.every((charge) => charge.due_on <= now)).toBe(true);
    expect(ledger.charges.length).toBeGreaterThan(0);
  });
});
