import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { assignResourceToPatients, getPatient, markResourceRead } from '../store.js';
import { listAssignedRecipes } from '../recipes/repository.js';
import {
  buildHits,
  catalogResources,
  dropFavorite,
  findResource,
  getFavorite,
  listFavorites,
  newResourceId,
  putFavorite,
  putResource,
  visibleResources,
} from './memory.js';
import {
  favoriteKindForResource,
  type EditorialResource,
  type FavoriteKind,
  type FavoriteView,
  type PatientLibraryView,
  type ResourceAssignmentView,
} from '../../src/types/resources.js';

export { CareError } from '../care/errors.js';
export { resetResourceMemory } from './memory.js';

export function resourceDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'Los recursos editoriales requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') {
    throw new CareError(403, 'No tenés permiso para esta acción.');
  }
  if (error.code === 'P0002' || error.code === 'PGRST116') {
    throw new CareError(404, 'No encontramos ese recurso.');
  }
  if (['22023', '23514', '22P02', '23503', '23505'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá el recurso, la autoría y las reglas de publicación.');
  }
  throw new CareError(503, 'No se pudo guardar el recurso. Reintentá en un momento.');
}

function asSections(value: unknown): EditorialResource['sections'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.title !== 'string' || typeof row.body !== 'string') return [];
    return [{ title: row.title, body: row.body }];
  });
}

function asResource(value: unknown): EditorialResource | null {
  const row = (value ?? {}) as Record<string, unknown>;
  if (typeof row.slug !== 'string' || typeof row.title !== 'string') return null;
  const kind = row.kind === 'clinical' ? 'clinical' : 'operational';
  const license = row.license_kind === 'declared' || row.license_kind === 'placeholder' ? row.license_kind : 'internal_operational';
  return {
    id: String(row.id ?? row.slug),
    slug: row.slug,
    kind,
    nutritionist_id: row.nutritionist_id == null ? null : String(row.nutritionist_id),
    title: String(row.title),
    category: String(row.category ?? ''),
    eyebrow: String(row.eyebrow ?? ''),
    summary: String(row.summary ?? ''),
    minutes: Number(row.minutes ?? 1),
    icon: String(row.icon ?? 'sparkle'),
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
    sections: asSections(row.sections),
    related: Array.isArray(row.related) ? row.related.map((item) => String(item)) : [],
    action_label: String(row.action_label ?? ''),
    action_page: String(row.action_page ?? ''),
    author_name: String(row.author_name ?? ''),
    reviewed_at: row.reviewed_at == null ? null : String(row.reviewed_at),
    published: Boolean(row.published),
    license_kind: license,
    license_note: String(row.license_note ?? ''),
    cover_url: row.cover_url == null ? null : String(row.cover_url),
  };
}

function asResources(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = asResource(entry);
    return parsed ? [parsed] : [];
  });
}

function asAssignments(value: unknown): ResourceAssignmentView[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string') return [];
    return [{
      id: String(row.id),
      patient_id: String(row.patient_id),
      resource_id: String(row.resource_id ?? row.slug ?? ''),
      slug: String(row.slug ?? row.resource_id ?? ''),
      assigned_at: String(row.assigned_at),
      read_at: row.read_at == null ? null : String(row.read_at),
    }];
  });
}

function asFavorites(value: unknown): FavoriteView[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string') return [];
    const kind = row.item_kind;
    if (kind !== 'resource' && kind !== 'article' && kind !== 'recipe' && kind !== 'plan_b') return [];
    return [{
      id: String(row.id),
      patient_id: String(row.patient_id),
      item_kind: kind,
      item_id: String(row.item_id),
      title: String(row.title ?? ''),
      created_at: String(row.created_at),
    }];
  });
}

export function asLibraryView(data: unknown, patientId: string): PatientLibraryView {
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    patient_id: String(row.patient_id ?? patientId),
    resources: asResources(row.resources).filter((entry) => entry.kind === 'operational'),
    articles: asResources(row.articles).filter((entry) => entry.kind === 'clinical'),
    recipes: Array.isArray(row.recipes) ? row.recipes.flatMap((entry) => {
      const item = entry as Record<string, unknown>;
      if (typeof item.id !== 'string') return [];
      return [{ id: String(item.id), title: String(item.title ?? ''), assigned_at: String(item.assigned_at ?? '') }];
    }) : [],
    plan_b: row.plan_b && typeof row.plan_b === 'object' ? {
      patient_id: String((row.plan_b as Record<string, unknown>).patient_id ?? patientId),
      title: String((row.plan_b as Record<string, unknown>).title ?? ''),
    } : null,
    assignments: asAssignments(row.assignments),
    favorites: asFavorites(row.favorites),
    hits: Array.isArray(row.hits) ? row.hits.flatMap((entry) => {
      const item = entry as Record<string, unknown>;
      const kind = item.kind;
      if (kind !== 'resource' && kind !== 'article' && kind !== 'recipe' && kind !== 'plan_b') return [];
      return [{
        kind,
        id: String(item.id),
        title: String(item.title ?? ''),
        summary: String(item.summary ?? ''),
        category: String(item.category ?? ''),
      }];
    }) : [],
  };
}

