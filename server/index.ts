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
  authRecoverInputSchema,
  billingUpdateInputSchema,
  clinicalNoteInputSchema,
  consentDecisionInputSchema,
  goalUpdateInputSchema,
  habitUpdateInputSchema,
  inviteAcceptInputSchema,
  inviteIdParamSchema,
  intakePatchInputSchema,
  intakeSubmitInputSchema,
  listPageQuerySchema,
  mealReviewInputSchema,
  menuSlotParamsSchema,
  menuSlotUpdateSchema,
  messageInputSchema,
  messageReadSchema,
  nutritionistSetupInputSchema,
  patientArchiveInputSchema,
  patientCreateInputSchema,
  patientProfileUpdateInputSchema,
  provisionNutritionistInputSchema,
  resourceAssignmentInputSchema,
  resourceGuideIdSchema,
} from './schemas.js';
import { paginateItems } from './pagination.js';
import { CONSENT_CATALOG, matchConsentVersion } from './intake/consent.js';
import {
  addClinicalNote,
  appendConsent,
  getIntakeRecord,
  IntakeConflictError,
  IntakeNotReadyError,
  listClinicalNotes,
  listConsentEvents,
  patchIntake,
  reviewIntake,
  submitIntake,
} from './intake/memory.js';
import { parseIntakePayload, type IntakeStep } from './intake/payload.js';
import { toPatientIntakeView, toProfessionalIntakeView } from './intake/views.js';
import { getAuthAccount, isSupabaseEnabled } from './db/supabase-client.js';
import * as sb from './db/supabase-repo.js';
import { recoveryAcknowledgement, provisionSecretMatches, validateProvisionInput } from './identity/provision.js';
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
  acceptPatientInvite,
  dismissBrief,
  enqueueNotice,
  getInviteById,
  getPatient,
  getStore,
  listNotices,
  markResourceRead,
  provisionNutritionistMemory,
  revokePatientInvite,
  sendPatientInvite,
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

function queryAudience(role: 'nutri' | 'paciente') {
  return role === 'paciente' ? 'patient' as const : 'professional' as const;
}

function serializePatient(patient: NonNullable<Awaited<ReturnType<typeof sb.sbGetPatientById>>>, role: 'nutri' | 'paciente') {
  return role === 'paciente' ? toPatientSelfView(patient) : patient;
}

async function parseJsonBody<T>(c: Context, schema: ZodType<T>) {
  try {
    return schema.safeParse(await c.req.json());
  } catch {
    return { success: false as const };
  }
}

async function persistPatientWrite(
  c: Context,
  patientId: string,
  role: 'nutri' | 'paciente',
  write: () => Promise<void>,
  unavailable: string,
) {
  try {
    await write();
  } catch (error) {
    if (error instanceof sb.SchemaUnavailableError) {
      return c.json({ error: unavailable }, 501);
    }
    throw error;
  }
  const patient = await sb.sbGetPatientById(patientId, queryAudience(role));
  if (!patient) return c.notFound();
  return c.json({ patient: serializePatient(patient, role), source: 'supabase' });
}

app.use('/*', cors());
app.use('/api/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
});
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
  const parsedPage = listPageQuerySchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
  });
  if (!parsedPage.success) return c.json({ error: 'Paginación inválida' }, 400);
  const { limit, offset } = parsedPage.data;

  const auth = c.get('auth');
  if ('userId' in auth && isSupabaseEnabled()) {
    if (await sb.sbGetProfileRole(auth.userId) !== 'nutri') {
      return c.json({ error: 'Prohibido' }, 403);
    }
    const listed = await sb.sbListPatientsForNutri(auth.userId, { limit, offset });
    return c.json({ patients: listed.patients, page: listed.page, source: 'supabase' });
  }

  const listed = paginateItems(getStore().patients.map((patient) => {
    const brief = briefForDisplay(patient);
    return { ...patient, brief: brief ?? (patient.brief ? { ...patient.brief, suggested_action: null, up_next_title: null, up_next_body: null, draft_message: null } : null) };
  }), offset, limit);
  return c.json({ patients: listed.items, page: listed.page, source: 'memory' });
});

