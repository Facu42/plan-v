import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
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
  for (const [id, email] of [[nutriA, 'a@example.test'], [nutriB, 'b@example.test']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
}, 120_000);

afterAll(async () => { await db?.close(); });

describe('cobro de la plataforma', () => {
  it('guarda los tres planes y el cupo de 30 fundadoras con bloqueo', async () => {
    const plans = await db.query<{ code: string; annual_amount_cents: string; max_ai_meal_photos_month: number | null }>(
      'select code, annual_amount_cents::text, max_ai_meal_photos_month from public.platform_plans order by monthly_amount_cents',
    );
    expect(plans.rows.map((row) => [row.code, row.annual_amount_cents, row.max_ai_meal_photos_month])).toEqual([
      ['arranque', '23904000', 150],
      ['pro', '47904000', 600],
      ['consultorio', '86304000', null],
    ]);
    const source = await db.query<{ prosrc: string }>("select prosrc from pg_proc where proname = 'claim_platform_founder_slot'");
    expect(source.rows[0].prosrc.toLowerCase()).toContain('for update');
    for (let i = 0; i < 30; i += 1) expect((await db.query<{ ok: boolean }>('select public.claim_platform_founder_slot() as ok')).rows[0].ok).toBe(true);
    expect((await db.query<{ ok: boolean }>('select public.claim_platform_founder_slot() as ok')).rows[0].ok).toBe(false);
  });

  it('la nutri A no ve ni escribe el plan de la nutri B', async () => {
    const sub = (await db.query<{ id: string }>(
      `insert into public.platform_subscriptions
        (nutritionist_id, plan_code, billing_cycle, status, current_amount_cents, payer_email, client_request_id, create_idempotency_key)
       values ($1, 'arranque', 'monthly', 'authorized', 2490000, 'a@example.test', 'pedido-a-1', 'pedido-a-1') returning id`,
      [nutriAId],
    )).rows[0].id;
    await expect(asUser(nutriB, 'insert into public.platform_subscriptions (nutritionist_id, plan_code, billing_cycle, status, current_amount_cents, payer_email, client_request_id, create_idempotency_key) values ($1, $2, $3, $4, $5, $6, $7, $8)', [nutriBId, 'pro', 'monthly', 'pending', 4990000, 'b@example.test', 'pedido-b-1', 'pedido-b-1'])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(nutriB, 'select id from public.platform_subscriptions where id = $1', [sub])).toEqual([]);
    expect(await asUser(nutriA, 'select id from public.platform_subscriptions where id = $1', [sub])).toEqual([{ id: sub }]);
  });

  it('cuenta como activa a quien se dio de alta o se movió en 30 días', async () => {
    const patient = (await db.query<{ id: string }>(
      "insert into public.patients (nutritionist_id, full_name, billing_status) values ($1, 'Lola', 'waived') returning id",
      [nutriAId],
    )).rows[0].id;
    expect((await db.query<{ n: number }>('select public.platform_active_patient_count($1) as n', [nutriAId])).rows[0].n).toBe(1);
    await db.query("update public.patients set created_at = clock_timestamp() - interval '40 days' where id = $1", [patient]);
    expect((await db.query<{ n: number }>('select public.platform_active_patient_count($1) as n', [nutriAId])).rows[0].n).toBe(0);
    await db.query('insert into public.meal_logs (patient_id, description) values ($1, $2)', [patient, 'Almuerzo']);
    expect((await db.query<{ n: number }>('select public.platform_active_patient_count($1) as n', [nutriAId])).rows[0].n).toBe(1);
  });
});
