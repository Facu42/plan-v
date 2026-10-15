import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaHealthyMenuProvider } from './FigmaHealthyMenu';
import HealthyMenu from './screens/HealthyMenu';
import HealthyMenuTablet from './screens/HealthyMenuTablet';
import HealthyMenuMobile from './screens/HealthyMenuMobile';
import RecipeDetails from './screens/RecipeDetails';
import RecipeDetailsTablet from './screens/RecipeDetailsTablet';
import RecipeDetailsMobile from './screens/RecipeDetailsMobile';

const patient = {
  id: 'p-menu', name: 'Ana Pérez', initials: 'AP',
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Cena', title: 'Omelette de verduras' }] },
    { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }] },
  ],
} as unknown as ShowroomPatient;

const render = (Screen: typeof HealthyMenu, selectedKey: string | null = null, value = patient) => renderToStaticMarkup(<FigmaPatientIdentity patient={value}>
  <FigmaHealthyMenuProvider patient={value} selectedKey={selectedKey} onSelect={() => {}} onNavigate={() => {}}><Screen /></FigmaHealthyMenuProvider>
</FigmaPatientIdentity>);

describe('Figma patient healthy menu', () => {
  it.each([['escritorio', HealthyMenu], ['tablet', HealthyMenuTablet], ['móvil', HealthyMenuMobile]])('shows the real patient menu in %s', (_, Screen) => {
    const html = render(Screen);
    expect(html).toContain('Pollo con vegetales');
    expect(html).toContain('Omelette de verduras');
    expect(html).toContain('2 veces en el plan');
    expect(html).toContain('Buscar menú');
    expect(html).toContain('Sin valores publicados');
    expect(html).not.toContain('Pechuga de pavo grillada');
    expect(html).not.toContain('Tostada con palta y huevo poché');
    expect(html).not.toContain('4,8/5');
    expect(html).not.toContain('450 kcal');
  });

  it.each([['escritorio', RecipeDetails], ['tablet', RecipeDetailsTablet], ['móvil', RecipeDetailsMobile]])('shows the selected preparation without invented nutrition in %s', (_, Screen) => {
    const html = render(Screen, 'plan:pollo con vegetales');
    expect(html).toContain('Pollo con vegetales');
    expect(html).toContain('Ingredientes y cantidades pendientes de publicación');
    expect(html).toContain('No hay valores nutricionales publicados');
    expect(html).not.toContain('200 g turkey breast');
    expect(html).not.toContain('450 kcal');
  });

  it('shows loading while checking an empty patient publication', () => {
    const html = render(HealthyMenuMobile, null, { ...patient, weekPlan: [] } as ShowroomPatient);
    expect(html).toContain('Cargando menú publicado');
    expect(html).not.toContain('Pollo con vegetales');
  });

  it.each([['escritorio', HealthyMenu], ['tablet', HealthyMenuTablet], ['móvil', HealthyMenuMobile]])('keeps every preparation accessible in the Figma scroll list in %s', (_, Screen) => {
    const manyMeals = Array.from({ length: 10 }, (_, index) => ({ slot: 'Almuerzo', title: `Preparación ${index + 1}` }));
    const html = render(Screen, null, { ...patient, weekPlan: [{ day: 'Lunes', meals: manyMeals }] } as ShowroomPatient);
    expect((html.match(/class="figma-menu-list-card /g) ?? []).length).toBe(10);
    expect(html).toContain('Preparación 1');
    expect(html).toContain('Preparación 10');
  });
});