async function rpc(name: string, args: Record<string, unknown>) {
  let result: { data: unknown; error: { code?: string; message?: string } | null };
  try {
    result = await getRequestDb().rpc(name, args);
  } catch {
    throw new CareError(501, 'Los recursos editoriales requieren instalar la migración de este módulo.');
  }
  resourceDbError(result.error);
  return result.data;
}

async function memorySnapshot(patientId: string, professional: boolean, query = ''): Promise<PatientLibraryView> {
  const patient = getPatient(patientId);
  if (!patient) throw new CareError(404, 'Paciente no encontrado.');
  const assignedSlugs = new Set((patient.resource_assignments ?? []).map((row) => row.resource_id));
  const visible = visibleResources(professional, assignedSlugs);
  const recipes = (await listAssignedRecipes(patientId, false)).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    assigned_at: recipe.assigned_at,
  }));
  const planB = professional && patient.plan_b.trim()
    ? { patient_id: patient.id, title: patient.plan_b }
    : null;
  const assignments: ResourceAssignmentView[] = (patient.resource_assignments ?? []).map((row) => ({
    id: row.id,
    patient_id: row.patient_id,
    resource_id: row.resource_id,
    slug: row.resource_id,
    assigned_at: row.assigned_at,
    read_at: row.read_at,
  }));
  return {
    patient_id: patientId,
    resources: visible.filter((entry) => entry.kind === 'operational'),
    articles: visible.filter((entry) => entry.kind === 'clinical'),
    recipes,
    plan_b: planB,
    assignments,
    favorites: listFavorites(patientId),
    hits: buildHits(professional, assignedSlugs, recipes, planB, query),
  };
}

export async function getPatientLibrary(patientId: string, persistent: boolean, professional: boolean, query = ''): Promise<PatientLibraryView> {
  if (!persistent) return memorySnapshot(patientId, professional, query);
  return asLibraryView(await rpc('get_patient_library', { target_patient: patientId, query }), patientId);
}

export async function assignEditorialResource(
  resourceId: string,
  patientIds: string[],
  persistent: boolean,
  professional: boolean,
): Promise<{ patients: ReturnType<typeof getPatient>[]; assigned_count: number; existing_count: number; library?: PatientLibraryView }> {
  const resource = findResource(resourceId);
  if (!resource || !resource.published) throw new CareError(400, 'Recurso inválido');
  if (!professional) throw new CareError(403, 'Sólo una profesional puede asignar un recurso.');
  if (!persistent) {
    const result = assignResourceToPatients(resource.slug, patientIds);
    if (!result) throw new CareError(404, 'Paciente no encontrado.');
    return {
      patients: result.patients,
      assigned_count: result.assignedCount,
      existing_count: result.existingCount,
    };
  }
  const data = await rpc('assign_editorial_resource', {
    resource_slug: resource.slug,
    patient_ids: patientIds,
  }) as Record<string, unknown>;
  return {
    patients: [],
    assigned_count: Number(data.assigned_count ?? 0),
    existing_count: Number(data.existing_count ?? 0),
  };
}

export async function markEditorialRead(patientId: string, resourceId: string, persistent: boolean, professional: boolean) {
  const resource = findResource(resourceId);
  if (!resource) throw new CareError(400, 'Recurso inválido');
  if (professional) throw new CareError(403, 'Sólo la paciente puede marcar la lectura.');
  if (!persistent) {
    const patient = markResourceRead(patientId, resource.slug);
    if (!patient) throw new CareError(404, 'No encontramos ese recurso.');
    return { patient, library: await memorySnapshot(patientId, false) };
  }
  return { patient: null, library: asLibraryView(await rpc('mark_editorial_resource_read', {
    target_patient: patientId,
    resource_slug: resource.slug,
  }), patientId) };
}

