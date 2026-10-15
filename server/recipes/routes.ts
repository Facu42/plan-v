import type { Hono, Context } from 'hono';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { recipeInputSchema } from '../../src/types/recipes.js';
import * as repo from './repository.js';

async function parse(c: Context) {
  try { return recipeInputSchema.parse(JSON.parse(await c.req.text())); }
  catch { throw new repo.RecipeError(400, 'Revisá título, porciones, ingredientes y fuente.'); }
}
async function professionalAccess(c: Context) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (c.req.query('audience') !== 'pro') throw new repo.RecipeError(403, 'Sólo tu nutricionista puede editar el catálogo.');
    return { persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID };
  }
  const actor = await sb.sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri' || !actor.nutritionistId) throw new repo.RecipeError(403, 'Sólo tu nutricionista puede editar el catálogo.');
  return { persistent: true, nutritionistId: actor.nutritionistId };
}
async function patientAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.RecipeError(404, 'Paciente no encontrado.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor) throw new repo.RecipeError(403, 'No tenés permiso para ver estas recetas.');
  return { persistent: true };
}

export function registerRecipeRoutes(app: Hono) {
  app.get('/api/recipes', async c => {
    const { persistent, nutritionistId } = await professionalAccess(c);
    const recipes = (await repo.listRecipes(persistent, false, nutritionistId)).map(repo.toRecipeView);
    return c.json({ recipes, source: persistent ? 'supabase' : 'memory' });
  });
  app.post('/api/recipes', async c => {
    const { persistent, nutritionistId } = await professionalAccess(c);
    const recipe = await repo.saveRecipe(await parse(c), persistent, nutritionistId);
    return c.json({ recipe: repo.toRecipeView(recipe) });
  });
  app.post('/api/recipes/:id/publish', async c => {
    const { persistent, nutritionistId } = await professionalAccess(c);
    const recipe = await repo.publishRecipe(c.req.param('id'), persistent, nutritionistId);
    return c.json({ recipe: repo.toRecipeView(recipe) });
  });
  app.get('/api/patients/:id/recipes', async c => {
    const id = c.req.param('id');
    const { persistent } = await patientAccess(c, id);
    const recipes = (await repo.listRecipes(persistent, true)).map(repo.toRecipeView);
    return c.json({ recipes, source: persistent ? 'supabase' : 'memory' });
  });
}
