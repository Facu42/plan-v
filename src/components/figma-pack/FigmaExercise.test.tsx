import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaExerciseProvider } from './FigmaExercise';
import Exercise from './screens/Exercise';
import ExerciseTablet from './screens/ExerciseTablet';
import ExerciseMobile from './screens/ExerciseMobile';

const now = new Date('2026-09-23T12:00:00Z');
const patient = {
  id: 'p-exercise', name: 'Ana Pérez', initials: 'AP',
  activities: [{ id: 'activity-1', patient_id: 'p-exercise', activity: 'Caminata suave', duration_minutes: 35, intensity: 'suave', note: 'En el parque', logged_at: '2026-09-22T15:00:00Z' }],
} as unknown as ShowroomPatient;
const render = (Screen: typeof Exercise, value = patient) => renderToStaticMarkup(<FigmaPatientIdentity patient={value}><FigmaExerciseProvider patient={value} now={now} onLogActivity={() => {}}><Screen /></FigmaExerciseProvider></FigmaPatientIdentity>);

describe('Figma patient exercises', () => {
  it.each([['escritorio', Exercise], ['tablet', ExerciseTablet], ['móvil', ExerciseMobile]])('uses recorded activity in %s', (_, Screen) => {
    const html = render(Screen);
    expect(html).toContain('Caminata suave');
    expect(html).toContain('35 min');
    expect(html).toContain('En el parque');
    expect(html).toContain('Registrar actividad');
    expect(html).not.toContain('Sentadillas');
    expect(html).not.toContain('de 28');
  });

  it('has an honest empty state', () => {
    const html = render(ExerciseMobile, { ...patient, activities: [] } as ShowroomPatient);
    expect(html).toContain('Todavía no hay actividades registradas');
    expect(html).not.toContain('Caminata suave');
  });
});
