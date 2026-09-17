import { serve } from '@hono/node-server';
import { pathToFileURL } from 'node:url';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import type { ZodType } from 'zod';
import { analyzeMeal } from './ai/meal-analyzer.js';
import { generateCopilotBrief } from './ai/copilot.js';
import { AIUnavailableError } from './ai/errors.js';
import { readRuntimeConfig } from './config/runtime.js';
import { authMiddleware } from './middleware/auth.js';
import {
  analyzeMealInputSchema,
  activityInputSchema,
  appointmentUpdateSchema,
  appointmentRescheduleSchema,
  noticeCreateSchema,
  billingUpdateInputSchema,
  goalUpdateInputSchema,
  habitUpdateInputSchema,
  mealReviewInputSchema,
  menuSlotParamsSchema,
  menuSlotUpdateSchema,
  messageInputSchema,
  messageReadSchema,
  nutritionistSetupInputSchema,
  patientArchiveInputSchema,
  patientCreateInputSchema,
  patientProfileUpdateInputSchema,
  resourceAssignmentInputSchema,
  resourceGuideIdSchema,
} from './schemas.js';
import { isSupabaseEnabled } from './db/supabase-client.js';
import * as sb from './db/supabase-repo.js';
import { authorizePatientAction } from './security/authorization.js';
import {
  canManagePatients,
  toPatientMealAnalysis,
  toPatientSelfMealLog,
  toPatientSelfView,
  type PatientAction,
} from './security/contracts.js';
import {
  addMealLog,
  addMessage,
  markMessagesRead,
  addActivityLog,
  deleteActivityLog,
  assignResourceToPatients,
  briefForDisplay,
  computeShoppingList,
  createPatient,
  dismissBrief,
  enqueueNotice,
  getPatient,
  getStore,
  listNotices,
  markResourceRead,
  setBrief,
  setAppointment,
  setBillingStatus,
  setGoal,
  setPatientArchived,
  setPatientProfile,
  updateMealLog,
  updatePatient,
  removeMenuSlot,
  upsertHabitLog,
  upsertMenuSlot,
} from './store.js';

export const app = new Hono();

const patientAccessResolvers = {
  getActor: sb.sbGetActor,
  getPatientResource: sb.sbGetPatientResource,
};

function authorizePatient(userId: string, patientId: string, action: PatientAction) {
  return authorizePatientAction(userId, patientId, action, patientAccessResolvers);
}

async function parseJsonBody<T>(c: Context, schema: ZodType<T>) {
  try {
    return schema.safeParse(await c.req.json());
  } catch {
    return { success: false as const };
  }
}

app.use('/*', cors());
app.use('/api/*', authMiddleware);

app.onError((error, c) => {
  if (error instanceof AIUnavailableError) {
    return c.json({
      code: error.code,
      message: error.message,
      requestId: crypto.randomUUID(),
    }, 503);
  }
  return c.json({ error: 'No se pudo completar la operación' }, 500);
});

app.get('/api/health', (c) =>
  c.json({ status: 'ok', ai: Boolean(process.env.OPENAI_API_KEY), supabase: isSupabaseEnabled() }),
);

app.get('/api/patients', async (c) => {
  const auth = c.get('auth');
  if ('userId' in auth && isSupabaseEnabled()) {
    if (await sb.sbGetProfileRole(auth.userId) !== 'nutri') {
      return c.json({ error: 'Prohibido' }, 403);
    }
    const patients = await sb.sbGetPatientsForNutri(auth.userId);
    return c.json({ patients, source: 'supabase' });
  }
  return c.json({
    patients: getStore().patients.map((patient) => {
      const brief = briefForDisplay(patient);
      return { ...patient, brief: brief ?? (patient.brief ? { ...patient.brief, suggested_action: null, up_next_title: null, up_next_body: null, draft_message: null } : null) };
    }),
    source: 'memory',
  });
});

app.post('/api/patients', async (c) => {
  const auth = c.get('auth');
  const parsedBody = await parseJsonBody(c, patientCreateInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    const actor = await sb.sbGetActor(auth.userId);
    if (!canManagePatients(actor, 'create_patient')) return c.json({ error: 'Prohibido' }, 403);
    return c.json({ error: 'Alta de pacientes pendiente del contrato Supabase 016' }, 501);
  }

  const created = createPatient(parsedBody.data);
  if (!created) return c.json({ error: 'Ya existe una invitación para ese email' }, 409);
  return c.json({ ...created, source: 'memory' }, 201);
});

