import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NutrigoIngredientPhoto } from './IngredientPhoto';

describe('Foto de ingrediente desde la pieza de Nutrigo', () => {
  const photo = 'https://plan-v.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg';
  it('conecta la foto real y conserva número como respaldo sin sustituir cantidades', () => {
    const html = renderToStaticMarkup(<NutrigoIngredientPhoto ingredient={{ name: 'Tomate', ingredient_cover_url: photo, ingredient_cover_alt: 'Tomate · imagen ilustrativa generada con IA' }} index={1} />);
    expect(html).toContain(photo);
    expect(html).toContain('Tomate · imagen ilustrativa generada con IA');
    expect(html).toContain('>2</p>');
    expect(html).toContain('data-name="Number"');
  });
  it('no expone fotos inválidas y conserva el número sin foto', () => {
    for (const value of [null, 'javascript:alert(1)', 'https://plan-v.supabase.co/private/patient.jpg']) {
      const html = renderToStaticMarkup(<NutrigoIngredientPhoto ingredient={{ name: 'Tomate', ingredient_cover_url: value }} index={0} />);
      expect(html).not.toContain('<img');
      expect(html).toContain('>1</p>');
    }
  });
});
