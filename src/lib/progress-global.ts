import type { GlobalPatientProgress, GlobalWeight } from '../types/progress-global';

export type GlobalFilter = 'all' | 'with-records' | 'without-records';
export type GlobalSort = 'name' | 'meals' | 'weight-change';

export const hasRecords = (row: GlobalPatientProgress) => row.meals.logged > 0 || row.weight.state === 'ok';

export function filterRows(rows: readonly GlobalPatientProgress[], filter: GlobalFilter): GlobalPatientProgress[] {
  if (filter === 'with-records') return rows.filter(hasRecords);
  if (filter === 'without-records') return rows.filter((row) => !hasRecords(row));
  return [...rows];
}

const weightDelta = (weight: GlobalWeight) => (weight.state === 'ok' && weight.delta !== null ? Math.abs(weight.delta) : -1);

/** Ordena sin esconder a nadie: las pacientes sin dato quedan al final del criterio elegido, no fuera de la lista. */
export function sortRows(rows: readonly GlobalPatientProgress[], sort: GlobalSort): GlobalPatientProgress[] {
  const byName = (a: GlobalPatientProgress, b: GlobalPatientProgress) => a.patient_name.localeCompare(b.patient_name, 'es-AR');
  const copy = [...rows];
  if (sort === 'meals') return copy.sort((a, b) => b.meals.logged - a.meals.logged || byName(a, b));
  if (sort === 'weight-change') return copy.sort((a, b) => weightDelta(b.weight) - weightDelta(a.weight) || byName(a, b));
  return copy.sort(byName);
}

const number = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 1 });
export const shortDate = (dateId: string) => dateId.split('-').reverse().slice(0, 2).join('/');

export function weightLines(weight: GlobalWeight): { main: string; note: string } {
  if (weight.state === 'no-consent') return { main: 'Sin permiso', note: 'La paciente no autorizó compartir mediciones.' };
  if (weight.state === 'none') return { main: 'Sin peso en el período', note: 'No cargó ni se le cargó un peso en estas fechas.' };
  const main = `${number(weight.last)} ${weight.unit}`;
  if (weight.delta === null || weight.from === null || weight.from_on === null) return { main, note: `Único registro del período (${shortDate(weight.last_on)}).` };
  const sign = weight.delta > 0 ? '+' : weight.delta < 0 ? '−' : '';
  return { main, note: `${sign}${number(Math.abs(weight.delta))} ${weight.unit} desde ${number(weight.from)} (${shortDate(weight.from_on)})` };
}

export function mealsNote(meals: GlobalPatientProgress['meals']): string {
  if (meals.logged === 0 && meals.previous === 0) return 'Sin comidas en los dos períodos';
  return `${meals.previous} en el período anterior`;
}
