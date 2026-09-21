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
    recipe: {
      title: 'Bowl de lentejas',
      version: 1,
      yield_portions: 2,
      steps: ['Lavar.', 'Cocinar.'],
      nutrient_source: 'Tabla del consultorio',
      ingredients: [{ id: 'i1', name: 'Lentejas', quantity: 80, unit: 'g' }],
    },
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

  it('paciente y CRM ven el mismo detalle de receta, porciones y días vacíos reales', () => {
    const patient = renderToStaticMarkup(<PublishedDatedPlanView plan={published} />);
    const crm = renderToStaticMarkup(<PublishedDatedPlanView plan={published} audience="pro" />);
    for (const html of [patient, crm]) {
      expect(html).toContain('Bowl de lentejas');
      expect(html).toContain('2026-09-21');
      expect(html).toContain('Almuerzo');
      expect(html).toContain('revisión 1');
      expect(html).toContain('Porciones 1');
      expect(html).toContain('Rinde 2');
      expect(html).toContain('80 g Lentejas');
      expect(html).toContain('Cocinar.');
      expect(html).toContain('Tabla del consultorio');
      expect(html).toContain('Sin fritura');
      expect(html.match(/data-plan-date=/g)).toHaveLength(7);
      expect(html.match(/Sin indicaciones este día/g)).toHaveLength(6);
      expect(html).not.toMatch(/\bkcal\b|proteína|carbohidrato/i);
    }
    expect(patient).toContain('Plan publicado');
    expect(crm).toContain('Lo que ve el paciente');
  });

  it('la búsqueda no rellena días vacíos con comidas de otro día', () => {
    const html = renderToStaticMarkup(<PublishedDatedPlanView plan={published} query="lentejas" />);
    expect(html).toContain('Bowl de lentejas');
    expect(html.match(/data-plan-date=/g)).toHaveLength(1);
    expect(html).not.toContain('Sin indicaciones este día');
    const miss = renderToStaticMarkup(<PublishedDatedPlanView plan={published} query="milanesa" />);
    expect(miss).not.toContain('Bowl de lentejas');
    expect(miss).not.toContain('Sin indicaciones este día');
  });
});
