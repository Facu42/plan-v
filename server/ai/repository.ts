import { getRequestDb } from '../db/supabase-client.js';
import type { AiJob, AiJobArtifact, AiJobType } from '../../src/types/ai-jobs.js';

export class AiJobError extends Error {
  constructor(public status: 400 | 403 | 404 | 409 | 501 | 503, message: string) {
    super(message);
    this.name = 'AiJobError';
  }
}

const jobs = new Map<string, AiJob>();

export function resetAiJobMemory() {
  jobs.clear();
}

export function toAiJobView(job: AiJob) {
  const { nutritionist_id: _owner, ...view } = job;
  return view;
}

function jobDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new AiJobError(501, 'Las propuestas de IA requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new AiJobError(403, 'Sólo tu nutricionista puede pedir o ver estas propuestas.');
  if (error.code === 'PT404') throw new AiJobError(404, 'No encontramos esa propuesta.');
  if (error.code === 'PT409' || error.code === '23505') {
    throw new AiJobError(409, 'Ya hay una propuesta en curso o esa solicitud no coincide. Recargá y reintentá.');
  }
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new AiJobError(400, 'Revisá el tipo de propuesta y los datos del pedido.');
  }
  throw new AiJobError(503, 'No se pudo guardar la propuesta. Reintentá sin cerrar el consultorio.');
}

function owned(patientId: string, nutritionistId: string) {
  return [...jobs.values()].filter((job) => job.patient_id === patientId && job.nutritionist_id === nutritionistId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listAiJobs(patientId: string, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<AiJob[]> {
  if (!persistent) return owned(patientId, nutritionistId).slice(0, 20);
  const { data, error } = await getRequestDb()
    .from('ai_jobs')
    .select('id,patient_id,nutritionist_id,job_type,status,prompt_version,context_hash,attempt,cost_tokens,error_code,created_at,started_at,finished_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(20);
  jobDbError(error);
  return (data ?? []).map((row) => ({ ...(row as Omit<AiJob, 'artifact'>), artifact: null }));
}

export async function getAiJob(id: string, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<AiJob | null> {
  if (!persistent) {
    const job = jobs.get(id);
    return job && job.nutritionist_id === nutritionistId ? job : null;
  }
  const db = getRequestDb();
  const { data, error } = await db.from('ai_jobs')
    .select('id,patient_id,nutritionist_id,job_type,status,prompt_version,context_hash,attempt,cost_tokens,error_code,created_at,started_at,finished_at')
    .eq('id', id)
    .maybeSingle();
  jobDbError(error);
  if (!data) return null;
  const { data: artifactRows, error: artifactError } = await db.from('ai_artifacts')
    .select('kind,payload')
    .eq('ai_job_id', id)
    .limit(1);
  jobDbError(artifactError);
  const artifact = artifactRows?.[0] as AiJobArtifact | undefined;
  return { ...(data as Omit<AiJob, 'artifact'>), artifact: artifact ?? null };
}

export async function enqueueAiJob(input: {
  id: string;
  patientId: string;
  jobType: AiJobType;
  promptVersion: string;
  contextHash: string;
  persistent: boolean;
  nutritionistId: string;
}): Promise<AiJob> {
  if (input.persistent) {
    const { data, error } = await getRequestDb().rpc('enqueue_ai_job', {
      job_id: input.id,
      patient_id: input.patientId,
      job_type: input.jobType,
      prompt_version: input.promptVersion,
      context_hash: input.contextHash,
    });
    jobDbError(error);
    return data as AiJob;
  }
  const existing = jobs.get(input.id);
  if (existing) {
    if (existing.patient_id !== input.patientId || existing.job_type !== input.jobType || existing.nutritionist_id !== input.nutritionistId) {
      throw new AiJobError(409, 'Ya hay una propuesta en curso o esa solicitud no coincide. Recargá y reintentá.');
    }
    return existing;
  }
  if (owned(input.patientId, input.nutritionistId).some((job) => job.job_type === input.jobType && (job.status === 'queued' || job.status === 'running'))) {
    throw new AiJobError(409, 'Ya hay una propuesta en curso o esa solicitud no coincide. Recargá y reintentá.');
  }
  const now = new Date().toISOString();
  const job: AiJob = {
    id: input.id,
    patient_id: input.patientId,
    nutritionist_id: input.nutritionistId,
    job_type: input.jobType,
    status: 'queued',
    prompt_version: input.promptVersion,
    context_hash: input.contextHash,
    attempt: 0,
    cost_tokens: null,
    error_code: null,
    created_at: now,
    started_at: null,
    finished_at: null,
    artifact: null,
  };
  jobs.set(job.id, job);
  return job;
}

export async function startAiJob(id: string, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<AiJob> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('start_ai_job', { job_id: id });
    jobDbError(error);
    return data as AiJob;
  }
  const job = jobs.get(id);
  if (!job || job.nutritionist_id !== nutritionistId) throw new AiJobError(404, 'No encontramos esa propuesta.');
  if (job.status === 'running') return job;
  if (job.status !== 'queued') throw new AiJobError(409, 'Esa propuesta ya no se puede ejecutar.');
  if (job.attempt >= 2) throw new AiJobError(409, 'Se alcanzó el límite de reintentos de esta propuesta.');
  const next: AiJob = { ...job, status: 'running', attempt: job.attempt + 1, started_at: new Date().toISOString(), error_code: null };
  jobs.set(id, next);
  return next;
}

export async function completeAiJob(id: string, costTokens: number, artifact: AiJobArtifact, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<AiJob> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('complete_ai_job', {
      job_id: id,
      cost_tokens: costTokens,
      artifact_kind: artifact.kind,
      payload: artifact.payload,
    });
    jobDbError(error);
    return data as AiJob;
  }
  const job = jobs.get(id);
  if (!job || job.nutritionist_id !== nutritionistId) throw new AiJobError(404, 'No encontramos esa propuesta.');
  if (job.status === 'succeeded') return job;
  if (job.status !== 'running') throw new AiJobError(409, 'Esa propuesta ya no se puede completar.');
  const next: AiJob = {
    ...job,
    status: 'succeeded',
    cost_tokens: costTokens,
    error_code: null,
    finished_at: new Date().toISOString(),
    artifact,
  };
  jobs.set(id, next);
  return next;
}

export async function failAiJob(id: string, errorCode: string, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<AiJob> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('fail_ai_job', { job_id: id, error_code: errorCode });
    jobDbError(error);
    return data as AiJob;
  }
  const job = jobs.get(id);
  if (!job || job.nutritionist_id !== nutritionistId) throw new AiJobError(404, 'No encontramos esa propuesta.');
  if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') return job;
  const next: AiJob = {
    ...job,
    status: 'failed',
    error_code: errorCode,
    finished_at: new Date().toISOString(),
  };
  jobs.set(id, next);
  return next;
}

export async function cancelAiJob(id: string, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<AiJob> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('cancel_ai_job', { job_id: id });
    jobDbError(error);
    return data as AiJob;
  }
  const job = jobs.get(id);
  if (!job || job.nutritionist_id !== nutritionistId) throw new AiJobError(404, 'No encontramos esa propuesta.');
  if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') return job;
  const next: AiJob = { ...job, status: 'cancelled', error_code: 'cancelled', finished_at: new Date().toISOString() };
  jobs.set(id, next);
  return next;
}
