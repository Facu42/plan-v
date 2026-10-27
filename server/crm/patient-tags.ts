import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import type { WorkScope } from './repository.js';

export type PatientTag = { id: string; label: string; tone: 'a' | 'n' };
export const MAX_PATIENT_TAGS = 8;

export const patientTagBodySchema = z.object({
  label: z.string().trim().min(1).max(30),
  tone: z.enum(['a', 'n']).default('n'),
}).strict();

const memory = new Map<string, PatientTag[]>();
const key = (scope: WorkScope, patientId: string) => `${scope.nutritionistId}:${patientId}`;
const sameLabel = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function assertPatient(scope: WorkScope, patientId: string) {
  if (!scope.patients.some(p => p.id === patientId && !p.deactivated_at && !p.anonymized_at)) throw new CareError(403, 'Esa paciente no está disponible en tu consultorio.');
}

export async function listPatientTags(scope: WorkScope, patientId: string): Promise<PatientTag[]> {
  assertPatient(scope, patientId);
  if (!scope.persistent) return [...(memory.get(key(scope, patientId)) ?? [])];
  const { data, error } = await getRequestDb().from('patient_tags').select('id,label,tone').eq('nutritionist_id', scope.nutritionistId).eq('patient_id', patientId).order('created_at').order('id').limit(MAX_PATIENT_TAGS);
  if (error) throw new CareError(503, 'No pudimos leer las etiquetas. Probá de nuevo.');
  return (data ?? []).map(row => ({ id: String(row.id), label: String(row.label), tone: row.tone === 'a' ? 'a' : 'n' }));
}

export async function addPatientTag(scope: WorkScope, patientId: string, input: z.infer<typeof patientTagBodySchema>): Promise<PatientTag[]> {
  const current = await listPatientTags(scope, patientId);
  if (current.some(tag => sameLabel(tag.label, input.label))) return current;
  if (current.length >= MAX_PATIENT_TAGS) throw new CareError(409, `Cada paciente puede tener hasta ${MAX_PATIENT_TAGS} etiquetas.`);
  if (!scope.persistent) {
    const next = [...current, { id: randomUUID(), label: input.label, tone: input.tone }];
    memory.set(key(scope, patientId), next);
    return next;
  }
  const { error } = await getRequestDb().from('patient_tags').insert({ nutritionist_id: scope.nutritionistId, patient_id: patientId, label: input.label, tone: input.tone });
  if (error && error.code !== '23505') throw new CareError(503, 'No pudimos guardar la etiqueta. Probá de nuevo.');
  return listPatientTags(scope, patientId);
}

export async function removePatientTag(scope: WorkScope, patientId: string, tagId: string): Promise<PatientTag[]> {
  assertPatient(scope, patientId);
  if (!scope.persistent) {
    memory.set(key(scope, patientId), (memory.get(key(scope, patientId)) ?? []).filter(tag => tag.id !== tagId));
    return listPatientTags(scope, patientId);
  }
  const { error } = await getRequestDb().from('patient_tags').delete().eq('nutritionist_id', scope.nutritionistId).eq('patient_id', patientId).eq('id', tagId);
  if (error) throw new CareError(503, 'No pudimos quitar la etiqueta. Probá de nuevo.');
  return listPatientTags(scope, patientId);
}

/** Solo para pruebas: vacía las etiquetas en memoria. */
export const resetPatientTagsMemory = () => memory.clear();
