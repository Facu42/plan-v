import type { Hono, Context } from 'hono';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { planInputSchema, planPublishSchema } from '../../src/types/plans.js';
import * as repo from './repository.js';

async function parseSave(c: Context) {
  try { return planInputSchema.parse(JSON.parse(await c.req.text())); }
  catch { throw new repo.PlanError(400, 'Revisá la semana, los momentos y las recetas publicadas.'); }
}
async function parsePublish(c: Context) {
  try { return planPublishSchema.parse(JSON.parse(await c.req.text())); }
  catch { throw new repo.PlanError(400, 'La versión esperada no coincide.'); }
}
async function professionalAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (c.req.query('audience') !== 'pro') throw new repo.PlanError(403, 'Sólo tu nutricionista puede editar el plan.');
    if (!getPatient(patientId)) throw new repo.PlanError(404, 'Paciente no encontrado.');
    return { persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'edit_menu', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor || actor.role !== 'nutri' || !actor.nutritionistId) throw new repo.PlanError(403, 'Sólo tu nutricionista puede editar el plan.');
  return { persistent: true, nutritionistId: actor.nutritionistId };
}
async function patientAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.PlanError(404, 'Paciente no encontrado.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor) throw new repo.PlanError(403, 'No tenés permiso para ver este plan.');
  return { persistent: true };
}

export function registerPlanRoutes(app: Hono) {
  app.get('/api/patients/:id/plans', async c => {
    const id = c.req.param('id');
    const professional = c.req.query('audience') === 'pro';
    if (professional) {
      const { persistent, nutritionistId } = await professionalAccess(c, id);
      const board = await repo.loadPlanBoard(id, persistent, true, nutritionistId);
      return c.json({
        open: board.open ? repo.toPlanView(board.open) : null,
        published: board.published ? repo.toPlanView(board.published) : null,
        source: persistent ? 'supabase' : 'memory',
      });
    }
    const { persistent } = await patientAccess(c, id);
    const board = await repo.loadPlanBoard(id, persistent, false);
    return c.json({
      open: null,
      published: board.published ? repo.toPlanView(board.published) : null,
      source: persistent ? 'supabase' : 'memory',
    });
  });
  app.put('/api/patients/:id/plans', async c => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professionalAccess(c, id);
    const plan = await repo.savePlan(id, await parseSave(c), persistent, nutritionistId);
    return c.json({ plan: repo.toPlanView(plan) });
  });
  app.post('/api/patients/:id/plans/:planId/publish', async c => {
    const id = c.req.param('id');
    const { persistent, nutritionistId } = await professionalAccess(c, id);
    const body = await parsePublish(c);
    const plan = await repo.publishPlan(id, c.req.param('planId'), body.expected_version, persistent, nutritionistId);
    return c.json({ plan: repo.toPlanView(plan) });
  });
}
