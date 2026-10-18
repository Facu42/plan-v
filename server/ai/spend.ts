import { CareError } from '../care/errors.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { AI_JOB_MAX_TOKENS } from '../../src/types/ai-jobs.js';
import { argentinaBudgetMonth, clinicalMemoryBudget, SupabaseClinicalBudget, type ClinicalBudget } from '../clinical-processing/budget.js';

export type ModelPrice = { inputUsdPerMTok: number; outputUsdPerMTok: number };
export type TokenUsage = { inputTokens: number; outputTokens: number };

function nonNegative(value: string | undefined) {
  const parsed = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Sin precios configurados el modelo es gratis (costo cero). */
export function modelPrice(env: Record<string, string | undefined> = process.env): ModelPrice {
  return {
    inputUsdPerMTok: nonNegative(env.AI_PRICE_INPUT_USD_PER_MTOK) ?? 0,
    outputUsdPerMTok: nonNegative(env.AI_PRICE_OUTPUT_USD_PER_MTOK) ?? 0,
  };
}

/** USD por millón de tokens equivale a millonésimas de dólar por token. */
export function costMicroUsd(usage: TokenUsage, price: ModelPrice): number {
  return Math.ceil(usage.inputTokens * price.inputUsdPerMTok + usage.outputTokens * price.outputUsdPerMTok);
}

/** Peor caso de una llamada: todo el contexto de entrada y el máximo de salida. */
export function worstCaseMicroUsd(inputTokens: number, price: ModelPrice): number {
  return costMicroUsd({ inputTokens, outputTokens: AI_JOB_MAX_TOKENS }, price);
}

const capMessage = 'Se alcanzó el tope de gasto de IA de este mes. Volvé a intentar el mes que viene o armá el plan a mano.';
const unavailableMessage = 'No pudimos confirmar el gasto de IA. Reintentá en unos minutos.';

export type SpendReservation = {
  /** La llamada terminó: se cobra lo realmente gastado y se libera el resto. */
  charge(actualMicroUsd: number): Promise<void>;
  /** La llamada falló sin respuesta confiable: la reserva queda contada (no se sabe si el proveedor cobró). */
  keepReserved(): Promise<void>;
};

const free: SpendReservation = { charge: async () => undefined, keepReserved: async () => undefined };

/**
 * Usa la misma bolsa global de US$5 por mes que el resto de la IA nueva. Reserva el peor caso
 * ANTES de llamar al proveedor y corta si pasaría el tope. Costo cero (modelos gratis) no la toca.
 */
export async function reserveSpend(
  operationKey: string,
  worstCaseMicro: number,
  budget: ClinicalBudget = isSupabaseEnabled() ? new SupabaseClinicalBudget() : clinicalMemoryBudget,
): Promise<SpendReservation> {
  if (worstCaseMicro <= 0) return free;
  const key = `plan-assistant:${operationKey}`;
  try {
    await budget.reserve({ key, month: argentinaBudgetMonth(), micros: worstCaseMicro });
  } catch (error) {
    const reachedCap = error instanceof Error && /bolsa mensual|límite/.test(error.message);
    throw new CareError(reachedCap ? 429 : 503, reachedCap ? capMessage : unavailableMessage);
  }
  const settle = async (status: 'charged' | 'uncertain', micros: number) => {
    try { await budget.settle(key, status, micros); } catch { throw new CareError(503, unavailableMessage); }
  };
  return {
    charge: (actual) => settle('charged', Math.min(Math.max(0, Math.ceil(actual)), worstCaseMicro)),
    keepReserved: () => settle('uncertain', worstCaseMicro),
  };
}
