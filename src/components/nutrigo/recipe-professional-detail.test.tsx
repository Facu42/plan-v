import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecipeProfessionalDetail } from './RecipeProfessionalDetail';
import type { ProfessionalRecipe } from '../../types/recipes';
describe('detalle profesional de recetas', () => {
  it('muestra cero de cocción y datos faltantes, pasos e ingredientes, con origen IA explícito', () => {
    const recipe = { id: 'recipe', title: 'Avena preparada', current: { id: 'v2', title: 'Avena preparada', version: 2, ingredients: [{ id: 'i1', name: 'Avena', quantity: 20, unit: 'g' }], steps: ['Mezclar.'], yield_portions: 2, cooking_minutes: 0, final_weight_g: 40, nutrient_source: 'propuesta_ia.v2', published_at: null }, published: { id: 'v1', version: 1 } } as ProfessionalRecipe;
    const html = renderToStaticMarkup(<RecipeProfessionalDetail recipe={recipe} onBack={() => {}} headingRef={createRef()} renderComposition={() => null} favorite={null} actions={<button>Publicar borrador</button>} />);
    expect(html).toContain('Volver al catálogo'); expect(html).toContain('Borrador privado');
    expect(html).toContain('Publicada · versión 1'); expect(html).toContain('20');
    expect(html).toContain('Mezclar.'); expect(html).toContain('0 min'); expect(html).toContain('Sin dato');
    expect(html).toContain('Propuesta de IA'); expect(html).not.toContain('USDA');
  });
});
