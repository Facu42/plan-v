import { describe, expect, it } from 'vitest';
import { DEFAULT_HABIT_REMINDERS, dueHabits, habitRemindersSchema, waterTimes } from './habit-reminders';

const at = (iso: string) => new Date(iso);

describe('recordatorios de comer, agua y dormir', () => {
  it('avisa comer y agua a las 13 de Argentina, y dormir a las 23', () => {
    const prefs = { ...DEFAULT_HABIT_REMINDERS, mealsOn: true, waterOn: true, sleepOn: true };
    expect(dueHabits(prefs, at('2026-10-31T16:02:00Z'))).toEqual(['meals', 'water']);
    expect(dueHabits(prefs, at('2026-11-01T02:04:00Z'))).toEqual(['sleep']);
  });

  it('apagados no salen, y el agua no suena fuera de su intervalo', () => {
    expect(dueHabits(DEFAULT_HABIT_REMINDERS, at('2026-10-31T16:02:00Z'))).toEqual([]);
    const water = { ...DEFAULT_HABIT_REMINDERS, waterOn: true };
    expect(dueHabits(water, at('2026-10-31T13:00:00Z'))).toEqual([]);
    expect(waterTimes('09:00', '21:00', 2)).toEqual(['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']);
  });

  it('rechaza un horario de agua al revés', () => {
    expect(habitRemindersSchema.safeParse({ ...DEFAULT_HABIT_REMINDERS, waterFrom: '21:00', waterUntil: '09:00' }).success).toBe(false);
  });
});
