import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildPatientDiaryView, mealLogPlanRelation, patientVisibleReview, ShowroomPatientDiary } from './ShowroomPatientDiary';

const patient = {
  id: 'ana', name: 'Ana', initials: 'AR', goal: 'Organizar comidas', goalProgress: 40,
  hydration: 4, energy: 'Media', sleep: '7 h', adherence: 70,
  macros: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, kcal: 0, nutritionLogCount: 0,
  appointment: null, todayPlan: [], weekPlan: [], messages: [],
  journey: { reviewedMeals: 2, pendingMeals: 1, hydrationAverage: 0, sleepRecordedDays: 0, sleepAverageMinutes: null, days: [
    { date: '2026-09-14', label: 'lun', isToday: true, hydration: 0, energy: null, sleepMinutes: null, reviewedMeals: 2, pendingMeals: 1, mealLogIds: ['m1', 'm2', 'm3'] },
  ] },
  logs: [
    { id: 'm1', slot: 'Desayuno', description: 'Yogur y fruta', status: 'confirmed', macros: { kcal: 250, protein_g: 12, carbs_g: 30, fat_g: 8 }, foods: [{ name: 'Yogur natural' }, { name: 'Fruta roja' }], logged_at: '2026-09-14T09:00:00-03:00' },
    { id: 'm2', slot: 'Almuerzo', description: 'SECRETO VISUAL', status: 'pending_review', macros: { kcal: 700, protein_g: 20, carbs_g: 50, fat_g: 10 }, foods: [{ name: 'ESTIMACIÓN OCULTA' }], logged_at: '2026-09-14T13:00:00-03:00' },
    { id: 'm3', slot: 'Cena', description: null, status: 'adjusted', macros: null, foods: [{ name: 'Vegetales al vapor' }], logged_at: '2026-09-20T21:00:00-03:00' },
  ],
} as unknown as ShowroomPatient;

const now = new Date(2026, 8, 16, 12, 0, 0);

const planned = {
  ...patient,
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Desayuno', title: 'Yogur y fruta' }, { slot: 'Almuerzo', title: 'Pollo con arroz' }] },
    { day: 'Domingo', meals: [{ slot: 'Cena', title: 'Sopa liviana' }] },
  ],
} as unknown as ShowroomPatient;

