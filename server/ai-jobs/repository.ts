import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { requireCareConsent } from '../care/consents.js';
import { saveRecipeDraft } from '../recipes/repository.js';
import { getProfessionalMealPlan, saveMealPlanDraft } from '../plans/repository.js';
import { listProfessionalRecipes } from '../recipes/repository.js';
import { generateRecipeDraft } from '../ai/recipe-draft.js';
import { generateMenuDraft } from '../ai/menu-draft.js';
import { AIUnavailableError } from '../ai/errors.js';
import { resolveAiMode } from '../ai/mode.js';
import { resolveAiProvider } from '../ai/provider.js';
import {
  assertJobTokenBudget,
  buildMenuJobContext,
  buildRecipeJobContext,
  estimateTokens,
  hashAiContext,
  promptVersionFor,
} from '../ai/context.js';
import {
  AI_JOB_MAX_ACTIVE,
  AI_JOB_MONTHLY_TOKEN_BUDGET,
  AI_JOB_TIMEOUT_MS,
  AI_JOB_LEASE_MS,
  aiJobEnqueueSchema,
  type AiJobEnqueueInput,
  type AiJobStatus,
  type AiJobType,
  type AiJobView,
} from '../../src/types/ai-jobs.js';
import type { RecipeDraftInput } from '../../src/types/recipes.js';
import type { MealPlanDraftInput } from '../../src/types/plans.js';
import { getTarget } from '../targets/repository.js';
import { nutrientAmountsSchema } from '../../src/types/ai-nutrition.js';

export { CareError } from '../care/errors.js';

const MISSING_SCHEMA = ['42P01', '42883', 'PGRST202', 'PGRST205', '42703'];

type MemJob = AiJobView & {
  nutritionist_id: string;
  requested_by: string;
  context: unknown;
  expires_at: number;
};

const jobs = new Map<string, MemJob>();

export function resetAiJobMemory() {
  jobs.clear();
}

export function aiJobDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (MISSING_SCHEMA.includes(error.code ?? '')) {
    throw new CareError(501, 'Los jobs de IA requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT404' || error.code === 'PGRST116') throw new CareError(404, 'No encontramos ese job de IA.');
  if (error.code === 'PT409') {
    if (error.message === 'ai_job_allergies') {
      throw new CareError(409, 'Completá alergias y restricciones con el paciente antes de generar alternativas.');
    }
    throw new CareError(409, 'Ese borrador ya no se puede aplicar. Regenerá la propuesta.');
  }
  if (error.code === 'PT429') {
    throw new CareError(429, 'Se alcanzó el límite de jobs o de tokens de este mes.');
  }
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá el tipo de job, el paciente y el período.');
  }
  throw new CareError(503, 'No se pudo preparar el job de IA. Reintentá sin duplicar la solicitud.');
}

function asWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function asStatus(value: unknown): AiJobStatus {
  if (value === 'queued' || value === 'running' || value === 'succeeded' || value === 'failed' || value === 'cancelled' || value === 'stale') {
    return value;
  }
  throw new CareError(503, 'No se pudo preparar el job de IA. Reintentá sin duplicar la solicitud.');
}

function asType(value: unknown): AiJobType {
  if (value === 'recipe_draft' || value === 'menu_draft') return value;
  throw new CareError(400, 'Revisá el tipo de job, el paciente y el período.');
}

