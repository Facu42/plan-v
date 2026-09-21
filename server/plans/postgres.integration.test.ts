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
const planId = '40000000-0000-4000-a000-0000000000a1';
const recipeId = '30000000-0000-4000-a000-0000000000a1';

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

const recipeDraft = {
  id: recipeId,
  title: 'Ensalada de quinoa',
  yield_portions: 2,
  steps: ['Cocinar la quinoa.', 'Mezclar con vegetales.'],
  nutrient_source: 'Argenfoods',
  items: [{ name: 'Quinoa', quantity: 60, unit: 'g' }, { name: 'Tomate', quantity: 1, unit: 'u' }],
};

function planDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: planId,
    period_start: '2026-09-21',
    period_end: '2026-09-27',
    timezone: 'America/Argentina/Buenos_Aires',
    items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Pollo con vegetales', portions: 1 }],
    ...overrides,
  };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-plans-'));
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

describe('PV-19 planes en PostgreSQL descartable', () => {
  it('aisla el plan: paciente no lee tablas crudas; Nutri B no ve las de A', async () => {
    const saved = await rpc(nutriA, 'save_meal_plan_draft', [patientA, planDraft()]) as { current: { version: number; status: string } };
    expect(saved.current).toMatchObject({ version: 1, status: 'draft' });
    expect(await asUser(patientAUser, 'select id from public.meal_plans')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.meal_plan_versions')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.meal_plan_items')).toEqual([]);
    await expect(rpc(patientAUser, 'save_meal_plan_draft', [patientA, planDraft()])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'list_professional_meal_plan', [patientA])).rejects.toMatchObject({ code: '42501' });
    expect(await rpc(nutriB, 'list_professional_meal_plan', [patientB])).toBeNull();
    expect(await rpc(patientAUser, 'list_published_meal_plan', [patientA])).toBeNull();
  });

  it('publica una copia inmutable; el borrador siguiente no la pisa', async () => {
    await rpc(nutriA, 'publish_meal_plan', [planId, 1]);
    const visible = await rpc(patientAUser, 'list_published_meal_plan', [patientA]) as { version: number; items: Array<{ free_text: string }> };
    expect(visible.version).toBe(1);
    expect(visible.items[0].free_text).toBe('Pollo con vegetales');
    await expect(rpc(patientBUser, 'list_published_meal_plan', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'publish_meal_plan', [planId, 1])).rejects.toMatchObject({ code: '42501' });

    const edited = await rpc(nutriA, 'save_meal_plan_draft', [patientA, planDraft({
      items: [{ for_date: '2026-09-22', slot: 'Cena', free_text: 'Tortilla de verdura' }],
    })]) as { current: { version: number; published_at: string | null; items: Array<{ free_text: string }> }; published: { version: number } };
    expect(edited.current.version).toBe(2);
    expect(edited.current.published_at).toBeNull();
    expect(edited.current.items[0].free_text).toBe('Tortilla de verdura');
    expect(edited.published.version).toBe(1);
    const still = await rpc(patientAUser, 'list_published_meal_plan', [patientA]) as { version: number; items: Array<{ free_text: string }> };
    expect(still.version).toBe(1);
    expect(still.items[0].free_text).toBe('Pollo con vegetales');

    const publishedId = (await asUser<{ id: string }>(nutriA, 'select id from public.meal_plan_versions where meal_plan_id=$1 and version=1', [planId]))[0].id;
    await expect(asUser(nutriA, 'update public.meal_plan_versions set period_end=period_end + 1 where id=$1', [publishedId])).rejects.toMatchObject({ code: 'PT409' });
    await expect(asUser(nutriA, "insert into public.meal_plan_items(meal_plan_version_id, for_date, slot, free_text) values ($1,'2026-09-24','extra','no')", [publishedId])).rejects.toMatchObject({ code: 'PT409' });
    await expect(asUser(nutriA, 'delete from public.meal_plan_items where meal_plan_version_id=$1', [publishedId])).rejects.toMatchObject({ code: 'PT409' });
  });

  it('resuelve receta publicada XOR texto, rechaza receta borrador y falla cerrado sin tablas', async () => {
    await rpc(nutriA, 'save_recipe_draft', [recipeDraft]);
    await expect(rpc(nutriA, 'save_meal_plan_draft', [patientA, planDraft({
      items: [{ for_date: '2026-09-23', slot: 'Merienda', recipe_id: recipeId }],
    })])).rejects.toMatchObject({ code: '22023' });
    await rpc(nutriA, 'publish_recipe', [recipeId, 1]);
    await expect(rpc(nutriA, 'save_meal_plan_draft', [patientA, planDraft({
      items: [{ for_date: '2026-09-23', slot: 'Merienda', recipe_id: recipeId, free_text: 'también' }],
    })])).rejects.toMatchObject({ code: '22023' });
    const linked = await rpc(nutriA, 'save_meal_plan_draft', [patientA, planDraft({
      items: [{ for_date: '2026-09-23', slot: 'Colación', recipe_id: recipeId, portions: 1 }],
    })]) as { current: { version: number; items: Array<{ slot: string; recipe_title: string; free_text: string | null }> } };
    expect(linked.current.version).toBe(2);
    expect(linked.current.items[0]).toMatchObject({ slot: 'Colación', recipe_title: 'Ensalada de quinoa', free_text: null });

    await db.exec('alter table public.meal_plans rename to meal_plans_pv19_hidden');
    try {
      await expect(rpc(nutriA, 'list_professional_meal_plan', [patientA])).rejects.toMatchObject({ code: '42P01' });
    } finally {
      await db.exec('alter table public.meal_plans_pv19_hidden rename to meal_plans');
    }
  });

  it('el paciente ve el detalle inmutable de la receta, igual que el CRM', async () => {
    await rpc(nutriA, 'publish_meal_plan', [planId, 2]);
    const visible = await rpc(patientAUser, 'list_published_meal_plan', [patientA]) as {
      version: number;
      items: Array<{ slot: string; portions: number | string | null; recipe: { title: string; version: number; yield_portions: number | string; steps: string[]; ingredients: Array<{ name: string; quantity: number | string; unit: string }> } | null }>;
    };
    const professional = await rpc(nutriA, 'list_professional_meal_plan', [patientA]) as { published: { version: number; items: unknown } };
    expect(visible.version).toBe(2);
    expect(visible.items).toEqual(professional.published.items);
    expect(visible.items[0]).toMatchObject({ slot: 'Colación', recipe: { title: 'Ensalada de quinoa', version: 1 } });
    expect(Number(visible.items[0].recipe?.yield_portions)).toBe(2);
    expect(visible.items[0].recipe?.steps).toEqual(['Cocinar la quinoa.', 'Mezclar con vegetales.']);
    expect(visible.items[0].recipe?.ingredients).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Quinoa', unit: 'g' }),
    ]));

    await rpc(nutriA, 'save_recipe_draft', [{
      ...recipeDraft,
      title: 'Ensalada de quinoa nueva',
      yield_portions: 8,
      items: [{ name: 'Quinoa', quantity: 200, unit: 'g' }],
    }]);
    const still = await rpc(patientAUser, 'list_published_meal_plan', [patientA]) as {
      items: Array<{ recipe: { version: number; yield_portions: number | string; ingredients: Array<{ quantity: number | string }> } }>;
    };
    expect(still.items[0].recipe.version).toBe(1);
    expect(Number(still.items[0].recipe.yield_portions)).toBe(2);
    expect(Number(still.items[0].recipe.ingredients.find((line) => line.name === 'Quinoa')?.quantity)).toBe(60);
  });
});
