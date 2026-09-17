import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildGroceryView, ShowroomGrocery } from './ShowroomGrocery';

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

  it('no inventa cantidades, precios, presupuesto ni supermercado', () => {
    const html = renderToStaticMarkup(<ShowroomGrocery patient={patient} />);
    expect(html).toContain('No incluye cantidades ni porciones');
    expect(html).not.toMatch(/precio|presupuesto|supermercado|\$|\bkg\b|\bgramos\b/i);
  });

  it('muestra un vacío honesto cuando no existe plan semanal', () => {
    const html = renderToStaticMarkup(<ShowroomGrocery patient={{ ...patient, weekPlan: [] }} />);
    expect(html).toContain('Sin lista para generar');
    expect(html).not.toContain('Exportar .txt');
  });
});
