import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildShowroomReminders, openShowroomReminders } from './showroom-reminders';

const patient = {
  id: 'p1',
  name: 'Ana Ruiz',
  hydration: 3,
  sleepMinutes: null,
  appointment: { when: 'Sábado · 16:00', duration: 30, channel: 'video' },
  todayPlan: [
    { slot: 'Almuerzo', title: 'Bowl de pollo', time: '13:30' },
    { slot: 'Cena', title: 'Tortilla', time: '21:00' },
  ],
  logs: [
    { id: 'm1', slot: 'Almuerzo', description: 'Bowl', status: 'confirmed', macros: null, logged_at: '2026-09-05T13:40:00', foods: [] },
  ],
} as unknown as ShowroomPatient;

describe('Recordatorios de comidas y hábitos', () => {
  it('usa el plan de hoy, el diario y los hábitos publicados', () => {
    const reminders = buildShowroomReminders(patient, new Date('2026-09-05T14:00:00'));
    expect(reminders.find((item) => item.id === 'comida-Almuerzo')?.state).toBe('done');
    expect(reminders.find((item) => item.id === 'comida-Cena')?.state).toBe('proximo');
    expect(reminders.find((item) => item.id === 'agua')?.detail).toContain('3 de 8');
    expect(reminders.find((item) => item.id === 'descanso')?.state).not.toBe('done');
  });

  it('omite los recordatorios ya cumplidos para la campana', () => {
    const open = openShowroomReminders(buildShowroomReminders(patient, new Date('2026-09-05T14:00:00')));
    expect(open.some((item) => item.state === 'done')).toBe(false);
    expect(open.some((item) => item.kind === 'agua')).toBe(true);
  });
});