export function asAiJob(row: Record<string, unknown>): AiJobView {
  const request = row.request && typeof row.request === 'object' && !Array.isArray(row.request)
    ? row.request as Record<string, unknown>
    : {};
  const artifactRaw = row.artifact;
  let artifact: AiJobView['artifact'] = null;
  if (artifactRaw && typeof artifactRaw === 'object') {
    const item = artifactRaw as Record<string, unknown>;
    const kind = item.kind;
    if (kind === 'recipe_draft' || kind === 'menu_draft' || kind === 'replacement') {
      artifact = {
        id: String(item.id),
        kind,
        payload: (item.payload && typeof item.payload === 'object' ? item.payload : {}) as Record<string, unknown>,
        created_at: String(item.created_at),
      };
    }
  }
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    job_type: asType(row.job_type),
    status: asStatus(row.status),
    model: String(row.model ?? 'demo'),
    prompt_version: String(row.prompt_version),
    context_hash: String(row.context_hash),
    attempt: Number(row.attempt ?? 0),
    cost_tokens: row.cost_tokens == null ? null : Number(row.cost_tokens),
    error_code: row.error_code == null ? null : String(row.error_code),
    warnings: asWarnings(row.warnings),
    created_at: String(row.created_at),
    started_at: row.started_at == null ? null : String(row.started_at),
    finished_at: row.finished_at == null ? null : String(row.finished_at),
    applied_at: row.applied_at == null ? null : String(row.applied_at),
    request: {
      ...(request._write_base && typeof request._write_base === 'object' ? { _write_base: request._write_base as AiJobView['request']['_write_base'] } : {}),
      title_hint: typeof request.title_hint === 'string' ? request.title_hint : null,
      period_start: typeof request.period_start === 'string' ? request.period_start : null,
      period_end: typeof request.period_end === 'string' ? request.period_end : null,
      slots: Array.isArray(request.slots) ? request.slots.map((slot) => String(slot)) : [],
      ...(Array.isArray(request.dietary_preferences) ? { dietary_preferences: request.dietary_preferences.map(String) } : {}),
    },
    artifact,
  };
}

function publicJob(job: MemJob): AiJobView {
  const { nutritionist_id: _n, requested_by: _r, context: _c, expires_at: _e, ...view } = job;
  return view;
}

function monthStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
  }).format(now);
  return `${parts}-01`;
}

async function buildContext(nutritionistId: string, input: AiJobEnqueueInput, persistent: boolean) {
  const bundle = await requireCareConsent(input.patient_id, persistent, 'ai_menu_draft');
  const intake = bundle.intake.payload;
  const validity = bundle.intake.revision ? { intake_revision: bundle.intake.revision,
    consent_event_id: bundle.consents.filter((entry) => entry.purpose === 'ai_menu_draft').slice(-1)[0]?.id ?? null } : undefined;
  if (input.job_type === 'recipe_draft') {
    return { ...buildRecipeJobContext({ intake, titleHint: input.title_hint }), ...(validity ? { validity } : {}) };
  }
  const catalog = await listProfessionalRecipes(nutritionistId, persistent);
  const target = await getTarget(input.patient_id, persistent);
  return { ...buildMenuJobContext({
    intake,
    periodStart: input.period_start,
    periodEnd: input.period_end,
    slots: input.slots,
    dietaryPreferences: input.dietary_preferences,
    catalogTitles: catalog.filter((recipe) => recipe.published).map((recipe) => recipe.published!.title ?? recipe.title),
    catalog: catalog.filter((recipe) => recipe.published).map((recipe) => {
      const version = recipe.published!;
      const declared = nutrientAmountsSchema.safeParse(version.card?.macros);
      return {
        id: recipe.id, version: version.version, title: version.title ?? recipe.title,
        yield_portions: version.yield_portions, steps: version.steps,
        ingredients: version.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
        nutrition: version.nutrition ?? (declared.success && version.nutrient_source ? {
          origin: version.nutrient_source.startsWith('estimacion_ia.') || version.nutrient_source.startsWith('propuesta_ia.') ? 'ai_estimate' as const : 'declared' as const,
          source: version.nutrient_source, per_portion: declared.data,
        } : null),
      };
    }),
    confirmedTarget: target?.published_at ? {
      kcal: target.result.kcal, protein_g: target.result.protein_g, carbs_g: target.result.carbs_g, fat_g: target.result.fat_g,
      revision: target.updated_at, published_at: target.published_at,
    } : null,
    weekPlan: persistent ? [] : (getPatient(input.patient_id)?.weekPlan ?? []),
  }), ...(validity ? { validity } : {}) };
}

