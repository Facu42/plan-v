import { describe, expect, it } from 'vitest';
import type { PatientMealPlan, PlanItemView } from '../../types/plans';
import type { ShoppingListView } from '../../types/shopping';
import { comidasDelDia, kcalDeItem, kcalDelDia, kcalPorMomento, textoListaDeCompras } from './ficha-plan';

const item = (id: string, slot: PlanItemView['slot'], texto: string, kcalPorPorcion: number | null, porciones: number | null = 1): PlanItemView => ({
  id, for_date: '2026-10-27', slot, recipe_id: null, recipe_version: null, recipe_title: null, free_text: texto, portions: porciones, public_note: '',
  recipe: kcalPorPorcion === null ? null : { title: texto, version: 1, yield_portions: 1, steps: [], nutrient_source: 'x', ingredients: [], nutrition: { origin: 'declared', per_portion: { kcal: kcalPorPorcion, protein_g: 1, carbs_g: 1, fat_g: 1 } } as never },
});
const plan = { period_start: '2026-10-26', period_end: '2026-11-01', meal_times: { Desayuno: '08:00' }, items: [item('b', 'Almuerzo', 'Ensalada', 600, 2), item('a', 'Desayuno', 'Tostadas', 400), item('c', 'Cena', 'Tortilla', null), { ...item('d', 'Almuerzo', 'Postre', 100), for_date: '2026-10-28' }] } as unknown as PatientMealPlan;

describe('plan de la ficha', () => {
  it('ordena las comidas del día, usa el horario del plan y no inventa calorías', () => {
    const comidas = comidasDelDia(plan, '2026-10-27');
    expect(comidas.map(c => c.titulo)).toEqual(['Tostadas', 'Ensalada', 'Tortilla']);
    expect(comidas[0]).toMatchObject({ hora: '08:00', kcal: 400 });
    expect(comidas[1]!.kcal).toBe(1200);
    expect(comidas[2]).toMatchObject({ hora: null, kcal: null });
  });

  it('el total del día suma lo conocido y queda vacío si nada trae calorías', () => {
    expect(kcalDelDia(comidasDelDia(plan, '2026-10-27'))).toBe(1600);
    expect(kcalDelDia([{ ...comidasDelDia(plan, '2026-10-27')[2]! }])).toBeNull();
    expect(kcalDeItem(item('x', 'Cena', 'Sin datos', null))).toBeNull();
  });

  it('junta las calorías por momento de la comida', () => {
    const doble = [...comidasDelDia(plan, '2026-10-27'), ...comidasDelDia(plan, '2026-10-27').slice(1, 2)];
    expect(kcalPorMomento(doble)).toEqual([{ etiqueta: 'Desayuno', kcal: 400 }, { etiqueta: 'Almuerzo', kcal: 2400 }]);
  });

  it('la lista para la paciente deja afuera lo ya tildado y no sale si no hay nada', () => {
    const lista = { plan_version: 3, period_start: null, period_end: null, items: [
      { id: '1', kind: 'derived', source_key: 'a', name: 'Espinaca', quantity: 500, unit: 'g', occurrences: 1, checked: false },
      { id: '2', kind: 'derived', source_key: 'b', name: 'Limones', quantity: 2.5, unit: null, occurrences: 1, checked: false },
      { id: '3', kind: 'text', source_key: 'c', name: 'Pan', quantity: null, unit: null, occurrences: 1, checked: true },
    ] } as ShoppingListView;
    const texto = textoListaDeCompras('Sofía', lista)!;
    expect(texto).toContain('Hola Sofía');
    expect(texto).toContain('• Espinaca · 500 g');
    expect(texto).toContain('• Limones · 2,5');
    expect(texto).not.toContain('Pan');
    expect(textoListaDeCompras('Sofía', { ...lista, items: [] })).toBeNull();
  });
});
