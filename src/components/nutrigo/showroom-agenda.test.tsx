import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { buildAgendaCalendar, buildAgendaEntries, ShowroomAgenda } from './ShowroomAgenda';

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 72, adherence_why: '', time: 'hoy',
  hydration: 4, energy: 'Media', sleep_minutes: 420, appointment: null, habit_logs: [], todayPlan: [],
  weekPlan: [], brief: null, timeline: [], meal_logs: [], messages: [], ...overrides,
});

const patients = [
  patient({ id: 'ana', appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' } }),
  patient({ id: 'bea', name: 'Beatriz Paz', initials: 'BP', appointment: { when: 'Martes · 11:00', duration: 30, channel: 'presencial' } }),
  patient({ id: 'carla', name: 'Carla Sol', initials: 'CS' }),
];
const now = new Date(2026, 8, 13, 10, 0, 0);

describe('Agenda profesional multipaciente en Nutrigo', () => {
  it('deriva una única próxima ocurrencia por paciente y las ordena cronológicamente', () => {
    const entries = buildAgendaEntries(patients, now);
    expect(entries.map((entry) => [entry.patient.id, entry.dateId])).toEqual([
      ['bea', '2026-09-15'],
      ['ana', '2026-09-17'],
    ]);
  });

  it('agrupa varias consultas por día sin inventar historial longitudinal', () => {
    const entries = buildAgendaEntries([
      ...patients,
      patient({ id: 'dora', name: 'Dora Gil', initials: 'DG', appointment: { when: 'Martes · 16:00', duration: 60, channel: 'video' } }),
    ], now);
    const calendar = buildAgendaCalendar(entries, now);
    expect(calendar.label).toBe('Septiembre de 2026');
    expect(calendar.cells).toHaveLength(35);
    expect(calendar.cells.find((cell) => cell.dateId === '2026-09-15')?.entries).toHaveLength(2);
    expect(calendar.cells.flatMap((cell) => cell.entries)).toHaveLength(3);
  });

  it('muestra resumen, calendario, pacientes sin turno y acciones operativas', () => {
    const html = renderToStaticMarkup(<ShowroomAgenda patients={patients} now={now} onManage={vi.fn()} />);
    expect(html).toContain('Agenda del consultorio');
    expect((html.match(/class="nva-stat"/g) ?? [])).toHaveLength(4);
    expect((html.match(/data-agenda-day=/g) ?? [])).toHaveLength(35);
    expect(html).toContain('Beatriz Paz');
    expect(html).toContain('Ana Ruiz');
    expect(html).toContain('Carla Sol');
    expect(html).toContain('Sin turno');
    expect(html).toContain('Gestionar consulta');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('declara el límite del modelo semanal actual', () => {
    const html = renderToStaticMarkup(<ShowroomAgenda patients={patients} now={now} onManage={vi.fn()} />);
    expect(html).toContain('una próxima ocurrencia por paciente');
    expect(html).not.toMatch(/historial clínico|consultas realizadas|recurrencia configurada/i);
  });

  it('refleja el calendario de la paciente seleccionada sin inventar recordatorios', () => {
    const focused = patient({
      id: 'ana',
      appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' },
      weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Ensalada de quinoa' }] }],
      meal_logs: [{
        id: 'm1', patient_id: 'ana', slot: 'Cena', photo_url: null, description: 'Tortilla casera',
        foods: [], macros: null, confidence: 0, note_for_nutri: '', status: 'pending_review', analysis_status: 'succeeded', logged_at: '2026-09-16T19:00:00',
      }],
      activity_logs: [{ id: 'a1', patient_id: 'ana', activity: 'Caminata', duration_minutes: 30, intensity: 'moderada', note: null, logged_at: '2026-09-14T18:00:00' }],
    });
    const html = renderToStaticMarkup(<ShowroomAgenda patients={patients} now={new Date(2026, 8, 16, 10, 0, 0)} onManage={vi.fn()} focusPatient={focused} />);
    expect(html).toContain('Calendario de Ana Ruiz');
    expect(html).toContain('Ensalada de quinoa');
    expect(html).toContain('Tortilla casera');
    expect(html).toContain('Caminata');
    expect(html).toContain('Los avisos de comidas, hábitos y consulta están en la campana');
    expect(html).toContain('Historial de turnos');
    expect(html).not.toMatch(/recordatorio programado|historial de consultas/i);
  });
});
