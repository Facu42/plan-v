import { expect, it } from 'vitest';
import { latestWeight, latestMeasurementSeries } from './measurement-display';
import type { Measurement } from '../types/care';
import type { ProgressSeries } from '../types/progress';

it('el último peso conserva su unidad y desempata por fecha de registro', () => {
  const rows = [
    { kind: 'weight', value_numeric: 65, unit: 'kg', captured_on: '2026-10-04', created_at: '2026-10-04T09:00:00Z' },
    { kind: 'weight', value_numeric: 150, unit: 'lb', captured_on: '2026-10-04', created_at: '2026-10-04T10:00:00Z' },
  ] as Measurement[];
  expect(latestWeight(rows, 70)).toEqual({ value: 150, unit: 'lb' });
  expect(latestWeight([], 70)).toEqual({ value: 70, unit: 'kg' });
});
it('la gráfica muestra la serie del registro más reciente sin mezclar kg y lb', () => {
  const series = [
    { kind: 'weight', unit: 'kg', current_last: { captured_on: '2026-10-01', created_at: '2026-10-01T10:00:00Z' } },
    { kind: 'weight', unit: 'lb', current_last: { captured_on: '2026-10-04', created_at: '2026-10-04T10:00:00Z' } },
  ] as ProgressSeries[];
  expect(latestMeasurementSeries(series, 'weight')?.unit).toBe('lb');
  expect(latestMeasurementSeries(series, 'waist')).toBeUndefined();
});
