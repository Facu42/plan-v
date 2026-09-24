import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { buildAgendaCalendar, buildAgendaEntries, firstAgendaDateId, ShowroomAgenda } from './ShowroomAgenda';
import { toggleInSet } from './ShowroomPatientAgenda';

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

  it('usa el layout del frame Calendar: tres cards, grilla con categorías y detalle del día', () => {
    const html = renderToStaticMarkup(<ShowroomAgenda patients={patients} now={now} onManage={vi.fn()} />);
    expect((html.match(/class="nvcal-stat"/g) ?? [])).toHaveLength(3);
    expect((html.match(/data-agenda-day=/g) ?? [])).toHaveLength(35);
    expect(html).toContain('Videollamadas');
    expect(html).toContain('Presenciales');
    expect(html).toContain('Detalle del día');
    // El panel abre en la primera consulta desde hoy (Beatriz, martes 15).
    expect(html).toContain('Beatriz Paz');
    expect(html).toContain('Martes, 15 de septiembre de 2026');
    expect(html).toContain('Ana Ruiz');
    expect(html).toContain('Carla Sol');
    expect(html).toContain('Sin turno');
    expect(html).toContain('Gestionar consulta');
    expect(html).toContain('Nueva consulta');
  });

  it('abre la sala segura de la consulta por video del día elegido', () => {
    const html = renderToStaticMarkup(<ShowroomAgenda patients={[patients[0], patients[2]]} now={now} onManage={vi.fn()} />);
    expect(html).toContain('Abrir sala');
    expect(html).toContain('href="https://meet.example.com/ana"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Sin respuesta');
  });

  it('declara el límite del modelo semanal actual', () => {
    const html = renderToStaticMarkup(<ShowroomAgenda patients={patients} now={now} onManage={vi.fn()} />);
    expect(html).toContain('una próxima ocurrencia por paciente');
    expect(html).not.toMatch(/historial clínico|consultas realizadas|recurrencia configurada/i);
  });

  it('elige el primer día con consulta y alterna categorías sin perder las demás', () => {
    const entries = buildAgendaEntries(patients, now);
    expect(firstAgendaDateId(entries, now)).toBe('2026-09-15');
    expect(firstAgendaDateId([], now)).toBe('2026-09-13');
    const hidden = toggleInSet(new Set<string>(), 'video');
    expect([...hidden]).toEqual(['video']);
    expect([...toggleInSet(hidden, 'video')]).toEqual([]);
  });
});
