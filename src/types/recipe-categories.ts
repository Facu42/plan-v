import { z } from 'zod';
import { normalizeFoodSearch } from './foods';

// Examples visible in Nutriboost's catalogue, not an exhaustive taxonomy.
export const RECIPE_CATEGORY_SUGGESTIONS = ['Sándwiches y snacks', 'Pollo', 'Guisos', 'Platos de pescado', 'Platos principales'] as const;
export const culinaryCategoriesSchema = z.array(z.string().trim().min(1).max(50)).max(6)
  .refine(values => new Set(values.map(normalizeFoodSearch)).size === values.length, 'No repitas categorías.');

export function recipeCulinaryCategories(card?: { culinary_categories?: string[] }) {
  return card?.culinary_categories ?? [];
}
