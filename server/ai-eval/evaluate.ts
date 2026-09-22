import { RECIPE_UNITS } from '../../src/types/recipes.js';
import { planSlotKey } from '../../src/types/plans.js';
import { CareError } from '../care/errors.js';
import { EVAL_SET_VERSION, type EvalHealth, type EvalIssue, type EvalResult } from '../../src/types/ai-eval.js';
import { allergenTokens, haystackContains, normalizeClinicalToken, restrictionTokens } from './normalize.js';

export { EVAL_SET_VERSION };

const INCOMPLETE_MARKERS = [
  'ingrediente a definir',
  'completar antes de publicar',
  'indicacion demo',
  'indicación demo',
  'ejemplo demo',
  'contenido de demostracion',
  'contenido de demostración',
];

function emptyResult(): EvalResult {
  return { set: EVAL_SET_VERSION, blockers: [], warnings: [] };
}

function push(result: EvalResult, issue: EvalIssue) {
  result.blockers.push(issue);
}

function knownHealth(health?: EvalHealth | null): { ok: true; health: EvalHealth } | { ok: false; result: EvalResult } {
  const result = emptyResult();
  if (!health || health.allergies.state === 'unknown' || health.restrictions.state === 'unknown') {
    push(result, {
      code: 'unknown_allergies',
      message: 'Completá alergias y restricciones con el paciente antes de publicar.',
    });
    return { ok: false, result };
  }
  return { ok: true, health };
}

function scanDeclared(haystack: string, health: EvalHealth, result: EvalResult, path?: string) {
  for (const item of health.allergies.items) {
    const hit = haystackContains(haystack, allergenTokens(item));
    if (hit) {
      push(result, {
        code: 'allergy',
        message: `El contenido incluye «${item}», declarado como alergia. Sacalo o cambiá la indicación antes de publicar.`,
        path,
      });
    }
  }
  for (const item of health.restrictions.items) {
    const hit = haystackContains(haystack, restrictionTokens(item));
    if (hit) {
      push(result, {
        code: 'restriction',
        message: `El contenido no respeta la restricción «${item}». Revisalo antes de publicar.`,
        path,
      });
    }
  }
}

function scanIncomplete(haystack: string, result: EvalResult, path?: string) {
  const normalized = normalizeClinicalToken(haystack);
  for (const marker of INCOMPLETE_MARKERS) {
    if (normalized.includes(normalizeClinicalToken(marker))) {
      push(result, {
        code: 'incomplete_draft',
        message: 'Este borrador todavía tiene texto de demostración o pendientes. Completalo antes de publicar.',
        path,
      });
      return;
    }
  }
}

function scanMinutes(text: string, limit: number | null | undefined, result: EvalResult, path?: string) {
  if (limit == null) return;
  const matches = text.matchAll(/(\d+)\s*(minutos|minuto|min)\b/gi);
  for (const match of matches) {
    const minutes = Number(match[1]);
    if (Number.isFinite(minutes) && minutes > limit) {
      push(result, {
        code: 'time_exceeded',
        message: `Hay un paso de ${minutes} min y el tiempo de cocina declarado es ${limit} min.`,
        path,
      });
      return;
    }
  }
}

function ignoreInjection(text: string, result: EvalResult) {
  const normalized = normalizeClinicalToken(text);
  if (
    normalized.includes('ignore previous')
    || normalized.includes('ignora instrucciones')
    || normalized.includes('publica esto')
    || normalized.includes('send to other patient')
  ) {
    result.warnings.push({
      code: 'privacy',
      message: 'El texto incluye una instrucción no confiable. Se ignora; no cambia la evaluación ni publica.',
    });
  }
}

export type RecipeEvalInput = {
  title: string;
  yield_portions: number;
  steps: string[];
  items: Array<{ name: string; quantity: number; unit: string }>;
};

