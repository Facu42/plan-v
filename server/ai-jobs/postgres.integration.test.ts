import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_CATALOG } from '../intake/consent.js';

let db: PGlite;
let dir: string;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';
const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

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

async function finish(user: string, payload: Record<string, unknown>) {
  const claimed = await rpc(user, 'claim_ai_job', [payload.id]) as { run_token: string };
  return rpc(user, 'finish_ai_job', [{ ...payload, run_token: claimed.run_token }]);
}

function enqueuePayload(overrides: Record<string, unknown> = {}) {
  return {
    patient_id: patientA,
    job_type: 'recipe_draft',
    prompt_version: 'recipe_draft.v1',
    context_hash: hash,
    model: 'demo',
    estimated_tokens: 40,
    request: { title_hint: 'Tortilla' },
    ...overrides,
  };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-ai-jobs-'));
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

describe('PV-27 jobs de IA en PostgreSQL descartable', () => {
  it('versiona el job, aísla al paciente y Nutri B, y aplica un borrador sin publicar', async () => {
    await expect(rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()])).rejects.toMatchObject({ code: '42501' });

    const catalog = CONSENT_CATALOG.find((entry) => entry.purpose === 'ai_menu_draft')!;
    await rpc(patientAUser, 'record_patient_consent', [patientA, catalog.purpose, catalog.text_version, catalog.text_hash, 'granted']);
    await expect(rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()])).rejects.toMatchObject({ code: 'PT409' });

    await rpc(patientAUser, 'save_patient_intake', [patientA, 1, 'allergies', {
      preferred_name: 'Ana',
      allergies: { state: 'none', items: [] },
      restrictions: { state: 'none', items: [] },
    }]);

    await expect(rpc(patientAUser, 'enqueue_ai_job', [enqueuePayload()])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'enqueue_ai_job', [enqueuePayload()])).rejects.toMatchObject({ code: '42501' });

    const created = await rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()]) as {
      id: string;
      status: string;
      prompt_version: string;
      context_hash: string;
    };
    expect(created).toMatchObject({ status: 'queued', prompt_version: 'recipe_draft.v1', context_hash: hash });

    const finished = await finish(nutriA, {
      id: created.id,
      status: 'succeeded',
      cost_tokens: 42,
      current_context_hash: hash,
      warnings: ['revisar'],
      artifact: {
        kind: 'recipe_draft',
        payload: {
          id: '30000000-0000-4000-a000-0000000000a9',
          title: 'Tortilla de verdura',
          yield_portions: 2,
          steps: ['Batir huevos.', 'Cocinar a fuego medio.'],
          nutrient_source: 'propuesta_ia.v1',
          items: [{ name: 'Huevo', quantity: 2, unit: 'u' }],
        },
      },
    }) as { status: string; cost_tokens: number; artifact: { kind: string } };
    expect(finished.status).toBe('succeeded');
    expect(finished.cost_tokens).toBe(42);
    expect(finished.artifact.kind).toBe('recipe_draft');

    await expect(rpc(nutriB, 'get_ai_job', [created.id])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'get_ai_job', [created.id])).rejects.toMatchObject({ code: '42501' });
    const patientRows = await asUser(patientAUser, 'select id from public.ai_jobs');
    expect(patientRows).toEqual([]);

    const applied = await rpc(nutriA, 'apply_ai_job', [created.id]) as { applied_at: string };
    expect(applied.applied_at).toBeTruthy();
    await expect(rpc(nutriA, 'reject_ai_job', [created.id])).rejects.toMatchObject({ code: 'PT409' });
    const recipe = await rpc(nutriA, 'list_professional_recipes') as Array<{ status: string; current: { published_at: string | null } }>;
    expect(recipe[0].status).toBe('draft');
    expect(recipe[0].current.published_at).toBeNull();
    expect(await rpc(nutriA, 'list_assigned_recipes', [patientA])).toEqual([]);

    const disposable = await rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()]) as { id: string };
    await finish(nutriA, {
      id: disposable.id,
      status: 'succeeded',
      current_context_hash: hash,
      artifact: { kind: 'recipe_draft', payload: { title: 'Descartar' } },
    });
    await expect(rpc(nutriB, 'reject_ai_job', [disposable.id])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'reject_ai_job', [disposable.id])).rejects.toMatchObject({ code: '42501' });
    const rejected = await rpc(nutriA, 'reject_ai_job', [disposable.id]) as { status: string; artifact: unknown };
    expect(rejected).toMatchObject({ status: 'cancelled', artifact: null });
    await expect(rpc(nutriA, 'apply_ai_job', [disposable.id])).rejects.toMatchObject({ code: 'PT409' });

    const stale = await rpc(nutriA, 'enqueue_ai_job', [enqueuePayload({ context_hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' })]) as { id: string };
    const marked = await finish(nutriA, {
      id: stale.id,
      status: 'succeeded',
      current_context_hash: hash,
    }) as { status: string };
    expect(marked.status).toBe('stale');
    await expect(rpc(nutriA, 'apply_ai_job', [stale.id])).rejects.toMatchObject({ code: 'PT409' });
  });

  it('recupera la cola vencida, reserva una vez y descarta respuestas tardías', async () => {
    const queued = await Promise.all(Array.from({ length: 3 }, () => rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()]))) as Array<{ id: string }>;
    await expect(rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()])).rejects.toMatchObject({ code: 'PT429' });
    const claimed = await rpc(nutriA, 'claim_ai_job', [queued[0].id]) as { run_token: string };
    await expect(rpc(nutriA, 'claim_ai_job', [queued[0].id])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(nutriB, 'claim_ai_job', [queued[0].id])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriA, 'finish_ai_job', [{ id: queued[0].id, status: 'succeeded', run_token: 'wrong' }])).rejects.toMatchObject({ code: 'PT409' });
    await db.exec("update public.ai_jobs set run_expires_at=clock_timestamp()-interval '1 second' where status in ('queued','running')");
    const replacement = await rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()]) as { id: string };
    const late = await rpc(nutriA, 'finish_ai_job', [{ id: queued[0].id, status: 'succeeded', run_token: claimed.run_token, artifact: { kind: 'recipe_draft', payload: { title: 'Late' } } }]) as { status: string; artifact: unknown };
    expect(late).toMatchObject({ status: 'failed', artifact: null });
    const expired = (await rpc(nutriA, 'list_ai_jobs', [patientA]) as Array<{ id: string; status: string }>).filter(job => queued.some(old => old.id === job.id));
    expect(expired.every(job => job.status === 'failed')).toBe(true);
    await finish(nutriA, { id: replacement.id, status: 'failed', error_code: 'synthetic_failure' });
  });

  it('revalida el consentimiento al terminar y el contexto al aplicar', async () => {
    const catalog = CONSENT_CATALOG.find(entry => entry.purpose === 'ai_menu_draft')!;
    const queued = await rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()]) as { id: string };
    const claimed = await rpc(nutriA, 'claim_ai_job', [queued.id]) as { run_token: string };
    await rpc(patientAUser, 'record_patient_consent', [patientA, catalog.purpose, catalog.text_version, catalog.text_hash, 'withdrawn']);
    const stale = await rpc(nutriA, 'finish_ai_job', [{ id: queued.id, status: 'succeeded', run_token: claimed.run_token, current_context_hash: hash, artifact: { kind: 'recipe_draft', payload: { title: 'Private' } } }]) as { status: string; artifact: unknown };
    expect(stale).toMatchObject({ status: 'stale', artifact: null });
    await rpc(patientAUser, 'record_patient_consent', [patientA, catalog.purpose, catalog.text_version, catalog.text_hash, 'granted']);
    const ready = await rpc(nutriA, 'enqueue_ai_job', [enqueuePayload()]) as { id: string };
    await finish(nutriA, { id: ready.id, status: 'succeeded', current_context_hash: hash, artifact: { kind: 'recipe_draft', payload: { title: 'Private' } } });
    const revision = (await db.query<{ revision: number }>('select revision from public.intake_sessions where patient_id=$1', [patientA])).rows[0].revision;
    await rpc(patientAUser, 'save_patient_intake', [patientA, revision, 'allergies', { allergies: { state: 'reported', items: ['Maní'] } }]);
    await expect(rpc(nutriA, 'apply_ai_job', [ready.id])).rejects.toMatchObject({ code: 'PT409' });
    const rows = await db.query('select applied_at from public.ai_jobs where id=$1', [ready.id]);
    expect(rows.rows[0]).toMatchObject({ applied_at: null });
  });
});