app.post('/api/patients', async (c) => {
  const auth = c.get('auth');
  const parsedBody = await parseJsonBody(c, patientCreateInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    const actor = await sb.sbGetActor(auth.userId);
    if (!actor || actor.role !== 'nutri' || !canManagePatients(actor, 'create_patient')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    try {
      const created = await sb.sbCreatePatient({
        nutritionistId: actor.nutritionistId,
        name: parsedBody.data.name,
        email: parsedBody.data.email,
        goal: parsedBody.data.goal,
      });
      return c.json({ ...created, source: 'supabase' }, 201);
    } catch (error) {
      if (error instanceof sb.UniqueInviteError) return c.json({ error: error.message }, 409);
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'Alta de pacientes pendiente del contrato Supabase 016' }, 501);
      }
      throw error;
    }
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

    const patient = await sb.sbGetPatientById(id, actor.role === 'paciente' ? 'patient' : 'professional');
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
    const actor = await authorizePatient(auth.userId, patientId, 'edit_patient');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);
    return persistPatientWrite(c, patientId, actor.role, () => sb.sbUpdatePatientProfile(patientId, parsedBody.data), 'No se pudo guardar la ficha');
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
    return c.json({ error: 'Archivado operativo pendiente de una columna 016 revisada' }, 501);
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
    const actor = await authorizePatient(auth.userId, patientId, 'analyze_meal');
    if (!actor) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    patient = (await sb.sbGetPatientById(patientId, queryAudience(actor.role))) ?? undefined;
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
    const updated = await sb.sbGetPatientById(patient.id, 'patient');
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
    const actor = await authorizePatient(auth.userId, patientId, 'generate_copilot');
    if (!actor) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    try {
      await sb.sbDismissBrief(patientId, auth.userId);
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'No se pudo descartar el brief' }, 501);
      }
      throw error;
    }
    const patient = await sb.sbGetPatientById(patientId);
    if (!patient) return c.notFound();
    return c.json({
      patient: {
        ...patient,
        brief: briefForDisplay(patient) ?? (patient.brief ? { ...patient.brief, suggested_action: null, up_next_title: null, up_next_body: null, draft_message: null } : null),
      },
      source: 'supabase',
    });
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

    const patient = await sb.sbGetPatientById(patientId, queryAudience(actor.role));
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
    const updated = await sb.sbGetPatientById(patientId, queryAudience(actor.role));
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
    const actor = await authorizePatient(auth.userId, patientId, 'update_habits');
    if (!actor) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    try {
      await sb.sbUpdateHabits(patientId, body);
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'No se pudieron guardar los hábitos' }, 501);
      }
      throw error;
    }
    const patient = await sb.sbGetPatientById(patientId, queryAudience(actor.role));
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
    const actor = await authorizePatient(auth.userId, patientId, 'edit_appointment');
    if (!actor || actor.role !== 'nutri') {
      return c.json({ error: 'Prohibido' }, 403);
    }
    try {
      await sb.sbSetAppointment(patientId, actor.nutritionistId, body.appointment);
      if (body.appointment) {
        await sb.sbAddTimelineEvent(patientId, {
          kind: 'appointment',
          title: 'Consulta · actualizada',
          body: `${body.appointment.day} ${body.appointment.time}`,
          visibility: 'patient',
        });
      }
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'No se pudo guardar el turno' }, 501);
      }
      throw error;
    }
    const patient = await sb.sbGetPatientById(patientId);
    if (!patient) return c.notFound();
    return c.json({ patient, source: 'supabase' });
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
    const actor = await authorizePatient(auth.userId, patientId, 'reschedule_appointment');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);
    try {
      const current = await sb.sbGetScheduledAppointment(patientId);
      if (!current) return c.json({ error: 'No hay un turno para reprogramar' }, 409);
      const sameSlot = current.day === parsedBody.data.day && current.time === parsedBody.data.time;
      if (sameSlot) {
        const patient = await sb.sbGetPatientById(patientId, queryAudience(actor.role));
        if (!patient) return c.notFound();
        return c.json({ patient: serializePatient(patient, actor.role), source: 'supabase' });
      }
      const resource = await sb.sbGetPatientResource(patientId);
      if (!resource) return c.notFound();
      await sb.sbSetAppointment(patientId, resource.nutritionistId, {
        day: parsedBody.data.day,
        time: parsedBody.data.time,
        duration: current.duration,
        channel: current.channel,
        ...(current.meet_url ? { meet_url: current.meet_url } : {}),
      });
      await sb.sbAddTimelineEvent(patientId, {
        kind: 'appointment',
        title: 'Consulta · reprogramada',
        body: `${parsedBody.data.day} ${parsedBody.data.time}`,
        visibility: 'patient',
      });
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'No se pudo reprogramar el turno' }, 501);
      }
      throw error;
    }
    const patient = await sb.sbGetPatientById(patientId, queryAudience(actor.role));
    if (!patient) return c.notFound();
    return c.json({ patient: serializePatient(patient, actor.role), source: 'supabase' });
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
    return c.json({ error: 'Cobranza persistente: transiciones sólo por flujo autorizado (PV-32)' }, 501);
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
    const actor = await authorizePatient(auth.userId, patientId, 'edit_goal');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);
    return persistPatientWrite(
      c,
      patientId,
      actor.role,
      () => sb.sbUpdateGoal(patientId, parsedBody.data.goal),
      'No se pudo guardar el objetivo',
    );
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
    const actor = await authorizePatient(auth.userId, patientId, 'edit_menu');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);
    return persistPatientWrite(c, patientId, actor.role, async () => {
      await sb.sbUpsertMenuSlot(patientId, body.day, body.slot, body.title);
      await sb.sbAddTimelineEvent(patientId, {
        kind: 'menu',
        title: `Menú · ${body.day} ${body.slot}`,
        body: body.title,
        visibility: 'patient',
      });
    }, 'No se pudo guardar el menú');
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
    const actor = await authorizePatient(auth.userId, patientId, 'edit_menu');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);
    return persistPatientWrite(c, patientId, actor.role, async () => {
      await sb.sbDeleteMenuSlot(patientId, day, slot);
      await sb.sbAddTimelineEvent(patientId, {
        kind: 'menu',
        title: `Menú · quitado ${day} ${slot}`,
        body: '',
        visibility: 'patient',
      });
    }, 'No se pudo guardar el menú');
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
  try {
    const id = await sb.sbEnsureNutritionist(auth.userId, body.display_name);
    return c.json({ nutritionist_id: id });
  } catch (error) {
    if (error instanceof sb.SchemaUnavailableError) {
      return c.json({ error: 'Alta profesional pendiente del contrato Supabase 016' }, 501);
    }
    throw error;
  }
});

