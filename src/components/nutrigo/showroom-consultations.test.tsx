import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { buildConsultationCalendar, parseAppointmentWhen, ShowroomConsultations } from './ShowroomConsultations';

const patient: Patient = {
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas', sensitive_hours: '',
  plan_b: '', next_focus: '', adherence_score: 72, adherence_why: '', time: 'hoy', hydration: 4, energy: 'Media',
  sleep_minutes: 420, appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' },
  habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], meal_logs: [], messages: [],
};

const now = new Date(2026, 8, 13, 10, 0, 0);
const render = (value: Patient = patient) => renderToStaticMarkup(
  <ShowroomConsultations patient={value} patients={[value]} now={now} onSelect={vi.fn()} />,
);

describe('Consultas profesionales en Nutrigo', () => {
  it('interpreta únicamente días y horarios válidos', () => {
    expect(parseAppointmentWhen('Jueves · 14:30')).toEqual({ day: 'Jueves', time: '14:30' });
    expect(parseAppointmentWhen('Feriado · 29:99')).toEqual({ day: 'Lunes', time: '14:30' });
  });

  it('deriva la próxima fecha sin convertir la cita semanal en historial inventado', () => {
    const calendar = buildConsultationCalendar(patient.appointment, now);
    expect(calendar.label).toBe('Septiembre de 2026');
    expect(calendar.cells).toHaveLength(35);
    expect(calendar.cells.find((cell) => cell.hasAppointment)?.dateId).toBe('2026-09-17');
    expect(calendar.cells.filter((cell) => cell.hasAppointment)).toHaveLength(1);
  });

  it('renderiza métricas operativas, calendario, detalle seguro y selector multipaciente', () => {
    const html = render();
    expect(html).toContain('Consultas de Ana Ruiz');
    expect(html).toContain('Paciente de la consulta');
    expect((html.match(/class="nvc-stat"/g) ?? [])).toHaveLength(3);
    expect((html.match(/data-calendar-day=/g) ?? [])).toHaveLength(35);
    expect(html).toContain('Jueves · 14:30');
    expect(html).toContain('45 min');
    expect(html).toContain('Videollamada');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Reagendar');
    expect(html).toContain('Cancelar turno');
  });

  it('muestra un editor y un vacío explícito cuando no existe consulta', () => {
    const html = render({ ...patient, appointment: null });
    expect(html).toContain('Sin consulta programada');
    expect(html).toContain('Agendar consulta');
    expect(html).toContain('Guardar turno');
    expect(html).not.toContain('Abrir videollamada');
  });

  it('muestra el historial de turnos publicado y no inventa asistencia', () => {
    const html = render();
    expect(html).toContain('Historial de turnos');
    expect(html).toContain('Todavía no hay historial');
    expect(html).not.toMatch(/asistió|nota clínica|preparación/i);
  });
});
