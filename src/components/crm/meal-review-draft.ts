import type { FoodItem, Macros, MealLog } from '../../types';

export type MealReviewDraft = {
  foods: FoodItem[];
  macros: Macros;
};

export type AdjustedMealPatch = {
  status: 'adjusted';
  foods: FoodItem[];
  macros: Macros;
};

const EMPTY_MACROS: Macros = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

export function createMealReviewDraft(log: MealLog): MealReviewDraft {
  const foods = log.foods.map((food) => ({ ...food }));
  return {
    foods: foods.length > 0 ? foods : [{ name: '', portion_est: null, portion_unit: 'g', confidence: 0 }],
    macros: { ...(log.macros ?? EMPTY_MACROS) },
  };
}

function isWholeBetween(value: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= maximum;
}

export function buildAdjustedMealPatch(draft: MealReviewDraft): AdjustedMealPatch | null {
  if (draft.foods.length === 0 || draft.foods.length > 8) return null;

  const foods = draft.foods.map((food) => ({ ...food, name: food.name.trim() }));
  const validFoods = foods.every((food) => (
    food.name.length > 0
    && food.name.length <= 120
    && (food.portion_est === null || (Number.isFinite(food.portion_est) && food.portion_est >= 0 && food.portion_est <= 10_000))
    && food.confidence >= 0
    && food.confidence <= 1
  ));
  const validMacros = isWholeBetween(draft.macros.kcal, 10_000)
    && isWholeBetween(draft.macros.protein_g, 1_000)
    && isWholeBetween(draft.macros.carbs_g, 1_000)
    && isWholeBetween(draft.macros.fat_g, 1_000);

  if (!validFoods || !validMacros) return null;

  return {
    status: 'adjusted',
    foods,
    macros: { ...draft.macros },
  };
}
