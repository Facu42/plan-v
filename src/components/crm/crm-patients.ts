import type { Patient } from '../../types';

export type PatientDirectoryFilter = 'active' | 'attention' | 'archived';

function normalizedSearch(patient: Patient): string {
  return [patient.name, patient.status, patient.goal, patient.next_focus]
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function filterDirectoryPatients(
  patients: Patient[],
  query: string,
  filter: PatientDirectoryFilter,
): Patient[] {
  const term = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return patients.filter((patient) => {
    const archived = Boolean(patient.archived_at);
    const matchesFilter = filter === 'archived'
      ? archived
      : filter === 'attention'
        ? !archived && patient.adherence_score < 70
        : !archived;
    return matchesFilter && (!term || normalizedSearch(patient).includes(term));
  });
}

export function getPatientDirectoryMetrics(patients: Patient[]) {
  const activePatients = patients.filter((patient) => !patient.archived_at);
  return {
    active: activePatients.length,
    attention: activePatients.filter((patient) => patient.adherence_score < 70).length,
    archived: patients.length - activePatients.length,
    appointments: activePatients.filter((patient) => patient.appointment).length,
  };
}