function assertMemoryBudget(nutritionistId: string, tokens: number) {
  const start = monthStart();
  const mine = [...jobs.values()].filter((job) => job.nutritionist_id === nutritionistId);
  for (const job of mine) {
    if ((job.status === 'queued' || job.status === 'running') && job.expires_at <= Date.now()) {
      job.status = 'failed'; job.error_code = 'job_expired'; job.finished_at = new Date().toISOString(); job.artifact = null;
    }
  }
  const used = mine
    .filter((job) => job.created_at.slice(0, 10) >= start)
    .reduce((sum, job) => sum + (job.cost_tokens ?? 0), 0);
  if (used + tokens > AI_JOB_MONTHLY_TOKEN_BUDGET) {
    throw new CareError(429, 'Se alcanzó el límite de jobs o de tokens de este mes.');
  }
  const active = mine.filter((job) => job.status === 'queued' || job.status === 'running').length;
  if (active >= AI_JOB_MAX_ACTIVE) {
    throw new CareError(429, 'Se alcanzó el límite de jobs o de tokens de este mes.');
  }
  assertJobTokenBudget(tokens);
}

async function callRpc(name: string, args: Record<string, unknown>) {
  let error: { code?: string; message?: string } | null = null;
  let data: unknown = null;
  try {
    const result = await getRequestDb().rpc(name, args);
    error = result.error;
    data = result.data;
  } catch (caught) {
    if (caught instanceof CareError) throw caught;
    aiJobDbError(caught as { code?: string; message?: string });
    throw new CareError(503, 'No se pudo preparar el job de IA. Reintentá sin duplicar la solicitud.');
  }
  aiJobDbError(error);
  return data;
}

export async function enqueueAiJob(
  nutritionistId: string,
  actorId: string,
  input: AiJobEnqueueInput,
  persistent: boolean,
): Promise<AiJobView> {
  if (!aiJobEnqueueSchema.safeParse(input).success) throw new CareError(400, 'Revisá el tipo de job, el paciente y el período.');
  if (!persistent && !getPatient(input.patient_id)) throw new CareError(404, 'Paciente no encontrado.');
  const context = await buildContext(nutritionistId, input, persistent);
  const tokens = estimateTokens(context);
  const hash = hashAiContext(context);
  const promptVersion = promptVersionFor(input.job_type);
  const model = resolveAiMode() === 'live' ? resolveAiProvider()?.model ?? 'unavailable' : 'demo';
  const request = {
    title_hint: input.title_hint ?? null,
    period_start: input.period_start ?? null,
    period_end: input.period_end ?? null,
    slots: input.slots ?? [],
    ...(input.dietary_preferences ? { dietary_preferences: input.dietary_preferences } : {}),
  };
  if (!persistent) {
    assertMemoryBudget(nutritionistId, tokens);
    const current = input.job_type === 'menu_draft' ? await getProfessionalMealPlan(nutritionistId, input.patient_id, false) : null;
    const base = input.job_type === 'menu_draft' ? { plan_id: current?.id ?? randomUUID(), revision: current?.current.revision ?? null } : { recipe_id: randomUUID(), revision: null };
    const stamp = new Date().toISOString();
    const job: MemJob = {
      id: randomUUID(),
      patient_id: input.patient_id,
      nutritionist_id: nutritionistId,
      requested_by: actorId,
      job_type: input.job_type,
      status: 'queued',
      model,
      prompt_version: promptVersion,
      context_hash: hash,
      request: { ...request, _write_base: base },
      context,
      expires_at: Date.now() + AI_JOB_LEASE_MS,
      attempt: 0,
      cost_tokens: null,
      error_code: null,
      warnings: [],
      created_at: stamp,
      started_at: null,
      finished_at: null,
      applied_at: null,
      artifact: null,
    };
    jobs.set(job.id, job);
    return publicJob(job);
  }
  const data = await callRpc('enqueue_ai_job', {
    payload: {
      patient_id: input.patient_id,
      job_type: input.job_type,
      prompt_version: promptVersion,
      context_hash: hash,
      model,
      estimated_tokens: tokens,
      request,
    },
  });
  return asAiJob(data as Record<string, unknown>);
}

export async function getAiJob(nutritionistId: string, jobId: string, persistent: boolean): Promise<AiJobView> {
  if (!persistent) {
    const job = jobs.get(jobId);
    if (!job) throw new CareError(404, 'No encontramos ese job de IA.');
    if (job.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para esta acción.');
    return publicJob(job);
  }
  const data = await callRpc('get_ai_job', { target_job: jobId });
  const job = asAiJob(data as Record<string, unknown>);
  if (job && nutritionistId && job.patient_id) return job;
  return job;
}

export async function listAiJobs(nutritionistId: string, patientId: string, persistent: boolean): Promise<AiJobView[]> {
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    return [...jobs.values()]
      .filter((job) => job.nutritionist_id === nutritionistId && job.patient_id === patientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(publicJob);
  }
  const data = await callRpc('list_ai_jobs', { target_patient: patientId });
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => asAiJob(row as Record<string, unknown>));
}

