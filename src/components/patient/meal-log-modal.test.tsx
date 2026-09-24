import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MEAL_KEPT_COPY, mealLogWasKept } from './MealLogModal';

describe('PV-22 diario UI', () => {
  it('muestra que el registro no se perdió cuando la estimación falla', () => {
    expect(mealLogWasKept({ foods: [], macros: null, analysis_status: 'failed' })).toBe(true);
    expect(mealLogWasKept({
      foods: [{ name: 'pollo', portion_est: 120, portion_unit: 'g', confidence: 0.7 }],
      macros: { kcal: 400, protein_g: 30, carbs_g: 20, fat_g: 12 },
      analysis_status: 'succeeded',
    })).toBe(false);
    const html = renderToStaticMarkup(<p className="modal-note">{MEAL_KEPT_COPY}</p>);
    expect(html).toContain('Tu registro no se perdió');
    expect(html).not.toContain('note_for_nutri');
  });
});
