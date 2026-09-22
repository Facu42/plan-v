export const PROGRESS_PERIODS = [7, 30, 90] as const;
export type ProgressPeriodDays = (typeof PROGRESS_PERIODS)[number];
export const PROGRESS_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const PROGRESS_PERIOD_LABELS: Record<ProgressPeriodDays, string> = {
  7: '7 días',
  30: '30 días',
  90: '90 días',
};

export function isProgressPeriodDays(value: number): value is ProgressPeriodDays {
  return (PROGRESS_PERIODS as readonly number[]).includes(value);
}

export type ProgressWindow = { start: string; end: string };
export type ProgressMealCounts = { logged: number; reviewed: number; pending: number };
export type ProgressPoint = {
  id: string;
  value: number;
  source: 'patient' | 'professional';
  captured_on: string;
  created_at: string;
};
export type ProgressSeries = {
  kind: 'weight' | 'waist' | 'hip';
  unit: string;
  current: ProgressPoint[];
  previous: ProgressPoint[];
  current_last: ProgressPoint | null;
  previous_last: ProgressPoint | null;
  declared_delta: number | null;
};
export type PatientProgressView = {
  patient_id: string;
  timezone: typeof PROGRESS_TIMEZONE;
  period_days: ProgressPeriodDays;
  current: ProgressWindow;
  previous: ProgressWindow;
  measurements_included: boolean;
  series: ProgressSeries[];
  meals: { current: ProgressMealCounts; previous: ProgressMealCounts };
};
