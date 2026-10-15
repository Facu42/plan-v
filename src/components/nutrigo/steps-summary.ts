import type { JourneyDay } from '../patient/journey-summary';

const number = (value: number) => Math.round(value).toLocaleString('es-AR');

/** Pasos de la semana en una línea para la nutricionista: hoy y el promedio de los días que la paciente cargó. */
export function stepsSummaryText(days: readonly JourneyDay[]): string {
  const recorded = days.filter((day) => day.steps != null && Number.isFinite(day.steps) && day.steps >= 0);
  if (!recorded.length) return 'Sin pasos registrados';
  const average = recorded.reduce((sum, day) => sum + (day.steps ?? 0), 0) / recorded.length;
  const today = days.find((day) => day.isToday);
  const todayText = today?.steps != null ? `hoy ${number(today.steps)}` : 'hoy sin registro';
  return `Pasos: ${todayText} · promedio ${number(average)} por día (${recorded.length} ${recorded.length === 1 ? 'día' : 'días'} con registro)`;
}
