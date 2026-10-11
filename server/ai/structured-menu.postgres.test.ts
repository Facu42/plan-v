import { productFixtureArgs } from '../testing/product-rpc-fixture';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { planReviewSnapshot, type PlanVersionView } from '../../src/types/plans.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { calculateTarget } from '../../src/lib/nutrition-target.js';

let db: PGlite;
const user = '00000000-0000-4000-a000-0000000000a1';
const patientUser = '00000000-0000-4000-a000-0000000000a2';
const otherUser = '00000000-0000-4000-a000-0000000000b1';
const patient = '10000000-0000-4000-a000-0000000000a1';
const recipeId = '30000000-0000-4000-a000-0000000000a1';
const planId = '40000000-0000-4000-a000-0000000000a1';
const estimate = { origin: 'ai_estimate', source: 'estimacion_ia.v2', per_portion: { kcal: 500, protein_g: 20, carbs_g: 60, fat_g: 20 } };
const proposal = { title: 'Arroz con verduras', yield_portions: 2, steps: ['Cocinar y servir.'], ingredients: [{ name: 'Arroz', quantity: 100, unit: 'g' }], nutrition: estimate };
const draft = { id: planId, period_start: '2026-10-03', period_end: '2026-10-03', items: [{ for_date: '2026-10-03', slot: 'Almuerzo', free_text: proposal.title, portions: 2, recipe_proposal: proposal }] };

