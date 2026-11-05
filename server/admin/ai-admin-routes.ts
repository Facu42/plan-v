import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { payerEmail } from '../billing-platform/repository.js';
import { adminUsageView } from '../ai/metering.js';
import {
  AI_FEATURES, AI_FEATURE_LABELS, MODEL_OPTIONS, clearModelSetting, isAiFeature, listModelSettings, saveModelSetting,
} from '../ai/model-settings.js';

const settingSchema = z.object({
  model: z.string().trim().min(3).max(120),
  input_usd_per_mtok: z.number().min(0).max(100),
  output_usd_per_mtok: z.number().min(0).max(100),
}).strict();

async function readBody(c: Context) {
  const raw = await c.req.text();
  if (raw.length > 2_000) throw new CareError(413, 'Los datos son demasiado largos.');
  try { return settingSchema.parse(JSON.parse(raw)); } catch { throw new CareError(400, 'Revisá el modelo y los precios.'); }
}

function featureParam(c: Context) {
  const feature = c.req.param('feature');
  if (!isAiFeature(feature)) throw new CareError(404, 'Esa función de IA no existe.');
  return feature;
}

async function board() {
  const saved = await listModelSettings();
  return {
    features: AI_FEATURES.map((feature) => ({
      feature,
      label: AI_FEATURE_LABELS[feature],
      current: saved.find((row) => row.feature === feature) ?? null,
    })),
    options: MODEL_OPTIONS,
  };
}

/**
 * Consumo de IA por nutri y por consultorio, y elección de modelo por función con sus precios.
 * Pieza separada del resto de /admin: solo se registra desde un lugar y no toca otras rutas.
 */
export function registerAiAdminRoutes(app: Hono, requireAdmin: (c: Context) => Promise<boolean>) {
  app.get('/api/admin/ai/uso', async (c) => {
    const persistent = await requireAdmin(c);
    c.header('Cache-Control', 'no-store');
    return c.json({ usage: await adminUsageView(), source: persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/admin/ai/modelos', async (c) => {
    const persistent = await requireAdmin(c);
    c.header('Cache-Control', 'no-store');
    return c.json({ ...(await board()), source: persistent ? 'supabase' : 'memory' });
  });

  app.put('/api/admin/ai/modelos/:feature', async (c) => {
    const persistent = await requireAdmin(c);
    const feature = featureParam(c);
    const input = await readBody(c);
    const auth = c.get('auth');
    const email = persistent && 'userId' in auth ? await payerEmail(auth.userId) : 'admin@local';
    if (!email) throw new CareError(409, 'Tu cuenta no tiene un mail para anotar el cambio.');
    await saveModelSetting(feature, input, email);
    return c.json({ ...(await board()), source: persistent ? 'supabase' : 'memory' });
  });

  // Vuelve al modelo gratuito de siempre.
  app.delete('/api/admin/ai/modelos/:feature', async (c) => {
    const persistent = await requireAdmin(c);
    await clearModelSetting(featureParam(c));
    return c.json({ ...(await board()), source: persistent ? 'supabase' : 'memory' });
  });
}
