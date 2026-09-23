import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfessionalRecipe } from '../../types/recipes';
import type { ShowroomPatient } from './showroom-model';
import { buildHealthyMenu, filterCatalog, filterHealthyMenu, ShowroomHealthyMenu } from './ShowroomHealthyMenu';

const patient = {
  id: 'p1', name: 'Ana Ríos', initials: 'AR', todayPlan: [],
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Cena', title: 'Omelette de verduras' }] },
    { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Merienda', title: 'Yogur con fruta' }] },
  ],
} as unknown as ShowroomPatient;

/** Sólo la sección «Todo el menú» (la columna derecha muestra la semana completa). */
const allMenu = (html: string) => html.slice(html.indexOf('aria-label="Todo el menú"'), html.indexOf('aria-label="Más del menú"'));

describe('Menú saludable paciente Nutrigo', () => {
  it('deriva preparaciones únicas del plan publicado sin crear recetas', () => {
    const menu = buildHealthyMenu(patient);
    expect(menu.items).toHaveLength(3);
    expect(menu.totalAssignments).toBe(4);
    expect(menu.slots).toEqual(['Almuerzo', 'Cena', 'Merienda']);
    expect(menu.items[0]).toMatchObject({
      title: 'Pollo con vegetales', occurrences: 2,
      days: ['Lunes', 'Miércoles'], slots: ['Almuerzo'],
    });
  });

  it('arma el layout del archivo con datos publicados, sin puntajes inventados', () => {
    const html = renderToStaticMarkup(<ShowroomHealthyMenu patient={patient} query="" onNavigate={() => undefined} />);
    expect(html).toContain('Menú destacado');
    expect(html).toContain('Todo el menú');
    expect(html).toContain('Más presentes en tu semana');
    expect(html).toContain('Recetas de tu nutricionista');
    expect(html).toContain('Lista de compras');
    expect(html).toContain('Pollo con vegetales');
    expect(html).toContain('2 veces esta semana');
    expect(html).toContain('Imagen ilustrativa');
    expect(html).toContain('Ver en plan semanal');
    expect(html).not.toMatch(/health score|reseñas|reviews|dificultad|\/10|kcal|proteína|carbohidrato/i);
  });

  it('filtra con la búsqueda global sin mezclar otros datos', () => {
    const html = allMenu(renderToStaticMarkup(<ShowroomHealthyMenu patient={patient} query="yogur" onNavigate={() => undefined} />));
    expect(html).toContain('Yogur con fruta');
    expect(html).not.toContain('Pollo con vegetales');
    expect(html).not.toContain('Omelette de verduras');
  });

  it('filtra por momento y día y ordena por nombre o día', () => {
    const { items } = buildHealthyMenu(patient);
    expect(filterHealthyMenu(items, { slot: 'Cena' }).map((item) => item.title)).toEqual(['Omelette de verduras']);
    expect(filterHealthyMenu(items, { day: 'Miércoles' }).map((item) => item.title)).toEqual(['Pollo con vegetales', 'Yogur con fruta']);
    expect(filterHealthyMenu(items, { sort: 'nombre' }).map((item) => item.title)).toEqual(['Omelette de verduras', 'Pollo con vegetales', 'Yogur con fruta']);
    expect(filterHealthyMenu(items, { sort: 'dia' }).map((item) => item.title)[2]).toBe('Yogur con fruta');
  });

  it('presenta un vacío honesto si no hay plan publicado', () => {
    const html = renderToStaticMarkup(<ShowroomHealthyMenu patient={{ ...patient, weekPlan: [] }} query="" onNavigate={() => undefined} />);
    expect(html).toContain('Tu menú está en preparación');
    expect(html).not.toContain('Todo el menú');
  });
});

describe('Menú saludable nutricionista: el catálogo es el menú', () => {
  const recipe = (id: string, title: string, category: string, published: boolean, kcal: number | null, created: string): ProfessionalRecipe => ({
    id, title, status: published ? 'published' : 'draft', created_at: created,
    current: {
      id: `${id}-v1`, version: 1, yield_portions: 2, steps: ['Cocinar.'], nutrient_source: 'Tabla', published_at: published ? created : null,
      ingredients: [{ id: 'i1', name: 'Lentejas', quantity: 80, unit: 'g' }],
      card: { category, prep_minutes: null, macro_status: kcal == null ? 'unavailable' : 'declared', macros: kcal == null ? null : { kcal, protein_g: 10, carbs_g: 20, fat_g: 5 }, cover_status: 'none', cover_alt: title },
    },
    published: null,
  });
  const recipes = [
    recipe('a', 'Bowl de lentejas', 'Almuerzo', true, 420, '2026-09-20T10:00:00Z'),
    recipe('b', 'Avena con frutos rojos', 'Desayuno', false, 310, '2026-09-21T10:00:00Z'),
    recipe('c', 'Tortilla', 'Cena', false, null, '2026-09-19T10:00:00Z'),
  ];

  it('filtra por momento, estado y búsqueda y ordena por calorías sin inventar las faltantes', () => {
    expect(filterCatalog(recipes, {}).map((item) => item.id)).toEqual(['b', 'a', 'c']);
    expect(filterCatalog(recipes, { slot: 'Cena' }).map((item) => item.id)).toEqual(['c']);
    expect(filterCatalog(recipes, { status: 'publicadas' }).map((item) => item.id)).toEqual(['a']);
    expect(filterCatalog(recipes, { status: 'borradores' }).map((item) => item.id)).toEqual(['b', 'c']);
    expect(filterCatalog(recipes, { query: 'avena' }).map((item) => item.id)).toEqual(['b']);
    expect(filterCatalog(recipes, { sort: 'calorias' }).map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });

  it('las acciones de alta viven en la cabecera y la columna derecha es del paciente seleccionado', () => {
    const html = renderToStaticMarkup(<ShowroomHealthyMenu patient={patient} query="" onNavigate={() => undefined} role="pro" />);
    expect(html).toContain('Nueva receta');
    expect(html).toContain('aria-label="Generar borrador con IA"');
    expect(html).toContain('En el plan de Ana');
    expect(html).toContain('Recetas asignadas a Ana');
    expect(html).toContain('Cargando catálogo');
    expect(html).not.toContain('CATÁLOGO DEL CONSULTORIO');
  });
});
