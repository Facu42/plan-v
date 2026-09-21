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
let nutriAId = '';
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

const draft = {
  id: recipeId,
  title: 'Ensalada de quinoa',
  yield_portions: 2,
  steps: ['Cocinar la quinoa.', 'Mezclar con vegetales.'],
  nutrient_source: 'Argenfoods',
  items: [{ name: 'Quinoa', quantity: 60, unit: 'g' }, { name: 'Tomate', quantity: 1, unit: 'u' }],
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-recipes-'));
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
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
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

describe('PV-18 recetas en PostgreSQL descartable', () => {
  it('aisla el catálogo: paciente no lee tablas crudas; Nutri B no ve las de A', async () => {
    const saved = await rpc(nutriA, 'save_recipe_draft', [draft]) as { id: string; status: string; current: { version: number } };
    expect(saved.status).toBe('draft');
    expect(saved.current.version).toBe(1);
    expect(await asUser(patientAUser, 'select id from public.recipes')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.recipe_versions')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.ingredients')).toEqual([]);
    await expect(rpc(patientAUser, 'save_recipe_draft', [draft])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'list_professional_recipes')).rejects.toMatchObject({ code: '42501' });
    expect(await rpc(nutriB, 'list_professional_recipes')).toEqual([]);
    expect(await rpc(patientAUser, 'list_assigned_recipes', [patientA])).toEqual([]);
  });

  it('publica una revisión inmutable, asigna sólo esa copia y no deja que el borrador pise lo publicado', async () => {
    await rpc(nutriA, 'publish_recipe', [recipeId, 1]);
    expect(await rpc(patientAUser, 'list_assigned_recipes', [patientA])).toEqual([]);
    const assigned = await rpc(nutriA, 'assign_recipe', [recipeId, patientA, 1]) as { version: number; yield_portions: number | string };
    expect(Number(assigned.version)).toBe(1);
    const visible = await rpc(patientAUser, 'list_assigned_recipes', [patientA]) as Array<{ version: number; title: string }>;
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({ title: 'Ensalada de quinoa', version: 1 });
    await expect(rpc(patientBUser, 'list_assigned_recipes', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'assign_recipe', [recipeId, patientB, 1])).rejects.toMatchObject({ code: '42501' });

    const next = { ...draft, title: 'Ensalada de quinoa nueva', yield_portions: 3, items: [{ name: 'Quinoa', quantity: 80, unit: 'g' }] };
    const edited = await rpc(nutriA, 'save_recipe_draft', [next]) as { current: { version: number; published_at: string | null }; published: { version: number } };
    expect(edited.current.version).toBe(2);
    expect(edited.current.published_at).toBeNull();
    expect(edited.published.version).toBe(1);
    const still = await rpc(patientAUser, 'list_assigned_recipes', [patientA]) as Array<{ version: number; yield_portions: number | string }>;
    expect(still[0].version).toBe(1);
    expect(Number(still[0].yield_portions)).toBe(2);

    const publishedId = (await asUser<{ id: string }>(nutriA, 'select id from public.recipe_versions where recipe_id=$1 and version=1', [recipeId]))[0].id;
    await expect(asUser(nutriA, 'update public.recipe_versions set yield_portions=9 where id=$1', [publishedId])).rejects.toMatchObject({ code: 'PT409' });
    await expect(asUser(nutriA, 'delete from public.recipe_ingredients where recipe_version_id=$1', [publishedId])).rejects.toMatchObject({ code: 'PT409' });
  });

  it('sin tablas de recetas el RPC falla cerrado', async () => {
    await db.exec('alter table public.recipes rename to recipes_pv18_hidden');
    try {
      await expect(rpc(nutriA, 'list_professional_recipes')).rejects.toMatchObject({ code: '42P01' });
    } finally {
      await db.exec('alter table public.recipes_pv18_hidden rename to recipes');
    }
  });
});
