import { z } from 'zod';
import { RECIPE_UNITS, normalizeIngredientName, recipeUnitSchema } from './recipes';

export const shoppingManualSchema = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.number().positive().max(100000),
  unit: recipeUnitSchema,
  client_id: z.uuid(),
}).strict();

export const shoppingCheckSchema = z.object({
  source_key: z.string().trim().min(1).max(180),
  checked: z.boolean(),
}).strict();

export type ShoppingKind = 'derived' | 'text' | 'manual';
export type ShoppingLine = {
  id: string;
  kind: ShoppingKind;
  source_key: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  occurrences: number;
  checked: boolean;
};
export type ShoppingListView = {
  plan_version: number | null;
  period_start: string | null;
  period_end: string | null;
  items: ShoppingLine[];
};

export function shoppingSourceKey(kind: ShoppingKind, name: string, unit: string | null, id?: string) {
  if (kind === 'manual' && id) return `manual:${id}`;
  const normalized = normalizeIngredientName(name);
  if (kind === 'text') return `text:${normalized}`;
  return `derived:${normalized}|${unit ?? ''}`;
}

export function roundShoppingQty(value: number) {
  return Math.round(value * 100) / 100;
}

export { RECIPE_UNITS, normalizeIngredientName };
