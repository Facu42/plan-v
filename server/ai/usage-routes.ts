import type { Context, Hono } from 'hono';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { CareError } from '../care/errors.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { nutritionistUsageView } from './metering.js';

async function nutritionistId(c: Context): Promise<string> {
  const auth = c.get('auth');
  if (!('userId' in auth && isSupabaseEnabled())) return DEMO_NUTRITIONIST_ID;
  const actor = await sb.sbGetActor(auth.userId);
  if (!actor || actor.role !== 'nutri') throw new CareError(403, 'No tenés permiso para esta acción.');
  return actor.nutritionistId;
}

/** Lo que ve la nutri en Ajustes: solo el porcentaje de uso del mes, sin cantidades ni modelos. */
export function registerAiUsageRoutes(app: Hono) {
  app.get('/api/ai/uso', async (c) => {
    const usage = await nutritionistUsageView(await nutritionistId(c));
    c.header('Cache-Control', 'no-store');
    return c.json({ usage, source: isSupabaseEnabled() ? 'supabase' : 'memory' });
  });
}
