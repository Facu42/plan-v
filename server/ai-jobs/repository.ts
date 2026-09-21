import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { requireCareConsent } from '../care/consents.js';
import { saveRecipeDraft } from '../recipes/repository.js';
import { saveMealPlanDraft } from '../plans/repository.js';
import { listProfessionalRecipes } from '../recipes/repository.js';
import { generateRecipeDraft } from '../ai/recipe-draft.js';
import { generateMenuDraft } from '../ai/menu-draft.js';
import { AIUnavailableError } from '../ai/errors.js';
import { resolveAiMode } from '../ai/mode.js';
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
  type AiJobEnqueueInput,
  type AiJobStatus,
  type AiJobType,
  type AiJobView,
} from '../../src/types/ai-jobs.js';
import type { RecipeDraftInput } from '../../src/types/recipes.js';
import type { MealPlanDraftInput } from '../../src/types/plans.js';

export { CareError } from '../care/errors.js';

const MISSING_SCHEMA = ['42P01', '42883', 'PGRST202', 'PGRST205', '42703'];

type MemJob = AiJobView & {
  nutritionist_id: string;
  requested_by: string;
  context: unknown;
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
      title_hint: typeof request.title_hint === 'string' ? request.title_hint : null,
      period_start: typeof request.period_start === 'string' ? request.period_start : null,
      period_end: typeof request.period_end === 'string' ? request.period_end : null,
      slots: Array.isArray(request.slots) ? request.slots.map((slot) => String(slot)) : [],
    },
    artifact,
  };
}

function publicJob(job: MemJob): AiJobView {
  const { nutritionist_id: _n, requested_by: _r, context: _c, ...view } = job;
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
  if (input.job_type === 'recipe_draft') {
    return buildRecipeJobContext({ intake, titleHint: input.title_hint });
  }
  const catalog = await listProfessionalRecipes(nutritionistId, persistent);
  return buildMenuJobContext({
    intake,
    periodStart: input.period_start,
    periodEnd: input.period_end,
    slots: input.slots,
    catalogTitles: catalog.filter((recipe) => recipe.published).map((recipe) => recipe.title),
    weekPlan: persistent ? [] : (getPatient(input.patient_id)?.weekPlan ?? []),
  });
}

function assertMemoryBudget(nutritionistId: string, tokens: number) {
  const start = monthStart();
  const mine = [...jobs.values()].filter((job) => job.nutritionist_id === nutritionistId);
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
  if (!persistent && !getPatient(input.patient_id)) throw new CareError(404, 'Paciente no encontrado.');
  const context = await buildContext(nutritionistId, input, persistent);
  const tokens = estimateTokens(context);
  const hash = hashAiContext(context);
  const promptVersion = promptVersionFor(input.job_type);
  const model = resolveAiMode() === 'live' ? 'gpt-4o-mini' : 'demo';
  const request = {
    title_hint: input.title_hint ?? null,
    period_start: input.period_start ?? null,
    period_end: input.period_end ?? null,
    slots: input.slots ?? [],
  };
  if (!persistent) {
    assertMemoryBudget(nutritionistId, tokens);
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
      request,
      context,
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
  };
  const context = await buildContext(job.nutritionist_id, input, persistent);
  return { context, hash: hashAiContext(context), tokens: estimateTokens(context) };
}

