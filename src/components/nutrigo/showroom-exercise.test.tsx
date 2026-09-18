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
    expect(html).not.toMatch(/rutina recomendada|calorías quemadas|prescripción profesional/i);
  });

  it('presenta un vacío honesto y conserva el alta manual', () => {
    const html = renderToStaticMarkup(<ShowroomExercise patient={{ ...patient, activities: [] }} now={new Date('2026-09-14T18:00:00Z')} />);
    expect(html).toContain('Cargando registros');
    expect(html).not.toContain('Registros anteriores');
    expect(html).not.toContain('50 min');
  });
});