function titleForFavorite(patientId: string, kind: FavoriteKind, itemId: string, professional: boolean) {
  if (kind === 'plan_b') throw new CareError(400, 'El Plan B se guarda en la ficha profesional, no como favorito personal.');
  if (kind === 'recipe') return null;
  const resource = findResource(itemId);
  if (!resource) throw new CareError(404, 'No encontramos ese recurso.');
  const expected = favoriteKindForResource(resource.kind);
  if (expected !== kind) throw new CareError(400, 'Revisá el recurso, la autoría y las reglas de publicación.');
  const patient = getPatient(patientId);
  const assigned = new Set((patient?.resource_assignments ?? []).map((row) => row.resource_id));
  const visible = visibleResources(professional, assigned).some((entry) => entry.slug === resource.slug);
  if (!visible) throw new CareError(403, 'No tenés permiso para esta acción.');
  return resource.title;
}

export async function toggleFavorite(
  patientId: string,
  kind: FavoriteKind,
  itemId: string,
  persistent: boolean,
  professional: boolean,
): Promise<PatientLibraryView> {
  if (professional) throw new CareError(403, 'Sólo la paciente puede guardar favoritos personales.');
  if (!persistent) {
    const existing = getFavorite(patientId, kind, itemId);
    if (existing) {
      dropFavorite(existing.id);
      return memorySnapshot(patientId, false);
    }
    let title = titleForFavorite(patientId, kind, itemId, false);
    if (kind === 'recipe') {
      const recipes = await listAssignedRecipes(patientId, false);
      const recipe = recipes.find((row) => row.id === itemId);
      if (!recipe) throw new CareError(403, 'No tenés permiso para esta acción.');
      title = recipe.title;
    }
    putFavorite({
      id: newResourceId(),
      patient_id: patientId,
      item_kind: kind,
      item_id: itemId,
      title: title ?? itemId,
      created_at: new Date().toISOString(),
    });
    return memorySnapshot(patientId, false);
  }
  return asLibraryView(await rpc('toggle_favorite', {
    target_patient: patientId,
    input_kind: kind,
    input_item: itemId,
  }), patientId);
}

export async function saveEditorialDraft(
  slug: string,
  title: string,
  summary: string,
  category: string,
  sections: EditorialResource['sections'],
  persistent: boolean,
  professional: boolean,
): Promise<EditorialResource> {
  if (!professional) throw new CareError(403, 'Sólo una profesional puede crear un artículo.');
  if (!persistent) {
    if (findResource(slug)) throw new CareError(400, 'Revisá el recurso, la autoría y las reglas de publicación.');
    const entry: EditorialResource = {
      id: newResourceId(),
      slug,
      kind: 'clinical',
      nutritionist_id: 'nutri-demo',
      title,
      category,
      eyebrow: 'BORRADOR',
      summary,
      minutes: 3,
      icon: 'sparkle',
      tags: [],
      sections,
      related: [],
      action_label: '',
      action_page: '',
      author_name: 'Equipo editorial Plan V',
      reviewed_at: null,
      published: false,
      license_kind: 'placeholder',
      license_note: 'Borrador sin publicar. Sin imagen remota.',
      cover_url: null,
    };
    putResource(entry);
    return entry;
  }
  const parsed = asResource(await rpc('save_editorial_resource', {
    input_slug: slug,
    input_title: title,
    input_summary: summary,
    input_category: category,
    input_sections: sections,
    input_kind: 'clinical',
  }));
  if (!parsed) throw new CareError(503, 'No se pudo guardar el recurso. Reintentá en un momento.');
  return parsed;
}

export async function publishEditorial(id: string, persistent: boolean, professional: boolean): Promise<EditorialResource> {
  if (!professional) throw new CareError(403, 'Sólo una profesional puede publicar un artículo.');
  if (!persistent) {
    const current = findResource(id);
    if (!current || current.nutritionist_id !== 'nutri-demo') throw new CareError(404, 'No encontramos ese recurso.');
    if (!current.sections.length || !current.author_name.trim()) {
      throw new CareError(400, 'Revisá el recurso, la autoría y las reglas de publicación.');
    }
    const published: EditorialResource = {
      ...current,
      published: true,
      reviewed_at: new Date().toISOString(),
      eyebrow: 'ARTÍCULO REVISADO',
    };
    putResource(published);
    return published;
  }
  const parsed = asResource(await rpc('publish_editorial_resource', { target: id }));
  if (!parsed) throw new CareError(503, 'No se pudo guardar el recurso. Reintentá en un momento.');
  return parsed;
}

export function knownResourceSlug(value: string) {
  return Boolean(findResource(value));
}
