import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { professionalMealNotes, ShowroomPatientRecord } from './ShowroomPatientRecord';

const patient: Patient = {
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo',
  billing_status: 'active', billing_until: '2026-10-01', stage: 'seguimiento',
  goal: 'Organizar comidas', goal_status: 'active', goal_progress: 45, goal_updated_at: '2026-09-10T12:00:00.000Z',
  goal_history: [
    { id: 'g1', goal: 'Organizar comidas', status: 'active', progress: 45, note: 'Nota privada del objetivo', updated_at: '2026-09-10T12:00:00.000Z' },
  ],
  sensitive_hours: 'No escribir después de las 21', plan_b: 'Tener una opción fría', next_focus: 'Preparar meriendas',
  adherence_score: 68, adherence_why: 'Lectura privada de adherencia.', time: 'hoy', hydration: 4, energy: 'Media', sleep_minutes: 420,
  appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video' }, habit_logs: [], todayPlan: [], weekPlan: [], brief: null,
  timeline: [
    { id: 't1', kind: 'profile', atLabel: 'HOY', title: 'Ficha actualizada', body: 'Cambió el próximo foco' },
  ],
  messages: [],
  meal_logs: [
    { id: 'm1', patient_id: 'ana', slot: 'Cena', photo_url: null, description: 'Cena tardía', foods: [], macros: null, confidence: 0.6, note_for_nutri: 'Nota IA privada de Ana', status: 'pending_review', logged_at: '2026-09-11T22:00:00.000Z' },
    { id: 'm2', patient_id: 'otra', slot: 'Almuerzo', photo_url: null, description: 'Ajena', foods: [], macros: null, confidence: 0.8, note_for_nutri: 'SECRETO DE OTRA PERSONA', status: 'confirmed', logged_at: '2026-09-11T13:00:00.000Z' },
  ],
};

const render = (value = patient) => renderToStaticMarkup(<ShowroomPatientRecord patient={value} onEdit={vi.fn()} onOpen={vi.fn()} />);

describe('Ficha profesional en el showroom', () => {
  it('presenta identidad, estado, etapa, objetivo y próxima consulta', () => {
    const html = render();
    expect(html).toContain('Ficha de Ana Ruiz');
    expect(html).toContain('En ritmo');
    expect(html).toContain('Seguimiento');
    expect(html).toContain('Organizar comidas');
    expect(html).toContain('45%');
    expect(html).toContain('Jueves · 14:30');
    expect(html).toContain('nr-layout');
    expect(html).toContain('Contexto de la ficha');
  });

  it('rotula y muestra únicamente notas profesionales del paciente seleccionado', () => {
    const html = render();
    expect(html).toContain('Información profesional privada');
    expect(html).toContain('Solo visible para profesionales');
    expect(html).toContain('No escribir después de las 21');
    expect(html).toContain('Tener una opción fría');
    expect(html).toContain('Preparar meriendas');
    expect(html).toContain('Lectura privada de adherencia');
    expect(html).toContain('Nota privada del objetivo');
    expect(html).toContain('Nota IA privada de Ana');
    expect(html).not.toContain('SECRETO DE OTRA PERSONA');
  });

  it('aísla las observaciones de comidas por patient_id y ordena nuevas primero', () => {
    const notes = professionalMealNotes({ ...patient, meal_logs: [
      { ...patient.meal_logs[0], id: 'old', logged_at: '2026-09-09T22:00:00.000Z' },
      patient.meal_logs[1],
      { ...patient.meal_logs[0], id: 'new', note_for_nutri: 'Más reciente', logged_at: '2026-09-12T22:00:00.000Z' },
    ] });
    expect(notes.map((note) => note.id)).toEqual(['new', 'old']);
  });

  it('presenta historial clínico sin fabricar eventos cuando está vacío', () => {
    expect(render()).toContain('Ficha actualizada');
    const html = render({ ...patient, timeline: [], goal_history: [], meal_logs: [] });
    expect(html).toContain('Sin eventos registrados');
    expect(html).toContain('Sin notas de objetivos');
    expect(html).toContain('Sin observaciones de comidas');
    expect(html).not.toMatch(/NaN|undefined|null/);
  });

  it('ofrece edición y accesos operativos sin prometer una nota nueva inexistente', () => {
    const html = render();
    expect(html).toContain('Editar datos de ficha');
    expect(html).toContain('Revisar comidas');
    expect(html).toContain('Editar plan');
    expect(html).toContain('Gestionar consultas');
    expect(html).not.toContain('Agregar nota');
  });
});
