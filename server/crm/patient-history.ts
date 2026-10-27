import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { requireCareConsent } from '../care/consents.js';
import { argentinaToday } from '../progress/derive.js';
import type { WorkScope } from './repository.js';

export const HISTORY_TOPICS = ['motivo', 'diag', 'med', 'alerg', 'fam', 'halim', 'r24', 'hab', 'act', 'sue', 'dig', 'ciclo', 'emb', 'pref'] as const;
export const HISTORY_SOURCES = ['professional', 'patient', 'import', 'recording', 'form'] as const;
export type HistoryEntry = {
  id: string;
  topic: (typeof HISTORY_TOPICS)[number];
  text: string;
  since: string;
  source: (typeof HISTORY_SOURCES)[number];
  recorded_on: string;
  edited_on: string | null;
  ended_on: string | null;
  ended_reason: string;
};
export const MAX_HISTORY_ENTRIES = 400;

export const historyEntryBodySchema = z.object({
  topic: z.enum(HISTORY_TOPICS),
  text: z.string().trim().min(1).max(600),
  since: z.string().trim().max(40).default(''),
}).strict();
export const historyEditBodySchema = z.object({
  text: z.string().trim().min(1).max(600),
  since: z.string().trim().max(40).optional(),
}).strict();
export const historyEndBodySchema = z.object({ reason: z.string().trim().max(200).default('') }).strict();

const memory = new Map<string, HistoryEntry[]>();
const key = (scope: WorkScope, patientId: string) => `${scope.nutritionistId}:${patientId}`;
const COLUMNS = 'id,topic,body,since_text,source,recorded_on,edited_on,ended_on,ended_reason';

type Row = Record<string, unknown>;
const fromRow = (row: Row): HistoryEntry => ({
  id: String(row.id), topic: row.topic as HistoryEntry['topic'], text: String(row.body), since: String(row.since_text ?? ''),
  source: row.source as HistoryEntry['source'], recorded_on: String(row.recorded_on), edited_on: row.edited_on ? String(row.edited_on) : null,
  ended_on: row.ended_on ? String(row.ended_on) : null, ended_reason: String(row.ended_reason ?? ''),
});

async function assertAccess(scope: WorkScope, patientId: string) {
  if (!scope.patients.some(p => p.id === patientId && !p.deactivated_at && !p.anonymized_at)) throw new CareError(403, 'Esa paciente no está disponible en tu consultorio.');
  await requireCareConsent(patientId, scope.persistent, 'care_relationship');
}

export async function listHistory(scope: WorkScope, patientId: string): Promise<HistoryEntry[]> {
  await assertAccess(scope, patientId);
  if (!scope.persistent) return [...(memory.get(key(scope, patientId)) ?? [])];
  const { data, error } = await getRequestDb().from('patient_history_entries').select(COLUMNS).eq('nutritionist_id', scope.nutritionistId).eq('patient_id', patientId).order('recorded_on').order('created_at').order('id').limit(MAX_HISTORY_ENTRIES);
  if (error) throw new CareError(503, 'No pudimos leer la historia clínica. Probá de nuevo.');
  return (data ?? []).map(fromRow);
}

export async function addHistoryEntry(scope: WorkScope, patientId: string, input: z.infer<typeof historyEntryBodySchema>, now = new Date()): Promise<HistoryEntry[]> {
  const current = await listHistory(scope, patientId);
  if (current.length >= MAX_HISTORY_ENTRIES) throw new CareError(409, 'La historia clínica llegó al máximo de datos. Dá de baja los que ya no valen.');
  const today = argentinaToday(now);
  if (!scope.persistent) {
    memory.set(key(scope, patientId), [...current, { id: randomUUID(), topic: input.topic, text: input.text, since: input.since, source: 'professional', recorded_on: today, edited_on: null, ended_on: null, ended_reason: '' }]);
    return listHistory(scope, patientId);
  }
  const { error } = await getRequestDb().from('patient_history_entries').insert({ nutritionist_id: scope.nutritionistId, patient_id: patientId, topic: input.topic, body: input.text, since_text: input.since, source: 'professional', recorded_on: today });
  if (error) throw new CareError(503, 'No pudimos guardar el dato. Probá de nuevo.');
  return listHistory(scope, patientId);
}

async function changeEntry(scope: WorkScope, patientId: string, entryId: string, change: (entry: HistoryEntry) => HistoryEntry, columns: (entry: HistoryEntry) => Row): Promise<HistoryEntry[]> {
  const current = await listHistory(scope, patientId);
  const found = current.find(entry => entry.id === entryId);
  if (!found) throw new CareError(404, 'No encontramos ese dato de la historia.');
  if (found.ended_on) throw new CareError(409, 'Ese dato ya se dio de baja.');
  const next = change(found);
  if (!scope.persistent) {
    memory.set(key(scope, patientId), current.map(entry => entry.id === entryId ? next : entry));
    return listHistory(scope, patientId);
  }
  const { error } = await getRequestDb().from('patient_history_entries').update(columns(next)).eq('nutritionist_id', scope.nutritionistId).eq('patient_id', patientId).eq('id', entryId).is('ended_on', null);
  if (error) throw new CareError(503, 'No pudimos guardar el cambio. Probá de nuevo.');
  return listHistory(scope, patientId);
}

export const editHistoryEntry = (scope: WorkScope, patientId: string, entryId: string, input: z.infer<typeof historyEditBodySchema>, now = new Date()) =>
  changeEntry(scope, patientId, entryId, entry => ({ ...entry, text: input.text, since: input.since ?? entry.since, edited_on: argentinaToday(now) }),
    entry => ({ body: entry.text, since_text: entry.since, edited_on: entry.edited_on }));

/** Dar de baja no borra: el dato pasa a «Antes» con la fecha de hoy y el motivo. */
export const endHistoryEntry = (scope: WorkScope, patientId: string, entryId: string, input: z.infer<typeof historyEndBodySchema>, now = new Date()) =>
  changeEntry(scope, patientId, entryId, entry => ({ ...entry, ended_on: argentinaToday(now) < entry.recorded_on ? entry.recorded_on : argentinaToday(now), ended_reason: input.reason }),
    entry => ({ ended_on: entry.ended_on, ended_reason: entry.ended_reason }));

/** Solo para pruebas: vacía la historia en memoria. */
export const resetPatientHistoryMemory = () => memory.clear();
