import type { AppointmentHistoryEntry } from '../../types';
import { patientRecordLabels } from '../../features/nutrigo/secondaryTranslation';
import { PATIENT_RECORD_SECTION_IDS } from '../../types/patient-preview';

/** Las diez secciones clínicas conviven con los accesos operativos de Nutridash. */
const SECTION_IDS = PATIENT_RECORD_SECTION_IDS;
export const RECORD_TABS = SECTION_IDS.map(id => [id, patientRecordLabels[id]] as const);
export type RecordTab = typeof RECORD_TABS[number][0];
const PRIMARY_IDS=['resumen','historia','evolucion','notas','plan','alimentario','laboratorio','archivos','consultas','cobros','chat'] as const;
export type RecordPrimaryTab=typeof PRIMARY_IDS[number];
export const RECORD_PRIMARY_TABS=PRIMARY_IDS.map(id=>[id,id==='plan'?'Plan':patientRecordLabels[id]] as const);
export const RECORD_PLAN_TABS=(['plan','semanal','planificacion','compras'] as const).map(id=>[id,patientRecordLabels[id]] as const);
export function recordPrimaryTab(tab:RecordTab):RecordPrimaryTab {
  return tab==='semanal'||tab==='planificacion'||tab==='compras'?'plan':tab;
}
const LEGACY: Record<string, RecordTab> = { ingreso: 'historia', registros: 'evolucion', mensajes: 'chat' };
export function recordTab(value: string | null): RecordTab {
  if (value && Object.prototype.hasOwnProperty.call(LEGACY, value)) return LEGACY[value];
  return RECORD_TABS.some(([id]) => id === value) ? value as RecordTab : 'resumen';
}

/** Un horario vencido nunca prueba asistencia ni una consulta clínica finalizada. */
export function appointmentRecordSummary(history: readonly AppointmentHistoryEntry[] = []) {
  return {
    elapsed: new Set(history.filter(row => row.action === 'elapsed').map(row => row.id)).size,
    confirmed: new Set(history.filter(row => row.action === 'confirmed').map(row => row.id)).size,
  };
}

export type DocumentSection = 'files' | 'laboratory';
export function documentInSection(data: { kind: string; document_kind?: string }, section: DocumentSection): boolean {
  return section === 'laboratory'
    ? data.kind === 'clinical_document' && data.document_kind === 'laboratorio'
    : data.kind === 'clinical_document' || data.kind === 'body_photo';
}
