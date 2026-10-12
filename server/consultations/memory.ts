import { randomUUID } from 'node:crypto';
import { CareError } from '../care/errors.js';
import type { ConsultationCommand, ConsultationScope, ConsultationSession, ConsultationSharedSummary, ConsultationTask, ConsultationView } from '../../src/types/consultations.js';

export const sessions = new Map<string, ConsultationSession>();
export const shared = new Map<string, ConsultationSharedSummary>();
export const tasks = new Map<string, ConsultationTask>();
export function resetConsultationMemory() { sessions.clear(); shared.clear(); tasks.clear(); }
export function consultationMemoryView(patientId: string, professional: boolean): ConsultationView {
  return structuredClone({ sessions: professional ? [...sessions.values()].filter(s => s.patient_id === patientId) : [], shared: [...shared.values()].filter(s => s.patient_id === patientId).sort((a,b) => b.version-a.version), tasks: professional ? [...tasks.values()].filter(t => t.patient_id === patientId).map(({id, session_id, kind, index, status, error}) => ({id, session_id, kind, index, status, error})) : [] });
}
// Memory is only reachable after the same auth/demo gate as the rest of the API.
export function commandMemory(scope: ConsultationScope, input: Omit<ConsultationCommand, 'id'> & {id: string} | Record<string, unknown>): ConsultationSession {
  const id = String(input.id);
  if (input.action === 'start') {
    if (sessions.has(id)) { const s = sessions.get(id)!; if (s.patient_id !== scope.patientId || s.nutritionist_id !== scope.nutritionistId) throw new CareError(403, 'No tenés permiso.'); return structuredClone(s); }
    const s: ConsultationSession = { id, patient_id: scope.patientId, nutritionist_id: scope.nutritionistId, appointment_id: typeof input.appointment_id === 'string' ? input.appointment_id : null, source: input.source as ConsultationSession['source'], status: input.source === 'capture' ? 'recording' : 'finished', revision: 1, started_at: new Date().toISOString(), finished_at: null, duration_seconds: 0, microphone: Boolean(input.microphone), remote_audio: Boolean(input.remote_audio), incomplete: input.source === 'capture' && (!input.microphone || !input.remote_audio), transcript: '', draft: '', manual_transcript: false };
    sessions.set(id,s); return structuredClone(s);
  }
  const s = sessions.get(id);
  if (!s || s.patient_id !== scope.patientId || s.nutritionist_id !== scope.nutritionistId) throw new CareError(404, 'Consulta no encontrada.');
  if (s.revision !== input.expected_revision) throw new CareError(409, 'La consulta cambió. Recargá antes de guardar.');
  if (input.action === 'publish') {
    const version = [...shared.values()].filter(r => r.session_id === id).length + 1;
    const row: ConsultationSharedSummary = { id: randomUUID(), session_id: id, patient_id: s.patient_id, version, summary: String(input.summary), published_at: new Date().toISOString(), consultation_date: s.started_at };
    shared.set(row.id, row); return structuredClone(s);
  }
  if (input.action === 'finish') { s.status = 'finished'; s.finished_at = new Date().toISOString(); s.incomplete ||= Boolean(input.interrupted); s.revision++; }
  if (input.action === 'draft') { s.draft = String(input.draft); if (typeof input.transcript === 'string') { if ([...tasks.values()].some(t => t.session_id === id && t.kind === 'chunk' && ['queued','running'].includes(t.status))) throw new CareError(409, 'Esperá a que termine la transcripción.'); s.transcript = input.transcript; s.manual_transcript = true; } s.revision++; }
  if (input.action === 'summarize') {
    if (s.status !== 'finished' || !s.transcript.trim() || [...tasks.values()].some(t => t.session_id === id && t.kind === 'chunk' && ['queued','running','uploading'].includes(t.status))) throw new CareError(409, 'Terminá la consulta y esperá la transcripción antes de resumir.');
    const old = [...tasks.values()].find(t => t.session_id === id && t.kind === 'summary' && t.revision === s.revision);
    if (!old) { const task: ConsultationTask = { id: randomUUID(), session_id: id, patient_id: s.patient_id, nutritionist_id: scope.nutritionistId, requested_by: scope.requestedBy, kind: 'summary', revision: s.revision, index: 0, status: 'queued', audio_path: null, expires_at: null, duration_seconds: 0, audio_sha256: null, run_token: null, lease_until: null, attempts: 0, text: '', error: null, consent_version: 'ai_consultation.v1' }; tasks.set(task.id, task); }
    else if (old.status === 'failed') { old.status = 'queued'; old.error = null; }
  }
  return structuredClone(s);
}
