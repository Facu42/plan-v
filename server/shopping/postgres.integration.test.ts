import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
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
const planId = '40000000-0000-4000-a000-0000000000d1';
const recipeId = '30000000-0000-4000-a000-0000000000d1';
const extraId = '30000000-0000-4000-a000-0000000000d2';

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

type Line = {
  kind: string;
  name: string;
  quantity: number | string | null;
  unit: string | null;
  occurrences: number;
  source_key: string;
  checked: boolean;
  id: string;
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-shopping-'));
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
  await rpc(patientAUser, 'save_patient_intake', [patientA, 1, 'allergies', {
    preferred_name: 'Ana',
    allergies: { state: 'none', items: [] },
    restrictions: { state: 'none', items: [] },
  }]);
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-21 compras en PostgreSQL descartable', () => {
  it('deriva cantidades del plan publicado, aísla Nutri B/Paciente B y rechaza escritura profesional', async () => {
    await rpc(nutriA, 'save_recipe_draft', [{
      id: recipeId,
      title: 'Quinoa',
      yield_portions: 2,
      steps: ['Cocinar.'],
      items: [
        { name: 'Quinoa', quantity: 60, unit: 'g' },
        { name: 'Tomate', quantity: 1, unit: 'u' },
      ],
    }]);
    await rpc(nutriA, 'publish_recipe', [recipeId, 1]);
    await rpc(nutriA, 'save_recipe_draft', [{
      id: extraId,
      title: 'Otra',
      yield_portions: 1,
      steps: ['Servir.'],
      nutrient_source: '',
      items: [{ name: 'Quinoa', quantity: 1, unit: 'taza' }],
    }]);
    await rpc(nutriA, 'publish_recipe', [extraId, 1]);
    await rpc(nutriA, 'save_meal_plan_draft', [patientA, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [
        { for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: recipeId, portions: 2 },
        { for_date: '2026-09-22', slot: 'Cena', recipe_id: recipeId, portions: 1 },
        { for_date: '2026-09-23', slot: 'Merienda', recipe_id: extraId, portions: 1 },
        { for_date: '2026-09-24', slot: 'Cena', free_text: 'Pollo con vegetales', portions: 1 },
      ],
    }]);
    await rpc(nutriA, 'publish_meal_plan', [planId, 1]);

    const list = await rpc(patientAUser, 'get_shopping_list', [patientA]) as { plan_version: number; items: Line[] };
    expect(Number(list.plan_version)).toBe(1);
    const quinoa = list.items.filter((item) => item.name === 'Quinoa');
    expect(quinoa).toEqual([
      expect.objectContaining({ unit: 'g', occurrences: 2, kind: 'derived' }),
      expect.objectContaining({ unit: 'taza', occurrences: 1, kind: 'derived' }),
    ]);
    expect(Number(quinoa.find((item) => item.unit === 'g')?.quantity)).toBe(90);
    expect(Number(quinoa.find((item) => item.unit === 'taza')?.quantity)).toBe(1);
    expect(list.items.find((item) => item.name === 'Pollo con vegetales')).toMatchObject({
      kind: 'text', quantity: null, unit: null,
    });

    await expect(rpc(nutriB, 'get_shopping_list', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'get_shopping_list', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriA, 'add_shopping_manual', [{
      patient_id: patientA, name: 'Sal', quantity: 1, unit: 'g', client_id: randomUUID(),
    }])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(patientBUser, 'select id from public.shopping_manual_items')).toEqual([]);
  });

  it('sincroniza checks y conserva el manual al republicar; sin RPC falla cerrado', async () => {
    const clientId = randomUUID();
    const added = await rpc(patientAUser, 'add_shopping_manual', [{
      patient_id: patientA, name: 'Aceite de oliva', quantity: 1, unit: 'cda', client_id: clientId,
    }]) as { items: Line[] };
    const manual = added.items.find((item) => item.kind === 'manual');
    expect(manual).toMatchObject({ name: 'Aceite de oliva', unit: 'cda' });
    const quinoaKey = added.items.find((item) => item.name === 'Quinoa' && item.unit === 'g')!.source_key;
    const checked = await rpc(patientAUser, 'set_shopping_checked', [{
      patient_id: patientA, source_key: quinoaKey, checked: true,
    }]) as { items: Line[] };
    expect(checked.items.find((item) => item.source_key === quinoaKey)?.checked).toBe(true);

    await rpc(nutriA, 'save_meal_plan_draft', [patientA, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [{ for_date: '2026-09-25', slot: 'Almuerzo', free_text: 'Ensalada', portions: 1 }],
    }]);
    await rpc(nutriA, 'publish_meal_plan', [planId, 2]);
    const regenerated = await rpc(patientAUser, 'get_shopping_list', [patientA]) as { plan_version: number; items: Line[] };
    expect(Number(regenerated.plan_version)).toBe(2);
    expect(regenerated.items.find((item) => item.name === 'Aceite de oliva')).toMatchObject({ kind: 'manual' });
    expect(regenerated.items.some((item) => item.name === 'Quinoa')).toBe(false);

    await rpc(patientAUser, 'delete_shopping_manual', [{ patient_id: patientA, item_id: manual!.id }]);

    await db.exec('drop function public.get_shopping_list(uuid)');
    await expect(rpc(patientAUser, 'get_shopping_list', [patientA])).rejects.toMatchObject({ code: '42883' });
  });
});