async function rpc(actor: string, name: string, args: unknown[] = []) {
  args = await productFixtureArgs(db, name, args);
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [actor]);
    return (await tx.query<{ result: any }>(`select public.${name}(${args.map((_, index) => `$${index + 1}`).join(',')}) as result`, args)).rows[0].result;
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage; grant usage on schema public,auth,storage to authenticated,anon,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant select,insert,delete on storage.objects to authenticated;`);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  for (const actor of [user, patientUser, otherUser]) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [actor, `${actor}@example.test`]);
  const nid = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri prueba') as id", [user])).rows[0].id;
  await db.query("select public.provision_nutritionist($1,'Otra nutri')", [otherUser]);
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente prueba','waived')", [patient, nid, patientUser]);
  await rpc(patientUser, 'save_patient_intake', [patient, 1, 'allergies', { preferred_name: 'Prueba', allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } }]);
  const consent = CONSENT_CATALOG.find((entry) => entry.purpose === 'ai_menu_draft')!;
  await rpc(patientUser, 'record_patient_consent', [patient, consent.purpose, consent.text_version, consent.text_hash, 'granted']);
}, 60000);
afterAll(async () => { await db?.close(); });

describe('persistencia de recetas y planes estimados, sin proveedores externos', () => {
  it('rechaza propuestas sin porciones también por RPC y escritura directa', async () => {
    const { portions: _portions, ...noPortions } = draft.items[0];
    await expect(rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [noPortions] }])).rejects.toMatchObject({ code: '22023' });
    const saved = await rpc(user, 'save_meal_plan_draft', [patient, draft]);
    await expect(db.transaction(async (tx) => {
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
      await tx.query('update public.meal_plan_items set portions=null where id=$1', [saved.current.items[0].id]);
    })).rejects.toMatchObject({ code: '42501' });
  });
  it('conserva ingredientes y etiqueta estimada después de editar, publicar y recargar como paciente', async () => {
    let saved = await rpc(user, 'save_recipe_draft', [{ id: recipeId, title: proposal.title, yield_portions: 2, steps: proposal.steps, items: proposal.ingredients, nutrient_source: estimate.source, nutrition: estimate }]);
    expect(saved.current.nutrition).toEqual(estimate);
    saved = await rpc(user, 'save_recipe_draft', [{ id: recipeId, title: proposal.title, yield_portions: 2, steps: proposal.steps, items: proposal.ingredients, nutrient_source: 'Revisado', nutrition: { ...estimate, origin: 'declared', source: 'Revisado' } }]);
    expect(saved.current.nutrition.origin).toBe('ai_estimate');
    expect(saved.current.nutrient_source).toBe(estimate.source);
    await rpc(user, 'publish_recipe', [recipeId, saved.current.version]);
    await rpc(user, 'assign_recipe', [recipeId, patient, saved.current.version]);
    const assigned = await rpc(patientUser, 'list_assigned_recipes', [patient]);
    expect(assigned[0].nutrition).toEqual(estimate);
    await expect(rpc(otherUser, 'save_recipe_draft', [{ id: recipeId, title: proposal.title, yield_portions: 2, steps: proposal.steps, items: proposal.ingredients, nutrition: estimate }])).rejects.toMatchObject({ code: '42501' });
  });
  it('mantiene propuesta privada y publica sólo el snapshot exacto revisado, incluidos ingredientes y macros', async () => {
    let saved = await rpc(user, 'save_meal_plan_draft', [patient, draft]);
    expect(saved.current.items[0].recipe_proposal).toEqual(proposal);
    expect(await rpc(patientUser, 'list_published_meal_plan', [patient])).toBeNull();
    const reviewed = planReviewSnapshot(saved.current as PlanVersionView);
    saved = await rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [{ ...draft.items[0], recipe_proposal: { ...proposal, ingredients: [{ ...proposal.ingredients[0], quantity: 120 }] } }] }]);
    await expect(rpc(user, 'publish_reviewed_meal_plan', [planId, saved.current.version, reviewed])).rejects.toMatchObject({ code: 'PT409' });
    await rpc(user, 'publish_reviewed_meal_plan', [planId, saved.current.version, planReviewSnapshot(saved.current)]);
    const visible = await rpc(patientUser, 'list_published_meal_plan', [patient]);
    expect(visible.items[0].recipe_proposal.nutrition.origin).toBe('ai_estimate');
    expect(visible.items[0].recipe_proposal.ingredients[0].quantity).toBe(120);
    const shopping = await rpc(patientUser, 'get_shopping_list', [patient]);
    expect(shopping.items).toContainEqual(expect.objectContaining({ kind: 'derived', name: 'Arroz', quantity: 120, unit: 'g' }));
    const line = shopping.items.find((item: { name: string }) => item.name === 'Arroz');
    await rpc(patientUser, 'set_shopping_checked', [{ patient_id: patient, source_key: line.source_key, checked: true }]);
    expect((await rpc(patientUser, 'get_shopping_list', [patient])).items.find((item: { name: string }) => item.name === 'Arroz').checked).toBe(true);
    await rpc(user, 'save_meal_plan_draft', [patient, draft]);
    expect((await rpc(patientUser, 'list_published_meal_plan', [patient])).items[0].recipe_proposal.ingredients[0].quantity).toBe(120);
    expect((await rpc(patientUser, 'get_shopping_list', [patient])).items.find((item: { name: string }) => item.name === 'Arroz').quantity).toBe(120);
    await expect(rpc(otherUser, 'list_published_meal_plan', [patient])).rejects.toMatchObject({ code: '42501' });
  });
  it('conserva la estimación en borradores, nuevas versiones y cambios directos sin perder las correcciones', async () => {
    const edited = { ...proposal, nutrition: { ...estimate, origin: 'declared', source: 'Revisado', per_portion: { ...estimate.per_portion, kcal: 450 } } };
    let saved = await rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [{ ...draft.items[0], recipe_proposal: edited }] }]);
    expect(saved.current.items[0].recipe_proposal.nutrition).toEqual({ ...estimate, per_portion: edited.nutrition.per_portion });
    await rpc(user, 'publish_reviewed_meal_plan', [planId, saved.current.version, planReviewSnapshot(saved.current)]);
    saved = await rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [{ ...draft.items[0], recipe_proposal: edited }] }]);
    expect(saved.current.items[0].recipe_proposal.nutrition.origin).toBe('ai_estimate');
    expect(saved.current.items[0].recipe_proposal.nutrition.source).toBe(estimate.source);
    await expect(db.transaction(async (tx) => {
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
      await tx.query('update public.meal_plan_items set recipe_proposal=$1 where id=$2', [edited, saved.current.items[0].id]);
    })).rejects.toMatchObject({ code: '42501' });
    expect((await rpc(user, 'list_professional_meal_plan', [patient])).current.items[0].recipe_proposal.nutrition.origin).toBe('ai_estimate');
    const moved = { ...edited, title: 'Arroz revisado' };
    saved = await rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [{ ...draft.items[0], slot: 'Cena', free_text: moved.title, recipe_proposal: moved }] }]);
    expect(saved.current.items[0].recipe_proposal.nutrition.origin).toBe('ai_estimate');
    saved = await rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [{ ...draft.items[0], recipe_proposal: { ...proposal, ingredients: [{ ...proposal.ingredients[0], quantity: 400 }], nutrition: null } }] }]);
    expect(saved.current.items[0].recipe_proposal.nutrition).toBeNull();
  });
  it('rechaza nutrientes inválidos y revisa ingredientes inline contra alergias actuales', async () => {
    await expect(rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [{ ...draft.items[0], recipe_proposal: { ...proposal, nutrition: { ...estimate, per_portion: { ...estimate.per_portion, kcal: -5 } } } }] }])).rejects.toMatchObject({ code: '22023' });
    const revision = (await db.query<{ revision: number }>('select revision from public.intake_sessions where patient_id=$1', [patient])).rows[0].revision;
    await rpc(patientUser, 'save_patient_intake', [patient, revision, 'allergies', { allergies: { state: 'reported', items: ['Maní'] } }]);
    const saved = await rpc(user, 'save_meal_plan_draft', [patient, { ...draft, items: [{ ...draft.items[0], recipe_proposal: { ...proposal, ingredients: [{ name: 'Maní', quantity: 10, unit: 'g' }] } }] }]);
    await expect(rpc(user, 'publish_reviewed_meal_plan', [planId, saved.current.version, planReviewSnapshot(saved.current)])).rejects.toMatchObject({ code: 'PT409' });
  });
  it('no aplica ni publica una propuesta si cambió la meta confirmada, incluso por RPC directo', async () => {
    const hash = 'a'.repeat(64);
    async function artifactJob(payload: unknown) {
      const queued = await rpc(user, 'enqueue_ai_job', [{ patient_id: patient, job_type: 'menu_draft', prompt_version: 'menu_draft.v2', context_hash: hash, model: 'demo', estimated_tokens: 100, request: { period_start: draft.period_start, period_end: draft.period_end, slots: ['Almuerzo'] } }]);
      const claimed = await rpc(user, 'claim_ai_job', [queued.id]);
      return rpc(user, 'finish_ai_job', [{ id: queued.id, run_token: claimed.run_token, status: 'succeeded', cost_tokens: 100, current_context_hash: hash, artifact: { kind: 'menu_draft', payload } }]);
    }
    const beforeTarget = await artifactJob(draft);
    const inputs = { sex: 'femenino' as const, age: 34, weight_kg: 65, height_cm: 165, activity: 'moderada' as const, goal: 'mantener' as const, adjust_pct: 0, protein_g_per_kg: 1.4, fat_pct: 30 };
    const workspace = await rpc(user, 'get_nutrition_target_workspace', [patient]);
    const savedTarget = await rpc(user, 'save_nutrition_target_versioned', [patient, inputs, calculateTarget(inputs), true, workspace.revision]);
    await expect(rpc(user, 'apply_ai_job', [beforeTarget.id])).rejects.toMatchObject({ code: 'PT409' });
    const published = savedTarget.published;
    const snapshot = { kcal: published.result.kcal, protein_g: published.result.protein_g, carbs_g: published.result.carbs_g, fat_g: published.result.fat_g, revision: published.updated_at, published_at: published.published_at };
    const savedPlan = await rpc(user, 'save_meal_plan_draft', [patient, { ...draft, nutrition_target: snapshot }]);
    const oldProposal = await artifactJob({ ...draft, nutrition_target: snapshot });
    const changed = { ...inputs, adjust_pct: 10 };
    await rpc(user, 'save_nutrition_target_versioned', [patient, changed, calculateTarget(changed), true, savedTarget.revision]);
    await expect(rpc(user, 'apply_ai_job', [oldProposal.id])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(user, 'publish_reviewed_meal_plan', [planId, savedPlan.current.version, planReviewSnapshot(savedPlan.current)])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(user, 'save_meal_plan_draft', [patient, { ...draft, nutrition_target: snapshot }])).rejects.toMatchObject({ code: 'PT409' });
  });
});