describe('Diario del paciente dentro de Nutrigo', () => {
  it('resume y filtra estados dentro de la semana abierta', () => {
    const view = buildPatientDiaryView(patient, 'yogur', 'reviewed', now);
    expect(view.summary).toEqual({ total: 3, reviewed: 2, pending: 1, daysWithLogs: 2 });
    expect(view.logs.map((log) => log.id)).toEqual(['m1']);
  });

  it('aísla el historial a la semana elegida y no inventa registros vacíos', () => {
    const withPast = {
      ...patient,
      logs: [...patient.logs, { ...patient.logs[0], id: 'old', description: 'Semana previa', logged_at: '2026-09-08T12:00:00-03:00' }],
    } as unknown as ShowroomPatient;
    const current = buildPatientDiaryView(withPast, '', 'all', now, 0);
    expect(current.logs.map((log) => log.id)).toEqual(['m3', 'm2', 'm1']);
    expect(current.summary.total).toBe(3);
    const previous = buildPatientDiaryView(withPast, '', 'all', now, -1);
    expect(previous.logs.map((log) => log.id)).toEqual(['old']);
    expect(previous.emptyKind).toBeNull();
    const empty = buildPatientDiaryView(withPast, '', 'all', now, -2);
    expect(empty.logs).toEqual([]);
    expect(empty.emptyKind).toBe('week');
    expect(empty.bounds).toEqual({ minOffset: -1, maxOffset: 0 });
  });

  it('muestra registros y macros confirmados, pero no estimaciones pendientes', () => {
    const html = renderToStaticMarkup(<ShowroomPatientDiary patient={patient} query="" now={now} onLogMeal={() => {}} />);
    expect(html).toContain('Tu diario de comidas');
    expect(html).toContain('Yogur y fruta');
    expect(html).toContain('250 kcal');
    expect(html).toContain('SECRETO VISUAL');
    expect(html).not.toContain('700 kcal');
    expect(html).toContain('Pendiente de revisión');
    expect(html).toContain('Registrar comida');
  });

  it('conecta el CTA de registro y mantiene estados vacíos explícitos', () => {
    const onLogMeal = vi.fn();
    const html = renderToStaticMarkup(<ShowroomPatientDiary patient={patient} query="qa-no-match" now={now} onLogMeal={onLogMeal} />);
    expect(html).toContain('Sin registros para mostrar');
    expect(html).toContain('Usá otra búsqueda o cambiá el filtro.');
    expect(onLogMeal).not.toHaveBeenCalled();
  });

  it('no renderiza notas profesionales aunque se inyecten como propiedades extra', () => {
    const unsafe = { ...patient, note_for_nutri: 'NOTA PROFESIONAL', adherence_why: 'LECTURA PRIVADA' } as ShowroomPatient;
    const html = renderToStaticMarkup(<ShowroomPatientDiary patient={unsafe} query="" now={now} onLogMeal={() => {}} />);
    expect(html).not.toContain('NOTA PROFESIONAL');
    expect(html).not.toContain('LECTURA PRIVADA');
  });

  it('vincula cada registro con el slot planificado del mismo día de semana, sin inventar fechas', () => {
    const outside = { ...planned.logs[2], slot: 'Merienda' } as typeof planned.logs[number];
    expect(mealLogPlanRelation(planned.logs[0], planned.weekPlan)).toBe('planned');
    expect(mealLogPlanRelation(planned.logs[1], planned.weekPlan)).toBe('planned');
    expect(mealLogPlanRelation(planned.logs[2], planned.weekPlan)).toBe('planned');
    expect(mealLogPlanRelation(outside, planned.weekPlan)).toBe('outside');
    expect(mealLogPlanRelation(planned.logs[0], [])).toBe('unknown');
  });

  it('muestra la relación con el plan publicado como información, nunca como diagnóstico', () => {
    const withOutside = { ...planned, logs: [...planned.logs.slice(0, 2), { ...planned.logs[2], slot: 'Merienda' }] } as unknown as ShowroomPatient;
    const html = renderToStaticMarkup(<ShowroomPatientDiary patient={withOutside} query="" now={now} onLogMeal={() => {}} />);
    expect(html.match(/nvpdiary-plan-tag planned/g)?.length).toBe(2);
    expect(html).toContain('Fuera del plan');
    const without = renderToStaticMarkup(<ShowroomPatientDiary patient={patient} query="" now={now} onLogMeal={() => {}} />);
    expect(without).not.toContain('Del plan');
    expect(without).not.toContain('Fuera del plan');
  });

  it('muestra el detalle de la revisión profesional sólo en registros revisados, sin notas internas', () => {
    const html = renderToStaticMarkup(<ShowroomPatientDiary patient={patient} query="" now={now} onLogMeal={() => {}} />);
    expect(html).toContain('Esta semana');
    expect(html).toContain('Semana anterior');
    expect(html.match(/Revisión profesional/g)?.length).toBe(2);
    expect(html).toContain('Tu nutricionista confirmó este registro');
    expect(html).toContain('Tu nutricionista ajustó este registro');
    expect(html).toContain('Yogur natural');
    expect(html).toContain('Vegetales al vapor');
    expect(html).toContain('Solo ves el resultado publicado');
    expect(html).not.toContain('ESTIMACIÓN OCULTA');
  });

  it('expone el resultado publicado y oculta pendientes', () => {
    expect(patientVisibleReview(patient.logs[0])?.headline).toContain('confirmó');
    expect(patientVisibleReview(patient.logs[1])).toBeNull();
    expect(patientVisibleReview(patient.logs[2])?.headline).toContain('ajustó');
    expect(JSON.stringify(patientVisibleReview(patient.logs[0]))).not.toContain('note_for_nutri');
  });
});
