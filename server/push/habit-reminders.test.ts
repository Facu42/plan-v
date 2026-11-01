import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUSH_TEXTS } from './push.js';
import { resetHabitReminderMemory, resetHabitReminderTick, saveMemoryHabitReminders, tickHabitReminders } from './habit-reminders.js';
import { DEFAULT_HABIT_REMINDERS, type HabitKind } from '../../src/habit-reminders.js';

describe('envío de recordatorios de hábitos', () => {
  beforeEach(() => {
    resetHabitReminderTick();
    resetHabitReminderMemory();
  });

  it('manda comer y agua una sola vez en el tramo, y sigue si un teléfono falla', async () => {
    saveMemoryHabitReminders('ana', { ...DEFAULT_HABIT_REMINDERS, mealsOn: true, waterOn: true });
    const notify = vi.fn().mockResolvedValueOnce(1).mockRejectedValueOnce(new Error('caído'));
    const habits: HabitKind[] = ['meals', 'water'];
    const list = vi.fn(async () => [{ patientId: 'p1', habits }]);
    expect(await tickHabitReminders(new Date('2026-10-31T16:02:00Z'), { list, notify })).toEqual({ patients: 1, delivered: 1 });
    expect(notify.mock.calls).toEqual([['p1', 'meals'], ['p1', 'water']]);
    expect(await tickHabitReminders(new Date('2026-10-31T16:08:00Z'), { list, notify })).toBeNull();
  });

  it('sin claves de avisos no hace nada, y si la lista falla no rompe el reloj', async () => {
    expect(await tickHabitReminders(new Date('2026-10-31T16:02:00Z'), null)).toBeNull();
    expect(await tickHabitReminders(new Date('2026-10-31T16:12:00Z'), { list: async () => { throw new Error('base'); }, notify: async () => 1 })).toBeNull();
  });

  it('los textos no dicen el nombre ni datos de salud', () => {
    expect(PUSH_TEXTS.habit_meal.title).toBe('Hora de comer');
    expect(PUSH_TEXTS.habit_water.body).not.toMatch(/ml|vaso de/i);
    expect(JSON.stringify(PUSH_TEXTS.habit_sleep)).not.toMatch(/paciente|nutri/i);
  });
});
