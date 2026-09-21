import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { currentCareConsents } from '../care/consents.js';
import { listMeasurements } from '../care/repository.js';
import { getPatient } from '../store.js';
import { derivePatientProgress, finalizeSeries, isProgressPeriodDays } from './derive.js';
import {
  PROGRESS_TIMEZONE,
  type PatientProgressView,
  type ProgressMealCounts,
  type ProgressPeriodDays,
  type ProgressPoint,
  type ProgressSeries,
} from '../../src/types/progress.js';
import { isMeasurementKind } from '../../src/types/care.js';

export { CareError } from '../care/errors.js';
export { isProgressPeriodDays };

export function progressDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'El progreso por períodos requiere instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Elegí un período de 7, 30 o 90 días.');
  throw new CareError(503, 'No se pudo leer el progreso. Reintentá en un momento.');
}

function asMeals(value: unknown): ProgressMealCounts {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    logged: Number(row.logged ?? 0),
    reviewed: Number(row.reviewed ?? 0),
    pending: Number(row.pending ?? 0),
  };
}

function asPoint(value: unknown): ProgressPoint | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (row.source !== 'patient' && row.source !== 'professional') return null;
  return {
    id: String(row.id),
    value: Number(row.value),
    source: row.source,
    captured_on: String(row.captured_on),
    created_at: String(row.created_at),
  };
}

function asSeriesRow(value: unknown): Omit<ProgressSeries, 'current_last' | 'previous_last' | 'declared_delta'> | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.kind !== 'string' || !isMeasurementKind(row.kind)) return null;
  return {
    kind: row.kind,
    unit: String(row.unit ?? ''),
    current: Array.isArray(row.current) ? row.current.flatMap((entry) => {
      const point = asPoint(entry);
      return point ? [point] : [];
    }) : [],
    previous: Array.isArray(row.previous) ? row.previous.flatMap((entry) => {
      const point = asPoint(entry);
      return point ? [point] : [];
    }) : [],
  };
}

export function asProgressView(data: unknown, patientId: string, periodDays: ProgressPeriodDays): PatientProgressView {
  const row = (data ?? {}) as Record<string, unknown>;
  const current = (row.current ?? {}) as Record<string, unknown>;
  const previous = (row.previous ?? {}) as Record<string, unknown>;
  const meals = (row.meals ?? {}) as Record<string, unknown>;
  return {
    patient_id: String(row.patient_id ?? patientId),
    timezone: PROGRESS_TIMEZONE,
    period_days: periodDays,
    current: { start: String(current.start ?? ''), end: String(current.end ?? '') },
    previous: { start: String(previous.start ?? ''), end: String(previous.end ?? '') },
    measurements_included: Boolean(row.measurements_included),
    series: finalizeSeries((Array.isArray(row.series) ? row.series : []).flatMap((entry) => {
      const series = asSeriesRow(entry);
      return series ? [series] : [];
    })),
    meals: { current: asMeals(meals.current), previous: asMeals(meals.previous) },
  };
}

export async function getPatientProgress(patientId: string, periodDays: ProgressPeriodDays, persistent: boolean): Promise<PatientProgressView> {
  if (!persistent) {
    const patient = getPatient(patientId);
    if (!patient) throw new CareError(404, 'Paciente no encontrado.');
    const [measurements, consents] = await Promise.all([
      listMeasurements(patientId, false),
      currentCareConsents(patientId, false),
    ]);
    return derivePatientProgress({
      patientId,
      periodDays,
      measurements,
      meals: patient.meal_logs,
      measurementsIncluded: consents.consented.includes('measurement'),
    });
  }
  const { data, error } = await getRequestDb().rpc('get_patient_progress', {
    target_patient: patientId,
    period_days: periodDays,
  });
  progressDbError(error);
  return asProgressView(data, patientId, periodDays);
}
