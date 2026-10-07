import { describe, expect, it } from 'vitest';
import { culinaryCategoriesSchema, recipeCulinaryCategories } from './recipe-categories';
import { buildRecipeCard, recipeWizardSchema } from './recipe-plate';

describe('categorías culinarias opcionales', () => {
  it('admite recetas anteriores y rechaza repetidas, vacías o más de seis', () => {
    expect(recipeCulinaryCategories()).toEqual([]);
    expect(culinaryCategoriesSchema.parse(['  Guisos  ', 'Pollo'])).toEqual(['Guisos', 'Pollo']);
    for (const invalid of [['Guisos', 'GUÍSOS'], [' '], ['a','b','c','d','e','f','g'], ['a'.repeat(51)]]) expect(culinaryCategoriesSchema.safeParse(invalid).success).toBe(false);
  });
  it('conserva clasificación separada del momento incluso con alimentos vinculados', () => {
    const input = recipeWizardSchema.parse({ id: crypto.randomUUID(), title: 'Guiso casero', yield_portions: 2, steps: ['Cocinar.'], category: 'Cena', culinary_categories: ['Guisos'], items: [{ name: 'Pollo', quantity: 100, unit: 'g', catalog_ref: { id: crypto.randomUUID(), revision: 1, measure: null } }] });
    expect(buildRecipeCard(input)).toMatchObject({ category: 'Cena', culinary_categories: ['Guisos'], macro_status: 'unavailable' });
  });
});
