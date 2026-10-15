import { describe, expect, it } from 'vitest';
import type { JourneyDay } from '../patient/journey-summary';
import { stepsSummaryText } from './steps-summary';

const day = (steps: number | null, isToday = false): JourneyDay => ({
  date: '2026-10-15', label: 'jue', isToday, hydration: 0, energy: null, sleepMinutes: null, steps,
  symptoms: [], reviewedMeals: 0, pendingMeals: 0, mealLogIds: [],
});

describe('stepsSummaryText', () => {
  it('says there are no steps when the patient never logged them', () => {
    expect(stepsSummaryText([day(null), day(null, true)])).toBe('Sin pasos registrados');
  });

  it('averages only the days with a value and shows today', () => {
    expect(stepsSummaryText([day(4000), day(null), day(8000, true)])).toBe('Pasos: hoy 8.000 · promedio 6.000 por día (2 días con registro)');
  });

  it('marks today as missing when only earlier days have steps', () => {
    expect(stepsSummaryText([day(5000), day(null, true)])).toBe('Pasos: hoy sin registro · promedio 5.000 por día (1 día con registro)');
  });
});
