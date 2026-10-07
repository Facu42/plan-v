import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { CareError } from '../care/errors.js';
import { foodInputSchema } from '../../src/types/foods.js';
import { filterFoods, listFoods, saveFood } from './repository.js';

async function professional(c: Context) {
  const auth = c.get('auth');
  if ('demo' in auth) return { owner: DEMO_NUTRITIONIST_ID, persistent: false };
  if (!isSupabaseEnabled()) throw new CareError(503, 'El servicio no está disponible.');
  const actor = await sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri') throw new CareError(403, 'Sólo el nutricionista puede usar el catálogo.');
  return { owner: actor.nutritionistId, persistent: true };
}
export function registerFoodRoutes(app: Hono) {
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
