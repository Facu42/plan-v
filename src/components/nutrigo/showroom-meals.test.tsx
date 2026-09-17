import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { buildMealDiary, ShowroomMeals } from './ShowroomMeals';

const patient: Patient = {
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: '2026-10-01', stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 68, adherence_why: '', time: 'hoy',
  hydration: 5, energy: 'Media', sleep_minutes: 420,
  appointment: null,
  habit_logs: [
    { id: 'h1', patient_id: 'ana', date: '2026-09-12', hydration: 5, energy: 'Media', sleep_minutes: 420 },
    { id: 'h2', patient_id: 'otra', date: '2026-09-13', hydration: 8, energy: 'Alta', sleep_minutes: 480 },
  ],
  activity_logs: [
    { id: 'a1', patient_id: 'ana', activity: 'Caminata', duration_minutes: 35, intensity: 'moderada', note: 'Me sentí bien', logged_at: '2026-09-13T18:00:00.000Z' },
    { id: 'a2', patient_id: 'otra', activity: 'ACTIVIDAD AJENA', duration_minutes: 60, intensity: 'intensa', note: 'NOTA AJENA', logged_at: '2026-09-13T19:00:00.000Z' },
  ],
  todayPlan: [], weekPlan: [], brief: null, timeline: [], messages: [],
  meal_logs: [
    { id: 'm1', patient_id: 'ana', slot: 'Cena', photo_url: null, description: 'Sopa de calabaza', foods: [], macros: null, confidence: 0.62, note_for_nutri: 'Privada Ana', status: 'pending_review', logged_at: '2026-09-12T22:00:00.000Z' },
    { id: 'm2', patient_id: 'ana', slot: 'Almuerzo', photo_url: null, description: 'Ensalada', foods: [], macros: { kcal: 430, protein_g: 22, carbs_g: 45, fat_g: 18 }, confidence: 0.91, note_for_nutri: '', status: 'confirmed', logged_at: '2026-09-12T13:00:00.000Z' },
    { id: 'm3', patient_id: 'otra', slot: 'Desayuno', photo_url: null, description: 'REGISTRO AJENO', foods: [], macros: null, confidence: 0.8, note_for_nutri: 'SECRETO AJENO', status: 'adjusted', logged_at: '2026-09-13T08:00:00.000Z' },
  ],
};

const render = (query = '') => renderToStaticMarkup(
  <ShowroomMeals patient={patient} patients={[patient]} query={query} onSelect={vi.fn()} onReview={vi.fn()} />,
);

describe('Comidas y hábitos en Nutrigo', () => {
  it('deriva métricas y registros solo del paciente seleccionado', () => {
    const diary = buildMealDiary(patient);
    expect(diary.logs.map((log) => log.id)).toEqual(['m1', 'm2']);
    expect(diary.habits.map((habit) => habit.id)).toEqual(['h1']);
    expect(diary.activities.map((entry) => entry.id)).toEqual(['a1']);
    expect(diary.pending).toBe(1);
    expect(diary.reviewed).toBe(1);
  });

  it('presenta cuatro métricas y una tabla operativa compacta', () => {
    const html = render();
    expect(html).toContain('Registros totales');
    expect(html).toContain('Pendientes');
    expect(html).toContain('Revisadas');
    expect(html).toContain('Días con hábitos');
    expect(html).toContain('Historial de comidas');
    expect(html).toContain('Sopa de calabaza');
    expect(html).toContain('Ensalada');
    expect(html).toContain('Revisar');
    expect(html).not.toContain('REGISTRO AJENO');
    expect(html).not.toContain('SECRETO AJENO');
  });

  it('filtra por comida, detalle y estado sin inventar resultados', () => {
    const filtered = render('ensalada');
    expect(filtered).toContain('Ensalada');
    expect(filtered).not.toContain('Sopa de calabaza');
    expect(render('sin coincidencias')).toContain('Sin registros para mostrar');
  });

  it('mantiene los hábitos como información declarada por la paciente', () => {
    const html = render();
    expect(html).toContain('Hábitos declarados por la paciente');
    expect(html).toContain('5/8 vasos');
    expect(html).toContain('7 h');
    expect(html).toContain('Media');
    expect(html).toContain('Actividad autodeclarada');
    expect(html).toContain('Caminata');
    expect(html).toContain('35 min');
    expect(html).not.toContain('ACTIVIDAD AJENA');
    expect(html).not.toContain('NOTA AJENA');
    expect(html).not.toContain('Editar hábitos');
  });
});
