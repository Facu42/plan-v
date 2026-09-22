import { describe, expect, it } from 'vitest';
import { derivePatientProgress, declaredDelta, progressWindows, shiftIsoDate } from './derive.js';
import type { Measurement } from '../../src/types/care.js';

const now = new Date('2026-09-21T18:00:00-03:00');
const windows = progressWindows(7, now);

function measure(partial: Partial<Measurement> & Pick<Measurement, 'id' | 'kind' | 'value_numeric' | 'captured_on'>): Measurement {
  return {
    patient_id: 'pat-sofia',
    unit: partial.kind === 'weight' ? 'kg' : 'cm',
    source: 'patient',
    created_at: `${partial.captured_on}T12:00:00.000Z`,
    ...partial,
  };
}

describe('PV-34 derive progreso', () => {
  it('abre ventanas inclusivas de 7/30/90 sin solaparse', () => {
    expect(windows).toEqual({
      current: { start: '2026-09-15', end: '2026-09-21' },
      previous: { start: '2026-09-08', end: '2026-09-14' },
    });
    expect(progressWindows(30, now)).toEqual({
      current: { start: '2026-08-23', end: '2026-09-21' },
      previous: { start: '2026-07-24', end: '2026-08-22' },
    });
    expect(shiftIsoDate(windows.current.start, -1)).toBe(windows.previous.end);
  });

  it('compara el mismo paciente y no mezcla kg con lb ni rellena períodos vacíos', () => {
    const view = derivePatientProgress({
      patientId: 'pat-sofia',
      periodDays: 7,
      now,
      measurementsIncluded: true,
      meals: [
        { logged_at: '2026-09-20T20:00:00-03:00', status: 'confirmed' },
        { logged_at: '2026-09-19T13:00:00-03:00', status: 'pending_review' },
        { logged_at: '2026-09-10T13:00:00-03:00', status: 'adjusted' },
        { logged_at: '2026-08-01T13:00:00-03:00', status: 'confirmed' },
      ],
      measurements: [
        measure({ id: 'w-now', kind: 'weight', value_numeric: 64.5, captured_on: '2026-09-20', source: 'patient' }),
        measure({ id: 'w-prev', kind: 'weight', value_numeric: 65, captured_on: '2026-09-10', source: 'professional' }),
        measure({ id: 'w-lb', kind: 'weight', value_numeric: 140, unit: 'lb', captured_on: '2026-09-18', source: 'patient' }),
        measure({ id: 'w-old', kind: 'weight', value_numeric: 70, captured_on: '2026-07-01', source: 'patient' }),
        measure({ id: 'hip-now', kind: 'hip', value_numeric: 98, captured_on: '2026-09-16', source: 'professional' }),
      ],
    });
    expect(view.meals.current).toEqual({ logged: 2, reviewed: 1, pending: 1 });
    expect(view.meals.previous).toEqual({ logged: 1, reviewed: 1, pending: 0 });
    const kg = view.series.find((row) => row.kind === 'weight' && row.unit === 'kg');
    const lb = view.series.find((row) => row.kind === 'weight' && row.unit === 'lb');
    expect(kg?.declared_delta).toBe(-0.5);
    expect(kg?.current_last?.source).toBe('patient');
    expect(kg?.previous_last?.source).toBe('professional');
    expect(lb?.declared_delta).toBeNull();
    expect(lb?.previous).toEqual([]);
    expect(view.series.find((row) => row.kind === 'hip')?.declared_delta).toBeNull();
    expect(view.series.some((row) => row.current_last?.value === 70)).toBe(false);
  });

  it('omite medidas sin consentimiento y no inventa un delta', () => {
    expect(declaredDelta(64.5, null)).toBeNull();
    const view = derivePatientProgress({
      patientId: 'pat-sofia',
      periodDays: 7,
      now,
      measurementsIncluded: false,
      meals: [],
      measurements: [measure({ id: 'w-now', kind: 'weight', value_numeric: 64.5, captured_on: '2026-09-20' })],
    });
    expect(view.measurements_included).toBe(false);
    expect(view.series).toEqual([]);
    expect(view.meals.current).toEqual({ logged: 0, reviewed: 0, pending: 0 });
  });
});
