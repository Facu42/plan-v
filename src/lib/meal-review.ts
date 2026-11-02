/** Umbral del contrato foto → macros: por debajo no entra al indicador. */
export const GAUGE_MIN_CONFIDENCE = 0.45;

export type MealGaugeInput = {
  status: string;
  confidence: number;
};

export function mealCountsForGauge(log: MealGaugeInput): boolean {
  return (log.status === 'confirmed' || log.status === 'adjusted')
    && Number.isFinite(log.confidence)
    && log.confidence >= GAUGE_MIN_CONFIDENCE;
}

/** Texto que ve la paciente. Nunca incluye la nota interna. */
export function patientMealCopy(status: string, nutriName: string): string {
  const name = nutriName.trim() || 'tu nutricionista';
  if (status === 'pending_review') return `Estimación pendiente de ${name}`;
  return `Confirmada por ${name}`;
}

export function nutriNameOf(name: string | null | undefined): string {
  const clean = name?.replace(/[\r\n]/g, ' ').trim() ?? '';
  return clean || 'tu nutricionista';
}
