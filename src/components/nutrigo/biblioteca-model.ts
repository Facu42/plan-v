import type { Patient } from '../../types';
import type { EditorialResource } from '../../types/resources';

export const LIBRARY_RESOURCE_TYPES = ['Guía', 'Video', 'PDF'] as const;
export type LibraryResourceType = typeof LIBRARY_RESOURCE_TYPES[number];
const categories: Record<LibraryResourceType, string> = { 'Guía': 'guia', Video: 'video', PDF: 'pdf' };

/** Las categorías temáticas anteriores son guías; el rótulo v29 siempre es un tipo. */
export function libraryResourceType(category: string): LibraryResourceType {
  const value = category.trim().toLowerCase();
  return value === 'video' ? 'Video' : value === 'pdf' ? 'PDF' : 'Guía';
}

export function libraryResourceDraft(slug: string, title: string, type: LibraryResourceType, summary: string) {
  return { slug, title: title.trim(), category: categories[type], summary: summary.trim(),
    sections: [{ title: 'Recurso del consultorio', body: summary.trim() }] };
}

export function assignedReaders(resource: EditorialResource | null, patients: Patient[]) {
  if (!resource) return [];
  return patients.flatMap(patient => {
    const assignment = patient.resource_assignments?.find(item => item.resource_id === resource.slug || item.resource_id === resource.id);
    return assignment ? [{ patient, assignment }] : [];
  });
}

export function assignablePatients(resource: EditorialResource | null, patients: Patient[]) {
  if (!resource?.published) return [];
  const assigned = new Set(assignedReaders(resource, patients).map(row => row.patient.id));
  return patients.filter(patient => !assigned.has(patient.id));
}
