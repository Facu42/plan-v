import { describe, expect, it } from 'vitest';
import { EVAL_SET_VERSION, assertReadyToPublish, evaluateMealPlanDraft, evaluateRecipeDraft, evaluateReplacementDraft } from './evaluate.js';
import { SYNTHETIC_SCENARIOS } from './scenarios.js';
import { CareError } from '../care/errors.js';
import { recipeDbError } from '../recipes/repository.js';
import { mealPlanDbError } from '../plans/repository.js';

function run(scenario: (typeof SYNTHETIC_SCENARIOS)[number]) {
  if (scenario.kind === 'recipe') return evaluateRecipeDraft(scenario.recipe!, scenario.health);
  if (scenario.kind === 'plan') return evaluateMealPlanDraft(scenario.plan!, scenario.health);
  return evaluateReplacementDraft(scenario.replacement!, scenario.health);
}

describe('PV-28 evaluación sintética eval.v1', () => {
  it('cubre 30 escenarios versionados en los seis grupos del spec', () => {
    expect(SYNTHETIC_SCENARIOS).toHaveLength(30);
    const groups = Object.fromEntries(['allergies', 'missing_units', 'prefs_times', 'concurrent', 'errors', 'privacy'].map((group) => [group, SYNTHETIC_SCENARIOS.filter((row) => row.group === group).length]));
    expect(groups).toEqual({ allergies: 5, missing_units: 5, prefs_times: 5, concurrent: 5, errors: 5, privacy: 5 });
    expect(new Set(SYNTHETIC_SCENARIOS.map((row) => row.id)).size).toBe(30);
  });

  it.each(SYNTHETIC_SCENARIOS)('$id $note', (scenario) => {
    const result = run(scenario);
    expect(result.set).toBe(EVAL_SET_VERSION);
    if (scenario.expect === 'block') {
      expect(result.blockers.map((issue) => issue.code)).toContain(scenario.code);
    } else {
      expect(result.blockers).toEqual([]);
    }
  });

  it('ninguna alergia explícita del set pasa el validador', () => {
    const missed = SYNTHETIC_SCENARIOS.filter((row) => row.group === 'allergies' && run(row).blockers.every((issue) => issue.code !== 'allergy'));
    expect(missed).toEqual([]);
  });

  it('assertReadyToPublish no publica y mapea 501/409 persistentes', () => {
    expect(() => assertReadyToPublish(evaluateMealPlanDraft({ period_start: '2026-09-21', period_end: '2026-09-21', items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Pollo' }] }))).toThrow(CareError);
    try {
      mealPlanDbError({ code: 'PT409', message: 'meal_plan_allergies' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 409 });
    }
    try {
      recipeDbError({ code: 'PT409', message: 'recipe_incomplete' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 409 });
    }
    try {
      mealPlanDbError({ code: '42P01' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
  });
});
