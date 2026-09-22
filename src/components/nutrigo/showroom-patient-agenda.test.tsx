import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildPatientAgendaView, ShowroomPatientAgenda } from './ShowroomPatientAgenda';

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
  ],
  activities: [
    { id: 'a1', patient_id: 'p1', activity: 'Caminata', duration_minutes: 30, intensity: 'moderada', note: null, logged_at: '2026-09-14T18:00:00' },
  ],
} as unknown as ShowroomPatient;
const now = new Date(2026, 8, 16, 10, 0, 0);

describe('Agenda paciente Nutrigo', () => {
  it('deriva una sola próxima ocurrencia y un calendario mensual real', () => {
    const view = buildPatientAgendaView(patient, now);
    expect(view.date?.getFullYear()).toBe(2026);
    expect(view.date?.getMonth()).toBe(8);
    expect(view.date?.getDate()).toBe(17);
    expect(view.calendar.cells).toHaveLength(35);
    expect(view.events.filter((event) => event.kind === 'consult')).toHaveLength(1);
  });

  it('muestra mes/semana/día, eventos reales y confirmación de asistencia', () => {
    const html = renderToStaticMarkup(<ShowroomPatientAgenda patient={patient} now={now} onMessage={vi.fn()} storage={null} />);
    expect(html).toContain('Tu calendario');
    expect(html).toContain('Mes');
    expect(html).toContain('Semana');
    expect(html).toContain('Día');
    expect(html).toContain('Ensalada de quinoa');
    expect(html).toContain('Tortilla casera');
    expect(html).toContain('Caminata');
    expect(html).toContain('Videollamada');
    expect(html).toContain('45 min');
    expect(html).toContain('href="https://meet.example.com/ana"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Confirmar asistencia');
    expect(html).toContain('Necesito cambiar el horario');
    expect(html).toContain('America/Argentina/Buenos_Aires');
    expect(html).toContain('Reprogramar horario');
    expect(html).toContain('Historial de turnos');
    expect(html).toContain('indicaciones del plan se muestran sólo sobre la semana calendario actual');
    expect(html).not.toMatch(/Reagendar|Cancelar turno|Guardar turno/i);
  });

  it('rechaza enlaces inseguros y no inventa una fecha desde un valor inválido', () => {
    const unsafe = { ...patient, appointment: { ...patient.appointment!, when: 'Feriado · 29:99', meet_url: 'javascript:alert(1)' }, weekPlan: [], logs: [], activities: [] };
    const view = buildPatientAgendaView(unsafe, now);
    const html = renderToStaticMarkup(<ShowroomPatientAgenda patient={unsafe} now={now} onMessage={vi.fn()} storage={null} />);
    expect(view.date).toBeNull();
    expect(view.events.filter((event) => event.kind === 'consult')).toHaveLength(0);
    expect(html).toContain('Fecha pendiente de corregir');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('Abrir videollamada');
  });

  it('ofrece contactar a la nutricionista cuando no hay consulta y conserva el calendario', () => {
    const html = renderToStaticMarkup(<ShowroomPatientAgenda patient={{ ...patient, appointment: null }} now={now} onMessage={vi.fn()} storage={null} />);
    expect(html).toContain('Sin consulta programada');
    expect(html).toContain('Escribirle a Verónica');
    expect(html).toContain('Tu calendario');
    expect(html).toContain('data-patient-agenda-day="2026-09-16"');
  });
});
