import { describe, expect, it } from 'vitest';
import { DEFAULT_WATER_GOAL, MAX_WATER_GLASSES, WATER_GOAL_OPTIONS, waterGoalOf } from './water';
import { buildDailyReminders } from '../components/patient/daily-reminders';

describe('meta de agua de la paciente', () => {
  it('usa la que eligió la nutri y, sin dato o con un dato inválido, la de siempre', () => {
    expect(waterGoalOf({ water_goal_glasses: 12 })).toBe(12);
    for (const value of [undefined, null, 0, 3, 17, 7.5, Number.NaN]) expect(waterGoalOf({ water_goal_glasses: value })).toBe(DEFAULT_WATER_GOAL);
  });
  it('las opciones van de 4 a 16 vasos de a uno', () => {
    expect(WATER_GOAL_OPTIONS[0]).toBe(4);
    expect(WATER_GOAL_OPTIONS[WATER_GOAL_OPTIONS.length - 1]).toBe(MAX_WATER_GLASSES);
    expect(WATER_GOAL_OPTIONS).toHaveLength(13);
  });
  it('el recordatorio de agua se apaga al llegar a la meta y dice cuántos faltan sobre ella', () => {
    const input = { todayPlan: [], meal_logs: [], sleep_minutes: 420, appointment: null };
    expect(buildDailyReminders({ ...input, hydration: 6, water_goal_glasses: 6 }).some((item) => item.id === 'agua')).toBe(false);
    expect(buildDailyReminders({ ...input, hydration: 6, water_goal_glasses: 10 }).find((item) => item.id === 'agua')?.detail).toBe('6 de 10 vasos registrados');
  });
});
