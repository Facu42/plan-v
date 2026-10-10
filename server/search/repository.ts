import type { SearchFoodHit, SearchPatientHit, SearchRecipeHit, WorkspaceSearchResponse } from '../../src/types/search.js';
import { normalizeFoodSearch } from '../../src/types/foods.js';
import { listFoods } from '../foods/repository.js';
import { listProfessionalRecipes } from '../recipes/repository.js';
import { resolveWorkScope } from '../crm/repository.js';

/** Muestra por grupo: el buscador orienta, no reemplaza al catálogo completo. */
export const SEARCH_SAMPLE = 6;

const matches = (value: string, needle: string) => normalizeFoodSearch(value).includes(needle);

/**
 * El alcance sale siempre del servidor: pacientes del consultorio de la sesión (resolveWorkScope exige rol
 * nutricionista) y catálogo/recetas que la base ya filtra por consultorio. Nunca se acepta un consultorio del cliente.
 */
export async function searchWorkspace(actorId: string | null, persistent: boolean, query: string): Promise<WorkspaceSearchResponse> {
  const needle = normalizeFoodSearch(query);
  const scope = await resolveWorkScope(actorId, persistent);
  const [foods, recipes] = await Promise.all([listFoods(scope.nutritionistId, persistent), listProfessionalRecipes(scope.nutritionistId, persistent)]);

  const patientHits: SearchPatientHit[] = scope.patients
    .filter(patient => !patient.archived_at && !patient.deactivated_at && !patient.anonymized_at && matches(patient.name, needle))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(patient => ({ id: patient.id, name: patient.name, href: `/crm/ficha?paciente=${encodeURIComponent(patient.id)}` }));
  const recipeHits: SearchRecipeHit[] = recipes
    .filter(recipe => recipe.status !== 'archived' && matches(recipe.title, needle))
    .map(recipe => ({ id: recipe.id, title: recipe.title, href: '/crm/biblioteca?biblioteca=recetas' }));
  const foodHits: SearchFoodHit[] = foods
    .filter(food => matches(`${food.name} ${food.brand} ${food.category}`, needle))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(food => ({ id: food.id, name: food.name, detail: [food.brand, food.category].filter(Boolean).join(' · '), own: food.owner_id !== null, href: '/crm/alimentos' }));

  return {
    query,
    patients: patientHits.slice(0, SEARCH_SAMPLE),
    recipes: recipeHits.slice(0, SEARCH_SAMPLE),
    foods: foodHits.slice(0, SEARCH_SAMPLE),
    totals: { patients: patientHits.length, recipes: recipeHits.length, foods: foodHits.length },
    source: persistent ? 'supabase' : 'memory',
  };
}
