import { CareError } from '../care/errors.js';
import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { isFreeOpenRouterModel } from './cost-policy.js';

/** Funciones de IA a las que el administrador puede asignar un modelo. */
export const AI_FEATURES = [
  'menu_draft', 'recipe_draft', 'replacement', 'copilot', 'meal_photo',
  'lab_reading', 'content_post', 'admin_assistant', 'general',
] as const;
export type AiFeature = typeof AI_FEATURES[number];

export const AI_FEATURE_LABELS: Record<AiFeature, string> = {
  menu_draft: 'Planes semanales',
  recipe_draft: 'Recetas',
  replacement: 'Reemplazos de platos',
  copilot: 'Copiloto de la ficha',
  meal_photo: 'Fotos de comidas',
  lab_reading: 'Lectura de estudios',
  content_post: 'Contenido para redes',
  admin_assistant: 'Asistente del administrador',
  general: 'Otras funciones',
};

export type ModelSetting = {
  feature: AiFeature;
  model: string;
  input_usd_per_mtok: number;
  output_usd_per_mtok: number;
  updated_by: string;
  updated_at: string;
};

export type ModelOption = { model: string; label: string; input_usd_per_mtok: number; output_usd_per_mtok: number; note: string };

/**
 * Sugerencias para elegir rápido. Son precios de referencia de comparadores de terceros (4/11/2026):
 * el administrador los confirma contra la lista de OpenRouter antes de guardar.
 */
export const MODEL_OPTIONS: ModelOption[] = [
  { model: 'openrouter/free', label: 'Gratis (OpenRouter)', input_usd_per_mtok: 0, output_usd_per_mtok: 0, note: 'Con topes diarios. Solo para probar.' },
  { model: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', input_usd_per_mtok: 0.2, output_usd_per_mtok: 1.2, note: 'Barato. Falta probarlo en español y recetas.' },
  { model: 'openai/gpt-5.4-nano', label: 'GPT-5.4 nano', input_usd_per_mtok: 0.2, output_usd_per_mtok: 1.25, note: 'Chico: ideas, reemplazos, control.' },
  { model: 'openai/gpt-5.4-mini', label: 'GPT-5.4 mini', input_usd_per_mtok: 0.75, output_usd_per_mtok: 4.5, note: 'Medio: planes y recetas.' },
  { model: 'google/gemini-3.6-flash', label: 'Gemini 3.6 Flash', input_usd_per_mtok: 0.75, output_usd_per_mtok: 3.75, note: 'Medio. Precio promocional hasta fin de año.' },
];

export function isAiFeature(value: unknown): value is AiFeature {
  return typeof value === 'string' && (AI_FEATURES as readonly string[]).includes(value);
}

const MODEL_ID = /^[a-z0-9._-]+\/[a-z0-9._:-]+$/;
const PRICE_MAX = 100;

export type ModelSettingInput = { model: string; input_usd_per_mtok: number; output_usd_per_mtok: number };

export function validateModelSetting(input: ModelSettingInput): ModelSettingInput {
  const priceOk = (value: number) => Number.isFinite(value) && value >= 0 && value <= PRICE_MAX;
  if (typeof input.model !== 'string' || input.model.length > 120 || !MODEL_ID.test(input.model)) {
    throw new CareError(422, 'El modelo tiene que ser un id de OpenRouter, por ejemplo openai/gpt-5.6-luna.');
  }
  if (!priceOk(input.input_usd_per_mtok) || !priceOk(input.output_usd_per_mtok)) {
    throw new CareError(422, 'Los precios van en dólares por millón, entre 0 y 100.');
  }
  // Un modelo con precio cero tiene que ser gratis de verdad; si no, el proveedor lo rechazaría.
  const free = input.input_usd_per_mtok === 0 && input.output_usd_per_mtok === 0;
  if (free && !isFreeOpenRouterModel(input.model)) {
    throw new CareError(422, 'Un modelo sin precio tiene que ser gratuito (terminado en :free o openrouter/free).');
  }
  if (!free && isFreeOpenRouterModel(input.model)) {
    throw new CareError(422, 'Un modelo gratuito no lleva precio. Dejá los dos precios en 0.');
  }
  return { model: input.model, input_usd_per_mtok: input.input_usd_per_mtok, output_usd_per_mtok: input.output_usd_per_mtok };
}

const memory = new Map<AiFeature, ModelSetting>();
registerDemoState('ai/model-settings', () => ({ memory }));
export function resetModelSettingsMemory() { memory.clear(); cache = null; }

type Cache = { at: number; byFeature: Map<AiFeature, ModelSetting> };
const TTL_MS = 30_000;
let cache: Cache | null = null;

function asSetting(row: Record<string, unknown>): ModelSetting | null {
  if (!isAiFeature(row.feature)) return null;
  const input = Number(row.input_usd_per_mtok);
  const output = Number(row.output_usd_per_mtok);
  if (typeof row.model !== 'string' || !MODEL_ID.test(row.model) || !Number.isFinite(input) || !Number.isFinite(output)) return null;
  return {
    feature: row.feature, model: row.model, input_usd_per_mtok: input, output_usd_per_mtok: output,
    updated_by: String(row.updated_by ?? ''), updated_at: String(row.updated_at ?? ''),
  };
}

function schemaMissing(error: { code?: string } | null): boolean {
  return ['42P01', 'PGRST205'].includes(error?.code ?? '');
}

/** Lee la elección guardada. Si la tabla no existe todavía, todo sigue como hoy (modelo gratis). */
export async function listModelSettings(): Promise<ModelSetting[]> {
  if (!isSupabaseEnabled()) return [...memory.values()];
  const { data, error } = await privilegedDb().from('ai_model_settings')
    .select('feature,model,input_usd_per_mtok,output_usd_per_mtok,updated_by,updated_at');
  if (error) {
    if (schemaMissing(error)) return [];
    throw new CareError(503, 'No se pudo leer la elección de modelos.');
  }
  return (data ?? []).map((row) => asSetting(row as Record<string, unknown>)).filter((row): row is ModelSetting => row != null);
}

/** Refresca la copia en memoria si venció. Los fallos no cortan la IA: queda lo último conocido. */
export async function refreshModelSettings(force = false): Promise<void> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return;
  try {
    const rows = await listModelSettings();
    cache = { at: Date.now(), byFeature: new Map(rows.map((row) => [row.feature, row])) };
  } catch {
    cache = { at: Date.now(), byFeature: cache?.byFeature ?? new Map() };
  }
}

