import { normalizeFoodSearch } from './foods';
import type { ProfessionalRecipe } from './recipes';
export type RecipeCatalogQuery = { query: string; category: string; state: 'all' | 'draft' | 'published'; favoritesOnly: boolean };
export function filterProfessionalRecipes(recipes: readonly ProfessionalRecipe[], filters: RecipeCatalogQuery, favoriteIds: readonly string[]) {
  const term = normalizeFoodSearch(filters.query);
  const favorites = new Set(favoriteIds);
  return recipes.filter(recipe =>
    (!term || normalizeFoodSearch(`${recipe.title} ${recipe.current.ingredients.map(item => item.name).join(' ')}`).includes(term)) &&
    (!filters.category || recipe.current.card?.category === filters.category) &&
    (filters.state !== 'draft' || !recipe.current.published_at) &&
    (filters.state !== 'published' || Boolean(recipe.published)) &&
    (!filters.favoritesOnly || favorites.has(recipe.id)));
}
