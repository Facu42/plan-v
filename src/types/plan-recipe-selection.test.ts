import { describe, expect, it } from 'vitest';
import type { ProfessionalRecipe } from './recipes';
import type { PlanItemView, PlanRecipeDetail } from './plans';
import { filterPlanRecipes, publishedRecipeDetail, recipePortionNutrients, resolvePlanRecipeSelection } from './plan-recipe-selection';

const recipe = { id: 'r1', title: 'Título nuevo privado', current: { version: 2, title: 'Título nuevo privado', ingredients: [{ name: 'Pollo' }], card: { culinary_categories: ['Guisos'] } }, published: { version: 1, title: 'Avena publicada', yield_portions: 2, ingredients: [{ id: 'i1', name: 'Avena', quantity: 40, unit: 'g' }], steps: ['Mezclar.'], nutrient_source: 'Etiqueta ficticia', card: { culinary_categories: ['Platos principales'], macros: { kcal: 38, protein_g: 1.3, carbs_g: 6, fat_g: 0.7 } } } } as unknown as ProfessionalRecipe;

describe('selección de recetas para el plan', () => {
  it('busca y clasifica sólo la copia publicada, sin filtrar por un borrador posterior', () => {
    expect(filterPlanRecipes([recipe], 'avÉna', 'Platos principales')).toEqual([recipe]);
    expect(filterPlanRecipes([recipe], 'pollo', '')).toEqual([]);
    expect(filterPlanRecipes([recipe], '', 'Guisos')).toEqual([]);
    expect(filterPlanRecipes([{ ...recipe, published: null }], '', '')).toEqual([]);
  });
  it('mantiene el detalle guardado de v1 aunque el catálogo ya publique v2', () => {
    const old = publishedRecipeDetail(recipe)!;
    const updated = { ...recipe, published: { ...recipe.published!, version: 2, title: 'Nueva publicación' } };
    const saved = [{ recipe_id: 'r1', recipe_version: 1, recipe: old }] as PlanItemView[];
    expect(resolvePlanRecipeSelection({ recipe_id: 'r1', recipe_version: 1 }, [updated], saved)?.title).toBe('Avena publicada');
    expect(resolvePlanRecipeSelection({ recipe_id: 'r1', recipe_version: 1 }, [updated], [])).toBeNull();
  });
  it('escala nutrientes por porción, conserva cero/desconocidos y rechaza cantidades inválidas', () => {
    const detail = publishedRecipeDetail(recipe)!;
    expect(recipePortionNutrients(detail, 2)).toMatchObject({ kcal: 76, protein: 2.6, fiber: null });
    const withSnapshot = { ...detail, catalog_recipe: { per_portion: { kcal: 38, sodium: 0, fiber: null } } } as PlanRecipeDetail;
    expect(recipePortionNutrients(withSnapshot, 0.5)).toMatchObject({ kcal: 19, sodium: 0, fiber: null });
    for (const amount of [NaN, 0, 51, -1]) expect(recipePortionNutrients(detail, amount)).toBeNull();
  });
});