async function currentHash(job: Pick<MemJob, 'job_type' | 'patient_id' | 'request' | 'nutritionist_id'>, persistent: boolean) {
  const input: AiJobEnqueueInput = {
    patient_id: job.patient_id,
    job_type: job.job_type,
    title_hint: job.request.title_hint ?? undefined,
    period_start: job.request.period_start ?? undefined,
    period_end: job.request.period_end ?? undefined,
    slots: job.request.slots.length ? job.request.slots as AiJobEnqueueInput['slots'] : undefined,
    dietary_preferences: job.request.dietary_preferences,
  };
  const context = await buildContext(job.nutritionist_id, input, persistent);
  return { context, hash: hashAiContext(context), tokens: estimateTokens(context) };
}

export async function runAiJob(nutritionistId: string, jobId: string, persistent: boolean): Promise<AiJobView> {
  const memory = persistent ? null : jobs.get(jobId);
  if (!persistent && (!memory || memory.nutritionist_id !== nutritionistId)) throw new CareError(404, 'No encontramos ese job de IA.');
  const existing = persistent ? await getAiJob(nutritionistId, jobId, true) : publicJob(memory!);
  if (existing.status !== 'queued') return existing;
  let runToken: string | undefined;
  if (persistent) {
    const claimed = await callRpc('claim_ai_job', { target_job: jobId }) as Record<string, unknown>;
    if (claimed.status !== 'running') return asAiJob(claimed);
    if (typeof claimed.run_token !== 'string') throw new CareError(503, 'No se pudo reservar el intento de IA.');
    runToken = String(claimed.run_token);
  } else {
    if (memory!.expires_at <= Date.now()) {
      memory!.status = 'failed'; memory!.error_code = 'job_expired'; memory!.finished_at = new Date().toISOString();
      return publicJob(memory!);
    }
    memory!.status = 'running'; memory!.started_at = new Date().toISOString(); memory!.attempt += 1;
    memory!.expires_at = Date.now() + AI_JOB_LEASE_MS;
  }
  let tokens = 0;
  let hash = existing.context_hash;
  const finish = async (status: AiJobStatus, artifact: AiJobView['artifact'] = null, warnings: string[] = [], errorCode?: string) => {
    if (persistent) return asAiJob(await callRpc('finish_ai_job', { payload: {
      id: jobId, run_token: runToken, status, cost_tokens: tokens,
      current_context_hash: hash, error_code: errorCode, warnings, artifact,
    } }) as Record<string, unknown>);
    // A recovered/expired attempt can never become successful after its provider returns.
    if (memory!.status !== 'running' || memory!.expires_at <= Date.now()) {
      if (memory!.status === 'running') {
        memory!.status = 'failed'; memory!.error_code = 'job_expired'; memory!.finished_at = new Date().toISOString(); memory!.artifact = null;
      }
      return publicJob(memory!);
    }
    memory!.status = status; memory!.cost_tokens = tokens; memory!.finished_at = new Date().toISOString();
    memory!.error_code = errorCode ?? null; memory!.warnings = warnings; memory!.artifact = status === 'succeeded' ? artifact : null;
    return publicJob(memory!);
  };
  try {
    const live = await currentHash({ ...existing, nutritionist_id: nutritionistId }, persistent);
    hash = live.hash; tokens = live.tokens; assertJobTokenBudget(tokens);
    if (hash !== existing.context_hash) return await finish('stale', null, [], 'stale_context');
    const base = existing.request._write_base;
    if (!base || (existing.job_type === 'menu_draft' ? !base.plan_id : !base.recipe_id)) return await finish('stale', null, [], 'stale_context');
    let artifact: NonNullable<AiJobView['artifact']>;
    let warnings: string[];
    if (existing.job_type === 'recipe_draft') {
      const result = await generateRecipeDraft(live.context as Parameters<typeof generateRecipeDraft>[0]);
      artifact = { id: randomUUID(), kind: 'recipe_draft', payload: { ...result.recipe, id: base.recipe_id!, expected_revision: base.revision } as unknown as Record<string, unknown>, created_at: new Date().toISOString() };
      warnings = result.warnings;
    } else {
      const result = await generateMenuDraft(live.context as Parameters<typeof generateMenuDraft>[0], base.plan_id);
      artifact = { id: randomUUID(), kind: 'menu_draft', payload: { ...result.plan, id: base.plan_id!, expected_revision: base.revision } as unknown as Record<string, unknown>, created_at: new Date().toISOString() };
      warnings = result.warnings;
    }
    const latest = await currentHash({ ...existing, nutritionist_id: nutritionistId }, persistent);
    hash = latest.hash;
    if (hash !== existing.context_hash) return await finish('stale', null, [], 'stale_context');
    return await finish('succeeded', artifact, warnings);
  } catch (error) {
    await finish('failed', null, [], error instanceof AIUnavailableError ? 'AI_UNAVAILABLE' : 'job_failed');
    if (error instanceof CareError || error instanceof AIUnavailableError) throw error;
    throw new AIUnavailableError();
  }
}

