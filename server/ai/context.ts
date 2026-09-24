import { createHash } from 'node:crypto';
import type { IntakePayload } from '../intake/payload.js';
import type { Patient } from '../../src/types/index.js';
import {
  AI_JOB_MAX_TOKENS,
  MENU_PROMPT_VERSION,
  RECIPE_PROMPT_VERSION,
  type AiJobType,
} from '../../src/types/ai-jobs.js';
import { CareError } from '../care/errors.js';

export { RECIPE_PROMPT_VERSION, MENU_PROMPT_VERSION };

export type HealthSlice = {
  state: IntakePayload['allergies']['state'];
  items: string[];
};

export type RecipeJobContext = {
  schema: typeof RECIPE_PROMPT_VERSION;
  allergies: HealthSlice;
  restrictions: HealthSlice;
  cooking_time_minutes: number | null;
  title_hint: string | null;
};

export type MenuSlotContext = { day: string; meals: Array<{ slot: string; title: string }> };

export type MenuJobContext = {
  schema: typeof MENU_PROMPT_VERSION;
  allergies: HealthSlice;
  restrictions: HealthSlice;
  cooking_time_minutes: number | null;
  period_start: string | null;
  period_end: string | null;
  slots: string[];
  catalog_titles: string[];
  request: { target: string; reason: string; replacement: 'recipe' | 'ingredient' } | null;
  week_slots: MenuSlotContext[];
};

export function assertKnownAllergies(intake: Pick<IntakePayload, 'allergies' | 'restrictions'>) {
  if (intake.allergies.state === 'unknown' || intake.restrictions.state === 'unknown') {
    throw new CareError(409, 'Completá alergias y restricciones con el paciente antes de generar alternativas.');
  }
}

function sliceFact(fact: IntakePayload['allergies']): HealthSlice {
  return { state: fact.state, items: [...fact.items] };
}

export function buildRecipeJobContext(input: {
  intake: Pick<IntakePayload, 'allergies' | 'restrictions' | 'cooking_time_minutes'>;
  titleHint?: string | null;
}): RecipeJobContext {
  assertKnownAllergies(input.intake);
  return {
    schema: RECIPE_PROMPT_VERSION,
    allergies: sliceFact(input.intake.allergies),
    restrictions: sliceFact(input.intake.restrictions),
    cooking_time_minutes: input.intake.cooking_time_minutes ?? null,
    title_hint: input.titleHint?.trim() ? input.titleHint.trim() : null,
  };
}

export function buildMenuJobContext(input: {
  intake: Pick<IntakePayload, 'allergies' | 'restrictions' | 'cooking_time_minutes'>;
  periodStart?: string | null;
  periodEnd?: string | null;
  slots?: string[];
  catalogTitles?: string[];
  request?: { target: string; reason: string; replacement: 'recipe' | 'ingredient' } | null;
  weekPlan?: Patient['weekPlan'];
}): MenuJobContext {
  assertKnownAllergies(input.intake);
  return {
    schema: MENU_PROMPT_VERSION,
    allergies: sliceFact(input.intake.allergies),
    restrictions: sliceFact(input.intake.restrictions),
    cooking_time_minutes: input.intake.cooking_time_minutes ?? null,
    period_start: input.periodStart ?? null,
    period_end: input.periodEnd ?? null,
    slots: input.slots ?? [],
    catalog_titles: (input.catalogTitles ?? []).slice(0, 20),
    request: input.request ?? null,
    week_slots: (input.weekPlan ?? []).map((entry) => ({
      day: entry.day,
      meals: entry.meals.map((meal) => ({ slot: meal.slot, title: meal.title })),
    })),
  };
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

export function hashAiContext(context: unknown): string {
  return createHash('sha256').update(canonicalJson(context), 'utf8').digest('hex');
}

export function estimateTokens(context: unknown): number {
  return Math.max(1, Math.ceil(canonicalJson(context).length / 4));
}

export function assertJobTokenBudget(tokens: number) {
  if (tokens > AI_JOB_MAX_TOKENS) {
    throw new CareError(429, 'El contexto de este job supera el límite de tokens. Reducí el período o las comidas.');
  }
}

export function promptVersionFor(jobType: AiJobType) {
  return jobType === 'recipe_draft' ? RECIPE_PROMPT_VERSION : MENU_PROMPT_VERSION;
}