app.post('/api/invites/:id/send', async (c) => {
  const auth = c.get('auth');
  const inviteId = inviteIdParamSchema.safeParse(c.req.param('id'));
  if (!inviteId.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    const actor = await sb.sbGetActor(auth.userId);
    if (!actor || actor.role !== 'nutri' || !canManagePatients(actor, 'create_patient')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    try {
      const invite = await sb.sbGetInvite(inviteId.data);
      if (!invite || invite.nutritionist_id !== actor.nutritionistId) return c.json({ error: 'Prohibido' }, 403);
      return c.json({ invite: await sb.sbSendInvite(inviteId.data), source: 'supabase' });
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'Invitaciones persistentes pendientes del contrato 016' }, 501);
      }
      return c.json({ error: 'Invitación no disponible' }, 409);
    }
  }

  const invite = sendPatientInvite(inviteId.data);
  if (!invite) return c.json({ error: 'Invitación no disponible' }, 409);
  return c.json({ invite, source: 'memory' });
});

app.post('/api/invites/:id/revoke', async (c) => {
  const auth = c.get('auth');
  const inviteId = inviteIdParamSchema.safeParse(c.req.param('id'));
  if (!inviteId.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    const actor = await sb.sbGetActor(auth.userId);
    if (!actor || actor.role !== 'nutri' || !canManagePatients(actor, 'create_patient')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    try {
      const invite = await sb.sbGetInvite(inviteId.data);
      if (!invite || invite.nutritionist_id !== actor.nutritionistId) return c.json({ error: 'Prohibido' }, 403);
      return c.json({ invite: await sb.sbRevokeInvite(inviteId.data), source: 'supabase' });
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'Invitaciones persistentes pendientes del contrato 016' }, 501);
      }
      return c.json({ error: 'Invitación no disponible' }, 409);
    }
  }

  const invite = revokePatientInvite(inviteId.data);
  if (!invite) return c.json({ error: 'Invitación no disponible' }, 409);
  return c.json({ invite, source: 'memory' });
});

