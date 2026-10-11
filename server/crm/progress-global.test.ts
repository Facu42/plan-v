import { describe, expect, it } from 'vitest';
import type { PatientProgressView, ProgressPoint } from '../../src/types/progress.js';
import { summarizePatient, totalsFor, weightSummary } from './progress-global.js';

const point = (id: string, value: number, captured_on: string): ProgressPoint => ({ id, value, source: 'patient', captured_on, created_at: `${captured_on}T12:00:00Z` });
const view = (over: Partial<PatientProgressView> = {}): PatientProgressView => ({
  patient_id: 'p1', timezone: 'America/Argentina/Buenos_Aires', period_days: 30,
  current: { start: '2026-09-11', end: '2026-10-10' }, previous: { start: '2026-08-12', end: '2026-09-10' },
  measurements_included: true, series: [], meals: { current: { logged: 0, reviewed: 0, pending: 0 }, previous: { logged: 0, reviewed: 0, pending: 0 } }, ...over,
});
const weightSeries = (current: ProgressPoint[], previous: ProgressPoint[] = [], unit = 'kg'): PatientProgressView['series'] => [{
  kind: 'weight', unit, current, previous, current_last: current[current.length - 1] ?? null, previous_last: previous[previous.length - 1] ?? null, declared_delta: null,
}];

describe('Progreso global: resumen por paciente', () => {
  it('sin permiso de mediciones no muestra peso ni cero', () => {
    expect(weightSummary(view({ measurements_included: false, series: weightSeries([point('a', 70, '2026-10-01')]) }))).toEqual({ state: 'no-consent' });
  });
  it('sin pesos en el período lo dice como «none», no como variación cero', () => {
    expect(weightSummary(view())).toEqual({ state: 'none' });
    expect(weightSummary(view({ series: weightSeries([], [point('a', 70, '2026-09-01')]) }))).toEqual({ state: 'none' });
  });
  it('compara contra el último peso del período anterior', () => {
    const result = weightSummary(view({ series: weightSeries([point('b', 68.4, '2026-10-02')], [point('a', 70, '2026-09-05')]) }));
    expect(result).toMatchObject({ state: 'ok', last: 68.4, from: 70, delta: -1.6, points: 1 });
  });
  it('con dos pesos y sin período anterior compara el primero y el último del período', () => {
    const result = weightSummary(view({ series: weightSeries([point('a', 70, '2026-09-15'), point('b', 69.5, '2026-10-05')]) }));
    expect(result).toMatchObject({ state: 'ok', from: 70, last: 69.5, delta: -0.5, points: 2 });
  });
  it('un único peso sin referencia no inventa variación', () => {
    expect(weightSummary(view({ series: weightSeries([point('a', 70, '2026-10-05')]) }))).toMatchObject({ state: 'ok', from: null, delta: null });
  });
  it('totales: una paciente sin registros no cuenta como incumplimiento y las no disponibles se suman aparte', () => {
    const withMeals = summarizePatient('p1', 'Ana', view({ meals: { current: { logged: 4, reviewed: 3, pending: 1 }, previous: { logged: 2, reviewed: 2, pending: 0 } } }));
    const quiet = summarizePatient('p2', 'Bea', view({ measurements_included: false }));
    const totals = totalsFor([withMeals, quiet], 1);
    expect(totals).toEqual({ patients: 3, with_records: 1, meals: 4, previous_meals: 2, pending_review: 1, with_weight: 0, without_measurement_permission: 1 });
  });
});
