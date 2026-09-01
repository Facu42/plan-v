import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { analyzeMeal } from './ai/meal-analyzer.js';
import { generateCopilotBrief } from './ai/copilot.js';
import { authMiddleware } from './middleware/auth.js';
import { isSupabaseEnabled } from './db/supabase-client.js';
import * as sb from './db/supabase-repo.js';
import {
  addMealLog,
  addMessage,
  computeShoppingList,
  getPatient,
  getStore,
  setBrief,
  updateMealLog,
  updatePatient,
} from './store.js';

const app = new Hono();

app.use('/*', cors());
app.use('/api/*', authMiddleware);

app.get('/api/health', (c) =>
  c.json({ status: 'ok', ai: Boolean(process.env.OPENAI_API_KEY), supabase: isSupabaseEnabled() }),
);

app.get('/api/patients', async (c) => {
  const auth = c.get('auth');
  if ('userId' in auth && isSupabaseEnabled()) {
    const patients = await sb.sbGetPatientsForNutri(auth.userId);
    return c.json({ patients, source: 'supabase' });
  }
  return c.json({ patients: getStore().patients, source: 'memory' });
});

app.get('/api/patients/:id', async (c) => {
  const auth = c.get('auth');
  const id = c.req.param('id');

  if ('userId' in auth && isSupabaseEnabled()) {
    const own = await sb.sbGetPatientForUser(auth.userId);
    if (own && (own.id === id || !id)) {
      return c.json({ patient: own, shoppingList: sb.computeShoppingList(own), source: 'supabase' });
    }
    const patient = await sb.sbGetPatientById(id);
    if (!patient) return c.notFound();
    return c.json({ patient, shoppingList: sb.computeShoppingList(patient), source: 'supabase' });
  }

  const patient = getPatient(id);
  if (!patient) return c.notFound();
  return c.json({ patient, shoppingList: computeShoppingList(patient), source: 'memory' });
});

app.get('/api/me/patient', async (c) => {
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) return c.json({ patient: null });
  const patient = await sb.sbGetPatientForUser(auth.userId);
  return c.json({ patient, shoppingList: patient ? sb.computeShoppingList(patient) : [] });
});

app.post('/api/patients/:id/meals/analyze', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const body = await c.req.json<{
    description?: string;
    imageBase64?: string;
    slot: string;
    photoPreview?: string;
  }>();

  let patient = getPatient(patientId);
  if ('userId' in auth && isSupabaseEnabled()) {
    patient = (await sb.sbGetPatientById(patientId)) ?? (await sb.sbGetPatientForUser(auth.userId)) ?? undefined;
  }
  if (!patient) return c.notFound();

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
      photo_url: body.photoPreview ?? null,
      description: body.description ?? null,
      foods: analysis.foods,
      macros: analysis.macros,
      confidence: analysis.confidence,
      note_for_nutri: analysis.note_for_nutri,
    });
    const updated = await sb.sbGetPatientById(patient.id);
    return c.json({ analysis, log, patient: updated, source: 'supabase' });
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
  const body = await c.req.json<{ status?: 'confirmed' | 'adjusted'; foods?: unknown; macros?: unknown }>();

  if ('userId' in auth && isSupabaseEnabled()) {
    const log = await sb.sbUpdateMealLog(patientId, mealId, body as Parameters<typeof sb.sbUpdateMealLog>[2]);
    if (!log) return c.notFound();
    const patient = await sb.sbGetPatientById(patientId);
    return c.json({ log, patient, source: 'supabase' });
  }

  const log = updateMealLog(patientId, mealId, body as Parameters<typeof updateMealLog>[2]);
  if (!log) return c.notFound();
  return c.json({ log, patient: getPatient(patientId), source: 'memory' });
});

app.post('/api/patients/:id/copilot', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');

  let patient = getPatient(patientId);
  if ('userId' in auth && isSupabaseEnabled()) {
    patient = (await sb.sbGetPatientById(patientId)) ?? undefined;
  }
  if (!patient) return c.notFound();

  const brief = await generateCopilotBrief(patient as Parameters<typeof generateCopilotBrief>[0]);

  if ('userId' in auth && isSupabaseEnabled()) {
    const nutriId = await sb.sbGetNutritionistId(auth.userId);
    if (nutriId) await sb.sbSetBrief(patient.id, nutriId, brief);
    const updated = await sb.sbGetPatientById(patient.id);
    return c.json({ brief, patient: updated, source: 'supabase' });
  }

  setBrief(patient.id, brief);
  return c.json({ brief, patient: getPatient(patient.id), source: 'memory' });
});

app.post('/api/patients/:id/messages', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const body = await c.req.json<{ text: string; from: 'vero' | 'patient'; suggested_by_ai?: boolean }>();

  if ('userId' in auth && isSupabaseEnabled()) {
    const patient = await sb.sbGetPatientById(patientId);
    if (!patient) return c.notFound();
    const nutriId = await sb.sbGetNutritionistId(auth.userId) ?? patient.id;
    await sb.sbAddMessage(patientId, nutriId, auth.userId, body.text, body.suggested_by_ai ?? false);
    const updated = await sb.sbGetPatientById(patientId);
    return c.json({ patient: updated, source: 'supabase' });
  }

  addMessage(patientId, body.text, body.from, body.suggested_by_ai ?? false);
  return c.json({ patient: getPatient(patientId), source: 'memory' });
});

app.patch('/api/patients/:id/habits', async (c) => {
  const auth = c.get('auth');
  const patientId = c.req.param('id');
  const body = await c.req.json<{ hydration?: number; energy?: string | null }>();

  if ('userId' in auth && isSupabaseEnabled()) {
    await sb.sbUpdateHabits(patientId, body);
    const patient = await sb.sbGetPatientById(patientId);
    return c.json({ patient, source: 'supabase' });
  }

  const patient = updatePatient(patientId, body);
  if (!patient) return c.notFound();
  return c.json({ patient, source: 'memory' });
});

app.post('/api/nutritionist/setup', async (c) => {
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) return c.json({ error: 'Requires Supabase auth' }, 400);
  const body = await c.req.json<{ display_name: string }>();
  const id = await sb.sbEnsureNutritionist(auth.userId, body.display_name);
  return c.json({ nutritionist_id: id });
});

const port = Number(process.env.PORT ?? 3001);
console.log(`Plan V API → http://localhost:${port} (supabase: ${isSupabaseEnabled() ? 'on' : 'memory'})`);
serve({ fetch: app.fetch, port });
