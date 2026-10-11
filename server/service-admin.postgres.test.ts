import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServiceBoard, ServiceNutritionist } from '../src/types/service.js';

// Panel del servicio: sólo el administrador ve y cambia la suscripción de las nutricionistas.
let db: PGlite;
let dir: string;
let nutriAId = '';
let nutriBId = '';

const admin = '00000000-0000-4000-a000-0000000000e1';
const nutriA = '00000000-0000-4000-a000-0000000000e2';
const nutriB = '00000000-0000-4000-a000-0000000000e3';
const patientUser = '00000000-0000-4000-a000-0000000000e4';
const patient = '10000000-0000-4000-a000-0000000000e1';

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

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-service-'));
  db = new PGlite(dir);
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');
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
    [admin, 'admin@example.test'],
    [nutriA, 'nutri-a@example.test'],
    [nutriB, 'nutri-b@example.test'],
    [patientUser, 'paciente@example.test'],
  ] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at,last_sign_in_at) values($1,$2,now(),now())', [id, email]);
  }
  await db.query('insert into public.platform_admins(user_id) values ($1)', [admin]);
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente Secreta','pending')`,
    [patient, nutriAId, patientUser],
  );
}, 60000);
afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('panel del servicio (PGlite)', () => {
  it('cada nutricionista nueva arranca con 30 días de prueba', async () => {
    const rows = (await db.query<{ trial: string }>(
      "select to_char(trial_ends_on,'YYYY-MM-DD') as trial from public.nutritionist_subscriptions where nutritionist_id=$1", [nutriAId],
    )).rows;
    expect(rows[0].trial).toBe(await shift(30));
  });

  it('el administrador ve el tablero sin datos de salud', async () => {
    const board = await rpc<ServiceBoard>(admin, 'admin_get_service_board');
    expect(board.settings).toEqual({ monthly_price: null, trial_days: 30 });
    const a = board.nutritionists.find((row) => row.id === nutriAId)!;
    expect(a).toMatchObject({ display_name: 'Nutri A', email: 'nutri-a@example.test', patients_active: 1, patients_total: 1 });
    expect(a.subscription).toMatchObject({ override: 'none', paid_until: null });
    expect(JSON.stringify(board)).not.toContain('Paciente Secreta');
  });

  it('nadie más puede llamar al panel ni a sus acciones', async () => {
    for (const user of [nutriA, patientUser, '']) {
      expect(await rpc(user, 'is_platform_admin')).toBe(false);
      await expect(rpc(user, 'admin_get_service_board')).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_extend_trial', [nutriAId, 30])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_set_service_override', [nutriAId, 'waived', ''])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_record_service_payment', [nutriAId, 1, 1, await shift(0), 'otro', ''])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_void_service_payment', ['20000000-0000-4000-a000-000000000000'])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_set_service_settings', [1, 30])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_set_service_note', [nutriAId, 'nota'])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_log_service_event', [nutriAId, 'service.access_sent', null])).rejects.toMatchObject({ code: '42501' });
      await expect(rpc(user, 'admin_mark_test_account', [nutriAId])).rejects.toMatchObject({ code: '42501' });
      await expect(asUser(user, 'select public.service_nutritionist_json($1)', [nutriAId])).rejects.toMatchObject({ code: '42501' });
      await expect(asUser(user, 'select * from public.nutritionist_subscriptions')).rejects.toMatchObject({ code: '42501' });
      await expect(asUser(user, 'select * from public.platform_admins')).rejects.toMatchObject({ code: '42501' });
    }
    await expect(asUser(nutriA, 'insert into public.platform_admins(user_id) values ($1)', [nutriA])).rejects.toMatchObject({ code: '42501' });
    expect(await rpc(admin, 'is_platform_admin')).toBe(true);
  });

  it('declararse administrador en los datos editables de la cuenta no da acceso al panel', async () => {
    await db.query('update auth.users set raw_user_meta_data=$1 where id=$2', [{ role: 'admin', is_admin: true }, patientUser]);
    expect(await rpc(patientUser, 'is_platform_admin')).toBe(false);
    await expect(rpc(patientUser, 'admin_get_service_board')).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientUser, 'admin_set_service_override', [nutriAId, 'waived', ''])).rejects.toMatchObject({ code: '42501' });
  });

  it('carga el precio mensual y los días de prueba', async () => {
    expect(await rpc(admin, 'admin_set_service_settings', [15000, 14])).toEqual({ monthly_price: 15000, trial_days: 14 });
    await expect(rpc(admin, 'admin_set_service_settings', [0, 14])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_set_service_settings', [null, 400])).rejects.toMatchObject({ code: '22023' });
    const id = (await db.query<{ id: string }>("insert into public.nutritionists(user_id,display_name) values ($1,'Nutri Nueva') returning id", [admin])).rows[0].id;
    const trial = (await db.query<{ trial: string }>("select to_char(trial_ends_on,'YYYY-MM-DD') as trial from public.nutritionist_subscriptions where nutritionist_id=$1", [id])).rows[0].trial;
    expect(trial).toBe(await shift(14));
    await db.query('delete from public.nutritionists where id=$1', [id]);
    await rpc(admin, 'admin_set_service_settings', [null, 30]);
  });

  it('un pago durante la prueba suma meses desde el fin de la prueba; anularlo lo descuenta', async () => {
    const paid = await rpc<ServiceNutritionist>(admin, 'admin_record_service_payment', [nutriAId, 15000, 1, await shift(0), 'transferencia', 'octubre']);
    const trialEnd = paid.subscription.trial_ends_on;
    const expected = (await db.query<{ d: string }>("select to_char(($1::date + interval '1 month')::date,'YYYY-MM-DD') as d", [trialEnd])).rows[0].d;
    expect(paid.subscription.paid_until).toBe(expected);
    expect(paid.payments[0]).toMatchObject({ amount: 15000, months: 1, method: 'transferencia', status: 'confirmed' });

    const two = await rpc<ServiceNutritionist>(admin, 'admin_record_service_payment', [nutriAId, 30000, 2, await shift(0), 'mercado_pago', '']);
    const expectedTwo = (await db.query<{ d: string }>("select to_char(($1::date + interval '3 month')::date,'YYYY-MM-DD') as d", [trialEnd])).rows[0].d;
    expect(two.subscription.paid_until).toBe(expectedTwo);

    const voided = await rpc<ServiceNutritionist>(admin, 'admin_void_service_payment', [two.payments.find((row) => row.months === 2)!.id]);
    expect(voided.subscription.paid_until).toBe(expected);
    await expect(rpc(admin, 'admin_void_service_payment', [two.payments.find((row) => row.months === 2)!.id])).rejects.toMatchObject({ code: '22023' });
  });

  it('los meses de pagos seguidos se suman desde el mismo comienzo, también a fin de mes', async () => {
    const id = (await db.query<{ id: string }>("insert into public.nutritionists(user_id,display_name) values ($1,'Nutri Fin de Mes') returning id", [admin])).rows[0].id;
    await db.query("update public.nutritionist_subscriptions set trial_ends_on = date '2026-10-31' where nutritionist_id=$1", [id]);
    const pay = async (months: number, paidOn: string) => {
      await db.query("insert into public.service_payments (nutritionist_id, amount, months, paid_on, method, created_by) values ($1,$2,$3,$4,'transferencia',$5)", [id, 1000 * months, months, paidOn, admin]);
      await db.query('select public.service_recompute($1)', [id]);
      return (await db.query<{ d: string }>("select to_char(paid_until,'YYYY-MM-DD') as d from public.nutritionist_subscriptions where nutritionist_id=$1", [id])).rows[0].d;
    };
    expect(await pay(1, '2026-10-20')).toBe('2026-11-30');
    expect(await pay(2, '2026-11-25')).toBe('2027-01-31');
    // Un corte largo (más de 7 días) vuelve a contar desde el día que pagó.
    expect(await pay(1, '2027-03-15')).toBe('2027-04-15');
    await db.query('delete from public.nutritionists where id=$1', [id]);
  });

  it('la migración corrige también un vencimiento ya guardado sin modificar sus pagos', async () => {
    const id = (await db.query<{ id: string }>("insert into public.nutritionists(user_id,display_name) values ($1,'Vencimiento ficticio anterior') returning id", [admin])).rows[0].id;
    await db.query("update public.nutritionist_subscriptions set trial_ends_on=date '2026-10-31',paid_until=date '2027-01-30' where nutritionist_id=$1", [id]);
    for (const [months, paidOn] of [[1, '2026-10-20'], [2, '2026-11-25']] as const) {
      await db.query("insert into public.service_payments(nutritionist_id,amount,months,paid_on,method,created_by) values($1,$2,$3,$4,'transferencia',$5)", [id, months * 1000, months, paidOn, admin]);
    }
    const before = (await db.query('select * from public.service_payments where nutritionist_id=$1 order by months', [id])).rows;
    const migrations = new URL('../supabase/migrations/', import.meta.url);
    const migration = (await readdir(migrations)).find((name) => name.endsWith('_harden_nutrition_target_access.sql'))!;
    await db.exec(await readFile(new URL(migration, migrations), 'utf8'));
    expect((await db.query("select to_char(paid_until,'YYYY-MM-DD') as d from public.nutritionist_subscriptions where nutritionist_id=$1", [id])).rows[0]).toEqual({ d: '2027-01-31' });
    expect((await db.query('select * from public.service_payments where nutritionist_id=$1 order by months', [id])).rows).toEqual(before);
    await db.query('delete from public.nutritionists where id=$1', [id]);
  });

  it('rechaza pagos inválidos', async () => {
    await expect(rpc(admin, 'admin_record_service_payment', [nutriBId, 0, 1, await shift(0), 'otro', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_record_service_payment', [nutriBId, 100, 0, await shift(0), 'otro', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_record_service_payment', [nutriBId, 100, 1, await shift(10), 'otro', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_record_service_payment', [nutriBId, 100, 1, await shift(0), 'cripto', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_record_service_payment', ['20000000-0000-4000-a000-000000000000', 100, 1, await shift(0), 'otro', ''])).rejects.toMatchObject({ code: '22023' });
  });

  it('extiende la prueba, da sin cargo o suspende, y queda anotado', async () => {
    const before = (await rpc<ServiceBoard>(admin, 'admin_get_service_board')).nutritionists.find((row) => row.id === nutriBId)!;
    const extended = await rpc<ServiceNutritionist>(admin, 'admin_extend_trial', [nutriBId, 15]);
    const expected = (await db.query<{ d: string }>('select to_char($1::date + 15,\'YYYY-MM-DD\') as d', [before.subscription.trial_ends_on])).rows[0].d;
    expect(extended.subscription.trial_ends_on).toBe(expected);
    expect((await rpc<ServiceNutritionist>(admin, 'admin_set_service_override', [nutriBId, 'waived', 'amiga'])).subscription).toMatchObject({ override: 'waived', note: 'amiga' });
    expect((await rpc<ServiceNutritionist>(admin, 'admin_set_service_override', [nutriBId, 'suspended', ''])).subscription.override).toBe('suspended');
    await expect(rpc(admin, 'admin_set_service_override', [nutriBId, 'gratis', ''])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_extend_trial', [nutriBId, 0])).rejects.toMatchObject({ code: '22023' });

    const board = await rpc<ServiceBoard>(admin, 'admin_get_service_board');
    const actions = board.events.map((event) => event.action);
    expect(actions).toEqual(expect.arrayContaining(['service.payment', 'service.payment_voided', 'service.trial_extended', 'service.override', 'service.settings']));
    const actors = await db.query<{ actor_id: string }>("select distinct actor_id from public.audit_events where action like 'service.%'");
    expect(actors.rows.map((row) => row.actor_id)).toEqual([admin]);
  });

  it('la dueña de un consultorio sólo puede cancelarlo; el administrador pone cualquier estado', async () => {
    const org = await rpc<{ id: string; subscription: { status: string } }>(nutriA, 'create_organization', ['Consultorio A', 'consultorio-a']);
    expect(org.subscription.status).toBe('trialing');
    await expect(rpc(nutriA, 'set_organization_subscription_status', [org.id, 'waived', ''])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriA, 'set_organization_subscription_status', [org.id, 'trialing', ''])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'set_organization_subscription_status', [org.id, 'canceled', ''])).rejects.toMatchObject({ code: '42501' });
    expect(await rpc(admin, 'set_organization_subscription_status', [org.id, 'waived', 'piloto'])).toMatchObject({ status: 'waived' });
    expect(await rpc(nutriA, 'set_organization_subscription_status', [org.id, 'canceled', ''])).toMatchObject({ status: 'canceled' });
  });

  it('altas: nota interna de hasta 500, registro de altas y reenvíos sin datos personales', async () => {
    const long = 'n'.repeat(500);
    const noted = await rpc<ServiceNutritionist>(admin, 'admin_set_service_note', [nutriBId, `  ${long}  `]);
    expect(noted.subscription.note).toBe(long);
    expect(noted.is_test).toBe(false);
    await expect(rpc(admin, 'admin_set_service_note', [nutriBId, 'n'.repeat(501)])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_set_service_note', ['20000000-0000-4000-a000-000000000000', 'x'])).rejects.toMatchObject({ code: '22023' });

    await rpc(admin, 'admin_log_service_event', [nutriBId, 'service.nutritionist_created', 'invite']);
    await rpc(admin, 'admin_log_service_event', [nutriBId, 'service.access_sent', null]);
    await expect(rpc(admin, 'admin_log_service_event', [nutriBId, 'service.payment', null])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_log_service_event', [nutriBId, 'service.access_sent', 'nutri-b@example.test'])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(admin, 'admin_log_service_event', ['20000000-0000-4000-a000-000000000000', 'service.access_sent', null])).rejects.toMatchObject({ code: '22023' });

    const board = await rpc<ServiceBoard>(admin, 'admin_get_service_board');
    const mine = board.events.filter((event) => event.nutritionist_id === nutriBId).map((event) => event.action);
    expect(mine).toEqual(expect.arrayContaining(['service.note', 'service.nutritionist_created', 'service.access_sent']));
    expect(JSON.stringify(board.events)).not.toContain('@example.test');
    expect(JSON.stringify(board.events)).not.toContain(long);
  });

  it('cuenta de prueba: queda marcada en el tablero y anotada', async () => {
    const marked = await rpc<ServiceNutritionist>(admin, 'admin_mark_test_account', [nutriBId]);
    expect(marked.is_test).toBe(true);
    const board = await rpc<ServiceBoard>(admin, 'admin_get_service_board');
    expect(board.nutritionists.find((row) => row.id === nutriBId)?.is_test).toBe(true);
    expect(board.nutritionists.find((row) => row.id === nutriAId)?.is_test).toBe(false);
    expect(board.events[0]).toMatchObject({ action: 'service.test_accounts_created', nutritionist_id: nutriBId });
    await expect(rpc(admin, 'admin_mark_test_account', ['20000000-0000-4000-a000-000000000000'])).rejects.toMatchObject({ code: '22023' });
  });
});