export async function applyAiJob(nutritionistId: string, jobId: string, persistent: boolean): Promise<AiJobView> {
  if (!persistent) {
    const job = jobs.get(jobId);
    if (!job || job.nutritionist_id !== nutritionistId) throw new CareError(404, 'No encontramos ese job de IA.');
    if (job.status !== 'succeeded' || !job.artifact) {
      throw new CareError(409, 'Ese borrador ya no se puede aplicar. Regenerá la propuesta.');
    }
    if (job.applied_at) return publicJob(job);
    const latest = await currentHash(job, false);
    if (latest.hash !== job.context_hash) throw new CareError(409, 'El ingreso cambió. Regenerá la propuesta.');
    if (job.artifact.kind === 'recipe_draft') {
      const recipe = await saveRecipeDraft(nutritionistId, job.artifact.payload as unknown as RecipeDraftInput, false);
      if (recipe.current.published_at) throw new CareError(409, 'Ese borrador ya no se puede aplicar. Regenerá la propuesta.');
    }
    if (job.artifact.kind === 'menu_draft') {
      const plan = await saveMealPlanDraft(nutritionistId, job.patient_id, job.artifact.payload as unknown as MealPlanDraftInput, false);
      if (plan.current.published_at) throw new CareError(409, 'Ese borrador ya no se puede aplicar. Regenerá la propuesta.');
    }
    job.applied_at = new Date().toISOString();
    return publicJob(job);
  }
  const existing = await getAiJob(nutritionistId, jobId, true);
  if (!existing.applied_at) {
    const latest = await currentHash({ ...existing, nutritionist_id: nutritionistId }, true);
    if (latest.hash !== existing.context_hash) throw new CareError(409, 'El ingreso cambió. Regenerá la propuesta.');
  }
  const data = await callRpc('apply_ai_job', { target_job: jobId });
  return asAiJob(data as Record<string, unknown>);
}

export async function rejectAiJob(nutritionistId: string, jobId: string, persistent: boolean): Promise<AiJobView> {
  if (!persistent) {
    const job = jobs.get(jobId);
    if (!job) throw new CareError(404, 'No encontramos ese job de IA.');
    if (job.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para esta acción.');
    if (job.status === 'cancelled') return publicJob(job);
    if (job.status !== 'succeeded' || job.applied_at) {
      throw new CareError(409, 'Ese borrador ya no se puede rechazar.');
    }
    job.status = 'cancelled';
    job.error_code = 'rejected_by_nutritionist';
    job.artifact = null;
    return publicJob(job);
  }
  const data = await callRpc('reject_ai_job', { target_job: jobId });
  return asAiJob(data as Record<string, unknown>);
}

export function memoryJobContext(jobId: string) {
  return jobs.get(jobId)?.context ?? null;
}

export const AI_JOB_LIMITS = { timeoutMs: AI_JOB_TIMEOUT_MS, maxTokens: 8000, monthly: AI_JOB_MONTHLY_TOKEN_BUDGET, maxActive: AI_JOB_MAX_ACTIVE };
