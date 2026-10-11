/** Formato de cantidades de receta: nunca muestra NaN, infinito ni negativos. */
export const NO_VALUE = '—';
const amountFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
export const isAmount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
/** Hasta dos decimales (porciones 1,25). Sin dato válido, «—». */
export const formatAmount = (value: unknown): string => (isAmount(value) ? amountFormat.format(value) : NO_VALUE);
/** Rinde con el que se muestra una receta: si el declarado no es válido (0, NaN, negativo) se toma una porción base. */
export const effectiveYield = (yieldPortions: number): number => (Number.isFinite(yieldPortions) && yieldPortions > 0 ? yieldPortions : 1);
/** Escala la cantidad de la receta a las porciones pedidas; si la receta no declara un rendimiento válido, queda igual. */
export const scaleQuantity = (quantity: number, portions: number, yieldPortions: number): number =>
  Number.isFinite(yieldPortions) && yieldPortions > 0 ? (quantity * portions) / yieldPortions : quantity;
