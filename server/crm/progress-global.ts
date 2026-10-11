import type { GlobalPatientProgress, GlobalProgressTotals, GlobalWeight } from '../../src/types/progress-global.js';
import type { PatientProgressView, ProgressPoint } from '../../src/types/progress.js';

const round1 = (value: number) => Math.round(value * 10) / 10;
const byDate = (a: ProgressPoint, b: ProgressPoint) => a.captured_on.localeCompare(b.captured_on) || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);

/** Peso en kg si existe esa serie; si no, la primera serie de peso disponible. La variación se calcula siempre en una sola unidad. */
export function weightSummary(view: PatientProgressView): GlobalWeight {
  if (!view.measurements_included) return { state: 'no-consent' };
  const weights = view.series.filter((series) => series.kind === 'weight');
  const series = weights.find((entry) => entry.unit === 'kg') ?? weights[0];
  if (!series?.current.length) return { state: 'none' };
  const points = [...series.current].sort(byDate);
  const last = points[points.length - 1]!;
  const earlier = series.previous_last ?? (points.length > 1 ? points[0]! : null);
  return {
    state: 'ok', unit: series.unit, last: last.value, last_on: last.captured_on,
    from: earlier ? earlier.value : null, from_on: earlier ? earlier.captured_on : null,
    delta: earlier ? round1(last.value - earlier.value) : null, points: points.length,
  };
}

export function summarizePatient(patientId: string, patientName: string, view: PatientProgressView): GlobalPatientProgress {
  const weight = weightSummary(view);
  return {
    patient_id: patientId, patient_name: patientName, weight,
    meals: { logged: view.meals.current.logged, previous: view.meals.previous.logged, pending: view.meals.current.pending },
  };
}

export function totalsFor(rows: readonly GlobalPatientProgress[], unavailable: number): GlobalProgressTotals {
  return {
    patients: rows.length + unavailable,
    with_records: rows.filter((row) => row.meals.logged > 0 || row.weight.state === 'ok').length,
    meals: rows.reduce((sum, row) => sum + row.meals.logged, 0),
    previous_meals: rows.reduce((sum, row) => sum + row.meals.previous, 0),
    pending_review: rows.reduce((sum, row) => sum + row.meals.pending, 0),
    with_weight: rows.filter((row) => row.weight.state === 'ok').length,
    without_measurement_permission: rows.filter((row) => row.weight.state === 'no-consent').length,
  };
}
