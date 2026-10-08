import { describe, expect, it } from 'vitest';
import { filterProfessionalRecipes } from './recipe-catalog-query';
import type { ProfessionalRecipe } from './recipes';
const recipes = [
  { id: 'a', title: 'Tortilla de espinaca', current: { ingredients: [{ name: 'Huevo' }], published_at: null, card: { category: 'Cena' } }, published: null },
  { id: 'b', title: 'Avena preparada', current: { ingredients: [{ name: 'Yogur' }], published_at: null, card: { category: 'Desayuno' } }, published: { version: 1 } },
] as unknown as ProfessionalRecipe[];
describe('consulta de recetas profesionales', () => {
  it('combina categoría culinaria con momento y no reclasifica recetas antiguas', () => {
    const classified = [{ ...recipes[0], current: { ...recipes[0].current, card: { ...recipes[0].current.card!, culinary_categories: ['Guisos', 'Pollo'] } } }, recipes[1]];
    expect(filterProfessionalRecipes(classified, { query: '', category: 'Cena', culinaryCategory: 'GUÍSOS', state: 'draft', favoritesOnly: false }, []).map(recipe => recipe.id)).toEqual(['a']);
    expect(filterProfessionalRecipes(classified, { query: '', category: 'Desayuno', culinaryCategory: 'Guisos', state: 'all', favoritesOnly: false }, [])).toEqual([]);
  });
  it('combina nombre/ingrediente sin acentos, momento, estado y favorito', () => {
    expect(filterProfessionalRecipes(recipes, { query: '  HUEVÓ ', category: 'Cena', state: 'draft', favoritesOnly: true }, ['a']).map(r => r.id)).toEqual(['a']);
    expect(filterProfessionalRecipes(recipes, { query: 'yogur', category: '', state: 'published', favoritesOnly: true }, ['a'])).toEqual([]);
    expect(filterProfessionalRecipes(recipes, { query: '', category: '', state: 'published', favoritesOnly: false }, []).map(r => r.id)).toEqual(['b']);
  });
});
