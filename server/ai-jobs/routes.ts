import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { authorizePatientAction } from '../security/authorization.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { aiJobEnqueueSchema } from '../../src/types/ai-jobs.js';
import * as repo from './repository.js';

async function professional(c: Context, patientId?: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (patientId && !getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    return { persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID, actorId: 'demo-nutri' };
  }
  if (patientId) {
    const actor = await authorizePatientAction(auth.userId, patientId, 'generate_ai_job', {
      getActor: sb.sbGetActor,
      getPatientResource: sb.sbGetPatientResource,
    });
    if (!actor || actor.role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    return { persistent: true, nutritionistId: actor.nutritionistId, actorId: auth.userId };
  }
  const actor = await sb.sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, nutritionistId: actor.nutritionistId, actorId: auth.userId };
}

async function body(c: Context) {
  const raw = await c.req.text();
  if (raw.length > 8_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return aiJobEnqueueSchema.parse(JSON.parse(raw)); }
  catch { throw new repo.CareError(400, 'Revisá el tipo de job, el paciente y el período.'); }
}

const jobIdParam = z.uuid();

export function registerAiJobRoutes(app: Hono) {
  app.post('/api/ai/jobs', async (c) => {
    const input = await body(c);
    const { persistent, nutritionistId, actorId } = await professional(c, input.patient_id);
    const queued = await repo.enqueueAiJob(nutritionistId, actorId, input, persistent);
    const job = await repo.runAiJob(nutritionistId, queued.id, persistent);
    return c.json({ job, source: persistent ? 'supabase' : 'memory' }, 202);
  });

  app.get('/api/ai/jobs/:id', async (c) => {
    const id = jobIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá el tipo de job, el paciente y el período.');
    const { persistent, nutritionistId } = await professional(c);
    const job = await repo.getAiJob(nutritionistId, id.data, persistent);
    return c.json({ job, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/ai/jobs/:id/apply', async (c) => {
    const id = jobIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá el tipo de job, el paciente y el período.');
    const { persistent, nutritionistId } = await professional(c);
    const current = await repo.getAiJob(nutritionistId, id.data, persistent);
    const { persistent: accessPersistent } = await professional(c, current.patient_id);
    const job = await repo.applyAiJob(nutritionistId, id.data, accessPersistent);
    return c.json({ job, source: persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/patients/:id/ai/jobs', async (c) => {
    const patientId = c.req.param('id');
    const { persistent, nutritionistId } = await professional(c, patientId);
    const jobs = await repo.listAiJobs(nutritionistId, patientId, persistent);
    return c.json({ jobs, source: persistent ? 'supabase' : 'memory' });
  });
}
