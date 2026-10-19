import type { PatientQuickPreview, PatientRecordSection, PatientRowPreview } from '../../src/types/patient-preview.js';
import { PATIENT_RECORD_SECTION_IDS } from '../../src/types/patient-preview.js';
import { currentCareConsents } from '../care/consents.js';
import { CareError } from '../care/errors.js';
import { listMeasurements } from '../care/repository.js';
import { getRequestDb } from '../db/supabase-client.js';
import { getPatientPlanPreview } from '../plans/repository.js';
import { shared } from '../consultations/memory.js';
import { summarizeLedger, formatPesos } from '../../src/fees.js';
import { buildWorkItems, loadWorkSnapshot, queueDbError, type WorkScope } from './repository.js';

export async function loadPatientQuickPreview(scope: WorkScope, patientId: string, now = new Date()): Promise<PatientQuickPreview> {
  const patient = scope.patients.find(p => p.id === patientId);
  if (!patient || patient.deactivated_at || patient.anonymized_at) throw new CareError(403, 'Esa paciente no está disponible en tu consultorio.');
  const empty: PatientQuickPreview = { patient_id: patientId, generated_at: now.toISOString(), can_open: !patient.archived_at, source: scope.persistent ? 'supabase' : 'memory', latest_weight: null, plan: { status: 'none', period_start: null, period_end: null, has_draft: false }, last_consultation: null, sections: PATIENT_RECORD_SECTION_IDS.map(id => ({ id, summary: 'Ficha archivada · restaurala para continuar' })) };
  if (patient.archived_at) return empty;
  const bundle = await currentCareConsents(patientId, scope.persistent);
  const canMeasure = bundle.consented.includes('measurement');
  const canCare = bundle.consented.includes('care_relationship');
  const canDocuments = bundle.consented.includes('clinical_document');
  const canPhotos = bundle.consented.includes('body_progress');
  const scoped = { ...scope, patients: [patient] };
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(now);
  const lastSummary = async (): Promise<PatientQuickPreview['last_consultation']> => {
    if (!canCare) return null;
    if (!scope.persistent) {
      const note = [...shared.values()].filter(n => n.patient_id === patientId).sort((a,b) => b.published_at.localeCompare(a.published_at))[0];
      return note ? { summary: note.summary.slice(0,300) + (note.summary.length > 300 ? '…' : ''), date: note.consultation_date } : null;
    }
    const result = await getRequestDb().from('consultation_shared_summaries').select('summary,consultation_date').eq('patient_id', patientId).order('published_at', { ascending: false }).range(0,0);
    queueDbError(result.error);
    const row = result.data?.[0]; const text = String(row?.summary ?? '');
    return row ? { summary: text.slice(0,300) + (text.length > 300 ? '…' : ''), date: String(row.consultation_date) } : null;
  };
  const [snapshot, weight, plan, note] = await Promise.all([loadWorkSnapshot(scoped), loadLatestWeight(patientId, scope.persistent, canMeasure, today), getPatientPlanPreview(scope.nutritionistId, patientId, scope.persistent), lastSummary()]);
  const items = buildWorkItems(scoped, snapshot, now);
  const pending = (kind: string) => items.filter(i => i.kind === kind).length;
  const ledger = snapshot.ledgers.find(l => l.patient_id === patientId);
  const fee = ledger ? summarizeLedger(ledger, today) : null;
  const planLabel = { none: 'Sin plan', draft: 'Borrador', published: 'Publicado', scheduled: 'Programado' }[plan.status];
  const summaries: Record<PatientRecordSection,string> = {
    resumen: `${items.length} pendientes de revisión`,
    historia: bundle.intake.status === 'reviewed' ? 'Ingreso revisado' : bundle.intake.status === 'submitted' ? 'Ingreso por revisar' : 'Ingreso sin completar',
    evolucion: !canMeasure ? 'Permiso de medidas pendiente' : weight ? `${weight.value.toLocaleString('es-AR')} ${weight.unit}` : 'Sin mediciones',
    notas: !canCare ? 'Permiso de atención pendiente' : note ? `Resumen del ${note.date.slice(0,10).split('-').reverse().join('/')}` : 'Sin resumen publicado',
    plan: planLabel,
    semanal: plan.period_start && plan.period_end ? `${plan.period_start.split('-').reverse().join('/')} → ${plan.period_end.split('-').reverse().join('/')}` : 'Sin semana planificada',
    compras: plan.status === 'published' ? 'Lista del plan publicado' : 'Sin plan publicado',
    alimentario: `${pending('meal')} comidas por revisar`,
    chat: `${pending('message')} mensajes sin leer`,
    archivos: !canDocuments && !canPhotos ? 'Permiso de archivos pendiente' : `${snapshot.records.filter(r => (r.kind === 'clinical_document' && canDocuments) || (r.kind === 'body_photo' && canPhotos)).length} archivos por revisar`,
    laboratorio: !canDocuments ? 'Permiso de estudios pendiente' : `${snapshot.records.filter(r => r.kind === 'clinical_document' && r.document_kind === 'laboratorio').length} estudios por revisar`,
    planificacion: plan.has_draft ? 'Hay un borrador para revisar' : planLabel,
    consultas: `${snapshot.appointments.filter(a => a.status === 'scheduled' && a.starts_at >= now.toISOString()).length} consultas próximas`,
    cobros: !fee ? 'Sin cuota configurada' : fee.owed > 0 ? `Debe ${formatPesos(fee.owed)}` : fee.pending_reports ? `${fee.pending_reports} pagos por confirmar` : 'Sin deuda vencida',
  };
  return { ...empty, latest_weight: weight, plan, last_consultation: note, sections: PATIENT_RECORD_SECTION_IDS.map(id => ({ id, summary: summaries[id] })) };
}

async function loadLatestWeight(patientId: string, persistent: boolean, canMeasure: boolean, today: string): Promise<PatientQuickPreview['latest_weight']> {
    if (!canMeasure) return null;
    if (!persistent) {
      const weight = (await listMeasurements(patientId, false)).find(m => m.kind === 'weight' && m.captured_on <= today);
      return weight ? { value: weight.value_numeric, unit: weight.unit, captured_on: weight.captured_on } : null;
    }
    const result = await getRequestDb().from('measurements').select('value_numeric,unit,captured_on').eq('patient_id', patientId).eq('kind','weight').lte('captured_on', today).order('captured_on', { ascending: false }).order('created_at', { ascending: false }).range(0,0);
    queueDbError(result.error);
    const row = result.data?.[0];
    return row ? { value: Number(row.value_numeric), unit: String(row.unit), captured_on: String(row.captured_on) } : null;
}

export async function loadPatientRowPreview(scope: WorkScope, patientId: string): Promise<PatientRowPreview> {
  const patient = scope.patients.find(p => p.id === patientId);
  if (!patient || patient.deactivated_at || patient.anonymized_at) throw new CareError(403, 'Esa paciente no está disponible en tu consultorio.');
  const empty: PatientRowPreview = { patient_id: patientId, can_open: !patient.archived_at, latest_weight: null, plan: { status: 'none', period_start: null, period_end: null, has_draft: false } };
  if (patient.archived_at) return empty;
  const bundle = await currentCareConsents(patientId, scope.persistent);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  const [latest_weight, plan] = await Promise.all([loadLatestWeight(patientId, scope.persistent, bundle.consented.includes('measurement'), today), getPatientPlanPreview(scope.nutritionistId, patientId, scope.persistent)]);
  return { ...empty, latest_weight, plan };
}