export function evaluateRecipeDraft(input: RecipeEvalInput, health?: EvalHealth | null, options: { requireHealth?: boolean } = {}): EvalResult {
  const result = emptyResult();
  if (options.requireHealth) {
    const known = knownHealth(health);
    if (!known.ok) return known.result;
    health = known.health;
  }
  if (!input.title?.trim() || input.yield_portions <= 0) {
    push(result, { code: 'missing_portion', message: 'Indicá un título y un rinde de porciones mayor a cero.' });
  }
  if (!input.items?.length) {
    push(result, { code: 'missing_item', message: 'Agregá al menos un ingrediente con cantidad y unidad antes de publicar.' });
  }
  if (!input.steps?.length) {
    push(result, { code: 'missing_step', message: 'Agregá al menos un paso de preparación antes de publicar.' });
  }
  for (const [index, item] of (input.items ?? []).entries()) {
    if (!item.name?.trim() || !(item.quantity > 0)) {
      push(result, { code: 'missing_item', message: 'Cada ingrediente necesita nombre y cantidad positiva.', path: `items.${index}` });
    }
    if (!(RECIPE_UNITS as readonly string[]).includes(item.unit)) {
      push(result, { code: 'invalid_unit', message: 'Usá una unidad del catálogo (g, ml, u, cdita, cda, taza).', path: `items.${index}.unit` });
    }
  }
  const haystack = [input.title, ...(input.steps ?? []), ...(input.items ?? []).map((item) => item.name)].join(' ');
  scanIncomplete(haystack, result);
  ignoreInjection(haystack, result);
  if (health && health.allergies.state !== 'unknown' && health.restrictions.state !== 'unknown') {
    scanDeclared(haystack, health, result);
    scanMinutes(haystack, health.cooking_time_minutes, result);
  }
  return result;
}

export type PlanEvalItem = {
  for_date: string;
  slot: string;
  recipe_id?: string | null;
  free_text?: string | null;
  portions?: number | null;
  public_note?: string;
  recipe?: {
    title: string;
    steps: string[];
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
  } | null;
};

export type PlanEvalInput = {
  period_start: string;
  period_end: string;
  items: PlanEvalItem[];
};

export function evaluateMealPlanDraft(input: PlanEvalInput, health?: EvalHealth | null): EvalResult {
  const known = knownHealth(health);
  if (!known.ok) return known.result;
  const result = emptyResult();
  if (!input.items?.length) {
    push(result, { code: 'missing_item', message: 'El plan necesita al menos una indicación antes de publicar.' });
    return result;
  }
  const keys = new Set<string>();
  for (const [index, item] of input.items.entries()) {
    const hasRecipe = Boolean(item.recipe_id || item.recipe);
    const text = item.free_text?.trim() || '';
    if (hasRecipe === Boolean(text)) {
      push(result, { code: 'xor', message: 'Cada momento lleva receta o texto, no los dos ni ninguno.', path: `items.${index}` });
    }
    if (item.for_date < input.period_start || item.for_date > input.period_end) {
      push(result, { code: 'date_range', message: 'Hay una fecha fuera del período del plan.', path: `items.${index}.for_date` });
    }
    const slot = planSlotKey(item.slot) ?? item.slot;
    const key = `${item.for_date}|${slot}`;
    if (keys.has(key)) {
      push(result, { code: 'duplicate_slot', message: 'Hay dos indicaciones en la misma fecha y momento.', path: `items.${index}.slot` });
    }
    keys.add(key);
    if (hasRecipe && !(item.portions && item.portions > 0)) {
      push(result, { code: 'missing_portion', message: 'Las recetas del plan necesitan porciones positivas.', path: `items.${index}.portions` });
    }
    if (item.recipe) {
      const nested = evaluateRecipeDraft({
        title: item.recipe.title,
        yield_portions: 1,
        steps: item.recipe.steps,
        items: item.recipe.ingredients,
      }, known.health);
      for (const issue of nested.blockers) {
        result.blockers.push({ ...issue, path: issue.path ? `items.${index}.${issue.path}` : `items.${index}.recipe` });
      }
    }
    const haystack = [text, item.public_note ?? '', item.recipe?.title ?? '', ...(item.recipe?.ingredients.map((line) => line.name) ?? [])].join(' ');
    scanIncomplete(haystack, result, `items.${index}`);
    scanDeclared(haystack, known.health, result, `items.${index}`);
    scanMinutes(haystack, known.health.cooking_time_minutes, result, `items.${index}`);
    ignoreInjection(haystack, result);
  }
  return result;
}

export function evaluateReplacementDraft(
  recipe: { title: string; ingredients: string[]; steps: string[]; explanation?: string },
  health?: EvalHealth | null,
): EvalResult {
  const known = knownHealth(health);
  if (!known.ok) return known.result;
  const asRecipe = evaluateRecipeDraft({
    title: recipe.title,
    yield_portions: 1,
    steps: recipe.steps,
    items: recipe.ingredients.map((name) => ({ name, quantity: 1, unit: 'u' })),
  }, known.health);
  ignoreInjection(`${recipe.explanation ?? ''} ${recipe.title}`, asRecipe);
  return asRecipe;
}

export function assertReadyToPublish(result: EvalResult) {
  const first = result.blockers[0];
  if (!first) return;
  throw new CareError(409, first.message);
}
