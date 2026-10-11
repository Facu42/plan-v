import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PlanRecipeDetail } from '../../types/plans';
import { PlanRecipePreview } from './PlanRecipePicker';

describe('vista previa de receta en el plan', () => {
  it('escala los ingredientes por rinde sin dividir otra vez los nutrientes por porción', () => {
    const recipe = { title: 'Receta ficticia', version: 1, yield_portions: 2, ingredients: [{ id: 'i1', name: 'Avena', quantity: 40, unit: 'g' }], steps: ['Mezclar.'], nutrient_source: 'propuesta_ia.v2', card: { macros: { kcal: 38, protein_g: 1.3, carbs_g: 6, fat_g: 0.7 } } } as PlanRecipeDetail;
    const html = renderToStaticMarkup(<PlanRecipePreview recipe={recipe} portions={0.5} />);
    expect(html).toContain('10 g'); expect(html).toContain('19 kcal'); expect(html).toContain('Sin dato');
    expect(html).toContain('Nutrientes estimados por IA'); expect(html).toContain('Receta ficticia'); expect(html).toContain('v1');
  });
});
