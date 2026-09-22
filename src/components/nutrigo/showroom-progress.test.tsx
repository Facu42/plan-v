import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildProgressView, ShowroomProgress } from './ShowroomProgress';

const patient = {
  id: 'ana', name: 'Ana', initials: 'AR', goal: 'Sostener cuatro cenas organizadas', goalProgress: 60,
  hydration: 6, energy: 'Media', sleep: '7 h', adherence: 74,
  macros: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, kcal: 0, nutritionLogCount: 0,
  appointment: null, todayPlan: [], weekPlan: [], messages: [],
  logs: [
    { id: 'm2', slot: 'Cena', description: 'Sopa', status: 'pending_review', macros: null, logged_at: '2026-09-14T23:00:00-03:00' },
    { id: 'm1', slot: 'Almuerzo', description: 'Ensalada', status: 'confirmed', macros: null, logged_at: '2026-09-13T13:00:00-03:00' },
  ],
  journey: {
    reviewedMeals: 2, pendingMeals: 1, hydrationAverage: 3.1, sleepRecordedDays: 2, sleepAverageMinutes: 420,
    days: [
      { date: '2026-09-08', label: 'mar', isToday: false, hydration: 0, energy: null, sleepMinutes: null, reviewedMeals: 0, pendingMeals: 0, mealLogIds: [] },
      { date: '2026-09-09', label: 'mié', isToday: false, hydration: 5, energy: 'Alta', sleepMinutes: 390, reviewedMeals: 1, pendingMeals: 0, mealLogIds: ['m0'] },
      { date: '2026-09-10', label: 'jue', isToday: false, hydration: 0, energy: null, sleepMinutes: null, reviewedMeals: 0, pendingMeals: 0, mealLogIds: [] },
      { date: '2026-09-11', label: 'vie', isToday: false, hydration: 0, energy: null, sleepMinutes: null, reviewedMeals: 0, pendingMeals: 0, mealLogIds: [] },
      { date: '2026-09-12', label: 'sáb', isToday: false, hydration: 0, energy: null, sleepMinutes: null, reviewedMeals: 0, pendingMeals: 0, mealLogIds: [] },
      { date: '2026-09-13', label: 'dom', isToday: false, hydration: 5, energy: 'Media', sleepMinutes: 450, reviewedMeals: 1, pendingMeals: 0, mealLogIds: ['m1'] },
      { date: '2026-09-14', label: 'lun', isToday: true, hydration: 6, energy: 'Media', sleepMinutes: null, reviewedMeals: 0, pendingMeals: 1, mealLogIds: ['m2'] },
    ],
  },
} as unknown as ShowroomPatient;

describe('Progreso paciente dentro de Nutrigo', () => {
  it('deriva sólo datos registrados de los últimos siete días', () => {
    expect(buildProgressView(patient)).toMatchObject({ activeDays: 3, energyRecordedDays: 3, maxHydration: 6, reviewedMeals: 2, pendingMeals: 1 });
  });

  it('presenta adherencia, objetivo, agua, descanso y actividad semanal', () => {
    const html = renderToStaticMarkup(<ShowroomProgress patient={patient} />);
    expect(html).toContain('Tu progreso, en contexto');
    expect(html).toContain('74%');
    expect(html).toContain('Sostener cuatro cenas organizadas');
    expect(html).toContain('3,1 vasos/día');
    expect(html).toContain('Promedio 7 h');
    expect(html).toContain('Comidas revisadas');
    expect(html).toContain('Cena');
    expect(html).toContain('7 días');
    expect(html).toContain('30 días');
    expect(html).toContain('90 días');
  });

  it('no presenta medidas, inferencias clínicas ni campos profesionales', () => {
    const html = renderToStaticMarkup(<ShowroomProgress patient={patient} />);
    expect(html).not.toContain('IMC');
    expect(html).toContain('Peso, cintura y cadera opcionales');
    expect(html).toContain('Fotos y estudios no se usan para estimar medidas');
    expect(html).toContain('Cargando registros');
    expect(html).not.toContain('adherence_why');
    expect(html).not.toContain('goal_history');
    expect(html).toContain('No se completan períodos sin registros');
    expect(html).not.toMatch(/mejoró|empeoró|leaderboard/i);
    expect(html).toContain('Cada paciente se compara consigo misma');
  });

  it('muestra el cambio declarado del mismo paciente, con fuente y sin relleno', () => {
    const html = renderToStaticMarkup(<ShowroomProgress patient={patient} professional progress={{
      patient_id: 'ana',
      timezone: 'America/Argentina/Buenos_Aires',
      period_days: 7,
      current: { start: '2026-09-15', end: '2026-09-21' },
      previous: { start: '2026-09-08', end: '2026-09-14' },
      measurements_included: true,
      series: [{
        kind: 'weight', unit: 'kg',
        current: [{ id: 'now', value: 64.5, source: 'patient', captured_on: '2026-09-20', created_at: '2026-09-20T12:00:00.000Z' }],
        previous: [{ id: 'prev', value: 65, source: 'professional', captured_on: '2026-09-10', created_at: '2026-09-10T12:00:00.000Z' }],
        current_last: { id: 'now', value: 64.5, source: 'patient', captured_on: '2026-09-20', created_at: '2026-09-20T12:00:00.000Z' },
        previous_last: { id: 'prev', value: 65, source: 'professional', captured_on: '2026-09-10', created_at: '2026-09-10T12:00:00.000Z' },
        declared_delta: -0.5,
      }],
      meals: { current: { logged: 2, reviewed: 1, pending: 1 }, previous: { logged: 1, reviewed: 1, pending: 0 } },
    }} />);
    expect(html).toContain('Progreso de Ana, en contexto');
    expect(html).toContain('Cambio declarado: -0,5 kg');
    expect(html).toContain('Paciente');
    expect(html).toContain('Se compara consigo misma');
    expect(html).not.toContain('IMC');
    expect(html).not.toMatch(/mejoró|empeoró|leaderboard/i);
  });
});
