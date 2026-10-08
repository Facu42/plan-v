import { afterEach, describe, expect, it, vi } from 'vitest';
import { ingredientImage, ingredientPhotoUrl } from './plate-photo';

const https = 'https://abc.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg';
const demo = 'data:image/png;base64,iVBORw0KGgo=';
afterEach(() => { vi.unstubAllEnvs(); });

describe('foto de ingrediente en el detalle de la receta (mismas reglas que el servidor)', () => {
  it('muestra la dirección https del bucket público de ingredientes', () => {
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: https })).toBe(https);
    expect(ingredientImage({ name: 'Tomate', ingredient_cover_url: https, ingredient_cover_alt: 'Tomate · ilustración' })).toBeDefined();
  });

  it('con VITE_SUPABASE_URL configurada exige el mismo host', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co');
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: https })).toBe(https);
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: https.replace('abc.', 'otro.') })).toBeNull();
  });

  it('la imagen incrustada sólo se muestra en la demostración', () => {
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: demo })).toBeNull();
    vi.stubEnv('VITE_ALLOW_DEMO', 'true');
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: demo })).toBe(demo);
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: 'data:image/jpeg;base64,/9j/4AAQ' })).not.toBeNull();
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: 'data:image/webp;base64,UklGRg==' })).not.toBeNull();
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: 'data:image/gif;base64,R0lGODlh' })).toBeNull();
  });

  it.each([
    [undefined], [null], [''], ['javascript:alert(1)'], ['http://abc.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg'], ['//evil.example/x.jpg'],
    ['https://evil.example/x.jpg'], ['https://abc.supabase.co/storage/v1/object/public/recipe-covers/otra/tomate.jpg'],
    ['https://abc.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.svg'],
    ['data:image/svg+xml;base64,PHN2Zz4='], ['data:text/html;base64,PGgxPg=='], ['/relativa.jpg'],
  ])('sin foto segura (%s) no devuelve nada y el recuadro original queda como está', url => {
    vi.stubEnv('VITE_ALLOW_DEMO', 'true');
    expect(ingredientPhotoUrl({ name: 'Tomate', ingredient_cover_url: url as string | null | undefined })).toBeNull();
    expect(ingredientImage({ name: 'Tomate', ingredient_cover_url: url as string | null | undefined })).toBeUndefined();
  });
});