app.get('/api/patients/:id', async (c) => {
  const auth = c.get('auth');
  const id = c.req.param('id');

  if ('userId' in auth && isSupabaseEnabled()) {
    const actor = await authorizePatient(auth.userId, id, 'read_patient');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);

    const patient = await sb.sbGetPatientById(id);
    if (!patient) return c.notFound();
    return c.json({
      patient: actor.role === 'paciente' ? toPatientSelfView(patient) : patient,
      shoppingList: sb.computeShoppingList(patient),
      source: 'supabase',
    });
  }

  const patient = getPatient(id);
  if (!patient) return c.notFound();
  return c.json({ patient, shoppingList: computeShoppingList(patient), source: 'memory' });
});

app.patch('/api/patients/:id/profile', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, patientProfileUpdateInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'edit_patient')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Edición de pacientes pendiente del schema 016' }, 501);
  }

  const patient = setPatientProfile(patientId, parsedBody.data);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.patch('/api/patients/:id/archive', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, patientArchiveInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'archive_patient')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Archivado de pacientes pendiente del schema 016' }, 501);
  }

  const patient = setPatientArchived(patientId, parsedBody.data.archived);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.get('/api/me/patient', async (c) => {
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) return c.json({ patient: null });
  if (await sb.sbGetProfileRole(auth.userId) !== 'paciente') {
    return c.json({ error: 'Prohibido' }, 403);
  }
  const patient = await sb.sbGetPatientForUser(auth.userId);
  return c.json({
    patient: patient ? toPatientSelfView(patient) : null,
    shoppingList: patient ? sb.computeShoppingList(patient) : [],
  });
});

app.post('/api/patients/:id/meals/analyze', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, analyzeMealInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const body = parsedBody.data;

  let patient = getPatient(patientId);
  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'analyze_meal')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    patient = (await sb.sbGetPatientById(patientId)) ?? undefined;
  }
  if (!patient) return c.notFound();

  if ('userId' in auth && isSupabaseEnabled() && body.photoPreview) {
    return c.json({ error: 'Fotos de comidas pendientes del contrato Storage 016' }, 501);
  }

  const scheduled = patient.todayPlan.find((m) => m.slot === body.slot);
  const analysis = await analyzeMeal({
    description: body.description,
    imageBase64: body.imageBase64,
    slot: body.slot,
    scheduledTitle: scheduled?.title,
  });

  if ('userId' in auth && isSupabaseEnabled()) {
    const log = await sb.sbAddMealLog(patient.id, {
      slot: body.slot,
      photo_url: null,
      description: body.description ?? null,
      foods: analysis.foods,
      macros: analysis.macros,
      confidence: analysis.confidence,
      note_for_nutri: analysis.note_for_nutri,
    });
    await sb.sbAddTimelineEvent(patient.id, {
      kind: 'meal_logged',
      title: `${body.slot} · foto en revisión`,
      body: `${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · estimación (${analysis.confidence.toFixed(2)}). Pendiente de Vero.`,
    });
    const updated = await sb.sbGetPatientById(patient.id);
    return c.json({
      analysis: toPatientMealAnalysis(analysis),
      log: toPatientSelfMealLog(log),
      patient: updated ? toPatientSelfView(updated) : null,
      source: 'supabase',
    });
  }

  const log = addMealLog(patientId, {
    slot: body.slot,
    photo_url: body.photoPreview ?? null,
    description: body.description ?? null,
    foods: analysis.foods,
    macros: analysis.macros,
    confidence: analysis.confidence,
    note_for_nutri: analysis.note_for_nutri,
  });
  return c.json({ analysis, log, patient: getPatient(patientId), source: 'memory' });
});

app.patch('/api/patients/:id/meals/:mealId', async (c) => {
  const auth = c.get('auth');
  const { id: patientId, mealId } = c.req.param();
  const parsedBody = await parseJsonBody(c, mealReviewInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const body = parsedBody.data;

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'review_meal')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    const log = await sb.sbUpdateMealLog(patientId, mealId, body as Parameters<typeof sb.sbUpdateMealLog>[2]);
    if (!log) return c.notFound();
    await sb.sbAddTimelineEvent(patientId, {
      kind: 'meal_logged',
      title: `${log.slot} · ${body.status === 'confirmed' ? 'confirmado' : 'ajustado'}`,
      body: log.macros ? `${log.foods.map((food) => food.name).join(', ')} · ${log.macros.kcal} kcal` : 'Sin macros',
    });
    const patient = await sb.sbGetPatientById(patientId);
    return c.json({ log, patient, source: 'supabase' });
  }

  const log = updateMealLog(patientId, mealId, body as Parameters<typeof updateMealLog>[2]);
  if (!log) return c.notFound();
  return c.json({ log, patient: getPatient(patientId), source: 'memory' });
});

app.post('/api/patients/:id/brief/dismiss', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'generate_copilot')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Descarte del brief pendiente del schema 016' }, 501);
  }

  const patient = dismissBrief(patientId);
  if (!patient) return c.notFound();
  return c.json({
    patient: { ...patient, brief: briefForDisplay(patient) ?? (patient.brief ? { ...patient.brief, suggested_action: null, up_next_title: null, up_next_body: null, draft_message: null } : null) },
    source: 'memory',
  });
});

