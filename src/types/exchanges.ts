import { z } from 'zod';

/**
 * Equivalencias: listas de alimentos intercambiables y grupos de alimentos.
 * Una entrada con owner_id nulo es de «Sistema»: la ven todos los consultorios y sólo el servicio la escribe.
 */
const text = (max: number, min = 0) => z.string().trim().min(min).max(max);
const grams = z.number().finite().positive().max(100000);
const foodId = z.uuid().nullable();

export const exchangeItemSchema = z.object({
  food_id: foodId,
  name: text(160, 1),
  measure: text(80, 1),
  grams,
}).strict();
export const exchangeGroupFoodSchema = z.object({ food_id: foodId, name: text(160, 1) }).strict();
export const exchangePortionSchema = z.object({ measure: text(80, 1), grams }).strict();

const common = {
  id: z.uuid(),
  expected_revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  name: text(160, 1),
  description: text(400).default(''),
};
export const exchangeListInputSchema = z.object({
  ...common,
  kind: z.literal('list'),
  justification: text(500).default(''),
  base: exchangeItemSchema,
  items: z.array(exchangeItemSchema).min(1).max(50),
}).strict();
export const exchangeGroupInputSchema = z.object({
  ...common,
  kind: z.literal('group'),
  portion: exchangePortionSchema.nullable().default(null),
  foods: z.array(exchangeGroupFoodSchema).min(1).max(100),
}).strict();
export const exchangeInputSchema = z.discriminatedUnion('kind', [exchangeListInputSchema, exchangeGroupInputSchema]);

export type ExchangeItem = z.infer<typeof exchangeItemSchema>;
export type ExchangeGroupFood = z.infer<typeof exchangeGroupFoodSchema>;
export type ExchangeInput = z.infer<typeof exchangeInputSchema>;
export type ExchangeKind = ExchangeInput['kind'];
type Stored<T> = Omit<T, 'expected_revision'> & { revision: number; owner_id: string | null; updated_at: string };
export type ExchangeList = Stored<z.infer<typeof exchangeListInputSchema>>;
export type ExchangeGroup = Stored<z.infer<typeof exchangeGroupInputSchema>>;
export type ExchangeEntry = ExchangeList | ExchangeGroup;

/** Lo que se guarda en la columna de contenido: sin identidad, tipo ni revisión. */
export function exchangePayloadOf(input: ExchangeInput) {
  const { id: _id, kind: _kind, expected_revision: _revision, ...payload } = input;
  return payload;
}
export type ExchangePayload = ReturnType<typeof exchangePayloadOf>;

/** Reconstruye una entrada desde una fila de la base, validando el contenido otra vez. */
export function exchangeEntryFromRow(row: { id: string; kind: ExchangeKind; owner_id: string | null; revision: number; payload: unknown; updated_at: string }): ExchangeEntry {
  const { expected_revision: _revision, ...entry } = exchangeInputSchema.parse({ ...(row.payload as object), id: row.id, kind: row.kind, expected_revision: 0 });
  return { ...entry, revision: row.revision, owner_id: row.owner_id, updated_at: row.updated_at } as ExchangeEntry;
}