app.post('/api/invites/accept', async (c) => {
  const auth = c.get('auth');
  const parsedBody = await parseJsonBody(c, inviteAcceptInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  if (!('userId' in auth)) return c.json({ error: 'No autorizado' }, 401);

  if (isSupabaseEnabled()) {
    const role = await sb.sbGetProfileRole(auth.userId);
    if (role !== 'paciente') return c.json({ error: 'Invitación no disponible' }, 409);
    const account = await getAuthAccount(auth.userId);
    if (!account) return c.json({ error: 'Servicio no disponible' }, 503);
    if (!account.emailConfirmed) {
      return c.json({ error: 'Confirmá tu email para aceptar la invitación' }, 403);
    }
    try {
      const patientId = await sb.sbAcceptInvite(parsedBody.data.invite_id);
      return c.json({ patient_id: patientId, source: 'supabase' });
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'Invitaciones persistentes pendientes del contrato 016' }, 501);
      }
      const code = (error as { code?: string }).code;
      if (code === 'unconfirmed_email') {
        return c.json({ error: 'Confirmá tu email para aceptar la invitación' }, 403);
      }
      return c.json({ error: 'Invitación no disponible' }, 409);
    }
  }

  const current = getInviteById(parsedBody.data.invite_id);
  if (!current) return c.json({ error: 'Invitación no disponible' }, 409);
  const result = acceptPatientInvite(parsedBody.data.invite_id, {
    userId: auth.userId,
    email: null,
    emailConfirmed: false,
    role: 'paciente',
  });
  if (result.ok) return c.json({ patient_id: result.patientId, invite: result.invite, source: 'memory' });
  return c.json({ error: result.message }, result.code === 'unconfirmed_email' ? 403 : 409);
});

app.post('/api/auth/recover', async (c) => {
  const parsedBody = await parseJsonBody(c, authRecoverInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  if (isSupabaseEnabled()) {
    try {
      await sb.sbRequestPasswordRecovery(parsedBody.data.email);
    } catch {
      // Same acknowledgement whether the provider accepted the address or not.
    }
  }
  return c.json(recoveryAcknowledgement());
});

app.post('/api/ops/nutritionists', async (c) => {
  const presented = c.req.header('X-PlanV-Provision') ?? c.req.header('Authorization');
  if (!provisionSecretMatches(presented, process.env.PROVISION_SECRET)) {
    return c.json({ error: 'No autorizado' }, 401);
  }
  const parsedBody = await parseJsonBody(c, provisionNutritionistInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  const parsed = validateProvisionInput({
    userId: parsedBody.data.user_id,
    displayName: parsedBody.data.display_name,
    license: parsedBody.data.license,
    monthlyFee: parsedBody.data.monthly_fee_ars,
  });
  if (!parsed.ok) return c.json({ error: parsed.message }, 400);

  if (isSupabaseEnabled()) {
    try {
      const nutritionistId = await sb.sbProvisionNutritionist({
        userId: parsed.userId,
        displayName: parsed.displayName,
        license: parsed.license,
        monthlyFee: parsed.monthlyFee,
      });
      return c.json({ nutritionist_id: nutritionistId, source: 'supabase' }, 201);
    } catch (error) {
      if (error instanceof sb.SchemaUnavailableError) {
        return c.json({ error: 'Alta profesional pendiente del contrato Supabase 016' }, 501);
      }
      throw error;
    }
  }

  const created = provisionNutritionistMemory({
    userId: parsed.userId,
    displayName: parsed.displayName,
    license: parsed.license,
    monthlyFee: parsed.monthlyFee,
  });
  if ('error' in created) return c.json({ error: created.error }, 400);
  return c.json({ ...created, source: 'memory' }, 201);
});

const INTAKE_UNAVAILABLE = 'Ingreso persistente pendiente del contrato 016b';

app.get('/api/consents/catalog', (c) => c.json({
  schema_version: 'consent.v1',
  consents: CONSENT_CATALOG,
}));

app.get('/api/patients/:id/intake', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'read_intake')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  const record = getIntakeRecord(patientId);
  const events = listConsentEvents(patientId);
  if ('userId' in auth) {
    const actor = await authorizePatient(auth.userId, patientId, 'read_clinical_note');
    if (actor) {
      return c.json({ ...toProfessionalIntakeView(record, events, listClinicalNotes(patientId)), source: 'memory' });
    }
  }
  return c.json({ ...toPatientIntakeView(record, events), source: 'memory' });
});