app.post('/api/patients/:id/copilot', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');

  let patient = getPatient(patientId);
  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'generate_copilot')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    patient = (await sb.sbGetPatientById(patientId)) ?? undefined;
  }
  if (!patient) return c.notFound();

  const brief = await generateCopilotBrief(patient as Parameters<typeof generateCopilotBrief>[0]);

  if ('userId' in auth && isSupabaseEnabled()) {
    const nutriId = await sb.sbGetNutritionistId(auth.userId);
    if (nutriId) {
      try {
        await sb.sbSetBrief(patient.id, nutriId, brief);
      } catch {
        return c.json({ error: 'No se pudo guardar el brief' }, 503);
      }
    }
    const updated = await sb.sbGetPatientById(patient.id);
    return c.json({ brief, patient: updated, source: 'supabase' });
  }

  setBrief(patient.id, brief);
  return c.json({ brief, patient: getPatient(patient.id), source: 'memory' });
});

app.post('/api/patients/:id/messages', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, messageInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const body = parsedBody.data;

  if ('userId' in auth && isSupabaseEnabled()) {
    const actor = await authorizePatient(auth.userId, patientId, 'send_message');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);

    const patient = await sb.sbGetPatientById(patientId);
    const resource = await sb.sbGetPatientResource(patientId);
    if (!patient || !resource) return c.notFound();

    try {
      await sb.sbAddMessage(
        patientId,
        resource.nutritionistId,
        auth.userId,
        body.text,
        actor.role === 'nutri' && (body.suggested_by_ai ?? false),
      );
    } catch {
      return c.json({ error: 'No se pudo enviar el mensaje' }, 503);
    }
    const updated = await sb.sbGetPatientById(patientId);
    return c.json({
      patient: updated && actor.role === 'paciente' ? toPatientSelfView(updated) : updated,
      source: 'supabase',
    });
  }

  const patient = getPatient(patientId);
  if (!patient) return c.notFound();
  addMessage(patientId, body.text, body.from, body.from === 'vero' && (body.suggested_by_ai ?? false));
  const updated = getPatient(patientId)!;
  return c.json({
    patient: body.from === 'patient' ? toPatientSelfView(updated) : updated,
    source: 'memory',
  });
});

app.post('/api/patients/:id/messages/read', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, messageReadSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'send_message')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Lectura de mensajes pendiente del schema 016' }, 501);
  }

  const patient = markMessagesRead(patientId, parsedBody.data.reader);
  if (!patient) return c.notFound();
  return c.json({
    patient,
    source: 'memory',
  });
});

app.patch('/api/patients/:id/habits', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, habitUpdateInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const body = parsedBody.data;

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'update_habits')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    if (body.sleep_minutes !== undefined) {
      return c.json({ error: 'Descanso persistente pendiente del schema 016' }, 501);
    }
    await sb.sbUpdateHabits(patientId, body);
    const patient = await sb.sbGetPatientById(patientId);
    return c.json({ patient: patient ? toPatientSelfView(patient) : null, source: 'supabase' });
  }

  const patient = upsertHabitLog(patientId, body);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.post('/api/patients/:id/activities', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, activityInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'log_activity')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Actividad persistente pendiente del schema 016' }, 501);
  }

  const patient = addActivityLog(patientId, parsedBody.data);
  if (!patient) return c.notFound();
  return c.json({ patient: toPatientSelfView(patient), source: 'memory' });
});

app.delete('/api/patients/:id/activities/:activityId', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const activityId = c.req.param('activityId');

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'delete_activity')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Actividad persistente pendiente del schema 016' }, 501);
  }

  const patient = deleteActivityLog(patientId, activityId);
  if (!patient) return c.notFound();
  return c.json({ patient: toPatientSelfView(patient), source: 'memory' });
});

