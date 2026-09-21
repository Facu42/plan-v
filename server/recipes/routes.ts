import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { recipeAssignSchema, recipeDraftSchema, recipePublishSchema } from '../../src/types/recipes.js';
import * as repo from './repository.js';

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 16_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.'); }
}

async function professional(c: Context) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) return { persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID };
  const actor = await sb.sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, nutritionistId: actor.nutritionistId };
}

async function patientAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true };
}

const recipeIdParam = z.uuid();

export function registerRecipeRoutes(app: Hono) {
  app.get('/api/recipes', async (c) => {
    const { persistent, nutritionistId } = await professional(c);
    const recipes = await repo.listProfessionalRecipes(nutritionistId, persistent);
    return c.json({ recipes, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/recipes', async (c) => {
    const { persistent, nutritionistId } = await professional(c);
    const input = await body(c, recipeDraftSchema);
    const recipe = await repo.saveRecipeDraft(nutritionistId, input, persistent);
    return c.json({ recipe, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/recipes/:id/versions', async (c) => {
    const { persistent, nutritionistId } = await professional(c);
    const id = recipeIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    const input = await body(c, recipeDraftSchema);
    if (input.id !== id.data) throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    const recipe = await repo.saveRecipeDraft(nutritionistId, input, persistent);
    return c.json({ recipe, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/recipes/:id/publish', async (c) => {
    const { persistent, nutritionistId } = await professional(c);
    const id = recipeIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    const input = await body(c, recipePublishSchema);
    const recipe = await repo.publishRecipe(nutritionistId, id.data, input.expected_version, persistent);
    return c.json({ recipe, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/recipes/:id/assign', async (c) => {
    const { persistent, nutritionistId } = await professional(c);
    const id = recipeIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    const input = await body(c, recipeAssignSchema);
    const recipe = await repo.assignRecipe(nutritionistId, id.data, input.patient_id, input.expected_version, persistent);
    return c.json({ recipe, source: persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/patients/:id/recipes', async (c) => {
    const id = c.req.param('id');
    const { persistent } = await patientAccess(c, id);
    const recipes = await repo.listAssignedRecipes(id, persistent);
    return c.json({ recipes, source: persistent ? 'supabase' : 'memory' });
  });
}
