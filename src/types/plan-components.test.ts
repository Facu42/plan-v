import { expect, it } from 'vitest';
import { foodInputSchema, type Food } from './foods';
import { componentGrams, componentNutrients, planComponentsSchema, type PlanComponentView } from './plan-components';
import { analyzePlanDay, copyPlanDay } from './plan-day-analysis';
import { summarizeMenuNutrition } from '../../server/ai/menu-nutrition';

const id = '11111111-1111-4111-8111-111111111111';
const parsed = foodInputSchema.parse({ id, expected_revision: 0, name: 'Avena', kind: 'food', source: 'Etiqueta', nutrients: { kcal: 400, protein: 10, carbs: 60, fat: 0 }, portions: [{ name: 'Cucharada', grams: 10 }] });
const food: Food = { ...parsed, revision: 1, owner_id: null, updated_at: '' };
const component: PlanComponentView = { id, kind: 'food', food_id: id, food_revision: 1, quantity: 2, measure: 'Cucharada', public_note: '', food_snapshot: food };
it('usa sólo medidas declaradas, distingue desconocido de cero y copia sin referencias compartidas', () => {
  expect(componentGrams(component)).toBe(20);
  expect(componentNutrients(component)).toMatchObject({ kcal: 80, fat: 0, fiber: null });
  expect(componentGrams({ ...component, measure: 'Taza' })).toBeNull();
  expect(componentGrams({ ...component, quantity: NaN })).toBeNull();
  const copied = copyPlanDay([{ for_date: '2026-10-07', slot: 'Almuerzo', components: [component] }], '2026-10-07', ['2026-10-08'], ['2026-10-07','2026-10-08']);
  copied[1].components[0].quantity = 3;
  expect(copied[0].components[0].quantity).toBe(2);
  const day = analyzePlanDay([{ portions: '', component }, { portions: '', component: { id: '22222222-2222-4222-8222-222222222222', kind: 'text', free_text: 'Agua', public_note: '' } }]);
  expect(day.nutrients[0]).toMatchObject({ total: null, subtotal: 80, missing: 1 });
  expect(planComponentsSchema.safeParse([{ ...component, food_snapshot: undefined }]).success).toBe(false);
});
it('suma alimentos con una receta anterior en el mismo día', () => {
  const summary = summarizeMenuNutrition([
    { for_date: '2026-10-07', components: [component] },
    { for_date: '2026-10-07', recipe_id: 'r1', recipe_version: 1, portions: 2 },
  ], null, [{ id: 'r1', version: 1, nutrition: { origin: 'declared', source: 'Etiqueta', per_portion: { kcal: 100, protein_g: 2, carbs_g: 3, fat_g: 0 } } }]);
  expect(summary.days[0].totals).toMatchObject({ kcal: 280, fat_g: 0 });
});