app.patch('/api/patients/:id/intake', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, intakePatchInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'edit_intake')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  let payload = undefined;
  if (parsedBody.data.payload !== undefined) {
    const incoming = parsedBody.data.payload;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return c.json({ error: 'Datos inválidos' }, 400);
    }
    const parsedPayload = parseIntakePayload({ ...getIntakeRecord(patientId).payload, ...incoming });
    if (!parsedPayload.success) return c.json({ error: 'Datos inválidos' }, 400);
    payload = parsedPayload.data;
  }
  try {
    const record = patchIntake(patientId, {
      expected_revision: parsedBody.data.expected_revision,
      step: parsedBody.data.step as IntakeStep | undefined,
      payload,
    });
    return c.json({ ...toPatientIntakeView(record, listConsentEvents(patientId)), source: 'memory' });
  } catch (error) {
    if (error instanceof IntakeConflictError) return c.json({ error: error.message }, 409);
    throw error;
  }
});

app.post('/api/patients/:id/intake/submit', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, intakeSubmitInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'submit_intake')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  try {
    const record = submitIntake(patientId, parsedBody.data.expected_revision);
    return c.json({ ...toPatientIntakeView(record, listConsentEvents(patientId)), source: 'memory' });
  } catch (error) {
    if (error instanceof IntakeConflictError) return c.json({ error: error.message }, 409);
    if (error instanceof IntakeNotReadyError) return c.json({ error: error.message }, 409);
    throw error;
  }
});

app.post('/api/patients/:id/intake/review', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');

  if ('userId' in auth && isSupabaseEnabled()) {
    const actor = await authorizePatient(auth.userId, patientId, 'review_intake');
    if (!actor) return c.json({ error: 'Prohibido' }, 403);
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  try {
    const reviewer = 'userId' in auth ? auth.userId : 'demo-nutri';
    const record = reviewIntake(patientId, reviewer);
    return c.json({
      ...toProfessionalIntakeView(record, listConsentEvents(patientId), listClinicalNotes(patientId)),
      source: 'memory',
    });
  } catch (error) {
    if (error instanceof IntakeNotReadyError) return c.json({ error: error.message }, 409);
    throw error;
  }
});

app.get('/api/patients/:id/consents', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'read_consent')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  const view = toPatientIntakeView(getIntakeRecord(patientId), listConsentEvents(patientId));
  return c.json({ consents: view.consents, source: 'memory' });
});

app.post('/api/patients/:id/consents', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, consentDecisionInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
  if (!matchConsentVersion(parsedBody.data)) {
    return c.json({ error: 'La versión del consentimiento no coincide' }, 409);
  }

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'grant_consent')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  const event = appendConsent(patientId, {
    ...parsedBody.data,
    actor_id: 'userId' in auth ? auth.userId : 'demo-patient',
  });
  return c.json({ consent: event, source: 'memory' }, 201);
});

app.get('/api/patients/:id/clinical-notes', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'read_clinical_note')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  if ('userId' in auth && !await authorizePatient(auth.userId, patientId, 'read_clinical_note')) {
    return c.json({ error: 'Prohibido' }, 403);
  }
  return c.json({ clinical_notes: listClinicalNotes(patientId), source: 'memory' });
});

app.post('/api/patients/:id/clinical-notes', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const parsedBody = await parseJsonBody(c, clinicalNoteInputSchema);
  if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);

  if ('userId' in auth && isSupabaseEnabled()) {
    if (!await authorizePatient(auth.userId, patientId, 'write_clinical_note')) {
      return c.json({ error: 'Prohibido' }, 403);
    }
    return c.json({ error: INTAKE_UNAVAILABLE }, 501);
  }

  if (!getPatient(patientId)) return c.notFound();
  if ('userId' in auth && !await authorizePatient(auth.userId, patientId, 'write_clinical_note')) {
    return c.json({ error: 'Prohibido' }, 403);
  }
  const note = addClinicalNote(patientId, 'userId' in auth ? auth.userId : 'demo-nutri', parsedBody.data.body);
  return c.json({ clinical_note: note, source: 'memory' }, 201);
});

const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const config = readRuntimeConfig(process.env);
  const port = Number(process.env.PORT ?? 3001);
  console.log(`Plan V API → http://localhost:${port} (mode: ${config.mode}, data: ${config.dataMode}, ai: ${config.aiMode})`);
  serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
}
