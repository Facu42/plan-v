import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MealPlanDraftInput, PatientMealPlan, ProfessionalMealPlan } from '../../types/plans';
import { matchesMenuProposal, MealPlanEditor, MenuProposalReview, PublishedDatedPlan, PublishedDatedPlanView } from './MealPlanVersions';

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
  it('muestra aprobación y rechazo explícitos antes de publicar una propuesta IA', () => {
    const proposal: MealPlanDraftInput = {
      id: '00000000-0000-4000-a000-000000000001',
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Bowl de lentejas', public_note: '' }],
    };
    const html = renderToStaticMarkup(<MenuProposalReview proposal={proposal} warnings={[]} busy={false} onApprove={() => undefined} onReject={() => undefined} />);
    expect(html).toContain('BORRADOR PRIVADO');
    expect(html).toContain('Bowl de lentejas');
    expect(html).toContain('Aprobar y publicar menú');
    expect(html).toContain('Rechazar propuesta');
    const current = {
      id: proposal.id,
      current: {
        period_start: proposal.period_start,
        period_end: proposal.period_end,
        published_at: null,
        items: [{ for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: null, free_text: 'Bowl de lentejas', portions: null, public_note: '' }],
      },
    } as ProfessionalMealPlan;
    expect(matchesMenuProposal(current, proposal)).toBe(true);
    expect(matchesMenuProposal({ ...current, current: { ...current.current, items: [{ ...current.current.items[0], free_text: 'Otro plato' }] } }, proposal)).toBe(false);
  });

  it('el editor profesional explica borrador vs publicada sin inventar macros', () => {
    const html = renderToStaticMarkup(<MealPlanEditor patientId="pat-sofia" />);
    expect(html).toContain('Versiones del plan');
    expect(html).toContain('versión esperada');
    expect(html).toContain('alergias');
    expect(html).toContain('Guardar borrador');
    expect(html).toContain('Generar propuesta de menú');
    expect(html).toContain('no publica sola');
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
