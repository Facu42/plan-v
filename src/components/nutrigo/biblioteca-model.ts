import type { Patient } from '../../types';
import type { EditorialResource } from '../../types/resources';

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
