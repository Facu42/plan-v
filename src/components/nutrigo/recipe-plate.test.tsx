import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { RecipeDayAssignment } from '../../types/recipe-plate';
import { DayAssignedMealsView } from './DayMeals';
import { RecipeCatalog } from './RecipeCatalog';
import { RecipeDetails, RecipePlateCard, scaleQuantity } from './RecipePlate';

const card = {
  category: 'Almuerzo',
  prep_minutes: 25,
  macro_status: 'declared' as const,
  macros: { kcal: 185, protein_g: 18, carbs_g: 40, fat_g: 9 },
  cover_status: 'none' as const,
  cover_alt: 'Bowl de lentejas',
  cover_url: null,
};

const assignment: RecipeDayAssignment = {
  id: 'day-1',
  patient_id: 'pat-sofia',
  for_date: '2026-09-22',
  slot: 'Almuerzo',
  recipe_id: 'r1',
  recipe_version: 1,
  title: 'Bowl de lentejas',
  yield_portions: 2,
  ingredients: [{ id: 'i1', name: 'Lentejas', quantity: 80, unit: 'g' }],
  card,
  registered_meal_id: null,
};

describe('PV-40 formato de card y CTA', () => {
  it('la card muestra foto, badge, meta y macros KCAL/PROT/CARBS/GRASAS', () => {
    const html = renderToStaticMarkup(<RecipePlateCard title="Bowl de lentejas" portions={2} card={card} />);
    expect(html).toContain('recipe-dish');
    expect(html).toContain('Almuerzo');
    expect(html).toContain('2 porciones · 25 min');
    expect(html).toContain('KCAL');
    expect(html).toContain('PROT');
    expect(html).toContain('CARBS');
    expect(html).toContain('GRASAS');
    expect(html).toContain('185');
    expect(html).not.toMatch(/https?:\/\/|cenra/i);
  });

  it('sin macros declarados no imprime números nutricionales', () => {
    const html = renderToStaticMarkup(<RecipePlateCard title="Bowl" portions={1} card={{ ...card, macro_status: 'unavailable', macros: null }} />);
    expect(html).toContain('Sin macros declarados');
    expect(html).not.toContain('KCAL');
  });

  it('la foto fallida se dice, no se reemplaza con una URL', () => {
    const html = renderToStaticMarkup(<RecipePlateCard title="Tortilla" portions={1} card={{ ...card, cover_status: 'failed', macro_status: 'failed', macros: null }} />);
    expect(html).toContain('La foto del plato no se generó');
    expect(html).toContain('La IA no devolvió macros');
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('con cover_status ready se muestra la foto real generada (PV-42), no la ilustración', () => {
    const ready = { ...card, cover_status: 'ready' as const, cover_url: 'https://cdn.example.test/covers/bowl.png' };
    const html = renderToStaticMarkup(<RecipePlateCard title="Bowl de lentejas" portions={2} card={ready} />);
    expect(html).toContain('<img');
    expect(html).toContain('https://cdn.example.test/covers/bowl.png');
    expect(html).not.toContain('Ilustración de revisión');
  });

  it('el paciente ve Registrar esta comida y el catálogo ofrece manual o IA', () => {
    const meal = renderToStaticMarkup(<DayAssignedMealsView assignments={[assignment]} onRegister={() => {}} />);
    expect(meal).toContain('Registrar esta comida');
    expect(meal).toContain('80 g Lentejas');
    expect(meal).toContain('COMIDAS DEL DÍA');
    const catalog = renderToStaticMarkup(<RecipeCatalog patientId="pat-sofia" />);
    expect(catalog).toContain('Carga manual');
    expect(catalog).toContain('Asistente IA');
    expect(catalog).toContain('Nueva receta');
    expect(catalog).toContain('No se inventan calorías ni macros');
  });

  it('el detalle de receta sigue el archivo con datos reales y sin reseñas ni health score', () => {
    const detail = {
      id: 'r1', title: 'Bowl de lentejas', version: 2, yieldPortions: 2, steps: ['Lavar.', 'Cocinar.'],
      nutrientSource: 'Tabla del consultorio', ingredients: [{ id: 'i1', name: 'Lentejas', quantity: 80, unit: 'g' as const }],
      card, statusLabel: 'Publicada',
    };
    const html = renderToStaticMarkup(<RecipeDetails recipe={detail} onBack={() => {}} />);
    expect(html).toContain('Volver al menú');
    expect(html).toContain('Fuente nutricional declarada: Tabla del consultorio.');
    expect(html).toContain('80 g Lentejas');
    expect(html).toContain('Información nutricional');
    expect(html).toContain('185 kcal');
    expect(html).toContain('Publicada');
    expect(html).not.toMatch(/reseñas|reviews|health score|dificultad|fibra|sodio/i);
    const bare = renderToStaticMarkup(<RecipeDetails recipe={{ ...detail, card: { ...card, macro_status: 'unavailable', macros: null } }} onBack={() => {}} />);
    expect(bare).toContain('Sin macros declarados.');
    expect(bare).not.toContain('Información nutricional');
  });

  it('las porciones escalan las cantidades de la receta sin inventar datos', () => {
    expect(scaleQuantity(80, 2, 4)).toBe(160);
    expect(scaleQuantity(80, 2, 1)).toBe(40);
    expect(scaleQuantity(1, 3, 1)).toBe(0.3);
    expect(scaleQuantity(5, 0, 2)).toBe(5);
  });
});
