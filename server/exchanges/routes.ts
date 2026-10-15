import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { CareError } from '../care/errors.js';
import { exchangeInputSchema } from '../../src/types/exchanges.js';
import { archiveExchange, listExchanges, saveExchange } from './repository.js';

/** El consultorio sale siempre de la cuenta autenticada; el cuerpo nunca lo decide. */
async function professional(c: Context) {
  const auth = c.get('auth');
  if ('demo' in auth) return { owner: DEMO_NUTRITIONIST_ID, persistent: false };
  if (!isSupabaseEnabled()) throw new CareError(503, 'El servicio no está disponible.');
  const actor = await sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri') throw new CareError(403, 'Sólo el nutricionista puede usar Equivalencias.');
  return { owner: actor.nutritionistId, persistent: true };
}
async function json(c: Context, message: string) {
  try { return await c.req.json(); } catch { throw new CareError(400, message); }
}

export function registerExchangeRoutes(app: Hono) {
  app.get('/api/exchanges', async c => {
    const actor = await professional(c);
    return c.json({ entries: await listExchanges(actor.owner, actor.persistent), source: actor.persistent ? 'supabase' : 'demo' });
  });
  app.post('/api/exchanges', async c => {
    const actor = await professional(c);
    const parsed = exchangeInputSchema.safeParse(await json(c, 'Revisá los datos de la equivalencia.'));
    if (!parsed.success) throw new CareError(400, 'Revisá el nombre, los alimentos y las cantidades. Los gramos deben ser mayores que cero.');
    return c.json({ entry: await saveExchange(actor.owner, parsed.data, actor.persistent), source: actor.persistent ? 'supabase' : 'demo' });
  });
  app.post('/api/exchanges/:id/archive', async c => {
    const actor = await professional(c);
    const id = z.uuid().safeParse(c.req.param('id'));
    const body = z.object({ expected_revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER - 1) }).strict().safeParse(await json(c, 'Revisá la equivalencia antes de archivarla.'));
    if (!id.success || !body.success) throw new CareError(400, 'Revisá la equivalencia antes de archivarla.');
    return c.json({ archived: await archiveExchange(actor.owner, id.data, body.data.expected_revision, actor.persistent) });
  });
}
