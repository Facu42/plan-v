export type Nutrient = 'kcal' | 'carbs_g' | 'protein_g' | 'fat_g';
type LogLike = { status: string; macros: Partial<Record<Nutrient, number>> | null };

const instant = (value: string) => { const time = Date.parse(value); return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY; };

/** Del más nuevo al más viejo según el instante real; los registros sin fecha válida quedan al final. */
export function newestFirst<T extends { logged_at: string }>(logs: readonly T[]): T[] {
  return logs.map((log, index) => ({ log, index, time: instant(log.logged_at) })).sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time)).map(entry => entry.log);
}

/** Suma un nutriente de las comidas revisadas; ignora lo que no sea un número positivo. */
export function nutrientTotal(logs: readonly LogLike[], key: Nutrient): number {
  return logs.reduce((total, log) => {
    if (log.status === 'pending_review' || !log.macros) return total;
    const value = log.macros[key];
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? total + value : total;
  }, 0);
}

/** Cifra de las tarjetas de estadística; con valores absurdos se abrevia para que entre en la tarjeta. */
export function statNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  const rounded = Math.round(value);
  if (rounded >= 10_000_000) return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(rounded).replace(/ /g, ' ');
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(rounded);
}

/** Nombre de la comida en la tabla: su descripción, si no sus alimentos, si no un texto corto. */
export function mealTitle(log: { description?: string | null; foods?: readonly { name: string }[] | null }): string {
  return log.description?.trim() || (log.foods ?? []).map(food => food.name).filter(Boolean).join(', ') || 'Comida registrada';
}

/** Valor de una celda de nutrientes: con coma decimal; sin dato o inválido, un guion (no un cero que parezca medido). Con valores absurdos se abrevia para entrar en la columna. */
export function macroCell(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '—';
  if (value >= 100_000) return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(value).replace(/\u00a0/g, ' ');
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value);
}
