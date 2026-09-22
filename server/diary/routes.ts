import type { Hono, Context } from 'hono';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { analysisOrUnavailable, analyzeMeal } from '../ai/meal-analyzer.js';
import { requireCareConsent } from '../care/consents.js';
import { validatePhoto } from '../care/repository.js';
import { signMealPhotos, uploadMealPhoto } from '../care/meal-photos.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { analyzeMealInputSchema, mealReviewInputSchema } from '../schemas.js';
import { authorizePatientAction } from '../security/authorization.js';
import { toPatientMealAnalysis, toPatientSelfMealLog, toPatientSelfView, type PatientAction } from '../security/contracts.js';
import { getPatient } from '../store.js';
import * as repo from './repository.js';

const access = {
  getActor: sb.sbGetActor,
  getPatientResource: sb.sbGetPatientResource,
};

function authorize(userId: string, patientId: string, action: PatientAction) {
  return authorizePatientAction(userId, patientId, action, access);
}

function audience(role: 'nutri' | 'paciente') {
  return role === 'paciente' ? 'patient' as const : 'professional' as const;
}

function mealLoggedTimelineBody(confidence: number, foodCount: number, macros: { kcal: number } | null) {
  const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  if (foodCount === 0 && confidence === 0 && macros == null) {
    return `${time} · estimación no disponible. Pendiente de Vero.`;
  }
  return `${time} · estimación (${confidence.toFixed(2)}). Pendiente de Vero.`;
}

function emitMemoryTimeline(
  patientId: string,
  title: string,
  body: string,
) {
  const patient = getPatient(patientId);
  if (!patient) return;
  patient.timeline.unshift({
    id: randomUUID(),
    kind: 'meal_logged',
    atLabel: 'HOY',
    title,
    body,
  });
}

function photoDataUrl(body: { imageBase64?: string; photoPreview?: string }) {
  if (body.photoPreview) return body.photoPreview;
  if (!body.imageBase64) return null;
  const mime = body.imageBase64.startsWith('/9j/') ? 'jpeg' : body.imageBase64.startsWith('UklGR') ? 'webp' : 'png';
  return `data:image/${mime};base64,${body.imageBase64}`;
}

async function jsonBody<T>(c: Context, schema: z.ZodType<T>) {
  try {
    return schema.safeParse(await c.req.json());
  } catch {
    return { success: false as const };
  }
}

export function registerDiaryRoutes(app: Hono) {
  app.post('/api/patients/:id/meals/analyze', async (c) => {
    const auth = c.get('auth');
    const patientId = c.req.param('id');
    const parsedBody = await jsonBody(c, analyzeMealInputSchema);
    if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
    const body = parsedBody.data;
    const persistent = 'userId' in auth && isSupabaseEnabled();
    const clientId = body.client_id ?? randomUUID();

    let patient = getPatient(patientId);
    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'analyze_meal');
      if (!actor) return c.json({ error: 'Prohibido' }, 403);
      patient = (await sb.sbGetPatientById(patientId, audience(actor.role))) ?? undefined;
    }
    if (!patient) return c.notFound();

    const preview = photoDataUrl(body);
    if (persistent) {
      if (body.photoPreview) validatePhoto(body.photoPreview);
      if (body.imageBase64) validatePhoto(photoDataUrl({ imageBase64: body.imageBase64 })!);
      await requireCareConsent(patientId, true, 'ai_meal_analysis');
      if (body.photoPreview || body.imageBase64) await requireCareConsent(patientId, true, 'meal_photo');
    }

    let photoPath: string | null = null;
    if (persistent && preview) {
      photoPath = await uploadMealPhoto(patientId, preview);
    }

    const scheduled = patient.todayPlan.find((meal) => meal.slot === body.slot);
    const saved = await repo.saveMealLog(patientId, {
      client_id: clientId,
      slot: body.slot,
      description: body.description ?? null,
      photo_url: persistent ? photoPath : (preview ?? null),
    }, persistent);

    let analysis;
    let log = saved.log;
    const skipAnalysis = saved.duplicate && saved.log.analysis_status === 'succeeded';
    if (skipAnalysis) {
      analysis = {
        foods: saved.log.foods,
        macros: saved.log.macros,
        confidence: saved.log.confidence,
        note_for_nutri: saved.log.note_for_nutri,
      };
    } else {
      try {
        analysis = await analyzeMeal({
          description: body.description,
          imageBase64: body.imageBase64,
          slot: body.slot,
          scheduledTitle: scheduled?.title,
        });
      } catch (error) {
        analysis = analysisOrUnavailable(error);
      }
      const failed = analysis.foods.length === 0 && analysis.macros == null && analysis.confidence === 0;
      log = await repo.recordMealAnalysis(patientId, saved.log.id, {
        status: failed ? 'failed' : 'succeeded',
        foods: analysis.foods,
        macros: analysis.macros,
        confidence: analysis.confidence,
        note_for_nutri: analysis.note_for_nutri,
        error_code: failed ? 'AI_UNAVAILABLE' : null,
      }, persistent);
    }

    if (!saved.duplicate) {
      const title = `${body.slot} · foto en revisión`;
      const timelineBody = mealLoggedTimelineBody(analysis.confidence, analysis.foods.length, analysis.macros);
      if (persistent) {
        await sb.sbAddTimelineEvent(patientId, { kind: 'meal_logged', title, body: timelineBody });
      } else {
        emitMemoryTimeline(patientId, title, timelineBody);
      }
    }

    if (persistent) {
      const updated = await sb.sbGetPatientById(patient.id, 'patient');
      const visibleLog = toPatientSelfMealLog((await signMealPhotos(patientId, [log]))[0]);
      return c.json({
        analysis: toPatientMealAnalysis(analysis),
        log: visibleLog,
        patient: updated ? toPatientSelfView(updated) : null,
        source: 'supabase',
      });
    }

    return c.json({
      analysis: toPatientMealAnalysis(analysis),
      log: toPatientSelfMealLog(log),
      patient: getPatient(patientId),
      source: 'memory',
    });
  });

  app.patch('/api/patients/:id/meals/:mealId', async (c) => {
    const auth = c.get('auth');
    const { id: patientId, mealId } = c.req.param();
    const parsedBody = await jsonBody(c, mealReviewInputSchema);
    if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
    const body = parsedBody.data;
    const persistent = 'userId' in auth && isSupabaseEnabled();

    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'review_meal');
      if (!actor) return c.json({ error: 'Prohibido' }, 403);
      const log = await repo.reviewMealLog(patientId, mealId, body, true, auth.userId);
      await sb.sbAddTimelineEvent(patientId, {
        kind: 'meal_logged',
        title: `${log.slot} · ${body.status === 'confirmed' ? 'confirmado' : 'ajustado'}`,
        body: log.macros ? `${log.foods.map((food) => food.name).join(', ')} · ${log.macros.kcal} kcal` : 'Sin macros',
      });
      const patient = await sb.sbGetPatientById(patientId);
      return c.json({ log, patient, source: 'supabase' });
    }

    const log = await repo.reviewMealLog(patientId, mealId, body, false);
    emitMemoryTimeline(
      patientId,
      `${log.slot} · ${body.status === 'confirmed' ? 'confirmado' : 'ajustado'}`,
      log.macros ? `${log.foods.map((food) => food.name).join(', ')} · ${log.macros.kcal} kcal` : 'Sin macros',
    );
    return c.json({ log, patient: getPatient(patientId), source: 'memory' });
  });
}
