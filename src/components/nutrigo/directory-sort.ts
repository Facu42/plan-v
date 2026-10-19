import type { Patient } from '../../types';
import { homeAppointments } from '../../lib/panel-home';
export type DirectoryOrder = 'appointment' | 'name' | 'adherence';
export function sortDirectoryPatients(patients: Patient[], order: DirectoryOrder, now = new Date()) {
  const times = order === 'appointment' ? new Map(patients.map(patient => [patient.id, homeAppointments([patient], now).next?.at.getTime() ?? Infinity])) : new Map<string,number>();
  return [...patients].sort((a,b) => (order === 'appointment' ? times.get(a.id)! - times.get(b.id)! : order === 'adherence' ? a.adherence_score - b.adherence_score : 0) || a.name.localeCompare(b.name,'es-AR'));
}
