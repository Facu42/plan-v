import { describe, expect, it } from 'vitest';
import { buildDailyReminders, type RemindersInput } from './daily-reminders';

const NOW = new Date('2026-09-05T14:00:00'); // sábado 14:00

function mealLog(slot: string) {
  return {
    id: `ml-${slot}`,
    patient_id: 'pat-1',
    slot,
    photo_url: null,
    description: null,
    foods: [],
    macros: null,
    confidence: 0.7,
    note_for_nutri: '',
    status: 'confirmed' as const,
    logged_at: '2026-09-05T13:40:00.000Z',
  };
}

function input(overrides: Partial<RemindersInput>): RemindersInput {
  return {
    todayPlan: [
      { slot: 'Desayuno', title: 'Yogur con granola', time: '08:00' },
      { slot: 'Almuerzo', title: 'Bowl de pollo', time: '13:30' },
      { slot: 'Merienda', title: 'Tostada + huevo', time: '17:30' },
      { slot: 'Cena', title: 'Ensalada completa', time: '21:00' },
    ],
    meal_logs: [],
    hydration: 3,
    sleep_minutes: null,
    appointment: null,
    ...overrides,
  };
}

describe('buildDailyReminders', () => {
  it('marks past unlogged meals as missed and logged ones as done', () => {
    const reminders = buildDailyReminders(input({ meal_logs: [mealLog('Almuerzo')] }), NOW);
    const bySlot = Object.fromEntries(reminders.filter((r) => r.kind === 'comida').map((r) => [r.title, r]));

    expect(bySlot['Desayuno'].state).toBe('perdido');
    expect(bySlot['Almuerzo'].state).toBe('done');
    expect(bySlot['Merienda'].state).toBe('proximo');
    expect(bySlot['Cena'].state).toBe('proximo');
  });

  it('marks a meal within the half-hour window as ahora', () => {
    const reminders = buildDailyReminders(input({}), new Date('2026-09-05T17:15:00'));
    expect(reminders.find((r) => r.title === 'Merienda')?.state).toBe('ahora');
    expect(reminders.find((r) => r.title === 'Almuerzo')?.state).toBe('perdido');
  });

  it('includes a water reminder only while the daily goal is incomplete', () => {
    const incomplete = buildDailyReminders(input({ hydration: 3 }), NOW);
    expect(incomplete.some((r) => r.kind === 'agua')).toBe(true);

    const complete = buildDailyReminders(input({ hydration: 8 }), NOW);
    expect(complete.some((r) => r.kind === 'agua')).toBe(false);
  });

  it('includes the appointment only when it is scheduled for today', () => {
    const today = buildDailyReminders(input({ appointment: { when: 'Sábado · 16:00', duration: 30, channel: 'video' } }), NOW);
    const consulta = today.find((r) => r.kind === 'consulta');
    expect(consulta?.state).toBe('proximo');
    expect(consulta?.time).toBe('16:00');

    const otherDay = buildDailyReminders(input({ appointment: { when: 'Jueves · 16:00', duration: 30, channel: 'video' } }), NOW);
    expect(otherDay.some((r) => r.kind === 'consulta')).toBe(false);
  });

  it('keeps a sleep check-in at 22:30 and marks it done after the patient records rest', () => {
    const missing = buildDailyReminders(input({ sleep_minutes: null }), NOW);
    expect(missing.find((r) => r.kind === 'sueno')).toMatchObject({
      title: 'descanso',
      time: '22:30',
      state: 'proximo',
    });

    const recorded = buildDailyReminders(input({ sleep_minutes: 450 }), NOW);
    expect(recorded.find((r) => r.kind === 'sueno')).toMatchObject({
      detail: '7 h 30 min registrados',
      state: 'done',
    });
  });

  it('sorts timed reminders chronologically with the water nudge last', () => {
    const reminders = buildDailyReminders(input({ appointment: { when: 'Sábado · 09:00', duration: 30, channel: 'video' } }), NOW);
    expect(reminders.map((r) => r.title)).toEqual(['Desayuno', 'consulta', 'Almuerzo', 'Merienda', 'Cena', 'descanso', 'agua'].map(String));
    expect(reminders.map((r) => r.kind)).toEqual(['comida', 'consulta', 'comida', 'comida', 'comida', 'sueno', 'agua']);
  });
});
