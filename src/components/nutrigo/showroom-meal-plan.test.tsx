import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { buildPlanDays, PLAN_DAYS, ShowroomMealPlan } from './ShowroomMealPlan';

const patient: Patient = {
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'plan', goal: 'Organizar comidas',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 72, adherence_why: '', time: 'hoy',
  hydration: 4, energy: 'Media', sleep_minutes: 420, appointment: null, habit_logs: [], todayPlan: [],
  weekPlan: [
    { day: 'Miércoles', meals: [{ slot: 'Cena', title: 'Sopa de calabaza' }, { slot: 'Almuerzo', title: 'Ensalada completa' }] },
    { day: 'Lunes', meals: [{ slot: 'Desayuno', title: 'Yogur con fruta' }] },
  ],
  brief: null, timeline: [], meal_logs: [], messages: [],
};

const render = (query = '') => renderToStaticMarkup(
  <ShowroomMealPlan patient={patient} patients={[patient]} query={query} onSelect={vi.fn()} />,
);

describe('Plan semanal profesional en Nutrigo', () => {
  it('construye los siete días en orden y conserva únicamente datos existentes', () => {
    const days = buildPlanDays(patient.weekPlan);
    expect(days.map((day) => day.day)).toEqual([...PLAN_DAYS]);
    expect(days[0].meals.map((meal) => meal.slot)).toEqual(['Desayuno']);
    expect(days[2].meals.map((meal) => meal.slot)).toEqual(['Almuerzo', 'Cena']);
    expect(days[1].meals).toEqual([]);
  });

  it('renderiza una tabla editable con siete días y selección multipaciente', () => {
    const html = render();
    expect(html).toContain('Plan semanal de Ana Ruiz');
    expect(html).toContain('Paciente del plan');
    expect((html.match(/data-plan-day=/g) ?? [])).toHaveLength(7);
    expect(html).toContain('Yogur con fruta');
    expect(html).toContain('Sopa de calabaza');
    expect(html).toContain('Guardar');
    expect(html).toContain('Publicar para la paciente');
    expect(html).toContain('Generar propuesta');
    expect(html).toContain('Agregar comida');
  });

  it('muestra días vacíos y no inventa cantidades, calorías ni macros', () => {
    const html = render();
    expect(html).toContain('Sin comidas asignadas');
    expect(html).not.toMatch(/\b(kcal|gramos|proteína|carbohidratos)\b/i);
  });

  it('filtra comidas por slot o título sin eliminar las siete filas del plan', () => {
    const html = render('sopa');
    expect(html).toContain('Sopa de calabaza');
    expect(html).not.toContain('Yogur con fruta');
    expect((html.match(/data-plan-day=/g) ?? [])).toHaveLength(7);
    expect(html).toContain('Sin coincidencias');
  });
});
