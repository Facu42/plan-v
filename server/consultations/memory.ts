import { randomUUID } from 'node:crypto';
import { CareError } from '../care/errors.js';
import type { ConsultationCommand, ConsultationScope, ConsultationSession, ConsultationSharedSummary, ConsultationTask, ConsultationView,ConsultationCompletion,ConsultationCompletionEvent,ConsultationCompletionInput,ConsultationAppointmentCompletion } from '../../src/types/consultations.js';

export const sessions = new Map<string, ConsultationSession>();
export const shared = new Map<string, ConsultationSharedSummary>();
export const tasks = new Map<string, ConsultationTask>();
export const completions=new Map<string,ConsultationCompletion>();
export const completion_events=new Map<string,ConsultationCompletionEvent>();
export function resetConsultationMemory() { sessions.clear(); shared.clear(); tasks.clear();completions.clear();completion_events.clear(); }
export function completeAppointmentMemory(scope:ConsultationScope,input:ConsultationCompletionInput,appointment:ConsultationAppointmentCompletion,clock=new Date()):ConsultationCompletion{
 const previous=completions.get(input.appointment_id);
 if(appointment.appointment_id!==input.appointment_id)throw new CareError(403,'No tenés permiso para ese turno.');
 if(input.confirmed!==true||input.expected_revision<0)throw new CareError(400,'Confirmá la acción sobre la consulta.');
 if(previous&&(previous.patient_id!==scope.patientId||previous.nutritionist_id!==scope.nutritionistId))throw new CareError(403,'No tenés permiso para ese turno.');
 if((previous?.revision??0)!==input.expected_revision||previous?.completed===input.completed||!previous&&!input.completed)throw new CareError(409,'La consulta cambió. Recargá antes de confirmar.');
 if(input.completed&&(!['scheduled','done'].includes(appointment.status)||!Number.isFinite(Date.parse(appointment.starts_at))||Date.parse(appointment.starts_at)>=clock.getTime()))throw new CareError(409,'Sólo podés confirmar una consulta realizada de un turno pasado vigente.');
 const result:ConsultationCompletion={appointment_id:input.appointment_id,patient_id:scope.patientId,nutritionist_id:scope.nutritionistId,appointment_starts_at:appointment.starts_at,completed:input.completed,revision:input.expected_revision+1,marked_at:clock.toISOString(),marked_by:scope.requestedBy};
 completions.set(result.appointment_id,result);const event:ConsultationCompletionEvent={id:randomUUID(),appointment_id:result.appointment_id,patient_id:scope.patientId,nutritionist_id:scope.nutritionistId,appointment_starts_at:appointment.starts_at,revision:result.revision,completed:result.completed,actor_id:scope.requestedBy,recorded_at:result.marked_at};completion_events.set(event.id,event);return structuredClone(result);
}
export function consultationMemoryView(patientId: string, professional: boolean): ConsultationView {
  return structuredClone({ sessions: professional ? [...sessions.values()].filter(s => s.patient_id === patientId) : [], shared: [...shared.values()].filter(s => s.patient_id === patientId).sort((a,b) => b.version-a.version), tasks: professional ? [...tasks.values()].filter(t => t.patient_id === patientId).map(({id, session_id, kind, index, status, error,summary_steps}) => ({id, session_id, kind, index, status, error,completed_steps:summary_steps?.length??0})) : [] });
}
// Memory is only reachable after the same auth/demo gate as the rest of the API.
export function commandMemory(scope: ConsultationScope, input: ConsultationCommand): ConsultationSession {
  const id = String(input.id);
  if (input.action === 'start') {
    if (sessions.has(id)) { const s = sessions.get(id)!; if (s.patient_id !== scope.patientId || s.nutritionist_id !== scope.nutritionistId) throw new CareError(403, 'No tenés permiso.'); return structuredClone(s); }
    const s: ConsultationSession = { id, patient_id: scope.patientId, nutritionist_id: scope.nutritionistId, appointment_id: typeof input.appointment_id === 'string' ? input.appointment_id : null, source: input.source as ConsultationSession['source'], status: input.source !== 'manual' ? 'recording' : 'finished', revision: 1, started_at: new Date().toISOString(), finished_at: null, duration_seconds: 0, microphone: Boolean(input.microphone), remote_audio: Boolean(input.remote_audio), incomplete: input.source === 'capture' && (!input.microphone || !input.remote_audio), transcript: '', draft: '', manual_transcript: false };
    sessions.set(id,s); return structuredClone(s);
  }
  const s = sessions.get(id);
  if (!s || s.patient_id !== scope.patientId || s.nutritionist_id !== scope.nutritionistId) throw new CareError(404, 'Consulta no encontrada.');
  if (s.revision !== input.expected_revision) throw new CareError(409, 'La consulta cambió. Recargá antes de guardar.');
  if(input.action==='retry'){const t=tasks.get(input.task_id);if(!t||t.session_id!==id||t.status!=='failed'||(t.kind==='chunk'&&Date.parse(t.expires_at??'')<=Date.now()))throw new CareError(409,'Ese trabajo no se puede reintentar. Cargá de nuevo el audio o la transcripción.');t.status='queued';t.error=null;t.attempts=0;t.request_history=[...(t.request_history??[]),t.request_key];t.request_key=randomUUID();return structuredClone(s);}
  if (input.action === 'publish') {
    const version = [...shared.values()].filter(r => r.session_id === id).length + 1;
    const row: ConsultationSharedSummary = { id: randomUUID(), session_id: id, patient_id: s.patient_id, version, summary: String(input.summary), published_at: new Date().toISOString(), consultation_date: s.started_at };
    shared.set(row.id, row); return structuredClone(s);
  }
  if (input.action === 'finish') { s.status = 'finished';s.expected_chunks=input.expected_chunks??s.expected_chunks;s.finished_at = new Date().toISOString(); s.incomplete ||= Boolean(input.interrupted); s.revision++; }
  if (input.action === 'draft') { s.draft = String(input.draft); if (typeof input.transcript === 'string') { if ([...tasks.values()].some(t => t.session_id === id && t.kind === 'chunk' && ['queued','running'].includes(t.status))) throw new CareError(409, 'Esperá a que termine la transcripción.'); s.transcript = input.transcript; s.manual_transcript = true; } s.revision++; }
  if (input.action === 'summarize') {
    if (s.status !== 'finished' || !s.transcript.trim() || [...tasks.values()].some(t => t.session_id === id && t.kind === 'chunk' && ['queued','running','uploading'].includes(t.status))) throw new CareError(409, 'Terminá la consulta y esperá la transcripción antes de resumir.');
    const old = [...tasks.values()].find(t => t.session_id === id && t.kind === 'summary' && t.revision === s.revision);
    if(old?.status==='cancelled'){old.request_history=[...(old.request_history??[]),old.request_key];old.request_key=randomUUID();old.status='queued';old.attempts=0;old.error=null;old.run_token=null;old.lease_until=null;}
    if (!old) { const task: ConsultationTask = { id: randomUUID(), request_key: randomUUID(), session_id: id, patient_id: s.patient_id, nutritionist_id: scope.nutritionistId, requested_by: scope.requestedBy, kind: 'summary', revision: s.revision, index: 0, status: 'queued', audio_path: null, expires_at: null, duration_seconds: 0, audio_sha256: null, run_token: null, lease_until: null, attempts: 0, text: '', error: null, consent_version: 'ai_consultation.v1' }; tasks.set(task.id, task); }
  }
  return structuredClone(s);
}
