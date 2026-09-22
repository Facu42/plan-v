import { randomUUID } from 'node:crypto';
import {
  SEEDED_RESOURCES,
  favoriteKindForResource,
  resourceMatchesQuery,
  type EditorialResource,
  type FavoriteKind,
  type FavoriteView,
  type LibraryHit,
  type PatientLibraryView,
} from '../../src/types/resources.js';

const extras = new Map<string, EditorialResource>();
const favorites = new Map<string, FavoriteView>();

export function resetResourceMemory() {
  extras.clear();
  favorites.clear();
}

export function catalogResources() {
  return [...SEEDED_RESOURCES, ...extras.values()].map((entry) => ({ ...entry, sections: entry.sections.map((section) => ({ ...section })) }));
}

export function findResource(idOrSlug: string) {
  return catalogResources().find((entry) => entry.slug === idOrSlug || entry.id === idOrSlug) ?? null;
}

export function putResource(entry: EditorialResource) {
  extras.set(entry.id, entry);
}

export function listFavorites(patientId: string) {
  return [...favorites.values()]
    .filter((row) => row.patient_id === patientId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getFavorite(patientId: string, kind: FavoriteKind, itemId: string) {
  return [...favorites.values()].find((row) => row.patient_id === patientId && row.item_kind === kind && row.item_id === itemId) ?? null;
}

export function putFavorite(row: FavoriteView) {
  favorites.set(row.id, row);
}

export function dropFavorite(id: string) {
  favorites.delete(id);
}

export function newResourceId() {
  return randomUUID();
}

export function visibleResources(professional: boolean, assignedSlugs: Set<string>) {
  return catalogResources().filter((entry) => {
    if (professional) {
      if (entry.nutritionist_id) return true;
      return entry.published || entry.kind === 'operational';
    }
    if (!entry.published) return false;
    if (entry.kind === 'operational') return true;
    return assignedSlugs.has(entry.slug);
  });
}

export function buildHits(
  professional: boolean,
  assignedSlugs: Set<string>,
  recipes: Array<{ id: string; title: string }>,
  planB: { patient_id: string; title: string } | null,
  query: string,
): LibraryHit[] {
  const hits: LibraryHit[] = [];
  for (const entry of visibleResources(professional, assignedSlugs)) {
    if (!resourceMatchesQuery(entry, query)) continue;
    if (!professional && entry.kind === 'clinical' && !entry.published) continue;
    hits.push({
      kind: favoriteKindForResource(entry.kind),
      id: entry.slug,
      title: entry.title,
      summary: entry.summary,
      category: entry.category,
    });
  }
  const term = query.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
  for (const recipe of recipes) {
    if (term && !recipe.title.toLocaleLowerCase('es-AR').includes(term)) continue;
    hits.push({ kind: 'recipe', id: recipe.id, title: recipe.title, summary: '', category: 'Receta' });
  }
  if (professional && planB && (!term || planB.title.toLocaleLowerCase('es-AR').includes(term))) {
    hits.push({ kind: 'plan_b', id: planB.patient_id, title: planB.title, summary: 'Plan B de la ficha', category: 'Plan B' });
  }
  return hits;
}

export type { PatientLibraryView };
