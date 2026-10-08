import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { CareError } from '../care/errors.js';
import { modelSaveSchema } from '../../src/types/models.js';
import { listModels, modelAction, saveModel } from './repository.js';
async function professional(c: Context) {
  const auth = c.get('auth');
  if ('demo' in auth) return { owner: DEMO_NUTRITIONIST_ID, persistent: false };
  if (!isSupabaseEnabled())
    throw new CareError(503, 'El servicio no está disponible.');
  const actor = await sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri')
    throw new CareError(403, 'Sólo el nutricionista puede usar Modelos.');
  return { owner: actor.nutritionistId, persistent: true };
}
async function body(c: Context) {
  try {
    return await c.req.json();
  } catch {
    throw new CareError(400, 'Revisá los datos del modelo.');
  }
}
export function registerModelRoutes(app: Hono) {
  app.get('/api/models', async (c) => {
    const a = await professional(c);
    return c.json({ models: await listModels(a.owner, a.persistent) });
  });
  app.post('/api/models', async (c) => {
    const a = await professional(c);
    const parsed = modelSaveSchema.safeParse(await body(c));
    if (!parsed.success)
      throw new CareError(
        400,
        'Revisá nombre, contenido y cantidades del modelo.',
      );
    return c.json({
      model: await saveModel(a.owner, parsed.data, a.persistent),
    });
  });
  app.post('/api/models/:id/:action', async (c) => {
    const a = await professional(c);
    const params = z
      .object({ id: z.uuid(), action: z.enum(['publish', 'archive']) })
      .safeParse(c.req.param());
    const parsed = z
      .object({ expected_revision: z.uuid(), reviewed: z.literal(true) })
      .strict()
      .safeParse(await body(c));
    if (!params.success || !parsed.success)
      throw new CareError(400, 'Revisá el modelo antes de confirmar.');
    return c.json({
      model: await modelAction(
        a.owner,
        params.data.id,
        parsed.data.expected_revision,
        params.data.action,
        a.persistent,
      ),
    });
  });
}
