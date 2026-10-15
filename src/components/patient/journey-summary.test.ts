import { describe, expect, it } from 'vitest';
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
    analysis_status: 'succeeded',
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
