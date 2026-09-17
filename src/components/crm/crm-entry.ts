import type { Patient } from '../../types';
import type { CrmModule } from './CrmModuleView';

export type CrmEntry = {
  patientId: string;
  module: CrmModule;
  tab?: 'resumen' | 'comidas' | 'plan' | 'consultas';
};

// Navigation only, not authorization. The existing API remains the access boundary.
export function resolveCrmEntry(patients: Pick<Patient, 'id' | 'archived_at'>[], requested?: CrmEntry): Required<CrmEntry> | null {
  const patient = requested
    ? patients.find((p) => p.id === requested.patientId && !p.archived_at)
    : patients.find((p) => !p.archived_at);
  if (!patient) return null;
  const module = requested?.module ?? 'fichas';
  return { patientId: patient.id, module, tab: module === 'fichas' ? requested?.tab ?? 'resumen' : 'resumen' };
}
