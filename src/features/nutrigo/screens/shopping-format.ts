import { argentinaMonth } from './ar-time';

const compact = (value: number) => new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(value).replace(/ /g, ' ');

/** Cantidad de un producto: hasta dos decimales (0,25 no se redondea a 0,3); sin dato o inválida, un guion. */
export function quantityLabel(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '-';
  if (value < 0.01) return '<0,01';
  if (value >= 10_000_000) return compact(value);
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}
export const productCount = (count: number) => `${count} ${count === 1 ? 'producto' : 'productos'}`;
export const boughtLabel = (count: number) => `${count} ${count === 1 ? 'comprado' : 'comprados'}`;

/** Los últimos `count` meses, el más viejo primero, terminando en el mes de Argentina de `now`. */
export function recentMonths(now: Date, count: number): { year: number; month: number }[] {
  const { year, month } = argentinaMonth(now);
  return Array.from({ length: count }, (_, position) => { const index = year * 12 + month - (count - 1) + position; return { year: Math.floor(index / 12), month: index % 12 }; });
}
/** Nombre corto del mes («Oct»). */
export const monthName = (month: number) => new Date(Date.UTC(2026, month, 15)).toLocaleDateString('es-AR', { timeZone: 'UTC', month: 'short' }).replace('.', '').replace(/^./, letter => letter.toUpperCase());
