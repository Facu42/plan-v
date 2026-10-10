import type { MetricSummary } from '../../lib/body-metrics';

export function formatNumber(value: number): string {
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}
export function formatMetricValue(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}
/** `2026-10-01` → `1 oct 2026`; no depende de la zona horaria ni del idioma del navegador. */
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function formatMetricDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? match[2]} ${match[1]}`;
}
export function formatChange(change: number | null, unit: string): string {
  if (change === null) return 'Primer registro';
  if (change === 0) return 'Sin cambios';
  return `${change > 0 ? '+' : '−'}${formatNumber(Math.abs(change))} ${unit}`;
}
/** Texto de la tendencia para lectores de pantalla y para quien no distingue la flecha. */
export function trendText(trend: MetricSummary['trend'], change: number | null, unit: string): string {
  if (trend === 'none' || change === null) return 'Un solo registro';
  if (trend === 'flat') return 'Igual que el registro anterior';
  return `${trend === 'up' ? 'Subió' : 'Bajó'} ${formatNumber(Math.abs(change))} ${unit} desde el registro anterior`;
}
export const TREND_ARROW: Record<MetricSummary['trend'], string> = { up: '↑', down: '↓', flat: '→', none: '' };
/** Nota de la tarjeta: fecha del último registro y su variación, en el espacio que deja la tarjeta del archivo. */
export function cardNote(summary: MetricSummary): string {
  const date = formatMetricDate(summary.last.date);
  if (summary.trend === 'none' || summary.changeFromPrevious === null) return `${date} · 1 registro`;
  if (summary.trend === 'flat') return `${date} · → sin cambios`;
  return `${date} · ${TREND_ARROW[summary.trend]} ${formatNumber(Math.abs(summary.changeFromPrevious))} ${summary.unit}`;
}
