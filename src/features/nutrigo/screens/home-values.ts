/**
 * Valores de Inicio y Progreso listos para mostrar: nunca devuelven NaN, Infinity ni fechas corridas.
 * Funciones puras, sin React, para que la variabilidad de los datos se pruebe sola.
 */
import { argentinaDay } from './ar-time';

const GLASS_LITRES = 0.25;
const MAX_PERCENT_LABEL = 999;
const DAY_MS = 86_400_000;
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] as const;
const number = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const oneDecimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const portions4 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 });

const isNumber = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);

/** Porcentaje acotado a 0–100, o null si falta un dato, no es un número o la referencia no es positiva. */
export function safePercent(value: number | null | undefined, total: number | null | undefined): number | null {
  if (!isNumber(value) || !isNumber(total) || total <= 0) return null;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

/** Texto del porcentaje real (puede pasar de 100 %, con tope), o una raya sin dato. */
export function percentLabel(value: number | null | undefined, total: number | null | undefined): string {
  if (!isNumber(value) || !isNumber(total) || total <= 0) return '—';
  const real = Math.round(Math.max(0, (value / total) * 100));
  return real > MAX_PERCENT_LABEL ? `+${MAX_PERCENT_LABEL}%` : `${real}%`;
}

/** Litros de agua para una cantidad de vasos de 250 ml, con hasta dos decimales. */
export function litresLabel(glasses: number | null | undefined): string {
  return number.format(isNumber(glasses) && glasses > 0 ? glasses * GLASS_LITRES : 0);
}

/** «1 porción», «0,5 porciones»: concuerda el singular. */
export function portionsLabel(portions: number): string {
  return `${portions4.format(portions)} ${portions === 1 ? 'porción' : 'porciones'}`;
}

const parseDay = (id: string) => { const time = Date.parse(`${id}T12:00:00Z`); return Number.isNaN(time) ? null : time; };
const toId = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Fecha (AAAA-MM-DD) de `days` días antes, sobre el calendario y sin depender de la zona del navegador. */
export function daysBefore(id: string, days: number): string {
  const time = parseDay(id);
  return time == null ? id : toId(time - days * DAY_MS);
}

export type WeekDay = { id: string; day: number; label: string };
/**
 * Semana del calendario de Inicio. Con 7 columnas va de domingo a sábado; con 6 (escritorio) de lunes a sábado,
 * salvo en domingo, que se corre un día para que hoy siempre se vea.
 */
export function weekDays(today: string, columns: number): WeekDay[] {
  const time = parseDay(today);
  if (time == null) return [];
  const weekday = new Date(time).getUTCDay();
  const back = columns >= 7 ? weekday : weekday === 0 ? columns - 1 : weekday - 1;
  return Array.from({ length: columns }, (_, index) => {
    const day = new Date(time + (index - back) * DAY_MS);
    return { id: toId(day.getTime()), day: day.getUTCDate(), label: WEEKDAYS[day.getUTCDay()] };
  });
}

/** Mes y año del encabezado del calendario, salidos de la fecha de Buenos Aires. */
export function monthYearLabel(today: string): { month: string; year: string } {
  const time = parseDay(today);
  const date = new Date(time ?? 0);
  return time == null ? { month: '', year: '' } : { month: MONTHS[date.getUTCMonth()], year: String(date.getUTCFullYear()) };
}

/** «−2 kg desde el inicio», «Sin cambios desde el inicio» o «Primer registro» si no hay con qué comparar. */
export function weightChangeLabel(current: number, start: number, unit: string): string {
  if (!isNumber(current) || !isNumber(start)) return 'Primer registro';
  const rounded = Math.round(Math.abs(current - start) * 10) / 10;
  if (rounded === 0) return 'Sin cambios desde el inicio';
  return `${current < start ? '−' : '+'}${oneDecimal.format(rounded)} ${unit} desde el inicio`;
}

/** Cantidad registrada utilizable (número finito, no negativo), o null. */
export function cleanAmount(value: number | null | undefined): number | null {
  return isNumber(value) && value >= 0 ? value : null;
}

/** Día argentino (AAAA-MM-DD) de un instante ISO, o null si no es una fecha válida. Usa la misma función de día argentino que todo el producto. */
export function dayOfIso(value: string | null | undefined): string | null {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return argentinaDay(new Date(value));
}