export async function runAiJob(nutritionistId: string, jobId: string, persistent: boolean): Promise<AiJobView> {
  if (!persistent) {
    const job = jobs.get(jobId);
    if (!job || job.nutritionist_id !== nutritionistId) throw new CareError(404, 'No encontramos ese job de IA.');
    if (job.status === 'succeeded' || job.status === 'stale' || job.status === 'cancelled') return publicJob(job);
    job.status = 'running';
    job.started_at = new Date().toISOString();
    job.attempt += 1;
    try {
      const live = await currentHash(job, false);
      const tokens = Math.max(live.tokens, estimateTokens(job.context));
      assertJobTokenBudget(tokens);
      if (live.hash !== job.context_hash) {
        job.status = 'stale';
        job.finished_at = new Date().toISOString();
        job.cost_tokens = tokens;
        job.error_code = 'stale_context';
        return publicJob(job);
      }
      if (job.job_type === 'recipe_draft') {
        const result = await generateRecipeDraft(job.context as Parameters<typeof generateRecipeDraft>[0]);
        job.artifact = {
          id: randomUUID(),
          kind: 'recipe_draft',
          payload: result.recipe as unknown as Record<string, unknown>,
          created_at: new Date().toISOString(),
        };
        job.warnings = result.warnings;
        job.model = result.source === 'demo' ? 'demo' : job.model;
      } else {
        const result = await generateMenuDraft(job.context as Parameters<typeof generateMenuDraft>[0]);
        job.artifact = {
          id: randomUUID(),
          kind: 'menu_draft',
          payload: result.plan as unknown as Record<string, unknown>,
          created_at: new Date().toISOString(),
        };
        job.warnings = result.warnings;
        job.model = result.source === 'demo' ? 'demo' : job.model;
      }
      job.status = 'succeeded';
      job.cost_tokens = tokens;
      job.finished_at = new Date().toISOString();
      return publicJob(job);
    } catch (error) {
      job.status = 'failed';
      job.finished_at = new Date().toISOString();
      job.error_code = error instanceof AIUnavailableError ? 'AI_UNAVAILABLE' : 'job_failed';
      if (error instanceof CareError || error instanceof AIUnavailableError) throw error;
      throw new AIUnavailableError();
    }
  }

  const existing = await getAiJob(nutritionistId, jobId, true);
  if (existing.status === 'succeeded' || existing.status === 'stale' || existing.status === 'cancelled') return existing;
  const live = await currentHash({
    job_type: existing.job_type,
    patient_id: existing.patient_id,
    nutritionist_id: nutritionistId,
    request: existing.request,
  }, true);
  let artifact: { kind: 'recipe_draft' | 'menu_draft'; payload: Record<string, unknown> } | null = null;
  let warnings: string[] = [];
  let status: AiJobStatus = 'succeeded';
  let errorCode: string | undefined;
  try {
    if (live.hash !== existing.context_hash) {
      status = 'stale';
      errorCode = 'stale_context';
    } else if (existing.job_type === 'recipe_draft') {
      const result = await generateRecipeDraft(live.context as Parameters<typeof generateRecipeDraft>[0]);
      artifact = { kind: 'recipe_draft', payload: result.recipe as unknown as Record<string, unknown> };
      warnings = result.warnings;
    } else {
      const result = await generateMenuDraft(live.context as Parameters<typeof generateMenuDraft>[0]);
      artifact = { kind: 'menu_draft', payload: result.plan as unknown as Record<string, unknown> };
      warnings = result.warnings;
    }
  } catch (error) {
    status = 'failed';
    errorCode = error instanceof AIUnavailableError ? 'AI_UNAVAILABLE' : 'job_failed';
    await callRpc('finish_ai_job', {
      payload: { id: jobId, status, error_code: errorCode, cost_tokens: live.tokens, current_context_hash: live.hash },
    });
    if (error instanceof CareError || error instanceof AIUnavailableError) throw error;
    throw new AIUnavailableError();
  }
  const data = await callRpc('finish_ai_job', {
    payload: {
      id: jobId,
      status,
      cost_tokens: live.tokens,
      current_context_hash: live.hash,
      error_code: errorCode,
      warnings,
      artifact,
    },
  });
  return asAiJob(data as Record<string, unknown>);
}

export async function applyAiJob(nutritionistId: string, jobId: string, persistent: boolean): Promise<AiJobView> {
  if (!persistent) {
    const job = jobs.get(jobId);
    if (!job || job.nutritionist_id !== nutritionistId) throw new CareError(404, 'No encontramos ese job de IA.');
    if (job.status !== 'succeeded' || !job.artifact) {
      throw new CareError(409, 'Ese borrador ya no se puede aplicar. Regenerá la propuesta.');
    }
    if (job.applied_at) return publicJob(job);
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
  const data = await callRpc('apply_ai_job', { target_job: jobId });
  return asAiJob(data as Record<string, unknown>);
}

export function memoryJobContext(jobId: string) {
  return jobs.get(jobId)?.context ?? null;
}

export const AI_JOB_LIMITS = { timeoutMs: AI_JOB_TIMEOUT_MS, maxTokens: 8000, monthly: AI_JOB_MONTHLY_TOKEN_BUDGET, maxActive: AI_JOB_MAX_ACTIVE };
