import { describe, expect, it } from 'vitest';
import { filterProfessionalRecipes } from './recipe-catalog-query';
import type { ProfessionalRecipe } from './recipes';
const recipes = [
  { id: 'a', title: 'Tortilla de espinaca', current: { ingredients: [{ name: 'Huevo' }], published_at: null, card: { category: 'Cena' } }, published: null },
  { id: 'b', title: 'Avena preparada', current: { ingredients: [{ name: 'Yogur' }], published_at: null, card: { category: 'Desayuno' } }, published: { version: 1 } },
] as unknown as ProfessionalRecipe[];
describe('consulta de recetas profesionales', () => {
  it('combina nombre/ingrediente sin acentos, momento, estado y favorito', () => {
    expect(filterProfessionalRecipes(recipes, { query: '  HUEVÓ ', category: 'Cena', state: 'draft', favoritesOnly: true }, ['a']).map(r => r.id)).toEqual(['a']);
    expect(filterProfessionalRecipes(recipes, { query: 'yogur', category: '', state: 'published', favoritesOnly: true }, ['a'])).toEqual([]);
    expect(filterProfessionalRecipes(recipes, { query: '', category: '', state: 'published', favoritesOnly: false }, []).map(r => r.id)).toEqual(['b']);
  });
});
