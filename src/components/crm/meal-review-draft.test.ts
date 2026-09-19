import { describe, expect, it } from 'vitest';
import type { MealLog } from '../../types';
import { buildAdjustedMealPatch, createMealReviewDraft } from './meal-review-draft';

const log: MealLog = {
  id: 'meal-1',
  patient_id: 'pat-1',
  slot: 'Almuerzo',
  photo_url: null,
  description: 'Pollo con arroz',
  foods: [{ name: 'pollo', portion_est: 120, portion_unit: 'g', confidence: 0.7 }],
  macros: { kcal: 400, protein_g: 30, carbs_g: 40, fat_g: 12 },
  confidence: 0.7,
  note_for_nutri: 'Revisar porción',
  status: 'pending_review',
  logged_at: '2026-09-05T12:00:00.000Z',
};

describe('meal review draft', () => {
  it('creates an isolated editable copy of the estimated meal', () => {
    const draft = createMealReviewDraft(log);
    draft.foods[0].name = 'pollo al horno';

    expect(log.foods[0].name).toBe('pollo');
    expect(draft.macros).toEqual(log.macros);
  });

  it('builds a trimmed adjusted review payload', () => {
    const draft = createMealReviewDraft(log);
    draft.foods[0].name = '  pollo al horno  ';
    draft.macros.kcal = 410;

    expect(buildAdjustedMealPatch(draft)).toEqual({
      status: 'adjusted',
      foods: [{ name: 'pollo al horno', portion_est: 120, portion_unit: 'g', confidence: 0.7 }],
      macros: { kcal: 410, protein_g: 30, carbs_g: 40, fat_g: 12 },
    });
  });

  it('seeds an editable food when the automatic estimation is empty', () => {
    const draft = createMealReviewDraft({ ...log, foods: [], macros: null, confidence: 0 });
    expect(draft.foods).toEqual([{ name: '', portion_est: null, portion_unit: 'g', confidence: 0 }]);
    expect(draft.macros).toEqual({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
    expect(buildAdjustedMealPatch(draft)).toBeNull();
    draft.foods[0].name = 'yogur';
    draft.macros = { kcal: 180, protein_g: 10, carbs_g: 20, fat_g: 4 };
    expect(buildAdjustedMealPatch(draft)?.foods[0].name).toBe('yogur');
  });

  it('rejects blank foods and invalid macro values before the request', () => {
    const blankFood = createMealReviewDraft(log);
    blankFood.foods[0].name = '   ';
    expect(buildAdjustedMealPatch(blankFood)).toBeNull();

    const negativeMacro = createMealReviewDraft(log);
    negativeMacro.macros.kcal = -1;
    expect(buildAdjustedMealPatch(negativeMacro)).toBeNull();
  });
});
