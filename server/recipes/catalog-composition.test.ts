import { beforeEach, describe, expect, it } from 'vitest';
import { resetFoodsMemory, saveFood } from '../foods/repository.js';
import { listProfessionalRecipes, listProfessionalRecipeFavorites, setProfessionalRecipeFavorite, publishRecipe, resetRecipeMemory, saveRecipeDraft } from './repository.js';
import { recipeDraftSchema } from '../../src/types/recipes.js';
import { NUTRIENTS, type FoodNutrients } from '../../src/types/foods.js';
import { unavailableCard } from '../../src/types/recipe-plate.js';

const owner = 'nutri-composition';
const foodInput = { id: '11111111-1111-4111-8111-111111111111', expected_revision: 0, name: 'Avena', brand: '', category: '', kind: 'food' as const, source: 'Etiqueta ficticia', reference: '',
  nutrients: { ...Object.fromEntries(NUTRIENTS.map(([key]) => [key, null])) as FoodNutrients, kcal: 380, protein: 13, carbs: 60, fat: 7, sodium: 0 }, portions: [{ name: 'Cucharada', grams: 10 }] };
const draft = () => recipeDraftSchema.parse({ id: crypto.randomUUID(), expected_revision: null, title: 'Avena preparada', yield_portions: 2, final_weight_g: 40, cooking_minutes: 0,
  steps: ['Mezclar y servir.'], items: [{ name: 'Avena', quantity: 2, unit: 'g', catalog_ref: { id: foodInput.id, revision: 1, measure: 'Cucharada' } }] });
beforeEach(() => { resetFoodsMemory(); resetRecipeMemory(); });
describe('guardado de composición propia', () => {
  it('conserva categorías de la copia publicada al reclasificar el borrador', async () => {
    await saveFood(owner, foodInput, false);
    const input = draft();
    const card = { ...unavailableCard(input.title, 'Cena'), culinary_categories: ['Guisos'] };
    const initial = await saveRecipeDraft(owner, input, false, card);
    const published = await publishRecipe(owner, input.id, 1, false, initial.current.revision);
    const changed = await saveRecipeDraft(owner, { ...input, expected_revision: published.current.revision }, false, { ...card, culinary_categories: ['Platos principales'] });
    expect(changed.current.card).toMatchObject({ category: 'Cena', culinary_categories: ['Platos principales'] });
    expect(changed.published?.card?.culinary_categories).toEqual(['Guisos']);
    expect(changed.current.catalog_recipe?.per_portion.kcal).toBe(38);
  });
  it('los favoritos son privados, idempotentes y no cambian la revisión de la receta', async () => {
    await saveFood(owner, foodInput, false);
    const input = draft(); const saved = await saveRecipeDraft(owner, input, false);
    await setProfessionalRecipeFavorite(owner, input.id, true, false);
    await setProfessionalRecipeFavorite(owner, input.id, true, false);
    expect(await listProfessionalRecipeFavorites(owner, false)).toEqual([input.id]);
    expect(await listProfessionalRecipeFavorites('otra-nutri', false)).toEqual([]);
    await expect(setProfessionalRecipeFavorite('otra-nutri', input.id, true, false)).rejects.toThrow('permiso');
    expect((await listProfessionalRecipes(owner, false))[0].current.revision).toBe(saved.current.revision);
    await setProfessionalRecipeFavorite(owner, input.id, false, false);
    await setProfessionalRecipeFavorite(owner, input.id, false, false);
    expect(await listProfessionalRecipeFavorites(owner, false)).toEqual([]);
  });
  it('persiste medidas, peso final y nutrientes sin cambiar una revisión publicada', async () => {
    await saveFood(owner, foodInput, false);
    const input = draft();
    const saved = await saveRecipeDraft(owner, input, false);
    expect(saved.current.ingredients[0].quantity).toBe(20);
    expect(saved.current.catalog_recipe?.per_portion.kcal).toBe(38);
    expect(saved.current.catalog_recipe?.per_portion.fiber).toBeNull();
    expect(saved.current.catalog_recipe?.per_portion.sodium).toBe(0);
    expect(saved.current.final_weight_g).toBe(40);
    await publishRecipe(owner, input.id, 1, false, saved.current.revision);
    await saveFood(owner, { ...foodInput, expected_revision: 1, nutrients: { ...foodInput.nutrients, kcal: 500 } }, false);
    const next = await saveRecipeDraft(owner, { ...input, expected_revision: saved.current.revision, yield_portions: 4 }, false);
    expect(next.current.version).toBe(2);
    expect(next.current.catalog_recipe?.per_portion.kcal).toBe(19);
    expect(next.published?.catalog_recipe?.per_portion.kcal).toBe(38);
    expect((await listProfessionalRecipes(owner, false))[0].published?.nutrition?.per_portion.kcal).toBe(38);
  });
  it('rechaza alimentos ajenos y conserva el borrador si una nueva referencia está vencida', async () => {
    await saveFood('otra-nutri', foodInput, false);
    await expect(saveRecipeDraft(owner, draft(), false)).rejects.toThrow('disponible');
    expect(await listProfessionalRecipes(owner, false)).toEqual([]);
  });
  it('recalcula y conserva origen IA aun con composición incompleta y al completar después', async () => {
    await saveFood(owner, foodInput, false);
    const input = draft();
    const initial = await saveRecipeDraft(owner, { ...input, nutrition: { origin: 'ai_estimate', source: 'propuesta_ia.v2', per_portion: { kcal: 400, protein_g: 10, carbs_g: 30, fat_g: 5 } } }, false);
    expect(initial.current.nutrition).toMatchObject({ origin: 'ai_estimate', per_portion: { kcal: 38 } });
    const partial = await saveRecipeDraft(owner, { ...input, expected_revision: initial.current.revision, items: [{ name: 'Ingrediente escrito', quantity: 1, unit: 'u' }] }, false);
    expect(partial.current.nutrition).toBeUndefined();
    expect(partial.current.catalog_recipe?.estimate_origin).toBe(true);
    expect(partial.current.card?.macros).toBeNull();
    const restored = await saveRecipeDraft(owner, { ...input, expected_revision: partial.current.revision }, false);
    expect(restored.current.nutrition?.origin).toBe('ai_estimate');
  });
});
