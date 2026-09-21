import type { Hono, Context } from 'hono';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { getIntakeRecord } from '../intake/memory.js';
import { readIntakeBundle } from '../intake/repository.js';
import { emptyIntakePayload } from '../intake/payload.js';
import { requireCareConsent } from '../care/routes.js';
import { mondayOf, type PlanSlot } from '../../src/types/plans.js';
import {
  aiJobEnqueueSchema,
  MENU_PROMPT_VERSION,
  RECIPE_PROMPT_VERSION,
  type AiJob,
} from '../../src/types/ai-jobs.js';
import { listRecipes, saveRecipe } from '../recipes/repository.js';
import { loadPlanBoard, savePlan } from '../plans/repository.js';
import { generateMenuProposal, generateRecipeProposal } from './jobs.js';
import { buildAiJobContext, hashAiJobContext } from './jobs-context.js';
import { assertCanApply, evaluateArtifact } from './evaluate.js';
import * as repo from './repository.js';
import { AIUnavailableError } from './errors.js';

async function parseEnqueue(c: Context) {
  try { return aiJobEnqueueSchema.parse(JSON.parse(await c.req.text())); }
  catch { throw new repo.AiJobError(400, 'Revisá el tipo de propuesta y los datos del pedido.'); }
}

async function professionalAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (c.req.query('audience') !== 'pro') throw new repo.AiJobError(403, 'Sólo tu nutricionista puede pedir o ver estas propuestas.');
    if (!getPatient(patientId)) throw new repo.AiJobError(404, 'Paciente no encontrado.');
    return { persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'generate_ai_job', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor || actor.role !== 'nutri' || !actor.nutritionistId) {
    throw new repo.AiJobError(403, 'Sólo tu nutricionista puede pedir o ver estas propuestas.');
  }
  return { persistent: true, nutritionistId: actor.nutritionistId };
}

async function intakeFor(patientId: string, persistent: boolean) {
  if (persistent) return (await readIntakeBundle(patientId)).intake.payload;
  return getIntakeRecord(patientId).payload ?? emptyIntakePayload();
}

async function contextFor(patientId: string, persistent: boolean, nutritionistId: string, focus?: string) {
  const patient = persistent ? await sb.sbGetPatientById(patientId, 'professional') : getPatient(patientId);
  const catalog = await listRecipes(persistent, false, nutritionistId);
  return buildAiJobContext({
    intake: await intakeFor(patientId, persistent),
    weekPlan: patient?.weekPlan ?? [],
    catalog,
    periodStart: mondayOf(),
    focus,
  });
}

function jobView(job: AiJob, context: Awaited<ReturnType<typeof contextFor>>) {
  return { ...repo.toAiJobView(job), evaluation: evaluateArtifact(job.artifact, context, job.context_hash) };
}

async function runJob(patientId: string, input: Awaited<ReturnType<typeof parseEnqueue>>, persistent: boolean, nutritionistId: string): Promise<{ job: AiJob; context: Awaited<ReturnType<typeof contextFor>> }> {
  const context = await contextFor(patientId, persistent, nutritionistId, input.focus);
  const promptVersion = input.job_type === 'recipe' ? RECIPE_PROMPT_VERSION : MENU_PROMPT_VERSION;
  const enqueued = await repo.enqueueAiJob({
    id: input.id,
    patientId,
    jobType: input.job_type,
    promptVersion,
    contextHash: hashAiJobContext(context),
    persistent,
    nutritionistId,
  });
  if (enqueued.status === 'succeeded' || enqueued.status === 'failed' || enqueued.status === 'cancelled') {
    return { job: enqueued, context };
  }
  const started = await repo.startAiJob(enqueued.id, persistent, nutritionistId);
  try {
    if (input.job_type === 'recipe') {
      const generated = await generateRecipeProposal(context);
      return { job: await repo.completeAiJob(started.id, generated.cost_tokens, { kind: 'recipe', payload: generated.proposal }, persistent, nutritionistId), context };
    }
    const generated = await generateMenuProposal(context);
    return { job: await repo.completeAiJob(started.id, generated.cost_tokens, { kind: 'menu', payload: generated.proposal }, persistent, nutritionistId), context };
  } catch (error) {
    const failed = await repo.failAiJob(started.id, 'AI_UNAVAILABLE', persistent, nutritionistId);
    if (error instanceof repo.AiJobError) throw error;
    if (error instanceof AIUnavailableError) throw error;
    return { job: failed, context };
  }
}

