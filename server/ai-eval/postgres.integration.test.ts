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
const planId = '40000000-0000-4000-a000-0000000000c1';
const recipeId = '30000000-0000-4000-a000-0000000000c1';

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

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-ai-eval-'));
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

describe('PV-28 evaluación en PostgreSQL descartable', () => {
  it('no publica ni asigna con alergia o ingreso unknown; Nutri B y paciente no publican', async () => {
    await expect(rpc(nutriA, 'save_recipe_draft', [{
      id: recipeId,
      title: 'Satay',
      yield_portions: 1,
      steps: ['Mezclar.'],
      items: [{ name: 'Salsa de maní', quantity: 30, unit: 'g' }],
    }])).resolves.toBeTruthy();
    await rpc(nutriA, 'publish_recipe', [recipeId, 1]);
    await expect(rpc(nutriA, 'assign_recipe', [recipeId, patientA, 1])).rejects.toMatchObject({ code: 'PT409' });

    await rpc(patientAUser, 'save_patient_intake', [patientA, 1, 'allergies', {
      preferred_name: 'Ana',
      allergies: { state: 'reported', items: ['Maní'] },
      restrictions: { state: 'none', items: [] },
    }]);
    await expect(rpc(nutriA, 'assign_recipe', [recipeId, patientA, 1])).rejects.toMatchObject({ code: 'PT409' });

    await rpc(nutriA, 'save_meal_plan_draft', [patientA, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Tostada con maní', portions: 1 }],
    }]);
    await expect(rpc(nutriA, 'publish_meal_plan', [planId, 1])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(nutriA, 'publish_meal_plan', [planId, 9])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(nutriB, 'publish_meal_plan', [planId, 1])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'publish_meal_plan', [planId, 1])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'publish_meal_plan', [planId, 1])).rejects.toMatchObject({ code: '42501' });

    await rpc(nutriA, 'save_meal_plan_draft', [patientA, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [{ for_date: '2026-09-22', slot: 'Cena', free_text: 'Pollo con vegetales', portions: 1 }],
    }]);
    const first = await rpc(nutriA, 'publish_meal_plan', [planId, 1]) as { published: { version: number } };
    expect(first.published.version).toBe(1);
    await rpc(nutriA, 'save_meal_plan_draft', [patientA, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [{ for_date: '2026-09-23', slot: 'Desayuno', free_text: 'Fruta', portions: 1 }],
    }]);
    const published = await rpc(nutriA, 'publish_meal_plan', [planId, 2]) as { published: { version: number } };
    expect(published.published.version).toBe(2);
    await expect(rpc(nutriA, 'publish_meal_plan', [planId, 1])).rejects.toMatchObject({ code: 'PT409' });
    expect(await rpc(patientAUser, 'list_published_meal_plan', [patientA])).toMatchObject({ version: 2 });
  });

  it('un marcador demo no se publica y sin schema falla cerrado', async () => {
    const demoId = '30000000-0000-4000-a000-0000000000d1';
    await rpc(nutriA, 'save_recipe_draft', [{
      id: demoId,
      title: 'Ejemplo demo: receta por revisar',
      yield_portions: 2,
      steps: ['Revisar alergias y restricciones declaradas.'],
      items: [{ name: 'Ingrediente a definir por la nutricionista', quantity: 1, unit: 'u' }],
    }]);
    await expect(rpc(nutriA, 'publish_recipe', [demoId, 1])).rejects.toMatchObject({ code: 'PT409' });

    await rpc(nutriA, 'save_meal_plan_draft', [patientA, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [{ for_date: '2026-09-24', slot: 'Merienda', free_text: 'Fruta', portions: 1 }],
    }]);
    await db.exec('alter table public.intake_sessions rename to intake_sessions_pv28_hidden');
    try {
      await expect(rpc(nutriA, 'publish_meal_plan', [planId, 3])).rejects.toMatchObject({ code: '42P01' });
    } finally {
      await db.exec('alter table public.intake_sessions_pv28_hidden rename to intake_sessions');
    }
  });
});
