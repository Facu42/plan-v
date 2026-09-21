import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluatePilotoActa, environmentLiveFlags } from './acta.js';

let db: PGlite;
let dir: string;
const nutriA = 'e0000000-0000-4000-a000-0000000000a1';
const nutriB = 'e0000000-0000-4000-a000-0000000000b1';
const patientAUser = 'e0000000-0000-4000-a000-0000000000a2';
const patientBUser = 'e0000000-0000-4000-a000-0000000000b2';
const patientA = 'e1000000-0000-4000-a000-0000000000a1';
const patientB = 'e1000000-0000-4000-a000-0000000000b1';
const recipeA = 'e3000000-0000-4000-a000-0000000000a1';
const recipeB = 'e3000000-0000-4000-a000-0000000000b1';
const planA = 'e4000000-0000-4000-a000-0000000000a1';
const planB = 'e4000000-0000-4000-a000-0000000000b1';

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

function recipeDraft(id: string, title: string) {
  return {
    id,
    title,
    yield_portions: 2,
    steps: ['Cocinar.', 'Servir.'],
    nutrient_source: 'Argenfoods',
    items: [{ name: 'Quinoa', quantity: 60, unit: 'g' }, { name: 'Tomate', quantity: 1, unit: 'u' }],
  };
}

function planDraft(id: string, recipeId: string) {
  return {
    id,
    period_start: '2026-09-21',
    period_end: '2026-09-27',
    timezone: 'America/Argentina/Buenos_Aires',
    items: [{ for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: recipeId, portions: 1 }],
  };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-piloto-'));
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

async function intake(user: string, patient: string, name: string) {
  return rpc(user, 'save_patient_intake', [patient, 1, 'allergies', {
    preferred_name: name,
    allergies: { state: 'none', items: [] },
    restrictions: { state: 'none', items: [] },
  }]);
}

async function circuit(opts: {
  nutri: string;
  patientUser: string;
  patient: string;
  recipeId: string;
  planId: string;
  title: string;
  meal: string;
  message: string;
}) {
  await intake(opts.patientUser, opts.patient, opts.title);
  await rpc(opts.nutri, 'save_recipe_draft', [recipeDraft(opts.recipeId, opts.title)]);
  await rpc(opts.nutri, 'publish_recipe', [opts.recipeId, 1]);
  await rpc(opts.nutri, 'assign_recipe', [opts.recipeId, opts.patient, 1]);
  await rpc(opts.nutri, 'save_meal_plan_draft', [opts.patient, planDraft(opts.planId, opts.recipeId)]);
  await rpc(opts.nutri, 'publish_meal_plan', [opts.planId, 1]);
  const plan = await rpc(opts.patientUser, 'list_published_meal_plan', [opts.patient]) as { version: number };
  expect(plan.version).toBe(1);
  const assigned = await rpc(opts.patientUser, 'list_assigned_recipes', [opts.patient]) as Array<{ title: string }>;
  expect(assigned[0].title).toBe(opts.title);

  const saved = await rpc(opts.patientUser, 'save_meal_log', [{
    patient_id: opts.patient,
    client_id: randomUUID(),
    slot: 'Almuerzo',
    description: opts.meal,
    photo_path: null,
  }]) as { log: { id: string; description: string } };
  const failed = await rpc(opts.patientUser, 'record_meal_analysis', [{
    meal_id: saved.log.id,
    status: 'failed',
    foods: [],
    macros: null,
    confidence: 0,
    note_for_nutri: 'La estimación automática no está disponible.',
    error_code: 'AI_UNAVAILABLE',
  }]) as { analysis_status: string; description: string };
  expect(failed).toMatchObject({ analysis_status: 'failed', description: opts.meal });

  const sent = await rpc(opts.patientUser, 'send_thread_message', [{
    patient_id: opts.patient,
    client_id: randomUUID(),
    text: opts.message,
  }]) as { message: { text: string } };
  expect(sent.message.text).toBe(opts.message);
  const listed = await rpc(opts.nutri, 'list_thread_messages', [opts.patient, false]) as Array<{ text: string }>;
  expect(listed.some((row) => row.text === opts.message)).toBe(true);

  const booked = await rpc(opts.nutri, 'schedule_appointment', [{
    patient_id: opts.patient,
    appointment: { day: 'Jueves', time: '14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.test/a' },
  }]) as { appointment: { when: string } };
  expect(booked.appointment.when).toBe('Jueves · 14:30');

  const created = await rpc(opts.patientUser, 'request_privacy_action', [{ patient_id: opts.patient, kind: 'export' }]) as { id: string };
  await rpc(opts.patientUser, 'complete_privacy_export', [{
    request_id: created.id,
    package: { version: 'privacy-export.v1', patient_id: opts.patient },
  }]);
  const downloaded = await rpc(opts.patientUser, 'get_privacy_package', [created.id]) as { package: Record<string, unknown> };
  expect(downloaded.package.version).toBe('privacy-export.v1');
  return created.id;
}

describe('PV-33 circuito E2E PGlite (Nutri A/B + Paciente A/B)', () => {
  it('recorre intake→receta/plan→diario fallido→mensaje→turno→export y aísla inquilinos', async () => {
    const exportA = await circuit({
      nutri: nutriA,
      patientUser: patientAUser,
      patient: patientA,
      recipeId: recipeA,
      planId: planA,
      title: 'Ensalada Nutri A',
      meal: 'Milanesa A',
      message: 'Mensaje A',
    });
    await circuit({
      nutri: nutriB,
      patientUser: patientBUser,
      patient: patientB,
      recipeId: recipeB,
      planId: planB,
      title: 'Ensalada Nutri B',
      meal: 'Milanesa B',
      message: 'Mensaje B',
    });

    await expect(rpc(patientBUser, 'list_published_meal_plan', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'list_professional_meal_plan', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'assign_recipe', [recipeA, patientB, 1])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'list_thread_messages', [patientA, false])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'get_privacy_package', [exportA])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'save_meal_log', [{
      patient_id: patientB,
      client_id: randomUUID(),
      slot: 'Cena',
      description: 'cruzado',
      photo_path: null,
    }])).rejects.toMatchObject({ code: '42501' });

    const acta = evaluatePilotoActa({
      demoCircuit: true,
      pgliteTwoNutritionists: true,
      viewportContracts: true,
      errorSimulation: true,
      ...environmentLiveFlags(),
    });
    expect(acta.verdict).toBe('go-synthetic-no-go-live');
  });

  it('sin RPC el persistente falla cerrado 42883', async () => {
    await db.exec('alter function public.save_meal_log(jsonb) rename to save_meal_log_pv33_hidden');
    try {
      await expect(rpc(patientAUser, 'save_meal_log', [{
        patient_id: patientA,
        client_id: randomUUID(),
        slot: 'Cena',
        description: 'oculto',
        photo_path: null,
      }])).rejects.toMatchObject({ code: '42883' });
    } finally {
      await db.exec('alter function public.save_meal_log_pv33_hidden(jsonb) rename to save_meal_log');
    }
  });
});
