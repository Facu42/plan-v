import { RECIPE_PROMPT_VERSION } from '../../src/types/ai-jobs.js';
import { generateRecipeDraft } from '../ai/recipe-draft.js';
import { ingredientCoverPrompt } from '../ai/ingredient-cover.js';
import { generateCoverFromPrompt, recipeCoverEnabled, recipeCoverPrompt, type RecipeCoverContext, type RecipeCoverResult } from '../ai/recipe-cover.js';
import { resolveAiMode } from '../ai/mode.js';
import { CareError } from '../care/errors.js';
import type { AiCheckPart, AiCheckStatus } from './ai-check.js';

/** Cada foto gasta cuota gratuita de Cloudflare: la prueba completa se puede repetir una vez por minuto. */
export const FULL_CHECK_MIN_INTERVAL_MS = 60_000;

export type FullCheckPhoto = {
  label: string;
  kind: 'plato' | 'ingrediente';
  /** El texto en inglés que realmente recibe el modelo de imágenes. */
  prompt: string;
  status: AiCheckStatus;
  detail: string;
  preview: string | null;
};
export type FullCheckResult = {
  recipe: AiCheckPart & { title: string | null; items: number; steps: number };
  photos: FullCheckPhoto[];
};

const SAMPLE_DISHES: RecipeCoverContext[] = [
  { title: 'Ensalada de lentejas', items: [{ name: 'lentejas cocidas' }, { name: 'zanahoria' }, { name: 'cebolla' }, { name: 'aceite de oliva' }] },
  { title: 'Merluza al horno con papas', items: [{ name: 'merluza' }, { name: 'papas' }, { name: 'limón' }, { name: 'aceite de oliva' }] },
];
const SAMPLE_INGREDIENTS = [{ key: 'huevo', label: 'Huevo' }, { key: 'merluza', label: 'Merluza' }];

export type FullCheckDeps = {
  now: () => number;
  aiLive: () => boolean;
  imageEnabled: () => boolean;
  runRecipe: () => Promise<{ title: string; items: number; steps: number }>;
  runImage: (prompt: string, alt: string) => Promise<RecipeCoverResult>;
};

const realDeps: FullCheckDeps = {
  now: () => Date.now(),
  aiLive: () => { try { return resolveAiMode() === 'live'; } catch { return false; } },
  imageEnabled: recipeCoverEnabled,
  runRecipe: async () => {
    const { recipe } = await generateRecipeDraft({
      schema: RECIPE_PROMPT_VERSION,
      allergies: { state: 'none', items: [] },
      restrictions: { state: 'none', items: [] },
      cooking_time_minutes: 30,
      title_hint: 'Ensalada de lentejas con verduras',
    });
    return { title: recipe.title, items: recipe.items.length, steps: recipe.steps.length };
  },
  runImage: generateCoverFromPrompt,
};

let lastRunAt = 0;

async function checkRecipe(deps: FullCheckDeps): Promise<FullCheckResult['recipe']> {
  const empty = { title: null, items: 0, steps: 0 };
  if (!deps.aiLive()) return { status: 'off', detail: 'La IA de texto está apagada en este servidor.', ms: 0, ...empty };
  const start = deps.now();
  try {
    const recipe = await deps.runRecipe();
    const complete = recipe.items >= 3 && recipe.steps >= 2;
    return {
      status: complete ? 'ok' : 'failed',
      detail: complete ? 'Armó una receta con ingredientes y pasos.' : 'La receta llegó incompleta (menos de 3 ingredientes o 2 pasos).',
      ms: deps.now() - start,
      ...recipe,
    };
  } catch {
    return { status: 'failed', detail: 'No pudo armar la receta. Revisá «Verificar IA» arriba para ver el motivo.', ms: deps.now() - start, ...empty };
  }
}

async function samplePhoto(deps: FullCheckDeps, label: string, kind: FullCheckPhoto['kind'], prompt: string): Promise<FullCheckPhoto> {
  try {
    const result = await deps.runImage(prompt, `${label} · imagen de verificación`);
    if (result.status === 'ready') {
      return { label, kind, prompt, status: 'ok', detail: 'Foto generada.', preview: `data:${result.mime};base64,${result.bytes.toString('base64')}` };
    }
    return { label, kind, prompt, status: 'failed', detail: result.blocked ? 'Cloudflare rechazó la clave o se agotó la cuota de hoy.' : 'Cloudflare no devolvió la foto.', preview: null };
  } catch {
    return { label, kind, prompt, status: 'failed', detail: 'Cloudflare no respondió.', preview: null };
  }
}

/** Receta de ejemplo con la IA de texto y cuatro fotos de ejemplo con los mismos textos que usa la app. No guarda nada. */
export async function runFullAiCheck(deps: FullCheckDeps = realDeps): Promise<FullCheckResult> {
  const now = deps.now();
  if (now - lastRunAt < FULL_CHECK_MIN_INTERVAL_MS) throw new CareError(429, 'Esperá un minuto antes de volver a probar.');
  lastRunAt = now;
  const jobs: Array<{ label: string; kind: FullCheckPhoto['kind']; prompt: string }> = [
    ...SAMPLE_DISHES.map((dish) => ({ label: dish.title, kind: 'plato' as const, prompt: recipeCoverPrompt(dish) })),
    ...SAMPLE_INGREDIENTS.map((item) => ({ label: item.label, kind: 'ingrediente' as const, prompt: ingredientCoverPrompt(item.key) })),
  ];
  const photoPromise = deps.imageEnabled()
    ? Promise.all(jobs.map((job) => samplePhoto(deps, job.label, job.kind, job.prompt)))
    : Promise.resolve(jobs.map((job): FullCheckPhoto => ({ ...job, status: 'off', detail: 'Faltan las variables de Cloudflare en Railway.', preview: null })));
  const [recipe, photos] = await Promise.all([checkRecipe(deps), photoPromise]);
  return { recipe, photos };
}

export function resetFullCheckLimit() { lastRunAt = 0; }
