import { z } from 'zod';

export const exchangeVisibilityInputSchema = z.object({
  enabled: z.boolean(),
  expected_revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
}).strict();
export type ExchangeVisibilityInput = z.infer<typeof exchangeVisibilityInputSchema>;
export type ExchangeVisibility = { enabled: boolean; revision: number };
/** Proyección publicable: nunca devuelve titularidad, notas de referencia o metadatos internos. */
export type PatientExchangeGroup = {
  id: string; name: string; revision: number;
  items: Array<{ quantity: number; unit: 'g' | 'ml'; food: {
    id: string; name: string;
    nutrients: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null };
    portions: Array<{ name: string; grams: number }>;
  } }>;
};
export type PatientExchanges = { enabled: boolean; groups: PatientExchangeGroup[] };
