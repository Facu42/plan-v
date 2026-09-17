import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  buildPatientCalendarEvents,
  canShiftWeek,
  calendarRange,
  filterCalendarEvents,
  startOfWeekMonday,
} from './showroom-calendar';
import type { ShowroomPatient } from './showroom-model';

const now = new Date(2026, 8, 16, 10, 0, 0);

const patient = {
  id: 'p1',
  name: 'Ana Ruiz',
  initials: 'AR',
  appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' },
  todayPlan: [{ slot: 'Almuerzo', title: 'Ensalada de quinoa', time: '13:00' }],
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Ensalada de quinoa' }] },
    { day: 'Jueves', meals: [{ slot: 'Cena', title: 'Tortilla de verduras' }] },
  ],
  logs: [
    { id: 'm1', slot: 'Cena', description: 'Tortilla casera', status: 'pending_review', macros: null, logged_at: '2026-09-16T19:00:00', foods: [] },
    { id: 'm-bad', slot: 'Desayuno', description: 'Inválido', status: 'pending_review', macros: null, logged_at: 'no-es-fecha', foods: [] },
  ],
  activities: [
    { id: 'a1', patient_id: 'p1', activity: 'Caminata', duration_minutes: 30, intensity: 'moderada', note: null, logged_at: '2026-09-14T18:00:00' },
  ],
} as unknown as ShowroomPatient;

describe('Modelo de calendario paciente', () => {
  it('arma eventos reales: consulta, plan de esta semana, diario y actividad', () => {
    const events = buildPatientCalendarEvents(patient, now);
    expect(events.filter((event) => event.kind === 'consult').map((event) => event.dateId)).toEqual(['2026-09-17']);
    expect(events.filter((event) => event.kind === 'plan').map((event) => [event.dateId, event.title])).toEqual([
      ['2026-09-14', 'Ensalada de quinoa'],
      ['2026-09-17', 'Tortilla de verduras'],
    ]);
    expect(events.filter((event) => event.kind === 'meal').map((event) => event.dateId)).toEqual(['2026-09-16']);
    expect(events.filter((event) => event.kind === 'activity').map((event) => event.title)).toEqual(['Caminata']);
  });

  it('no proyecta el plan sobre otra semana ni inventa recordatorios', () => {
    const events = buildPatientCalendarEvents(patient, now);
    expect(events.some((event) => event.kind === 'plan' && event.dateId === '2026-09-07')).toBe(false);
    expect(events.some((event) => /recordatorio/i.test(`${event.title} ${event.subtitle}`))).toBe(false);
    const previousMonday = startOfWeekMonday(new Date(2026, 8, 7, 12));
    const range = calendarRange(events, now);
    expect(canShiftWeek(previousMonday, 0, range)).toBe(false);
  });

  it('filtra por tipo y arma un mes de 35 o 42 celdas', () => {
    const events = buildPatientCalendarEvents(patient, now);
    expect(filterCalendarEvents(events, 'meal')).toHaveLength(1);
    expect(buildMonthGrid(now, now).cells).toHaveLength(35);
  });
});
