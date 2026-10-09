import { describe, expect, it } from 'vitest';
import { compareNutritionTargets } from './nutrition-target-comparison';
const proposal = { kcal: 1600, protein_g: 100, carbs_g: 180, fat_g: 53 };
describe('comparación de propuesta con meta confirmada', () => {
  it('muestra aumentos, reducciones y valores iguales por nutriente', () => {
    const rows = compareNutritionTargets(proposal, { kcal: 1800, protein_g: 90, carbs_g: 180, fat_g: 60 });
    expect(rows.map(row => row.change)).toEqual([-200, 10, 0, -7]);
  });
  it('no presenta una meta ausente como cero ni inventa diferencias', () => {
    const rows = compareNutritionTargets(proposal, null);
    expect(rows.every(row => row.confirmed === null && row.change === null)).toBe(true);
  });
  it('no modifica las dos versiones al comparar', () => {
    const confirmed = Object.freeze({ ...proposal });
    expect(compareNutritionTargets(Object.freeze(proposal), confirmed).every(row => row.change === 0)).toBe(true);
  });
});
