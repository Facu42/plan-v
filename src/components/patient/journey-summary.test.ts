import { afterEach, describe, expect, it } from 'vitest';
import type { HabitLog, MealLog } from '../../types';
import { buildJourneySummary } from './journey-summary';

const NOW = new Date('2026-09-05T23:30:00-03:00');

function habit(date: string, hydration: number, sleepMinutes: number | null, energy: string | null = null): HabitLog {
  return {
    id: `habit-${date}`,
    patient_id: 'patient-1',
    date,
    hydration,
    energy,
    sleep_minutes: sleepMinutes,
  };
}

function meal(id: string, status: MealLog['status'], loggedAt: string): MealLog {
  return {
    id,
    patient_id: 'patient-1',
    slot: 'Almuerzo',
    photo_url: null,
    description: null,
    foods: [{ name: id, portion_est: 1, portion_unit: 'u', confidence: 0.8 }],
    macros: null,
    confidence: 0.8,
    note_for_nutri: '',
    status,
    logged_at: loggedAt,
  };
}

describe('buildJourneySummary', () => {
  it('builds seven local calendar days from oldest to today', () => {
    const summary = buildJourneySummary({ meal_logs: [], habit_logs: [] }, NOW);

    expect(summary.days).toHaveLength(7);
    expect(summary.days.map((day) => day.date)).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
    ]);
    expect(summary.days[summary.days.length - 1]?.isToday).toBe(true);
  });

  it('keeps late-night records on the correct local day across UTC rollover', () => {
    const summary = buildJourneySummary({
      habit_logs: [habit('2026-09-05', 6, 450, 'Tranquila')],
      meal_logs: [meal('late-local', 'confirmed', '2026-09-06T01:00:00.000Z')],
    }, NOW);

    const today = summary.days[summary.days.length - 1];
    expect(today).toMatchObject({
      date: '2026-09-05',
      hydration: 6,
      sleepMinutes: 450,
      energy: 'Tranquila',
      reviewedMeals: 1,
      pendingMeals: 0,
    });
  });

  it('separates pending meals and ignores records outside the seven-day window', () => {
    const summary = buildJourneySummary({
      habit_logs: [],
      meal_logs: [
        meal('confirmed', 'confirmed', '2026-09-04T15:00:00-03:00'),
        meal('adjusted', 'adjusted', '2026-09-03T15:00:00-03:00'),
        meal('pending', 'pending_review', '2026-09-05T15:00:00-03:00'),
        meal('old', 'confirmed', '2026-08-29T15:00:00-03:00'),
      ],
    }, NOW);

    expect(summary.reviewedMeals).toBe(2);
    expect(summary.pendingMeals).toBe(1);
    expect(summary.days.some((day) => day.reviewedMeals > 0)).toBe(true);
    expect(summary.days.flatMap((day) => day.mealLogIds)).not.toContain('old');
  });

  it('averages water over all seven days and sleep only over recorded days', () => {
    const summary = buildJourneySummary({
      meal_logs: [],
      habit_logs: [
        habit('2026-09-05', 7, 450),
        habit('2026-09-04', 7, 390),
      ],
    }, NOW);

    expect(summary.hydrationAverage).toBe(2);
    expect(summary.sleepRecordedDays).toBe(2);
    expect(summary.sleepAverageMinutes).toBe(420);
    expect(summary.days[0]).toMatchObject({ hydration: 0, sleepMinutes: null, energy: null });
  });
});

/** vite.config.ts fija la zona de Buenos Aires para toda la suite: acá se cambia solo dentro de la prueba y se restaura. */
const originalZone = process.env.TZ;
afterEach(() => { if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone; });

describe.each(['Asia/Tokyo', 'America/Los_Angeles', 'Pacific/Auckland'])('buildJourneySummary con el dispositivo en %s', zone => {
  const lateEvening = new Date('2026-10-07T22:00:00-03:00');
  const afterMidnight = new Date('2026-10-08T01:30:00-03:00');

  it('cuenta los días de Buenos Aires: a las 22:00 de allá hoy sigue siendo hoy', () => {
    process.env.TZ = zone;
    const days = buildJourneySummary({ meal_logs: [], habit_logs: [] }, lateEvening).days;
    expect(days[6]).toMatchObject({ date: '2026-10-07', isToday: true, label: 'mié' });
    expect(days[0].date).toBe('2026-10-01');
  });
  it('cruza el medianoche de Buenos Aires sin adelantar ni atrasar el día', () => {
    process.env.TZ = zone;
    expect(buildJourneySummary({ meal_logs: [], habit_logs: [] }, afterMidnight).days[6].date).toBe('2026-10-08');
  });
  it('una comida y el agua de las 22:00 de Buenos Aires caen en el mismo día argentino', () => {
    process.env.TZ = zone;
    const summary = buildJourneySummary({ habit_logs: [habit('2026-10-07', 5, 420)], meal_logs: [meal('cena', 'confirmed', '2026-10-07T22:00:00-03:00')] }, lateEvening);
    expect(summary.days[6]).toMatchObject({ date: '2026-10-07', hydration: 5, reviewedMeals: 1, mealLogIds: ['cena'] });
  });
  it('cruza fin de mes y de año', () => {
    process.env.TZ = zone;
    const days = buildJourneySummary({ meal_logs: [], habit_logs: [] }, new Date('2027-01-02T23:00:00-03:00')).days;
    expect(days.map(day => day.date)).toEqual(['2026-12-27', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });
});
