import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientUser = '00000000-0000-4000-a000-0000000000a2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
let db: PGlite;
let nutriAId = '';
let nutriBId = '';

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
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    "insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente A','waived')",
    [patientA, nutriAId, patientUser],
  );
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe('suscripciones en la base', () => {
  it('un mismo cobro entra una sola vez, también después de anularlo', async () => {
    const plan = (await db.query<{ id: string }>(
      `insert into public.patient_subscription_plans (nutritionist_id, name, amount_cents)
       values ($1, 'Seguimiento mensual', 5400000) returning id`,
      [nutriAId],
    )).rows[0].id;
    const sub = (await db.query<{ id: string }>(
      `insert into public.patient_subscriptions
         (nutritionist_id, plan_id, patient_id, provider_account_id, payer_email, source, amount_cents, status)
       values ($1, $2, $3, 'cuenta-a', 'lola@correo.com', 'panel', 5400000, 'authorized') returning id`,
      [nutriAId, plan, patientA],
    )).rows[0].id;
    const payment = {
      text: `insert into public.patient_payments
        (patient_id, nutritionist_id, amount, paid_on, method, note, status, created_by, source, provider, provider_payment_id)
        values ($1, $2, 54000, current_date, 'mercado_pago', 'Débito automático', 'confirmed', $3, 'subscription', 'mercado_pago', '88')`,
      params: [patientA, nutriAId, nutriA],
    };
    await db.query(payment.text, payment.params);
    await expect(db.query(payment.text, payment.params)).rejects.toMatchObject({ code: '23505' });
    await db.query("update public.patient_payments set status = 'voided', note = 'Anulado por devolución' where provider_payment_id = '88'");
    await expect(db.query(payment.text, payment.params)).rejects.toMatchObject({ code: '23505' });
    const rows = (await db.query<{ n: number; note: string; source: string }>(
      "select count(*)::int as n, max(note) as note, max(source) as source from public.patient_payments where provider_payment_id = '88'",
    )).rows[0];
    expect(rows).toEqual({ n: 1, note: 'Anulado por devolución', source: 'subscription' });
    const ledger = (await asUser<{ source: string }>(
      nutriA,
      "select public.get_patient_ledger($1) -> 'payments' -> 0 ->> 'source' as source",
      [patientA],
    ))[0];
    expect(ledger.source).toBe('subscription');
    expect(sub).toBeTruthy();
  });

  it('una firma rechazada no tapa el aviso válido, y el válido no se duplica', async () => {
    const insert = `insert into public.patient_subscription_events
      (topic, resource_id, provider_notification_id, signature_valid, status)
      values ('payment', 'AbC-12', 'aviso-1', $1, $2)`;
    await db.query(insert, [false, 'ignored']);
    await db.query(insert, [true, 'queued']);
    await expect(db.query(insert, [true, 'queued'])).rejects.toMatchObject({ code: '23505' });
    const rows = (await db.query<{ n: number; queued: number }>(
      `select count(*)::int as n, count(*) filter (where status = 'queued')::int as queued
       from public.patient_subscription_events where provider_notification_id = 'aviso-1'`,
    )).rows[0];
    expect(rows).toEqual({ n: 2, queued: 1 });
  });

  it('cada consultorio ve solo lo suyo, y la paciente no lee los avisos crudos', async () => {
    const own = await asUser(nutriA, 'select id from public.patient_subscription_plans');
    const other = await asUser(nutriB, 'select id from public.patient_subscription_plans');
    expect(own.length).toBeGreaterThan(0);
    expect(other).toEqual([]);
    await expect(asUser(nutriA, `insert into public.patient_subscriptions
      (nutritionist_id, plan_id, provider_account_id, payer_email, source, amount_cents)
      select $1, id, 'cuenta', 'a@b.co', 'panel', 5400000 from public.patient_subscription_plans limit 1`, [nutriAId])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientUser, 'select id from public.patient_subscription_events')).rejects.toMatchObject({ code: '42501' });
    const mine = await asUser<{ row: { payer_email?: string; provider_preapproval_id?: string; plan_name: string }[] }>(
      patientUser,
      'select public.get_my_subscriptions() as row',
    );
    const text = JSON.stringify(mine[0].row);
    expect(text).toContain('Seguimiento mensual');
    expect(text).not.toContain('lola@correo.com');
    expect(text).not.toContain('provider_preapproval');
    const closed = await db.query<{ pause: boolean; claim: boolean; anon: boolean }>(
      `select has_function_privilege('authenticated', 'public.pause_manual_fee_for_debit(uuid)', 'execute') as pause,
              has_function_privilege('authenticated', 'public.claim_patient_subscription_events(integer)', 'execute') as claim,
              has_function_privilege('anon', 'public.get_my_subscriptions()', 'execute') as anon`,
    );
    expect(closed.rows[0]).toEqual({ pause: false, claim: false, anon: false });
    expect(nutriBId).toBeTruthy();
  });

  it('al activar el débito se apaga la cuota manual y queda el cobro suelto', async () => {
    await db.query(
      'insert into public.patient_fees (patient_id, nutritionist_id, amount, first_due_on) values ($1, $2, 54000, current_date)',
      [patientA, nutriAId],
    );
    await db.query(
      `insert into public.patient_charges (patient_id, nutritionist_id, due_on, amount, kind, concept)
       values ($1, $2, current_date + 20, 8000, 'extra', 'Taller')`,
      [patientA, nutriAId],
    );
    await db.query('select public.pause_manual_fee_for_debit($1)', [patientA]);
    const fee = await db.query('select 1 from public.patient_fees where patient_id = $1', [patientA]);
    const future = await db.query<{ n: number }>(
      "select count(*)::int as n from public.patient_charges where patient_id = $1 and kind = 'fee' and due_on > current_date",
      [patientA],
    );
    const extra = await db.query<{ concept: string }>(
      "select concept from public.patient_charges where patient_id = $1 and kind = 'extra'",
      [patientA],
    );
    expect(fee.rows).toEqual([]);
    expect(future.rows[0].n).toBe(0);
    expect(extra.rows).toEqual([{ concept: 'Taller' }]);
  });
});
