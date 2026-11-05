// Texto de cada evaluación guardada (laboratorio, bioimpedancia, Kerr, bariátrica y pedidos de estudios).
// Lo usan la ficha (pantalla y PDF) y la descarga de todos los datos del consultorio, para que digan lo mismo.
import { SEGMENT_LABELS, type ClinicalWorkspaceRecord } from '../types/clinical-workspace';
import { bariatricSummary, kerrSummary } from './clinical-workspace';

export const METHOD_LABEL = { segmental: 'Bioimpedancia segmental', kerr: 'Antropometría Kerr', bariatric: 'Seguimiento bariátrico' };
export const COMPONENT_LABEL = { muscle: 'Músculo', fat: 'Grasa', water: 'Agua', impedance: 'Impedancia' };
export const MASS_LABEL = { skin: 'Piel', adipose: 'Adiposa', muscle: 'Muscular', bone: 'Ósea', residual: 'Residual' };

function clinicalRecordLines(record: ClinicalWorkspaceRecord): string[] {
  const d = record.data;
  if (d.kind === 'laboratory') return d.values.map(v => `${v.name}: ${v.raw_value} ${v.unit}; rango del informe: ${v.range_text || 'sin informar'}; página ${v.page}.`);
  if (d.kind === 'segmental') return [`Equipo: ${d.device}`, ...d.values.map(v => `${SEGMENT_LABELS[v.segment]} · ${COMPONENT_LABEL[v.component]}: ${v.value} ${v.unit}. Original: ${v.original}`)];
  if (d.kind === 'kerr') {
    const summary = kerrSummary(d.components_kg, d.weight_kg);
    return ['Resultados declarados por la profesional; sin cálculo automático.', `Peso: ${d.weight_kg} kg; ${summary.complete ? `suma de masas ${summary.total_kg} kg; diferencia con peso ${summary.difference_kg} kg` : 'evaluación incompleta: faltan masas'}`, ...Object.entries(d.components_kg).map(([k, v]) => `${MASS_LABEL[k as keyof typeof MASS_LABEL]}: ${v ?? 'sin dato'} kg`), `Originales: ${d.original_measurements}`];
  }
  if (d.kind === 'bariatric') {
    const s = bariatricSummary(d.preop_kg, d.current_kg, d.reference_kg);
    return [`Cirugía: ${d.surgery_type || 'sin especificar'} · ${d.surgery_date ?? 'sin fecha'}`, `Peso preoperatorio ${d.preop_kg} kg; actual ${d.current_kg} kg. Cambio: ${s.lost_kg.toFixed(2)} kg; pérdida total ${s.total_loss_pct.toFixed(2)}%.`, s.excess_loss_pct === null ? 'Pérdida de exceso no calculada: falta una referencia válida.' : `Referencia ${d.reference_kg} kg; pérdida de exceso ${s.excess_loss_pct.toFixed(2)}%.`, `Seguimiento: ${d.symptoms || 'sin nota'}`, `Suplementación: ${d.supplements || 'sin registro'}`, `Próxima revisión: ${d.next_review ?? 'sin fecha'}`];
  }
  return [...d.studies, `Motivo: ${d.reason || 'sin especificar'}`, `Indicaciones: ${d.instructions || 'sin especificar'}`];
}

export function recordLines(record: ClinicalWorkspaceRecord): string[] {
  const ref = record.reference_snapshot;
  return [...clinicalRecordLines(record), ...(ref ? [`Referencia aprobada: ${ref.title}. ${ref.source_url}; validada el ${ref.approved_at}.`] : [])];
}

export function historyTitle(record: ClinicalWorkspaceRecord) {
  return record.data.kind === 'laboratory' ? 'Laboratorio' : record.data.kind === 'study_order' ? 'Pedido de estudios' : METHOD_LABEL[record.data.kind];
}
