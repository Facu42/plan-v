import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { recipeAssignSchema, recipePublishSchema } from '../../src/types/recipes.js';
import { buildRecipeCard, recipeDayAssignSchema, recipeRegisterSchema, recipeWizardSchema } from '../../src/types/recipe-plate.js';
import * as days from './day.js';
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

async function patientWrite(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    if (c.req.query('audience') === 'pro') throw new repo.CareError(403, 'Sólo el paciente puede registrar esta comida.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'analyze_meal', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor || actor.role !== 'paciente') throw new repo.CareError(403, 'Sólo el paciente puede registrar esta comida.');
  return { persistent: true };
}

function coreDraft(input: ReturnType<typeof recipeWizardSchema.parse>) {
  return {
    id: input.id,
    title: input.title,
    yield_portions: input.yield_portions,
    steps: input.steps,
    nutrient_source: input.nutrient_source,
    items: input.items.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
  };
}

async function saveWizard(c: Context) {
  const { persistent, nutritionistId } = await professional(c);
  const input = await body(c, recipeWizardSchema);
  let card;
  try { card = buildRecipeCard(input); }
  catch (error) {
    if (error instanceof Error && error.message === 'recipe_macro_source') {
      throw new repo.CareError(400, 'Declará la fuente nutricional antes de guardar macros.');
    }
    throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
  }
  if (persistent && card.macro_status === 'declared') {
    throw new repo.CareError(501, 'La ficha visual de la receta requiere instalar la migración de este módulo.');
  }
  const recipe = await repo.saveRecipeDraft(nutritionistId, coreDraft(input), persistent, card);
  return { recipe, source: persistent ? 'supabase' : 'memory' };
}

const recipeIdParam = z.uuid();

export function registerRecipeRoutes(app: Hono) {
  app.get('/api/recipes', async (c) => {
    const { persistent, nutritionistId } = await professional(c);
    const recipes = await repo.listProfessionalRecipes(nutritionistId, persistent);
    return c.json({ recipes, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/recipes', async (c) => c.json(await saveWizard(c)));

  app.post('/api/recipes/:id/versions', async (c) => {
    const id = recipeIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    const saved = await saveWizard(c);
    if (saved.recipe.id !== id.data) throw new repo.CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    return c.json(saved);
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

  app.post('/api/recipes/:id/day', async (c) => {
    const { persistent, nutritionistId } = await professional(c);
    if (c.req.query('audience') === 'patient') throw new repo.CareError(403, 'Sólo una profesional puede asignar la receta.');
    const id = recipeIdParam.safeParse(c.req.param('id'));
    if (!id.success) throw new repo.CareError(400, 'Revisá el paciente, el día y el momento de la comida.');
    const input = await body(c, recipeDayAssignSchema);
    const assignment = await days.assignRecipeDay(nutritionistId, id.data, input, persistent);
    return c.json({ assignment, source: persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/patients/:id/recipe-days', async (c) => {
    const id = c.req.param('id');
    const { persistent } = await patientAccess(c, id);
    const date = c.req.query('date') ?? null;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new repo.CareError(400, 'Revisá el paciente, el día y el momento de la comida.');
    const assignments = await days.listRecipeDays(id, date, persistent);
    return c.json({ assignments, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/patients/:id/recipe-days/:assignmentId/register', async (c) => {
    const id = c.req.param('id');
    const assignmentId = recipeIdParam.safeParse(c.req.param('assignmentId'));
    if (!assignmentId.success) throw new repo.CareError(400, 'Revisá la comida asignada.');
    const { persistent } = await patientWrite(c, id);
    const input = await body(c, recipeRegisterSchema);
    const result = await days.registerRecipeDay(id, assignmentId.data, input.client_id, persistent);
    return c.json({ ...result, source: persistent ? 'supabase' : 'memory' });
  });
}
