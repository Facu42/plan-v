import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildPatientPlanView, ShowroomPatientPlan } from './ShowroomPatientPlan';

const patient = {
  id: 'p1', name: 'Ana', initials: 'AR',
  todayPlan: [{ slot: 'Almuerzo', title: 'Pollo con vegetales', time: '13:00' }],
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Cena', title: 'Omelette de verduras' }] },
    { day: 'Miércoles', meals: [{ slot: 'Merienda', title: 'Yogur con fruta' }] },
  ],
} as ShowroomPatient;
const monday = new Date(2026, 8, 14, 12);

describe('Plan semanal paciente Nutrigo', () => {
  it('ordena los siete días y usa horas reales sólo para el día actual', () => {
    const view = buildPatientPlanView(patient, monday);
    expect(view.days).toHaveLength(7);
    expect(view.days.map((day) => day.day)).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    expect(view.days[0].meals[0]).toMatchObject({ slot: 'Almuerzo', title: 'Pollo con vegetales', time: '13:00' });
    expect(view.days[2].meals[0]).toMatchObject({ slot: 'Merienda', title: 'Yogur con fruta', time: '' });
    expect(view.totalMeals).toBe(3);
    expect(view.plannedDays).toBe(2);
  });

  it('muestra el plan publicado como lectura y permite elegir los siete días', () => {
    const html = renderToStaticMarkup(<ShowroomPatientPlan patient={patient} now={monday} query="" />);
    expect(html).toContain('Tu plan semanal');
    expect(html).toContain('Plan publicado por tu nutricionista');
    expect(html).toContain('Pollo con vegetales');
    expect(html).toContain('13:00');
    expect(html.match(/class="nvpp-day"/g)).toHaveLength(7);
    expect(html).toContain('aria-current="date"');
    expect(html).not.toMatch(/Guardar|Quitar|Agregar comida/);
  });

  it('busca en toda la semana sin inventar recetas, porciones ni macros', () => {
    const html = renderToStaticMarkup(<ShowroomPatientPlan patient={patient} now={monday} query="yogur" />);
    expect(html).toContain('1 resultado en tu semana');
    expect(html).toContain('Yogur con fruta');
    expect(html).not.toContain('Pollo con vegetales');
    expect(html).not.toMatch(/Cómo prepararla|Tip de sabor|porción|kcal|proteína|carbohidrato|grasa/i);
  });

  it('presenta un vacío honesto cuando no existe un plan publicado', () => {
    const html = renderToStaticMarkup(<ShowroomPatientPlan patient={{ ...patient, todayPlan: [], weekPlan: [] }} now={monday} query="" />);
    expect(html).toContain('Tu plan está en preparación');
    expect(html).not.toContain('Comidas asignadas');
  });
});
