import { normalizeIngredientName, roundShoppingQty, shoppingSourceKey, type ShoppingLine, type ShoppingListView } from '../../src/types/shopping.js';
import type { PatientMealPlan, PlanItemView } from '../../src/types/plans.js';

type Acc = ShoppingLine & { quantity: number | null };

export function deriveShoppingFromPlan(plan: PatientMealPlan | null, checks: ReadonlyMap<string, boolean> = new Map()): ShoppingListView {
  if (!plan) {
    return { plan_version: null, period_start: null, period_end: null, items: [] };
  }
  const lines = new Map<string, Acc>();

  const add = (partial: Omit<Acc, 'checked' | 'id'>) => {
    const id = partial.source_key;
    const current = lines.get(id);
    if (!current) {
      lines.set(id, { ...partial, id, checked: checks.get(id) === true });
      return;
    }
    if (partial.kind === 'derived' && current.kind === 'derived' && partial.unit && current.unit === partial.unit) {
      current.quantity = roundShoppingQty((current.quantity ?? 0) + (partial.quantity ?? 0));
      current.occurrences += partial.occurrences;
      return;
    }
    if (partial.kind === 'text' && current.kind === 'text') {
      current.occurrences += partial.occurrences;
    }
  };

  for (const item of plan.items) {
    addPlanItem(item, add);
  }

  return {
    plan_version: plan.version,
    period_start: plan.period_start,
    period_end: plan.period_end,
    items: [...lines.values()].sort((a, b) => a.name.localeCompare(b.name, 'es-AR') || (a.unit ?? '').localeCompare(b.unit ?? '', 'es-AR')),
  };
}

function addPlanItem(item: PlanItemView, add: (partial: Omit<Acc, 'checked' | 'id'>) => void) {
  const recipe = item.recipe;
  if (recipe?.ingredients.length) {
    const yieldPortions = recipe.yield_portions > 0 ? recipe.yield_portions : 1;
    const scale = (item.portions && item.portions > 0 ? item.portions : 1) / yieldPortions;
    for (const ingredient of recipe.ingredients) {
      const name = ingredient.name.trim();
      if (!name) continue;
      add({
        kind: 'derived',
        source_key: shoppingSourceKey('derived', name, ingredient.unit),
        name,
        quantity: roundShoppingQty(ingredient.quantity * scale),
        unit: ingredient.unit,
        occurrences: 1,
      });
    }
    return;
  }
  const text = (item.free_text ?? item.recipe_title ?? '').trim();
  if (!text) return;
  add({
    kind: 'text',
    source_key: shoppingSourceKey('text', text, null),
    name: text,
    quantity: null,
    unit: null,
    occurrences: 1,
  });
}

export { normalizeIngredientName };
