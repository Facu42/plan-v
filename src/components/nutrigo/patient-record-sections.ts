import type { AppointmentHistoryEntry, Stage } from '../../types';
import { patientRecordLabels } from '../../features/nutrigo/secondaryTranslation';

/** Las diez secciones clínicas conviven con los accesos operativos de Plan V. */
const SECTION_IDS = ['resumen', 'historia', 'evolucion', 'notas', 'plan', 'semanal', 'compras', 'alimentario', 'chat', 'archivos', 'laboratorio', 'planificacion', 'consultas', 'cobros'] as const;
export const RECORD_TABS = SECTION_IDS.map(id => [id, patientRecordLabels[id]] as const);
export type RecordTab = typeof RECORD_TABS[number][0];

/** Cuatro pestañas fijas. El resto sigue en la ficha, bajo «Más de esta paciente». */
export const RECORD_PRIMARY = [
  ['resumen', 'Resumen'],
  ['alimentario', 'Registro'],
  ['plan', 'Plan'],
  ['consultas', 'Consultas'],
] as const satisfies ReadonlyArray<readonly [RecordTab, string]>;
const PRIMARY_IDS = new Set<RecordTab>(RECORD_PRIMARY.map(([id]) => id));
export const RECORD_MORE = RECORD_TABS.filter(([id]) => !PRIMARY_IDS.has(id));
const LEGACY: Record<string, RecordTab> = { ingreso: 'historia', registros: 'evolucion', mensajes: 'chat' };
const CONSULTA: Record<Stage, string> = {
  ingreso: 'Consulta de ingreso',
  plan: 'Consulta de plan',
  seguimiento: 'Consulta de seguimiento',
  alta: 'Consulta de alta',
};
export function consultaNombre(stage: Stage): string {
  return CONSULTA[stage] ?? 'Consulta';
}

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
