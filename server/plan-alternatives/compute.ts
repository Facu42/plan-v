import { foodQuantityUnit, scaleFoodNutrients } from '../../src/types/foods.js';
import { exchangeAmount, type ExchangeGroup } from '../../src/types/nutrition-capabilities.js';
import { componentNativeQuantity } from '../../src/types/plan-components.js';
import type { PlanChoice, PlanAlternativeOption, PlanAlternativeSlot, PlanAlternativesView } from '../../src/types/plan-alternatives.js';
import type { PatientMealPlan } from '../../src/types/plans.js';
import { blockedTermsIn } from '../ai/plan-assistant.js';

export type AlternativesHealth = {
  allergies: { state: 'unknown' | 'none' | 'reported'; items: string[] };
  restrictions: { state: 'unknown' | 'none' | 'reported'; items: string[] };
};
export type StoredChoice = PlanChoice & { group_revision: number; food_revision: number };

const round = (value: number) => Math.round(value * 10) / 10;

/** Alternativas por alimento del plan: solo grupos revisados por la nutri, nunca un alimento declarado como alergia o restricción. */
export function planAlternativeSlots(plan: Pick<PatientMealPlan, 'items'> | null, groups: ExchangeGroup[], health: AlternativesHealth): { status: 'ok' | 'health_unknown'; slots: PlanAlternativeSlot[] } {
  if (health.allergies.state === 'unknown' || health.restrictions.state === 'unknown') return { status: 'health_unknown', slots: [] };
  const blocked = [...health.allergies.items, ...health.restrictions.items];
  const slots: PlanAlternativeSlot[] = [];
  for (const item of plan?.items ?? []) {
    for (const component of item.components ?? []) {
      if (component.kind !== 'food') continue;
      const quantity = componentNativeQuantity(component);
      if (quantity === null) continue;
      const options = new Map<string, PlanAlternativeOption>();
      for (const group of groups) {
        const base = group.items.find(row => row.food.id === component.food_id);
        const baseAmount = base ? exchangeAmount(base) : NaN;
        if (!base || !Number.isFinite(baseAmount) || baseAmount <= 0 || foodQuantityUnit(base.food) !== foodQuantityUnit(component.food_snapshot ?? base.food)) continue;
        const units = quantity / baseAmount;
        for (const row of group.items) {
          const amount = exchangeAmount(row) * units;
          if (row.food.id === component.food_id || options.has(row.food.id) || !Number.isFinite(amount) || amount <= 0 || amount > 100000) continue;
          if (blockedTermsIn(row.food.name, blocked).length) continue;
          options.set(row.food.id, {
            group_id: group.id, group_name: group.name, group_revision: group.revision, food_id: row.food.id, food_revision: row.food.revision,
            name: row.food.name, quantity: round(amount), unit: foodQuantityUnit(row.food), kcal: scaleFoodNutrients(row.food.nutrients, amount).kcal ?? null,
          });
        }
      }
      if (options.size) slots.push({ item_id: item.id, component_id: component.id, base_food_id: component.food_id, options: [...options.values()] });
    }
  }
  return { status: 'ok', slots };
}

/** Las elecciones se vuelven a validar contra lo vigente: si el plan, el grupo o las alergias cambiaron, la elección deja de valer. */
export function planAlternativesView(plan: Pick<PatientMealPlan, 'items'> | null, groups: ExchangeGroup[], health: AlternativesHealth, stored: StoredChoice[]): PlanAlternativesView {
  const { status, slots } = planAlternativeSlots(plan, groups, health);
  const choices = stored.flatMap(choice => {
    const option = slots.find(slot => slot.item_id === choice.item_id && slot.component_id === choice.component_id)?.options.find(row => row.food_id === choice.food_id && row.group_id === choice.group_id);
    if (!option) return [];
    return [{ item_id: choice.item_id, component_id: choice.component_id, group_id: choice.group_id, base_food_id: choice.base_food_id, food_id: choice.food_id, name: option.name, quantity: option.quantity, unit: option.unit, chosen_at: choice.chosen_at }];
  });
  return { status, slots, choices };
}
