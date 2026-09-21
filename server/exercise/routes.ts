import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { toPatientSelfView } from '../security/contracts.js';
import {
  activityLogInputSchema,
  assignRoutineSchema,
  routineFeedbackSchema,
} from '../../src/types/exercise.js';
import * as repo from './repository.js';

async function body<T>(c: Context, schema: z.ZodType<T>, fallback: string): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 8_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, fallback); }
}

async function access(c: Context, patientId: string, action: 'read_patient' | 'log_activity' | 'delete_activity' | 'assign_routine') {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    const professional = c.req.query('audience') === 'pro';
    if (action === 'assign_routine' && !professional) {
      throw new repo.CareError(403, 'Sólo una profesional habilitada puede asignar una rutina.');
    }
    if ((action === 'log_activity' || action === 'delete_activity') && professional) {
      throw new repo.CareError(403, 'Sólo la paciente puede registrar actividad autodeclarada.');
    }
    return { persistent: false, canAssign: professional };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, action, {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, canAssign: actor.role === 'nutri' };
}

function patientPayload(patientId: string) {
  const patient = getPatient(patientId);
  return patient ? toPatientSelfView(patient) : null;
}

export function registerExerciseRoutes(app: Hono) {
  app.get('/api/patients/:id/exercise', async (c) => {
    const id = c.req.param('id');
    const { persistent, canAssign } = await access(c, id, 'read_patient');
    const exercise = await repo.getPatientExercise(id, persistent, canAssign);
    return c.json({ exercise, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/patients/:id/activities', async (c) => {
    const id = c.req.param('id');
    const input = await body(c, activityLogInputSchema, 'Datos inválidos');
    const { persistent } = await access(c, id, 'log_activity');
    const exercise = await repo.logPatientActivity(id, input, persistent);
    return c.json({
      exercise,
      patient: persistent ? null : patientPayload(id),
      source: persistent ? 'supabase' : 'memory',
    });
  });

  app.delete('/api/patients/:id/activities/:activityId', async (c) => {
    const id = c.req.param('id');
    const parsed = z.string().min(1).safeParse(c.req.param('activityId'));
    if (!parsed.success) throw new repo.CareError(400, 'Datos inválidos');
    const { persistent } = await access(c, id, 'delete_activity');
    const exercise = await repo.deletePatientActivity(id, parsed.data, persistent);
    return c.json({
      exercise,
      patient: persistent ? null : patientPayload(id),
      source: persistent ? 'supabase' : 'memory',
    });
  });

  app.post('/api/patients/:id/routines', async (c) => {
    const id = c.req.param('id');
    const input = await body(c, assignRoutineSchema, 'Revisá la rutina, las series y las repeticiones.');
    const { persistent, canAssign } = await access(c, id, 'assign_routine');
    const exercise = await repo.assignExerciseRoutine(id, input, persistent, canAssign);
    return c.json({ exercise, source: persistent ? 'supabase' : 'memory' }, 201);
  });

  app.post('/api/patients/:id/routines/:assignmentId/feedback', async (c) => {
    const id = c.req.param('id');
    const parsed = z.uuid().safeParse(c.req.param('assignmentId'));
    if (!parsed.success) throw new repo.CareError(400, 'Revisá la rutina, las series y las repeticiones.');
    const input = await body(c, routineFeedbackSchema, 'Revisá la rutina, las series y las repeticiones.');
    const { persistent } = await access(c, id, 'log_activity');
    const exercise = await repo.saveRoutineFeedback(id, parsed.data, input, persistent);
    return c.json({ exercise, source: persistent ? 'supabase' : 'memory' });
  });
}
