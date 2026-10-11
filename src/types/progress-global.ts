import type { ProgressPeriodDays, ProgressWindow } from './progress';

/** Peso de una paciente en el período. Sin permiso o sin registros no se inventa un valor ni un cero. */
export type GlobalWeight =
  | { state: 'no-consent' }
  | { state: 'none' }
  | { state: 'ok'; unit: string; last: number; last_on: string; from: number | null; from_on: string | null; delta: number | null; points: number };

export type GlobalPatientProgress = {
  patient_id: string;
  patient_name: string;
  weight: GlobalWeight;
  meals: { logged: number; previous: number; pending: number };
};

export type GlobalProgressTotals = {
  patients: number;
  with_records: number;
  meals: number;
  previous_meals: number;
  pending_review: number;
  with_weight: number;
  without_measurement_permission: number;
};

export type GlobalProgressResponse = {
  period_days: ProgressPeriodDays;
  current: ProgressWindow;
  previous: ProgressWindow;
  patients: GlobalPatientProgress[];
  totals: GlobalProgressTotals;
  /** Pacientes cuyo resumen no se pudo consultar: se avisan aparte, nunca como cero. */
  unavailable: Array<{ patient_id: string; patient_name: string }>;
  source: 'memory' | 'supabase';
};
