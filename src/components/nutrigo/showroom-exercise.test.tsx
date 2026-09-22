import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildActivitySummary, ShowroomExercise } from './ShowroomExercise';

const patient = {
  id: 'p1', name: 'Ana', initials: 'AR',
  activities: [
    { id: 'a1', patient_id: 'p1', activity: 'Caminata', duration_minutes: 35, intensity: 'moderada', note: 'Me sentí bien', logged_at: '2026-09-14T15:00:00Z' },
    { id: 'a2', patient_id: 'p1', activity: 'Movilidad', duration_minutes: 15, intensity: 'suave', note: null, logged_at: '2026-09-12T15:00:00Z' },
  ],
} as unknown as ShowroomPatient;

describe('Ejercicio paciente Nutrigo', () => {
  it('resume sólo actividad autodeclarada dentro de siete días', () => {
    const summary = buildActivitySummary(patient.activities, new Date('2026-09-14T18:00:00Z'));
    expect(summary.sessions).toBe(2);
    expect(summary.minutes).toBe(50);
    expect(summary.byIntensity).toEqual({ suave: 1, moderada: 1, intensa: 0 });
  });

  it('muestra registros y sus datos reales sin prescribir rutinas', () => {
    const html = renderToStaticMarkup(<ShowroomExercise patient={patient} now={new Date('2026-09-14T18:00:00Z')} />);
    expect(html).toContain('Tu actividad física');
    expect(html).toContain('Caminata');
    expect(html).toContain('35 min');
    expect(html).toContain('Me sentí bien');
    expect(html).toContain('Registros anteriores');
    expect(html).toContain('Cargando registros');
    expect(html).toContain('Todavía no hay una rutina asignada');
    expect(html).not.toMatch(/rutina recomendada|calorías quemadas|prescripción profesional/i);
  });

  it('presenta un vacío honesto y conserva el alta manual', () => {
    const html = renderToStaticMarkup(<ShowroomExercise patient={{ ...patient, activities: [] }} now={new Date('2026-09-14T18:00:00Z')} />);
    expect(html).toContain('Cargando registros');
    expect(html).not.toContain('Registros anteriores');
    expect(html).not.toContain('50 min');
  });

  it('muestra la rutina asignada y bloquea la asignación sin habilitación', () => {
    const assigned = renderToStaticMarkup(<ShowroomExercise patient={patient} exercise={{
      patient_id: 'p1',
      can_assign: false,
      habilitation_verified: true,
      library: [{ id: '11111111-1111-4111-a111-000000000001', slug: 'movilidad-cadera', name: 'Movilidad de cadera', description: 'Círculos lentos', category: 'movilidad', default_sets: 2, default_reps: 8, default_rest_seconds: 30 }],
      assignments: [{
        id: 'as1', patient_id: 'p1', title: 'Movilidad suave', status: 'active', assigned_at: '2026-09-14T12:00:00.000Z',
        items: [{ id: 'it1', exercise_id: '11111111-1111-4111-a111-000000000001', name: 'Movilidad de cadera', category: 'movilidad', sets: 2, reps: 8, rest_seconds: 30, note: null, sort: 0 }],
        feedback: null,
      }],
      activities: [],
    }} />);
    expect(assigned).toContain('Movilidad suave');
    expect(assigned).toContain('2 × 8');
    expect(assigned).toContain('Ejercicios de tu rutina');
    expect(assigned).not.toMatch(/rutina recomendada|calorías quemadas/i);

    const blocked = renderToStaticMarkup(<ShowroomExercise patient={patient} professional exercise={{
      patient_id: 'p1',
      can_assign: false,
      habilitation_verified: false,
      library: [{ id: '11111111-1111-4111-a111-000000000002', slug: 'sentadilla-aire', name: 'Sentadilla al aire', description: 'Bajada controlada', category: 'fuerza', default_sets: 3, default_reps: 10, default_rest_seconds: 60 }],
      assignments: [],
      activities: [],
    }} />);
    expect(blocked).toContain('Ejercicio de Ana');
    expect(blocked).toContain('Sin habilitación verificada');
    expect(blocked).toContain('falta la verificación de habilitación');
    expect(blocked).not.toContain('Asignar rutina');
    expect(blocked).toContain('No hay un casillero para auto-otorgársela');
  });
});