async function applyJob(patientId: string, job: AiJob, persistent: boolean, nutritionistId: string) {
  const context = await contextFor(patientId, persistent, nutritionistId);
  const board = job.job_type === 'menu' ? await loadPlanBoard(patientId, persistent, true, nutritionistId) : { open: null, published: null };
  const concurrent = Boolean(board.open && board.open.id !== job.id);
  assertCanApply(job, context, concurrent);
  const artifact = job.artifact;
  if (!artifact) throw new repo.AiJobError(409, 'La propuesta todavía no está lista para guardar.');
  if (artifact.kind === 'recipe') {
    const payload = artifact.payload;
    const recipe = await saveRecipe({
      id: job.id,
      title: payload.title,
      ingredients: payload.ingredients,
      steps: payload.steps,
      explanation: payload.explanation,
      servings: payload.servings,
      nutrient_source: payload.nutrient_source,
    }, persistent, nutritionistId);
    return { kind: 'recipe' as const, recipe };
  }
  const catalog = (await listRecipes(persistent, true, nutritionistId)).filter((recipe) => recipe.published_at);
  const slots: PlanSlot[] = artifact.payload.slots.map((item) => {
    const match = catalog.find((recipe) => recipe.title === item.title);
    return {
      day: item.day,
      slot: item.slot,
      title: item.title,
      recipe_id: match?.id ?? null,
      servings: match?.servings ?? null,
    };
  });
  const plan = await savePlan(patientId, {
    id: board.open?.id ?? job.id,
    period_start: mondayOf(board.open?.period_start ?? board.published?.period_start ?? mondayOf()),
    slots,
    expected_version: board.open?.version ?? board.published?.version ?? 0,
  }, persistent, nutritionistId);
  return { kind: 'menu' as const, plan };
}

export function registerAiJobRoutes(app: Hono) {
  app.get('/api/patients/:id/ai-jobs', async (c) => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professionalAccess(c, id);
    const listed = await repo.listAiJobs(id, persistent, nutritionistId);
    return c.json({ jobs: listed.map(repo.toAiJobView), source: persistent ? 'supabase' : 'memory' });
  });
  app.post('/api/patients/:id/ai-jobs', async (c) => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professionalAccess(c, id);
    await requireCareConsent(id, persistent, 'ai_menu_draft');
    const { job, context } = await runJob(id, await parseEnqueue(c), persistent, nutritionistId);
    return c.json({ job: jobView(job, context), source: persistent ? 'supabase' : 'memory' });
  });
  app.get('/api/patients/:id/ai-jobs/:jobId', async (c) => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professionalAccess(c, id);
    const job = await repo.getAiJob(c.req.param('jobId'), persistent, nutritionistId);
    if (!job || job.patient_id !== id) throw new repo.AiJobError(404, 'No encontramos esa propuesta.');
    return c.json({ job: jobView(job, await contextFor(id, persistent, nutritionistId)), source: persistent ? 'supabase' : 'memory' });
  });
  app.post('/api/patients/:id/ai-jobs/:jobId/cancel', async (c) => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professionalAccess(c, id);
    const current = await repo.getAiJob(c.req.param('jobId'), persistent, nutritionistId);
    if (!current || current.patient_id !== id) throw new repo.AiJobError(404, 'No encontramos esa propuesta.');
    const job = await repo.cancelAiJob(current.id, persistent, nutritionistId);
    return c.json({ job: repo.toAiJobView(job) });
  });
  app.post('/api/patients/:id/ai-jobs/:jobId/apply', async (c) => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professionalAccess(c, id);
    const job = await repo.getAiJob(c.req.param('jobId'), persistent, nutritionistId);
    if (!job || job.patient_id !== id) throw new repo.AiJobError(404, 'No encontramos esa propuesta.');
    const applied = await applyJob(id, job, persistent, nutritionistId);
    return c.json(applied);
  });
}
