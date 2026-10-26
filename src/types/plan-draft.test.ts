import { describe, expect, it } from 'vitest';
import { integrarPropuesta } from './plan-draft';
import type { MealPlanDraftInput, ProfessionalMealPlan } from './plans';

const propuesta: MealPlanDraftInput = { id: '11111111-1111-4111-8111-111111111111', expected_revision: null, timezone: 'America/Argentina/Buenos_Aires', period_start: '2026-10-26', period_end: '2026-10-27', items: [
  { for_date: '2026-10-26', slot: 'Almuerzo', free_text: 'Pollo', public_note: '' },
  { for_date: '2026-10-26', slot: 'Cena', free_text: 'Fuera de alcance', public_note: '' },
  { for_date: '2026-10-27', slot: 'Almuerzo', free_text: 'Otro día', public_note: '' },
] };
const pedido = { period_start: '2026-10-26', period_end: '2026-10-26', slots: ['Almuerzo'] };

describe('integración de la propuesta en el servidor', () => {
  it('descarta cualquier comida generada fuera del pedido, incluso sin plan previo', () => {
    expect(integrarPropuesta(propuesta, null, pedido).items).toEqual([propuesta.items[0]]);
  });
  it('slots omitidos respetan el default del generador y conservan Colación y Extra', () => {
    const actual = { id: propuesta.id, patient_id: 'p', timezone: propuesta.timezone, created_at: '', published: null, current: { id: 'v', version: 1, status: 'draft', period_start: '2026-10-26', period_end: '2026-10-27', published_at: null, items: ['Colación', 'Extra'].map(slot => ({ id: slot, for_date: '2026-10-26', slot, free_text: 'Conservar', public_note: '', recipe_id: null, recipe_version: null, recipe_title: null, recipe: null, portions: null })) } } as ProfessionalMealPlan;
    expect(integrarPropuesta(propuesta, actual, { ...pedido, slots: [] }).items.filter(i => i.free_text === 'Conservar')).toHaveLength(2);
  });
  it('no sustituye por vacío si el generador devolvió otro alcance', () => {
    expect(() => integrarPropuesta({ ...propuesta, items: [propuesta.items[1]] }, null, pedido)).toThrow('alcance');
  });
  it('rechaza un merge de más de 42 comidas sin recortar el borrador', () => {
    const items = Array.from({ length: 42 }, (_, i) => ({ id: String(i), for_date: `2026-10-${String(27 + Math.floor(i / 6)).padStart(2, '0')}`, slot: ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'][i % 6], free_text: 'Original', public_note: '', recipe_id: null, recipe_version: null, portions: null, recipe_title: null, recipe: null }));
    // Período válido de una semana posterior al pedido.
    items.forEach((item, i) => { item.for_date = new Date(Date.UTC(2026, 9, 27 + Math.floor(i / 6))).toISOString().slice(0, 10); });
    const actual = { id: propuesta.id, patient_id: 'p', timezone: propuesta.timezone, created_at: '', published: null, current: { id: 'v', version: 1, status: 'draft', period_start: '2026-10-26', period_end: '2026-11-02', published_at: null, items } } as ProfessionalMealPlan;
    expect(() => integrarPropuesta(propuesta, actual, pedido)).toThrow('42 comidas');
    expect(actual.current.items).toHaveLength(42);
  });
});
