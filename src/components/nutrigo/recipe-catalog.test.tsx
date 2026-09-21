import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PatientRecipe } from '../../types/recipes';
import { AssignedRecipes, AssignedRecipesView, RecipeCatalog } from './RecipeCatalog';

const assigned: PatientRecipe = {
  id: 'r1',
  title: 'Bowl de lentejas',
  version: 1,
  yield_portions: 2,
  steps: ['Lavar.', 'Cocinar.'],
  nutrient_source: 'Tabla del consultorio',
  ingredients: [{ id: 'i1', name: 'Lentejas', quantity: 80, unit: 'g' }],
  assigned_at: '2026-09-21T12:00:00.000Z',
  published_at: '2026-09-21T11:00:00.000Z',
};

describe('Catálogo profesional y recetas asignadas', () => {
  it('el catálogo profesional explica borrador vs publicada sin inventar macros', () => {
    const html = renderToStaticMarkup(<RecipeCatalog patientId="pat-sofia" />);
    expect(html).toContain('Recetas e ingredientes');
    expect(html).toContain('No se inventan calorías ni macros');
    expect(html).toContain('Generar borrador con IA');
    expect(html).toContain('borrador privado');
    expect(html).toContain('Cargando catálogo');
    expect(html).not.toMatch(/\bkcal\b|proteína|carbohidrato/i);
  });

  it('el vacío asignado no simula una receta completa', () => {
    const html = renderToStaticMarkup(<AssignedRecipes patientId="pat-sofia" />);
    expect(html).toContain('Todavía no hay recetas publicadas para vos');
    expect(html).not.toMatch(/ingredientes|preparación|porción|kcal|proteína|carbohidrato|grasa/i);
  });

  it('muestra rinde, ingredientes, pasos y fuente de una revisión asignada', () => {
    const html = renderToStaticMarkup(<AssignedRecipesView recipes={[assigned]} />);
    expect(html).toContain('Bowl de lentejas');
    expect(html).toContain('Ingredientes');
    expect(html).toContain('80 g Lentejas');
    expect(html).toContain('Pasos');
    expect(html).toContain('Cocinar.');
    expect(html).toContain('Tabla del consultorio');
    expect(html).toContain('Rinde 2');
    expect(html).not.toMatch(/\bkcal\b|proteína|carbohidrato/i);
  });
});
