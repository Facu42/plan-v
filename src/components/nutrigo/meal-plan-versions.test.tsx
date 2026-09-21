import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PatientMealPlan } from '../../types/plans';
import { MealPlanEditor, PublishedDatedPlan, PublishedDatedPlanView } from './MealPlanVersions';

const published: PatientMealPlan = {
  id: 'plan-1',
  timezone: 'America/Argentina/Buenos_Aires',
  version: 1,
  period_start: '2026-09-21',
  period_end: '2026-09-27',
  published_at: '2026-09-21T12:00:00.000Z',
  items: [{
    id: 'item-1',
    for_date: '2026-09-21',
    slot: 'Almuerzo',
    recipe_id: 'r1',
    recipe_version: 1,
    recipe_title: 'Bowl de lentejas',
    free_text: null,
    portions: 1,
    public_note: 'Sin fritura',
  }],
};

describe('Plan fechado profesional y publicado', () => {
  it('el editor profesional explica borrador vs publicada sin inventar macros', () => {
    const html = renderToStaticMarkup(<MealPlanEditor patientId="pat-sofia" />);
    expect(html).toContain('Versiones del plan');
    expect(html).toContain('versión esperada');
    expect(html).toContain('Guardar borrador');
    expect(html).toContain('PLAN FECHADO');
    expect(html).toContain('Almuerzo');
    expect(html).not.toMatch(/\bkcal\b|proteína|carbohidrato/i);
  });

  it('el vacío publicado no simula un plan fechado', () => {
    const html = renderToStaticMarkup(<PublishedDatedPlan patientId="pat-sofia" />);
    expect(html).toContain('Todavía no hay un plan fechado publicado');
    expect(html).not.toMatch(/porción|kcal|proteína|carbohidrato|grasa/i);
  });

  it('muestra fecha, momento, receta o texto y rinde de la copia publicada', () => {
    const html = renderToStaticMarkup(<PublishedDatedPlanView plan={published} />);
    expect(html).toContain('Bowl de lentejas');
    expect(html).toContain('2026-09-21');
    expect(html).toContain('Almuerzo');
    expect(html).toContain('revisión 1');
    expect(html).toContain('Rinde 1');
    expect(html).toContain('Sin fritura');
    expect(html).not.toMatch(/\bkcal\b|proteína|carbohidrato/i);
  });
});
