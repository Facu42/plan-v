import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { CareError } from '../care/errors.js';
import { foodInputSchema } from '../../src/types/foods.js';
import { filterFoods, listFoods, saveFood, searchFoodPage } from './repository.js';
import { sara2Detail } from './sara2.js';

async function professional(c: Context) {
  const auth = c.get('auth');
  if ('demo' in auth) return { owner: DEMO_NUTRITIONIST_ID, persistent: false };
  if (!isSupabaseEnabled()) throw new CareError(503, 'El servicio no está disponible.');
  const actor = await sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri') throw new CareError(403, 'Sólo el nutricionista puede usar el catálogo.');
  return { owner: actor.nutritionistId, persistent: true };
}
export function registerFoodRoutes(app: Hono) {
  app.get('/api/foods/:id/composition',async c=>{
    await professional(c);
    const query=z.object({offset:z.coerce.number().int().min(0).max(38).default(0),limit:z.coerce.number().int().min(1).max(39).default(10)}).strict().safeParse(c.req.query());
    if(!query.success||!z.uuid().safeParse(c.req.param('id')).success)throw new CareError(400,'Revisá la página de composición.');
    const detail=sara2Detail(c.req.param('id'),query.data.offset,query.data.limit);
    if(!detail)throw new CareError(404,'La composición institucional no está disponible.');
    return c.json(detail);
  });
  app.get('/api/foods/search',async c=>{
    const actor=await professional(c);const parsed=z.object({q:z.string().max(160).default(''),kind:z.enum(['food','supplement']).default('food'),scope:z.enum(['all','own','platform']).default('all'),source:z.string().max(240).default(''),category:z.string().max(80).default(''),order:z.enum(['name-asc','name-desc','kcal-asc','kcal-desc']).default('name-asc'),page:z.coerce.number().int().min(0).max(100000).default(0),page_size:z.coerce.number().int().min(1).max(100).default(50)}).strict().safeParse(c.req.query());
    if(!parsed.success)throw new CareError(400,'Revisá los filtros y la página de alimentos.');const{page,page_size,...filters}=parsed.data;return c.json(await searchFoodPage(actor.owner,filters,page,page_size,actor.persistent));
  });
  app.get('/api/foods', async c => {
    const actor = await professional(c);
    const parsed = z.object({ q: z.string().max(160).default(''), kind: z.enum(['food', 'supplement']).optional(), scope: z.enum(['own', 'platform']).optional() }).strict().safeParse(c.req.query());
    if (!parsed.success) throw new CareError(400, 'Revisá los filtros de alimentos.');
    const all = await listFoods(actor.owner, actor.persistent);
    return c.json({ foods: filterFoods(all, parsed.data.q, parsed.data.kind, parsed.data.scope), total: all.length, source: actor.persistent ? 'supabase' : 'demo' });
  });
  app.post('/api/foods', async c => {
    const actor = await professional(c);
    let raw: unknown; try { raw = await c.req.json(); } catch { throw new CareError(400, 'Revisá los datos del alimento.'); }
    const parsed = foodInputSchema.safeParse(raw);
    if (!parsed.success) throw new CareError(400, 'Revisá nombre, fuente, nutrientes y medidas. Los valores deben ser positivos o cero; las medidas necesitan gramos mayores que cero.');
    return c.json({ food: await saveFood(actor.owner, parsed.data, actor.persistent), source: actor.persistent ? 'supabase' : 'demo' });
  });
}
