import { createHash } from 'node:crypto';
import type { IntakePayload } from '../intake/payload.js';
import type { Patient } from '../../src/types/index.js';
import type { Recipe } from '../../src/types/recipes.js';
import type { AiJobContext } from '../../src/types/ai-jobs.js';

export function buildAiJobContext(input: {
  intake: IntakePayload;
  weekPlan: Patient['weekPlan'];
  catalog: readonly Recipe[];
  periodStart: string;
  focus?: string;
}): AiJobContext {
  return {
    allergies: { state: input.intake.allergies.state, items: [...input.intake.allergies.items] },
    restrictions: { state: input.intake.restrictions.state, items: [...input.intake.restrictions.items] },
    cooking_time_minutes: input.intake.cooking_time_minutes ?? null,
    catalog: input.catalog.filter((recipe) => recipe.published_at).map((recipe) => recipe.title).slice(0, 24),
    current_plan: input.weekPlan.flatMap((day) => day.meals.map((meal) => ({ day: day.day, slot: meal.slot, title: meal.title }))).slice(0, 42),
    period_start: input.periodStart,
    focus: input.focus?.trim() ? input.focus.trim().slice(0, 200) : null,
  };
}

export function hashAiJobContext(context: AiJobContext): string {
  return createHash('sha256').update(JSON.stringify(context)).digest('hex');
}