/** Elección vigente para una función, o null si el administrador no eligió nada (se usa el modelo gratis de siempre). */
export function modelSettingFor(feature: AiFeature): ModelSetting | null {
  return cache?.byFeature.get(feature) ?? cache?.byFeature.get('general') ?? null;
}

export async function saveModelSetting(feature: AiFeature, input: ModelSettingInput, actorEmail: string): Promise<ModelSetting[]> {
  const valid = validateModelSetting(input);
  const row = { feature, ...valid, updated_by: actorEmail.slice(0, 254), updated_at: new Date().toISOString() };
  if (!isSupabaseEnabled()) {
    memory.set(feature, row);
  } else {
    const { error } = await privilegedDb().from('ai_model_settings').upsert(row, { onConflict: 'feature' });
    if (error) {
      if (schemaMissing(error)) throw new CareError(501, 'Falta aplicar la migración de modelos de IA. No aplicar en producción sin la frase de Facundo.');
      throw new CareError(503, 'No se pudo guardar el modelo.');
    }
  }
  await refreshModelSettings(true);
  return listModelSettings();
}

export async function clearModelSetting(feature: AiFeature): Promise<ModelSetting[]> {
  if (!isSupabaseEnabled()) {
    memory.delete(feature);
  } else {
    const { error } = await privilegedDb().from('ai_model_settings').delete().eq('feature', feature);
    if (error && !schemaMissing(error)) throw new CareError(503, 'No se pudo volver al modelo gratuito.');
  }
  await refreshModelSettings(true);
  return listModelSettings();
}
