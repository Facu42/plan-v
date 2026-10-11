import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PlanRecipeDetail } from '../../types/plans';
import { PlanDayAnalysis } from './PlanDayAnalysis';

const recipe = { title: 'Prueba', version: 1, yield_portions: 1, ingredients: [], steps: [], nutrient_source: 'fuente', card: { macros: { kcal: 400, protein_g: 25, carbs_g: 50, fat_g: 11.1 } } } as unknown as PlanRecipeDetail;

describe('panel de análisis del plan', () => {
  it('muestra la energía por momento y el reparto de macronutrientes del día', () => {
    const html = renderToStaticMarkup(<PlanDayAnalysis date="2026-10-10" lines={[{ portions: '1', recipe }, { portions: '1', recipe }]} moments={[{ slot: 'Desayuno', lines: [{ portions: '1', recipe }] }, { slot: 'Almuerzo', lines: [{ portions: '1', recipe }] }]} />);
    expect(html).toContain('Energía por momento');
    expect(html).toMatch(/Desayuno.*400 kcal.*50 %/);
    expect(html).toContain('Reparto de la energía');
    expect(html).toMatch(/Proteínas.*25 %.*Carbohidratos.*50 %.*Grasas.*25 %/);
  });
  it('avisa cuando a un momento le faltan datos', () => {
    const html = renderToStaticMarkup(<PlanDayAnalysis date="2026-10-10" lines={[{ portions: '1' }]} moments={[{ slot: 'Cena', lines: [{ portions: '1' }] }]} />);
    expect(html).toMatch(/Cena.*Sin energía completa/);
    expect(html).not.toContain('Reparto de la energía');
  });
});
