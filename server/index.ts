import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { analyzeMeal } from './ai/meal-analyzer.js';
import { generateCopilotBrief } from './ai/copilot.js';
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

app.get('/api/health', (c) => c.json({ status: 'ok', ai: Boolean(process.env.OPENAI_API_KEY) }));

app.get('/api/patients', (c) => {
  const { patients } = getStore();
  return c.json({ patients });
});

app.get('/api/patients/:id', (c) => {
  const patient = getPatient(c.req.param('id'));
  if (!patient) return c.notFound();
  return c.json({ patient, shoppingList: computeShoppingList(patient) });
});

app.post('/api/patients/:id/meals/analyze', async (c) => {
  const patientId = c.req.param('id');
  const patient = getPatient(patientId);
  if (!patient) return c.notFound();

  const body = await c.req.json<{
    description?: string;
    imageBase64?: string;
    slot: string;
    photoPreview?: string;
  }>();

  const scheduled = patient.todayPlan.find((m) => m.slot === body.slot);
  const analysis = await analyzeMeal({
    description: body.description,
    imageBase64: body.imageBase64,
    slot: body.slot,
    scheduledTitle: scheduled?.title,
  });

  const log = addMealLog(patientId, {
    slot: body.slot,
    photo_url: body.photoPreview ?? null,
    description: body.description ?? null,
    foods: analysis.foods,
    macros: analysis.macros,
    confidence: analysis.confidence,
    note_for_nutri: analysis.note_for_nutri,
  });

  return c.json({ analysis, log, patient: getPatient(patientId) });
});

app.patch('/api/patients/:id/meals/:mealId', async (c) => {
  const { id: patientId, mealId } = c.req.param();
  const body = await c.req.json<{ status?: 'confirmed' | 'adjusted'; foods?: typeof import('./store.ts').FoodItem[]; macros?: typeof import('./store.ts').Macros | null }>();
  const log = updateMealLog(patientId, mealId, body);
  if (!log) return c.notFound();
  return c.json({ log, patient: getPatient(patientId) });
});

app.post('/api/patients/:id/copilot', async (c) => {
  const patient = getPatient(c.req.param('id'));
  if (!patient) return c.notFound();
  const brief = await generateCopilotBrief(patient);
  setBrief(patient.id, brief);
  return c.json({ brief, patient: getPatient(patient.id) });
});

app.post('/api/patients/:id/messages', async (c) => {
  const patientId = c.req.param('id');
  const body = await c.req.json<{ text: string; from: 'vero' | 'patient'; suggested_by_ai?: boolean }>();
  const msg = addMessage(patientId, body.text, body.from, body.suggested_by_ai ?? false);
  return c.json({ message: msg, patient: getPatient(patientId) });
});

app.patch('/api/patients/:id/habits', async (c) => {
  const patientId = c.req.param('id');
  const body = await c.req.json<{ hydration?: number; energy?: string | null }>();
  const patient = updatePatient(patientId, body);
  if (!patient) return c.notFound();
  return c.json({ patient });
});

const port = Number(process.env.PORT ?? 3001);
console.log(`Plan V API → http://localhost:${port}`);
serve({ fetch: app.fetch, port });
