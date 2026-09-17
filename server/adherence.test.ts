import { describe, expect, it } from 'vitest';
import { calculateAdherence, type AdherenceInput } from './adherence.js';

const TODAY = new Date('2026-09-05T15:00:00.000Z'); // sábado

function daysAgoIso(days: number): string {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function daysAgoDate(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

function habit(daysBack: number, hydration: number, energy: string | null = null) {
  return { id: `hb-${daysBack}`, patient_id: 'pat-1', date: daysAgoDate(daysBack), hydration, energy, sleep_minutes: null };
}

function habitWeek(daily: number) {
  return Array.from({ length: 7 }, (_, i) => habit(i, daily));
}

function log(status: 'pending_review' | 'confirmed' | 'adjusted', loggedAt: string) {
  return {
    id: `ml-${status}-${loggedAt}`,
    patient_id: 'pat-1',
    slot: 'Almuerzo',
    photo_url: null,
    description: null,
    foods: [],
    macros: null,
    confidence: 0.7,
    note_for_nutri: '',
    status,
    logged_at: loggedAt,
  };
}

function input(overrides: Partial<AdherenceInput>): AdherenceInput {
  return {
    meal_logs: [],
    weekPlan: [],
    todayPlan: [],
    habit_logs: [],
    ...overrides,
  };
}

describe('calculateAdherence', () => {
  it('does not count pending meals toward the score', () => {
    const result = calculateAdherence(input({
      meal_logs: [log('pending_review', daysAgoIso(0)), log('pending_review', daysAgoIso(1))],
      weekPlan: [{ day: 'Sábado', meals: [{ slot: 'Almuerzo', title: 'X' }] }],
      todayPlan: [{ slot: 'Almuerzo', title: 'X', time: '13:30' }],
    }), TODAY);

    expect(result.score).toBe(0);
    expect(result.why).toContain('2 en revisión (no suman)');
  });

  it('counts confirmed and adjusted meals against the planned slots of the last 7 days', () => {
    const result = calculateAdherence(input({
      meal_logs: [log('confirmed', daysAgoIso(0)), log('adjusted', daysAgoIso(5))],
      weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'X' }] }],
      todayPlan: [{ slot: 'Almuerzo', title: 'X', time: '13:30' }],
    }), TODAY);

    expect(result.score).toBe(75);
    expect(result.why).toContain('2 de 2 comidas revisadas');
  });

  it('ignores reviewed meals older than the 7-day window', () => {
    const result = calculateAdherence(input({
      meal_logs: [log('confirmed', daysAgoIso(8))],
      weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'X' }] }],
    }), TODAY);

    expect(result.score).toBe(0);
  });

  it('averages the week hydration as 25% of the score, counting unlogged days as zero', () => {
    const result = calculateAdherence(input({
      meal_logs: [log('confirmed', daysAgoIso(0))],
      todayPlan: [{ slot: 'Almuerzo', title: 'X', time: '13:30' }],
      habit_logs: habitWeek(4), // 4/8 todos los días → proporción 0.5
    }), TODAY);

    // comidas 1/1 → 75; agua 0.5 × 25 = 12.5 → 88
    expect(result.score).toBe(88);
    expect(result.why).toContain('Agua 4.0/8 promedio');
  });

  it('counts days without a habit log as zero water', () => {
    const full = calculateAdherence(input({ habit_logs: habitWeek(8) }), TODAY);
    const halfWeek = calculateAdherence(input({
      habit_logs: [habit(0, 8), habit(1, 8), habit(2, 8), habit(3, 8)], // 4 días de 7
    }), TODAY);

    expect(full.score).toBe(100);
    expect(halfWeek.score).toBe(89); // comidas cubiertas (sin plan) + agua 32/56 × 25 ≈ 14.3
  });

  it('treats an empty plan as fully covered and never divides by zero', () => {
    const result = calculateAdherence(input({ habit_logs: habitWeek(8) }), TODAY);
    expect(result.score).toBe(100);
    expect(result.why).toContain('Agua 8.0/8 promedio');
  });

  it('is deterministic for the same inputs', () => {
    const data = input({
      meal_logs: [log('confirmed', daysAgoIso(2)), log('pending_review', daysAgoIso(0))],
      weekPlan: [{ day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'X' }] }],
      habit_logs: habitWeek(6),
    });
    expect(calculateAdherence(data, TODAY)).toEqual(calculateAdherence(data, TODAY));
  });
});
