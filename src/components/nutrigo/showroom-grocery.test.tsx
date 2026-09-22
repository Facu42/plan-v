import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildGroceryView, groceryGroupsFromLines, publishedRecipeMeals, ShowroomGrocery } from './ShowroomGrocery';

const patient = {
  id: 'p1', name: 'Ana', initials: 'AR',
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Cena', title: 'Omelette de verduras' }] },
    { day: 'Martes', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Cena', title: 'Preparación especial de Ana' }] },
  ],
} as ShowroomPatient;

describe('Lista de compras Nutrigo', () => {
  it('reutiliza la derivación conservadora del plan y conserva fallbacks explícitos', () => {
    const view = buildGroceryView(patient);
    expect(view.totalMeals).toBe(4);
    expect(view.groups.flatMap((group) => group.items).find((item) => item.id === 'pollo')?.occurrences).toBe(2);
    expect(view.groups.flatMap((group) => group.items).some((item) => item.label === 'Ingredientes para: Preparación especial de Ana')).toBe(true);
    expect(view.fallbackItems).toBe(1);
  });

  it('incluye alternativas publicadas y descarta borradores', () => {
    const extras = publishedRecipeMeals([
      { published_at: '2026-09-18T12:00:00.000Z', recipe: { title: 'Tarta de zapallo', ingredients: ['zapallo', 'queso'], steps: ['Hornear'], explanation: 'Revisada' } },
      { published_at: null, recipe: { title: 'Borrador secreto', ingredients: ['nuez'], steps: ['Mezclar'], explanation: 'Privado' } },
    ]);
    expect(extras).toEqual([{ title: 'Tarta de zapallo', detail: 'zapallo queso' }]);
    const view = buildGroceryView(patient, extras);
    expect(view.groups.flatMap((group) => group.items).some((item) => item.id === 'zapallo')).toBe(true);
    expect(view.groups.flatMap((group) => group.items).some((item) => item.label.includes('Borrador secreto'))).toBe(false);
  });

  it('muestra categorías, checklist local, filtros y exportación', () => {
    const html = renderToStaticMarkup(<ShowroomGrocery patient={patient} />);
    expect(html).toContain('Lista de compras');
    expect(html).toContain('Derivada de tu plan semanal');
    expect(html).toContain('Pollo');
    expect(html).toContain('Verduras variadas');
    expect(html).toContain('Preparación especial de Ana');
    expect(html).toContain('Filtrar lista');
    expect(html).toContain('Exportar .txt');
    expect(html).toContain('0 de');
  });

  it('no inventa cantidades, precios, presupuesto ni supermercado en la vista de títulos', () => {
    const html = renderToStaticMarkup(<ShowroomGrocery patient={patient} />);
    expect(html).toContain('No incluye cantidades ni porciones');
    expect(html).not.toMatch(/precio|presupuesto|supermercado|\$|\bkg\b|\bgramos\b/i);
  });

  it('muestra cantidades y unidades del plan publicado sin mezclar g con taza', () => {
    const html = renderToStaticMarkup(<ShowroomGrocery patient={patient} list={{
      plan_version: 1,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      items: [
        { id: 'derived:quinoa|g', kind: 'derived', source_key: 'derived:quinoa|g', name: 'Quinoa', quantity: 90, unit: 'g', occurrences: 2, checked: false },
        { id: 'derived:quinoa|taza', kind: 'derived', source_key: 'derived:quinoa|taza', name: 'Quinoa', quantity: 1, unit: 'taza', occurrences: 1, checked: false },
        { id: 'text:pollo', kind: 'text', source_key: 'text:pollo con vegetales', name: 'Pollo con vegetales', quantity: null, unit: null, occurrences: 1, checked: false },
        { id: 'manual-1', kind: 'manual', source_key: 'manual:manual-1', name: 'Aceite de oliva', quantity: 1, unit: 'cda', occurrences: 1, checked: false },
      ],
    }} />);
    expect(html).toContain('Quinoa · 90 g');
    expect(html).toContain('Quinoa · 1 taza');
    expect(html).toContain('Aceite de oliva · 1 cda');
    expect(html).toContain('Pollo con vegetales');
    expect(html).toContain('Agregar');
    expect(html).toContain('El check se sincroniza en tu cuenta');
    expect(html).not.toContain('No incluye cantidades ni porciones');
    expect(groceryGroupsFromLines([
      { id: 'derived:quinoa|g', kind: 'derived', source_key: 'derived:quinoa|g', name: 'Quinoa', quantity: 90, unit: 'g', occurrences: 2, checked: false },
      { id: 'derived:quinoa|taza', kind: 'derived', source_key: 'derived:quinoa|taza', name: 'Quinoa', quantity: 1, unit: 'taza', occurrences: 1, checked: false },
    ]).flatMap((group) => group.items).map((item) => item.label)).toEqual(['Quinoa · 1 taza', 'Quinoa · 90 g']);
  });

  it('muestra un vacío honesto cuando no existe plan semanal', () => {
    const html = renderToStaticMarkup(<ShowroomGrocery patient={{ ...patient, weekPlan: [] }} />);
    expect(html).toContain('Sin lista para generar');
    expect(html).not.toContain('Exportar .txt');
  });
});