app.post('/api/resources/assign', async (c) => {
  const auth = c.get('auth');
  const parsedBody = await parseJsonBody(c, resourceAssignmentInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const { resource_id: resourceId, patient_ids: patientIds } = parsedBody.data;

  if ('userId' in auth && isSupabaseEnabled()) {
    const decisions = await Promise.all(patientIds.map((patientId) => authorizePatient(auth.userId, patientId, 'assign_resource')));
    if (decisions.some((actor) => !actor)) return c.json({ error: 'Prohibido' }, 403);
    return c.json({ error: 'Asignación de recursos pendiente del schema 016' }, 501);
  }

  const result = assignResourceToPatients(resourceId, patientIds);
  if (!result) return c.notFound();
  return c.json({
    patients: result.patients,
    assigned_count: result.assignedCount,
    existing_count: result.existingCount,
    source: 'memory',
  });
});

app.post('/api/patients/:id/resources/:resourceId/read', async (c) => {
  const auth = c.get('auth');
  const { id: patientId, resourceId } = c.req.param();
  const parsedResourceId = resourceGuideIdSchema.safeParse(resourceId);
  if (!parsedResourceId.success) return c.json({ error: 'Recurso inválido' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'read_resource')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Lectura de recursos pendiente del schema 016' }, 501);
  }

  const patient = markResourceRead(patientId, parsedResourceId.data);
  if (!patient) return c.notFound();
  return c.json({ patient: toPatientSelfView(patient), source: 'memory' });
});

app.put('/api/patients/:id/appointment', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, appointmentUpdateSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const body = parsedBody.data;

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'edit_appointment')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Turnos persistentes pendientes del schema 016' }, 501);
  }

  const patient = setAppointment(patientId, body.appointment);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.post('/api/patients/:id/appointment/reschedule', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, appointmentRescheduleSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'reschedule_appointment')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Turnos persistentes pendientes del schema 016' }, 501);
  }

  const current = getPatient(patientId);
  if (!current) return c.notFound();
  if (!current.appointment) return c.json({ error: 'No hay un turno para reprogramar' }, 409);

  const parsed = current.appointment.when.split(' · ');
  const sameSlot = parsed[0] === parsedBody.data.day && parsed[1] === parsedBody.data.time;
  if (sameSlot) return c.json({ patient: current, source: 'memory' });

  const patient = setAppointment(patientId, {
    day: parsedBody.data.day,
    time: parsedBody.data.time,
    duration: current.appointment.duration,
    channel: current.appointment.channel,
    ...(current.appointment.meet_url ? { meet_url: current.appointment.meet_url } : {}),
  }, { actor: 'patient' });
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.get('/api/notices', (c) => {
  if (isSupabaseEnabled()) return c.json({ error: 'Avisos persistentes pendientes del schema 016' }, 501);
  const patientId = c.req.query('patientId') || undefined;
  return c.json({ notices: listNotices(patientId), source: 'memory' });
});

app.post('/api/notices', async (c) => {
  const parsedBody = await parseJsonBody(c, noticeCreateSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  if (isSupabaseEnabled()) return c.json({ error: 'Avisos persistentes pendientes del schema 016' }, 501);
  const person = getPatient(parsedBody.data.patientId);
  if (!person) return c.notFound();
  const notice = enqueueNotice({
    patientId: person.id,
    kind: 'reminder',
    subject: `Recordatorio · ${parsedBody.data.title} · ${person.name}`,
    body: `${parsedBody.data.detail} Este aviso quedó en el buzón demo de Plan V; no se envió a internet.`,
  });
  return c.json({ notice, source: 'memory' }, 201);
});

app.patch('/api/patients/:id/billing', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, billingUpdateInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'edit_billing')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Cobranza persistente pendiente del schema 016' }, 501);
  }

  const patient = setBillingStatus(patientId, parsedBody.data);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.patch('/api/patients/:id/goal', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, goalUpdateInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'edit_goal')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Objetivos persistentes pendientes del schema 016' }, 501);
  }

  const patient = setGoal(patientId, parsedBody.data);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.patch('/api/patients/:id/menu', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, menuSlotUpdateSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const body = parsedBody.data;

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'edit_menu')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Menú persistente pendiente del schema 016' }, 501);
  }

  const patient = upsertMenuSlot(patientId, body.day, body.slot, body.title);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.delete('/api/patients/:id/menu/:day/:slot', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedParams = menuSlotParamsSchema.safeParse({ day: c.req.param('day'), slot: c.req.param('slot') });
  if (!parsedParams.success) return c.json({ error: 'Datos inválidos' }, 400);
  const { day, slot } = parsedParams.data;

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'edit_menu')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: 'Menú persistente pendiente del schema 016' }, 501);
  }

  const patient = removeMenuSlot(patientId, day, slot);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.post('/api/nutritionist/setup', async (c) => {
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) return c.json({ error: 'Requires Supabase auth' }, 400);
  if (await sb.sbGetProfileRole(auth.userId) !== 'nutri') {
    return c.json({ error: 'Prohibido' }, 403);
  }
  const parsedBody = await parseJsonBody(c, nutritionistSetupInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const body = parsedBody.data;
  const id = await sb.sbEnsureNutritionist(auth.userId, body.display_name);
  return c.json({ nutritionist_id: id });
});

const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const config = readRuntimeConfig(process.env);
  const port = Number(process.env.PORT ?? 3001);
  console.log(`Plan V API → http://localhost:${port} (mode: ${config.mode}, data: ${config.dataMode}, ai: ${config.aiMode})`);
  serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
}
