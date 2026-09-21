import type { RecipeCard } from '../../src/types/recipes.js';
import { unavailableCard } from '../../src/types/recipe-plate.js';

const cards = new Map<string, RecipeCard>();

export function resetRecipeCards() {
  cards.clear();
}

export function setRecipeCard(versionId: string, card: RecipeCard) {
  cards.set(versionId, card);
}

export function getRecipeCard(versionId: string, title: string): RecipeCard {
  return cards.get(versionId) ?? unavailableCard(title);
}
