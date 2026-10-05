import type { Measurement } from '../types/care';
import type { ProgressSeries } from '../types/progress';

function latestDate(left: { captured_on: string; created_at: string }, right: { captured_on: string; created_at: string }) {
  return right.captured_on.localeCompare(left.captured_on) || right.created_at.localeCompare(left.created_at);
}

export function latestWeight(measurements: Measurement[], bodyWeight: number | null = null) {
  const latest = measurements.filter(row => row.kind === 'weight').sort(latestDate)[0];
  return latest ? { value: latest.value_numeric, unit: latest.unit } : { value: bodyWeight, unit: 'kg' };
}

export function latestMeasurementSeries(series: ProgressSeries[], kind: ProgressSeries['kind']) {
  return series.filter(row => row.kind === kind && row.current_last).sort((left, right) => latestDate(left.current_last!, right.current_last!))[0];
}
