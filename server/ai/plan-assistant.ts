import { foodQuantityUnit, normalizeFoodSearch, type Food } from '../../src/types/foods.js';
import type { ExchangeGroup } from '../../src/types/nutrition-capabilities.js';
import type { ProfessionalModel } from '../../src/types/models.js';

/** Apagado por defecto: sin esta variable el borrador con IA se comporta como siempre. */
export function planAssistantEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.AI_PLAN_ASSISTANT === 'on';
}

export const ASSISTANT_REFERENCE_VERSION = 'plan_assistant.v1';
const MAX_REFERENCE_CHARS = 12_000;
const FOODS_PER_CATEGORY = 8;
const MAX_EXCHANGE_GROUPS = 12;
const MAX_MODELS = 6;
const MAX_MODEL_LINES = 12;
const STAPLE_CATEGORIES = [
  'Verduras', 'Frutas', 'Legumbres, cereales, papa, choclo, batata, pan y pastas', 'Leche y postres de leche',
  'Yogures', 'Quesos', 'Carnes', 'Huevos', 'Pescados y mariscos', 'Aceites', 'Frutas secas y semillas',
] as const;

export type AssistantFood = { name: string; unit: 'g' | 'ml'; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export type AssistantExchange = { name: string; options: Array<{ food: string; quantity: number; unit: 'g' | 'ml' }> };
export type AssistantModel = { kind: 'plan' | 'recommendations' | 'avoid'; title: string; lines: string[] };
export type AssistantReference = {
  schema: typeof ASSISTANT_REFERENCE_VERSION;
  /** Valores por 100 g o 100 ml, del catálogo SARA 2. Sólo alimentos que no chocan con alergias ni restricciones. */
  foods: AssistantFood[];
  exchanges: AssistantExchange[];
  models: AssistantModel[];
};

function blockedBy(text: string, terms: string[]) {
  const haystack = normalizeFoodSearch(text);
  return terms.some((term) => {
    const needle = normalizeFoodSearch(term);
    return needle.length >= 3 && haystack.includes(needle);
  });
}

/** Devuelve los términos de alergias o restricciones que aparecen en el texto. */
export function blockedTermsIn(text: string, terms: string[]): string[] {
  const haystack = normalizeFoodSearch(text);
  return terms.filter((term) => {
    const needle = normalizeFoodSearch(term);
    return needle.length >= 3 && haystack.includes(needle);
  });
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function foodShortlist(foods: Food[], blocked: string[]): AssistantFood[] {
  const picked: AssistantFood[] = [];
  for (const category of STAPLE_CATEGORIES) {
    foods
      .filter((food) => food.kind === 'food' && food.category === category && food.nutrients.kcal != null
        && food.nutrients.protein != null && food.nutrients.carbs != null && food.nutrients.fat != null
        && !blockedBy(food.name, blocked))
      .sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name, 'es'))
      .slice(0, FOODS_PER_CATEGORY)
      .forEach((food) => picked.push({
        name: food.name,
        unit: foodQuantityUnit(food),
        kcal: round(food.nutrients.kcal!),
        protein_g: round(food.nutrients.protein!),
        carbs_g: round(food.nutrients.carbs!),
        fat_g: round(food.nutrients.fat!),
      }));
  }
  return picked;
}

function exchangeList(groups: ExchangeGroup[], blocked: string[]): AssistantExchange[] {
  return [...groups]
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .slice(0, MAX_EXCHANGE_GROUPS)
    .map((group) => ({
      name: group.name,
      options: group.items
        .filter((item) => !blockedBy(item.food.name, blocked))
        .map((item) => ({ food: item.food.name, quantity: item.quantity ?? item.grams ?? 0, unit: item.unit ?? 'g' as const }))
        .filter((option) => option.quantity > 0),
    }))
    .filter((group) => group.options.length >= 2);
}

function modelList(models: ProfessionalModel[], blocked: string[]): AssistantModel[] {
  return models
    .filter((model) => model.published && !model.archived_at)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, MAX_MODELS)
    .map((model) => {
      const copy = model.published!;
      const planLines = model.kind === 'plan'
        ? (copy.plan?.items ?? []).slice(0, MAX_MODEL_LINES).map((item) => `Día ${item.day} · ${item.slot}: ${item.free_text ?? item.recipe_proposal?.title ?? ''}`.trim())
        : [];
      const lines = [...copy.lines, ...planLines].filter((line) => line.length > 0 && !blockedBy(line, blocked)).slice(0, MAX_MODEL_LINES);
      return { kind: model.kind, title: copy.title, lines };
    })
    .filter((model) => model.lines.length > 0);
}

export function buildAssistantReference(input: {
  foods: Food[];
  exchanges: ExchangeGroup[];
  models: ProfessionalModel[];
  allergies: string[];
  restrictions: string[];
}): AssistantReference {
  const blocked = [...input.allergies, ...input.restrictions];
  const reference: AssistantReference = {
    schema: ASSISTANT_REFERENCE_VERSION,
    foods: foodShortlist(input.foods, blocked),
    exchanges: exchangeList(input.exchanges, blocked),
    models: modelList(input.models, blocked),
  };
  // Tope duro de tamaño: primero se recortan los modelos, luego las equivalencias, luego los alimentos.
  const size = () => JSON.stringify(reference).length;
  while (size() > MAX_REFERENCE_CHARS && reference.models.length) reference.models.pop();
  while (size() > MAX_REFERENCE_CHARS && reference.exchanges.length) reference.exchanges.pop();
  while (size() > MAX_REFERENCE_CHARS && reference.foods.length) reference.foods.pop();
  return reference;
}

/** Cuántos ingredientes propuestos coinciden exactamente (nombre y unidad) con un alimento de SARA 2. */
export function countSaraMatches(
  ingredients: Array<{ name: string; unit: string }>,
  foods: Food[],
): { matched: number; total: number } {
  const byName = new Map<string, Food[]>();
  for (const food of foods) {
    const key = normalizeFoodSearch(food.name);
    byName.set(key, [...(byName.get(key) ?? []), food]);
  }
  const matched = ingredients.filter((ingredient) => {
    const candidates = byName.get(normalizeFoodSearch(ingredient.name));
    return candidates?.length === 1 && foodQuantityUnit(candidates[0]) === ingredient.unit;
  }).length;
  return { matched, total: ingredients.length };
}
