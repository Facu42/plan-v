import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { mealPlanDraftSchema, mealPlanPublishSchema } from '../../src/types/plans.js';
import * as repo from './repository.js';

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 24_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.'); }
}

async function professional(c: Context, patientId?: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (patientId && !getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    return { persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID, role: 'nutri' as const };
  }
  if (patientId) {
    const actor = await authorizePatientAction(auth.userId, patientId, 'edit_menu', {
      getActor: sb.sbGetActor,
      getPatientResource: sb.sbGetPatientResource,
    });
    if (!actor || actor.role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    return { persistent: true, nutritionistId: actor.nutritionistId, role: 'nutri' as const };
  }
  const actor = await sb.sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, nutritionistId: actor.nutritionistId, role: 'nutri' as const };
}

async function readAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    const professional = c.req.query('audience') === 'pro';
    return { persistent: false, professional, nutritionistId: DEMO_NUTRITIONIST_ID };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, professional: actor.role === 'nutri', nutritionistId: actor.role === 'nutri' ? actor.nutritionistId : '' };
}

const planIdParam = z.uuid();

export function registerPlanRoutes(app: Hono) {
  app.get('/api/patients/:id/plans', async (c) => {
    const id = c.req.param('id');
    const { persistent, professional, nutritionistId } = await readAccess(c, id);
    if (professional) {
      const plan = await repo.getProfessionalMealPlan(nutritionistId, id, persistent);
      return c.json({ plan, source: persistent ? 'supabase' : 'memory' });
    }
    const plan = await repo.getPublishedMealPlan(id, persistent);
    return c.json({ plan, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/patients/:id/plans', async (c) => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professional(c, id);
    const input = await body(c, mealPlanDraftSchema);
    const plan = await repo.saveMealPlanDraft(nutritionistId, id, input, persistent);
    return c.json({ plan, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/plans/:id/publish', async (c) => {
    const id = planIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
    const { persistent, nutritionistId } = await professional(c);
    const input = await body(c, mealPlanPublishSchema);
    const plan = await repo.publishMealPlan(nutritionistId, id.data, input.expected_version, persistent);
    return c.json({ plan, source: persistent ? 'supabase' : 'memory' });
  });
}
