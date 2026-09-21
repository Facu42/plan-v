import { MEASUREMENT_KINDS, isMeasurementKind, type Measurement, type MeasurementKind } from '../../src/types/care.js';
import {
  PROGRESS_TIMEZONE,
  isProgressPeriodDays,
  type PatientProgressView,
  type ProgressMealCounts,
  type ProgressPeriodDays,
  type ProgressPoint,
  type ProgressSeries,
  type ProgressWindow,
} from '../../src/types/progress.js';
import type { MealLog } from '../../src/types/index.js';

export { isProgressPeriodDays };

export function argentinaToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PROGRESS_TIMEZONE }).format(now);
}

export function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function progressWindows(periodDays: ProgressPeriodDays, now = new Date()): { current: ProgressWindow; previous: ProgressWindow } {
  const end = argentinaToday(now);
  const start = shiftIsoDate(end, -(periodDays - 1));
  return {
    current: { start, end },
    previous: { start: shiftIsoDate(start, -periodDays), end: shiftIsoDate(start, -1) },
  };
}

export function argentinaDateFromInstant(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return argentinaToday(date);
}

export function inWindow(date: string, window: ProgressWindow): boolean {
  return date >= window.start && date <= window.end;
}

function emptyMeals(): ProgressMealCounts {
  return { logged: 0, reviewed: 0, pending: 0 };
}

function countMeals(logs: readonly Pick<MealLog, 'logged_at' | 'status'>[], window: ProgressWindow): ProgressMealCounts {
  const counts = emptyMeals();
  for (const log of logs) {
    const date = argentinaDateFromInstant(log.logged_at);
    if (!date || !inWindow(date, window)) continue;
    counts.logged += 1;
    if (log.status === 'pending_review') counts.pending += 1;
    else counts.reviewed += 1;
  }
  return counts;
}

function byCaptured(a: ProgressPoint, b: ProgressPoint): number {
  return a.captured_on.localeCompare(b.captured_on) || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
}

export function declaredDelta(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 10) / 10;
}

function lastPoint(points: readonly ProgressPoint[]): ProgressPoint | null {
  if (!points.length) return null;
  return [...points].sort(byCaptured).at(-1) ?? null;
}

function asPoint(entry: Measurement): ProgressPoint {
  return {
    id: entry.id,
    value: Number(entry.value_numeric),
    source: entry.source,
    captured_on: entry.captured_on,
    created_at: entry.created_at,
  };
}

const KIND_ORDER = new Map<MeasurementKind, number>(MEASUREMENT_KINDS.map((kind, index) => [kind, index]));

export function finalizeSeries(rows: Array<Omit<ProgressSeries, 'current_last' | 'previous_last' | 'declared_delta'>>): ProgressSeries[] {
  return rows
    .map((row) => {
      const current = [...row.current].sort(byCaptured);
      const previous = [...row.previous].sort(byCaptured);
      const current_last = lastPoint(current);
      const previous_last = lastPoint(previous);
      return {
        kind: row.kind,
        unit: row.unit,
        current,
        previous,
        current_last,
        previous_last,
        declared_delta: declaredDelta(current_last?.value, previous_last?.value),
      };
    })
    .sort((a, b) => (KIND_ORDER.get(a.kind) ?? 9) - (KIND_ORDER.get(b.kind) ?? 9) || a.unit.localeCompare(b.unit, 'es-AR'));
}

export function derivePatientProgress(input: {
  patientId: string;
  periodDays: ProgressPeriodDays;
  measurements: readonly Measurement[];
  meals: readonly Pick<MealLog, 'logged_at' | 'status'>[];
  measurementsIncluded: boolean;
  now?: Date;
}): PatientProgressView {
  const windows = progressWindows(input.periodDays, input.now);
  const groups = new Map<string, { kind: MeasurementKind; unit: string; current: ProgressPoint[]; previous: ProgressPoint[] }>();
  if (input.measurementsIncluded) {
    for (const entry of input.measurements) {
      if (!isMeasurementKind(entry.kind) || entry.patient_id !== input.patientId) continue;
      const inCurrent = inWindow(entry.captured_on, windows.current);
      const inPrevious = inWindow(entry.captured_on, windows.previous);
      if (!inCurrent && !inPrevious) continue;
      const key = `${entry.kind}|${entry.unit}`;
      const group = groups.get(key) ?? { kind: entry.kind, unit: entry.unit, current: [], previous: [] };
      const point = asPoint(entry);
      if (inCurrent) group.current.push(point);
      else group.previous.push(point);
      groups.set(key, group);
    }
  }
  return {
    patient_id: input.patientId,
    timezone: PROGRESS_TIMEZONE,
    period_days: input.periodDays,
    current: windows.current,
    previous: windows.previous,
    measurements_included: input.measurementsIncluded,
    series: finalizeSeries([...groups.values()]),
    meals: {
      current: countMeals(input.meals, windows.current),
      previous: countMeals(input.meals, windows.previous),
    },
  };
}
