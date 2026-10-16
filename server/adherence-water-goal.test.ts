import { describe, expect, it } from 'vitest';
import { calculateAdherence } from './adherence.js';

describe('adherencia con meta de agua', () => {
  it('la adherencia mide el agua contra la meta de la paciente', () => {
    const today = new Date('2026-10-15T15:00:00-03:00');
    const days = ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'];
    const base = { meal_logs: [], weekPlan: [], todayPlan: [], habit_logs: days.map((date) => ({ date, hydration: 6, energy: null, sleep_minutes: null })) };
    expect(calculateAdherence({ ...base, water_goal_glasses: 6 } as never, today).why).toContain('Agua 6.0/6 promedio');
    expect(calculateAdherence(base as never, today).why).toContain('Agua 6.0/8 promedio');
  });
});
