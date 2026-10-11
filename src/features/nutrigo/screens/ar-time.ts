import { dateLabel } from './date-label';

/** El producto es de Argentina: las horas y los días se cuentan ahí, sin importar la zona del navegador. */
export const ARGENTINA_ZONE = 'America/Argentina/Buenos_Aires';
const DAY = 86400000;
// Los formateadores de Intl son caros de crear: uno por módulo, no uno por llamada (se usan dentro de bucles).
const TIME_FORMAT = new Intl.DateTimeFormat('es-AR', { timeZone: ARGENTINA_ZONE, hour: '2-digit', minute: '2-digit' });
const DATE_FORMAT = new Intl.DateTimeFormat('es-AR', { timeZone: ARGENTINA_ZONE });
const DAY_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: ARGENTINA_ZONE });

const parse = (value: unknown) => { const date = new Date(typeof value === 'string' ? value : Number.NaN); return Number.isNaN(date.getTime()) ? null : date; };

/** Hora de una marca de tiempo («10:30 p. m.»); vacío si la fecha no es válida. */
export function argentinaTime(value: string): string {
  const date = parse(value);
  return date ? TIME_FORMAT.format(date).replace(/[\u00a0\u202f]/g, ' ') : '';
}

/** Fecha corta («3/10/2026»); una fecha sin hora no se corre de día. Vacío si no es válida. */
export function argentinaDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { const label = dateLabel(value); return label === value ? '' : label; }
  const date = parse(value);
  return date ? DATE_FORMAT.format(date) : '';
}

/** Día «AAAA-MM-DD» en Argentina; vacío si la fecha no es válida. */
export const argentinaDay = (date: Date) => Number.isNaN(date.getTime()) ? '' : DAY_FORMAT.format(date);

/** Día anterior de un «AAAA-MM-DD». */
export const previousDay = (day: string) => new Date(Date.parse(`${day}T12:00:00Z`) - DAY).toISOString().slice(0, 10);

/** Año y mes (0 a 11) de una fecha, contados en Argentina: el 31 de octubre a las 22:30 sigue siendo octubre. */
export function argentinaMonth(date: Date): { year: number; month: number } {
  const [year, month] = argentinaDay(date).split('-').map(Number);
  return { year, month: month - 1 };
}
