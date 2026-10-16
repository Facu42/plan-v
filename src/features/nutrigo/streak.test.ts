import { describe, expect, it } from 'vitest';
import { buildStreak, streakLabel, PATIENT_MEAL_PAGE, PATIENT_HABIT_PAGE } from './streak';

// 15/10/2026 a las 15:00 en Argentina.
const now = new Date('2026-10-15T18:00:00Z');
const meal = (day: string, hour = '13:00') => ({ logged_at: `${day}T${hour}:00-03:00` });
const habit = (date: string, patch: Partial<{ hydration: number; energy: string | null; sleep_minutes: number | null; steps: number | null; symptoms: string[] }> = {}) =>
  ({ date, hydration: 0, energy: null, sleep_minutes: null, steps: null, symptoms: [], ...patch });

describe('buildStreak', () => {
  it('cuenta los días seguidos con comidas hasta hoy', () => {
    expect(buildStreak([meal('2026-10-15'), meal('2026-10-14'), meal('2026-10-13')], [], now)).toEqual({ days: 3, today: true, atLeast: false });
  });

  it('si hoy no registró todavía, la racha sigue viva desde ayer', () => {
    expect(buildStreak([meal('2026-10-14'), meal('2026-10-13')], [], now)).toEqual({ days: 2, today: false, atLeast: false });
  });

  it('se corta cuando falta un día', () => {
    expect(buildStreak([meal('2026-10-15'), meal('2026-10-13'), meal('2026-10-12')], [], now).days).toBe(1);
  });

  it('un hábito declarado cuenta como registro, una fila vacía no', () => {
    const streak = buildStreak([meal('2026-10-15')], [habit('2026-10-14', { hydration: 3 }), habit('2026-10-13')], now);
    expect(streak.days).toBe(2);
  });

  it('usa el día de Argentina: una comida a las 23:30 cuenta ese día', () => {
    expect(buildStreak([meal('2026-10-15', '10:00'), meal('2026-10-14', '23:30')], [], now).days).toBe(2);
  });

  it('marca «al menos» cuando la racha llega al borde de las comidas que se ven', () => {
    const meals = Array.from({ length: PATIENT_MEAL_PAGE }, (_, i) => meal(`2026-10-${String(15 - Math.floor(i / 4)).padStart(2, '0')}`));
    const streak = buildStreak(meals, [], now);
    expect(streak).toEqual({ days: 5, today: true, atLeast: true });
  });

  it('no cuenta antes del borde de los hábitos aunque haya comidas', () => {
    const habits = Array.from({ length: PATIENT_HABIT_PAGE }, (_, i) => habit(new Date(Date.parse('2026-10-15T12:00:00Z') - i * 86400000).toISOString().slice(0, 10), { hydration: 1 }));
    const streak = buildStreak([], habits, now);
    expect(streak).toEqual({ days: 14, today: true, atLeast: true });
  });

  it('sin registros no hay racha', () => {
    expect(buildStreak([], [], now)).toEqual({ days: 0, today: false, atLeast: false });
  });
});

describe('streakLabel', () => {
  it('no reemplaza el texto con menos de dos días', () => {
    expect(streakLabel({ days: 1, today: true, atLeast: false })).toBeNull();
  });
  it('felicita si ya registró hoy', () => {
    expect(streakLabel({ days: 4, today: true, atLeast: false })).toBe('¡Llevás 4 días seguidos registrando! 🔥');
  });
  it('avisa si hoy falta registrar', () => {
    expect(streakLabel({ days: 3, today: false, atLeast: false })).toBe('Llevás 3 días seguidos. Registrá hoy para seguir.');
  });
  it('dice «o más» cuando no se ve el comienzo', () => {
    expect(streakLabel({ days: 14, today: true, atLeast: true })).toBe('¡Llevás 14 días o más seguidos registrando! 🔥');
  });
});
