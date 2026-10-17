import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// Migración 20261017040000: la paciente elige alternativas de un grupo de su nutri, y solo ella.
let db: PGlite;
const nutriA = '00000000-0000-4000-a000-000000000201';
const nutriB = '00000000-0000-4000-a000-000000000202';
const patientUser = '00000000-0000-4000-a000-000000000203';
const otherUser = '00000000-0000-4000-a000-000000000204';
const patient = '10000000-0000-4000-a000-000000000201';
const otherPatient = '10000000-0000-4000-a000-000000000202';
const group = '20000000-0000-4000-a000-000000000201';
const foreignGroup = '20000000-0000-4000-a000-000000000202';
const item = '30000000-0000-4000-a000-000000000201';
const draftItem = '30000000-0000-4000-a000-000000000202';
const component = '40000000-0000-4000-a000-000000000201';
const apple = '50000000-0000-4000-a000-000000000001', pear = '50000000-0000-4000-a000-000000000002', rice = '50000000-0000-4000-a000-000000000003';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
const save = (user: string, request: Record<string, unknown>, target = patient) => asUser(user, 'select public.save_patient_plan_choice($1, $2::jsonb) as result', [target, JSON.stringify(request)]);
const pear2 = { item_id: item, component_id: component, group_id: group, base_food_id: apple, food_id: pear, quantity: 75, unit: 'g' };
const exchangePayload = (foods: Array<[string, string]>) => JSON.stringify({ name: 'Frutas', reference: 'r', items: foods.map(([id, name]) => ({ grams: 100, food: { id, name, revision: 1 } })) });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1, '/') $$;
  `);
  const dir = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, dir), 'utf8'));
  for (const [id, email] of [[nutriA, 'a@example.test'], [nutriB, 'b@example.test'], [patientUser, 'p@example.test'], [otherUser, 'o@example.test']] as const) {
    await db.query('insert into auth.users(id, email, email_confirmed_at) values ($1, $2, now())', [id, email]);
  }
  await db.query("select public.provision_nutritionist($1, 'Consultorio A')", [nutriA]);
  await db.query("select public.provision_nutritionist($1, 'Consultorio B')", [nutriB]);
  const idA = (await db.query<{ id: string }>('select id from public.nutritionists where user_id = $1', [nutriA])).rows[0].id;
  const idB = (await db.query<{ id: string }>('select id from public.nutritionists where user_id = $1', [nutriB])).rows[0].id;
  await db.query(`insert into public.patients(id, nutritionist_id, user_id, full_name, billing_status) values ($1, $2, $3, 'Paciente', 'waived'), ($4, $2, $5, 'Otra', 'waived')`, [patient, idA, patientUser, otherPatient, otherUser]);
  await db.query('insert into public.nutrition_exchanges(id, owner_id, payload) values ($1, $2, $3::jsonb), ($4, $5, $6::jsonb)',
    [group, idA, exchangePayload([[apple, 'Manzana'], [pear, 'Pera']]), foreignGroup, idB, exchangePayload([[apple, 'Manzana'], [pear, 'Pera']])]);
  const plan = '60000000-0000-4000-a000-000000000201', published = '70000000-0000-4000-a000-000000000201', draft = '70000000-0000-4000-a000-000000000202';
  await db.query('insert into public.meal_plans(id, patient_id, nutritionist_id) values ($1, $2, $3)', [plan, patient, idA]);
  await db.query(`insert into public.meal_plan_versions(id, meal_plan_id, version, status, period_start, period_end, published_at) values ($1, $2, 1, 'draft', '2026-10-19', '2026-10-25', null), ($3, $2, 2, 'draft', '2026-10-26', '2026-11-01', null)`, [published, plan, draft]);
  await db.query(`insert into public.meal_plan_items(id, meal_plan_version_id, for_date, slot, free_text) values ($1, $2, '2026-10-19', 'desayuno', 'Fruta'), ($3, $4, '2026-10-26', 'desayuno', 'Fruta')`, [item, published, draftItem, draft]);
  await db.query("update public.meal_plan_versions set status = 'published', published_at = now() where id = $1", [published]);
}, 120000);
afterAll(async () => { await db?.close(); });

describe('elecciones de alternativas del plan en Postgres descartable', () => {
  it('la paciente guarda su elección y ella y su nutri la leen con los grupos', async () => {
    expect(await save(patientUser, pear2)).toEqual([{ result: { removed: false } }]);
    for (const user of [patientUser, nutriA]) {
      const [row] = await asUser<{ result: { groups: Array<{ id: string }>; choices: Array<{ food_name: string; quantity: number }> } }>(user, 'select public.list_patient_plan_alternatives($1) as result', [patient]);
      expect(row.result.groups.map((g) => g.id)).toEqual([group]);
      expect(row.result.choices).toMatchObject([{ food_name: 'Pera', quantity: 75 }]);
    }
  });

  it('cambiar la elección actualiza la fila y quitarla la borra', async () => {
    await save(patientUser, { ...pear2, food_id: apple, base_food_id: pear, quantity: 50 });
    expect((await db.query('select food_id from public.patient_plan_choices')).rows).toHaveLength(1);
    expect(await save(patientUser, { item_id: item, component_id: component, food_id: null })).toEqual([{ result: { removed: true } }]);
    expect((await db.query('select 1 from public.patient_plan_choices')).rows).toHaveLength(0);
  });

  it('niega a la nutri, a otra paciente, un grupo ajeno, un alimento fuera del grupo y un borrador', async () => {
    await expect(save(nutriA, pear2)).rejects.toThrow(/plan_choices_access/);
    await expect(save(otherUser, pear2)).rejects.toThrow(/plan_choices_access/);
    await expect(save(patientUser, { ...pear2, group_id: foreignGroup })).rejects.toThrow(/plan_choice_group/);
    await expect(save(patientUser, { ...pear2, food_id: rice })).rejects.toThrow(/plan_choice_group/);
    await expect(save(patientUser, { ...pear2, item_id: draftItem })).rejects.toThrow(/plan_choice_item/);
    await expect(asUser(otherUser, 'select public.list_patient_plan_alternatives($1)', [patient])).rejects.toThrow(/plan_choices_access/);
    await expect(asUser(nutriB, 'select public.list_patient_plan_alternatives($1)', [patient])).rejects.toThrow(/plan_choices_access/);
  });

  it('la tabla no se toca directo desde la sesión', async () => {
    await expect(asUser(patientUser, 'select * from public.patient_plan_choices')).rejects.toThrow(/permission denied/);
    await expect(asUser(patientUser, 'insert into public.patient_plan_choices(patient_id) values ($1)', [patient])).rejects.toThrow(/permission denied/);
  });
});
