import { registerDemoState } from '../demo/state.js';
import { randomUUID } from 'node:crypto';
import type { FoodItem, Macros, MealLog, MealStatus } from '../../src/types/index.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient, recalculateAdherence } from '../store.js';

export { CareError } from '../care/errors.js';

export type AnalysisStatus = 'pending' | 'succeeded' | 'failed';

export type MealAnalysisRun = {
  id: string;
  meal_log_id: string;
  status: AnalysisStatus;
  foods: FoodItem[] | null;
  macros: Macros | null;
  confidence: number | null;
  error_code: string | null;
  created_at: string;
};

export type MealReview = {
  id: string;
  meal_log_id: string;
  reviewer_id: string;
  status: MealStatus;
  foods: FoodItem[] | null;
  macros: Macros | null;
  created_at: string;
};

export type SavedMealLog = {
  log: MealLog;
  duplicate: boolean;
};

type MemLog = MealLog & { client_id: string };

const logs = new Map<string, MemLog>();
const clientIndex = new Map<string, string>();
const analysisRuns: MealAnalysisRun[] = [];
const reviews: MealReview[] = [];

export function resetDiaryMemory() {
  logs.clear();
  clientIndex.clear();
  analysisRuns.length = 0;
  reviews.length = 0;
}

export function listMealAnalysisRuns(mealLogId: string): MealAnalysisRun[] {
  return analysisRuns.filter((row) => row.meal_log_id === mealLogId);
}

export function listMealReviews(mealLogId: string): MealReview[] {
  return reviews.filter((row) => row.meal_log_id === mealLogId);
}

export function diaryDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205', '42703'].includes(error.code ?? '')) {
    throw new CareError(501, 'El diario de comidas requiere instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT409' && (error.message ?? '').includes('meal_open')) {
    throw new CareError(409, 'Esta comida todavía no está revisada. Podés corregirla o borrarla vos.');
  }
  if (error.code === 'PT409') throw new CareError(409, 'Esta comida ya está revisada. Pedile a tu nutricionista que la corrija.');
  if (error.code === 'PT404' || error.code === 'PGRST116') throw new CareError(404, 'No encontramos esa comida.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá la foto, la descripción o el identificador de la comida.');
  }
  throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
}

const STATUSES: AnalysisStatus[] = ['pending', 'succeeded', 'failed'];

function asAnalysisStatus(value: unknown): AnalysisStatus {
  if (typeof value === 'string' && STATUSES.includes(value as AnalysisStatus)) return value as AnalysisStatus;
  return 'pending';
}

function asLog(row: Record<string, unknown>): MealLog {
  const status = row.status;
  if (status !== 'pending_review' && status !== 'confirmed' && status !== 'adjusted') {
    throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
  }
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    slot: String(row.slot),
    photo_url: row.photo_url == null ? null : String(row.photo_url),
    description: row.description == null ? null : String(row.description),
    foods: Array.isArray(row.foods) ? row.foods as FoodItem[] : [],
    macros: row.macros && typeof row.macros === 'object' ? row.macros as Macros : null,
    confidence: Number(row.confidence ?? 0),
    ...(row.nutrition_origin === 'declared' || row.nutrition_origin === 'ai_estimate' ? {nutrition_origin:row.nutrition_origin} : {}),
    note_for_nutri: String(row.note_for_nutri ?? ''),
    status,
    logged_at: String(row.logged_at),
    analysis_status: asAnalysisStatus(row.analysis_status),
  };
}

function publicLog(entry: MemLog): MealLog {
  const { client_id: _clientId, ...log } = entry;
  return log;
}

function attachToPatient(log: MealLog, insert: boolean) {
  const patient = getPatient(log.patient_id);
  if (!patient) throw new CareError(404, 'No encontramos esa comida.');
  const idx = patient.meal_logs.findIndex((row) => row.id === log.id);
  if (idx >= 0) patient.meal_logs[idx] = log;
  else if (insert) patient.meal_logs.unshift(log);
  else throw new CareError(404, 'No encontramos esa comida.');
  recalculateAdherence(log.patient_id);
}

function findPatientLog(patientId: string, mealId: string): MealLog | undefined {
  return getPatient(patientId)?.meal_logs.find((row) => row.id === mealId);
}

export async function saveMealLog(
  patientId: string,
  input: { client_id: string; slot: string; description: string | null; photo_url: string | null },
  persistent: boolean,
): Promise<SavedMealLog> {
  if (persistent) {
    if (input.photo_url?.startsWith('data:')) {
      throw new CareError(400, 'La foto tiene que subir por el circuito privado antes de guardar la comida.');
    }
    const { data, error } = await getRequestDb().rpc('save_meal_log', {
      payload: {
        patient_id: patientId,
        client_id: input.client_id,
        slot: input.slot,
        description: input.description,
        photo_path: input.photo_url,
      },
    });
    diaryDbError(error);
    const row = data as { log?: Record<string, unknown>; duplicate?: boolean } | null;
    if (!row?.log) throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
    return { log: asLog(row.log), duplicate: Boolean(row.duplicate) };
  }

  if (!getPatient(patientId)) throw new CareError(404, 'No encontramos esa comida.');
  const key = `${patientId}:${input.client_id}`;
  const existingId = clientIndex.get(key);
  if (existingId) {
    const existing = logs.get(existingId);
    if (!existing) throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
    return { log: publicLog(existing), duplicate: true };
  }
  const entry: MemLog = {
    id: randomUUID(),
    patient_id: patientId,
    slot: input.slot,
    photo_url: input.photo_url,
    description: input.description,
    foods: [],
    macros: null,
    confidence: 0,
    note_for_nutri: '',
    status: 'pending_review',
    logged_at: new Date().toISOString(),
    analysis_status: 'pending',
    client_id: input.client_id,
  };
  logs.set(entry.id, entry);
  clientIndex.set(key, entry.id);
  attachToPatient(publicLog(entry), true);
  return { log: publicLog(entry), duplicate: false };
}

export async function recordMealAnalysis(
  patientId: string,
  mealId: string,
  input: {
    status: 'succeeded' | 'failed';
    foods: FoodItem[];
    macros: Macros | null;
    confidence: number;
    note_for_nutri: string;
    error_code?: string | null;
    nutrition_origin?: 'declared' | 'ai_estimate';
  },
  persistent: boolean,
): Promise<MealLog> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('record_meal_analysis', {
      payload: {
        meal_id: mealId,
        status: input.status,
        foods: input.foods,
        macros: input.macros,
        confidence: input.confidence,
        note_for_nutri: input.note_for_nutri,
        error_code: input.error_code ?? null,
      },
    });
    diaryDbError(error);
    const log = asLog(data as Record<string, unknown>);
    if (log.patient_id !== patientId) throw new CareError(404, 'No encontramos esa comida.');
    return log;
  }

  const stored = logs.get(mealId);
  const current = stored ?? (() => {
    const row = findPatientLog(patientId, mealId);
    if (!row) return undefined;
    const entry: MemLog = { ...row, client_id: randomUUID(), analysis_status: row.analysis_status ?? 'pending' };
    logs.set(entry.id, entry);
    return entry;
  })();
  if (!current || current.patient_id !== patientId) throw new CareError(404, 'No encontramos esa comida.');
  analysisRuns.push({
    id: randomUUID(),
    meal_log_id: mealId,
    status: input.status,
    foods: input.foods,
    macros: input.macros,
    confidence: input.confidence,
    error_code: input.error_code ?? null,
    created_at: new Date().toISOString(),
  });
  if (current.status === 'pending_review' && current.analysis_status !== 'succeeded') {
    current.foods = input.foods;
    current.macros = input.macros;
    current.confidence = input.confidence;
    current.note_for_nutri = input.note_for_nutri;
    current.analysis_status = input.status;
    if(input.macros) current.nutrition_origin = input.nutrition_origin ?? 'ai_estimate';
    attachToPatient(publicLog(current), false);
  }
  return publicLog(current);
}

export async function reviewMealLog(
  patientId: string,
  mealId: string,
  input: { status: 'confirmed' | 'adjusted'; foods?: FoodItem[]; macros?: Macros | null },
  persistent: boolean,
  reviewerId = 'nutri-demo',
): Promise<MealLog> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('review_meal_log', {
      payload: {
        meal_id: mealId,
        status: input.status,
        foods: input.foods,
        macros: input.macros,
      },
    });
    diaryDbError(error);
    const log = asLog(data as Record<string, unknown>);
    if (log.patient_id !== patientId) throw new CareError(404, 'No encontramos esa comida.');
    return log;
  }

  const stored = logs.get(mealId);
  const current = stored ?? (() => {
    const row = findPatientLog(patientId, mealId);
    if (!row) return undefined;
    const entry: MemLog = { ...row, client_id: randomUUID(), analysis_status: row.analysis_status ?? 'pending' };
    logs.set(entry.id, entry);
    return entry;
  })();
  if (!current || current.patient_id !== patientId) throw new CareError(404, 'No encontramos esa comida.');
  const foods = input.foods ?? current.foods;
  const macros = input.macros === undefined ? current.macros : input.macros;
  current.status = input.status;
  current.foods = foods;
  current.macros = macros;
  reviews.push({
    id: randomUUID(),
    meal_log_id: mealId,
    reviewer_id: reviewerId,
    status: input.status,
    foods,
    macros,
    created_at: new Date().toISOString(),
  });
  attachToPatient(publicLog(current), false);
  return publicLog(current);
}

const MEAL_SLOTS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'] as const;

function ownMeal(patientId: string, mealId: string): MemLog {
  const stored = logs.get(mealId);
  if (stored) {
    if (stored.patient_id !== patientId) throw new CareError(404, 'No encontramos esa comida.');
    return stored;
  }
  const row = findPatientLog(patientId, mealId);
  if (!row) throw new CareError(404, 'No encontramos esa comida.');
  const entry: MemLog = { ...row, client_id: randomUUID(), analysis_status: row.analysis_status ?? 'pending' };
  logs.set(entry.id, entry);
  return entry;
}

function cleanDescription(value: string | null): string | null {
  if (value == null) return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length > 1000) throw new CareError(400, 'Revisá la foto, la descripción o el identificador de la comida.');
  return text;
}

export function mealCorrectionRequest(slot: string, loggedAt: string, note: string): string {
  const day = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(loggedAt));
  return `Quiero corregir una comida ya revisada (${slot}, ${day}): ${note.trim()}`;
}

export async function correctOwnMeal(
  patientId: string,
  mealId: string,
  input: { slot: string; description: string | null },
  persistent: boolean,
): Promise<MealLog> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('correct_own_meal', {
      payload: { patient_id: patientId, meal_id: mealId, slot: input.slot, description: input.description },
    });
    diaryDbError(error);
    const log = asLog(data as Record<string, unknown>);
    if (log.patient_id !== patientId) throw new CareError(404, 'No encontramos esa comida.');
    return log;
  }
  const current = ownMeal(patientId, mealId);
  if (current.status !== 'pending_review') {
    throw new CareError(409, 'Esta comida ya está revisada. Pedile a tu nutricionista que la corrija.');
  }
  if (!MEAL_SLOTS.includes(input.slot as typeof MEAL_SLOTS[number])) {
    throw new CareError(400, 'Revisá la foto, la descripción o el identificador de la comida.');
  }
  const description = cleanDescription(input.description);
  if (description == null && current.photo_url == null) {
    throw new CareError(400, 'Revisá la foto, la descripción o el identificador de la comida.');
  }
  current.slot = input.slot;
  current.description = description;
  attachToPatient(publicLog(current), false);
  return publicLog(current);
}

export async function deleteOwnMeal(patientId: string, mealId: string, persistent: boolean): Promise<void> {
  if (persistent) {
    const { error } = await getRequestDb().rpc('delete_own_meal', {
      payload: { patient_id: patientId, meal_id: mealId },
    });
    diaryDbError(error);
    return;
  }
  const current = ownMeal(patientId, mealId);
  if (current.status !== 'pending_review') {
    throw new CareError(409, 'Esta comida ya está revisada. Pedile a tu nutricionista que la corrija.');
  }
  clientIndex.delete(`${patientId}:${current.client_id}`);
  logs.delete(mealId);
  const patient = getPatient(patientId);
  if (patient) patient.meal_logs = patient.meal_logs.filter((row) => row.id !== mealId);
  recalculateAdherence(patientId);
}

export async function requestMealCorrection(
  patientId: string,
  mealId: string,
  input: { note: string; client_id: string },
  persistent: boolean,
): Promise<{ duplicate: boolean; text: string | null }> {
  const note = input.note.trim();
  if (note.length < 1 || note.length > 500) {
    throw new CareError(400, 'Revisá la foto, la descripción o el identificador de la comida.');
  }
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('request_meal_correction', {
      payload: { patient_id: patientId, meal_id: mealId, note, client_id: input.client_id },
    });
    diaryDbError(error);
    const row = data as { duplicate?: boolean } | null;
    return { duplicate: Boolean(row?.duplicate), text: null };
  }
  const current = ownMeal(patientId, mealId);
  if (current.status === 'pending_review') {
    throw new CareError(409, 'Esta comida todavía no está revisada. Podés corregirla o borrarla vos.');
  }
  return { duplicate: false, text: mealCorrectionRequest(current.slot, current.logged_at, note) };
}

registerDemoState('diary/repository', () => ({ logs, clientIndex, analysisRuns, reviews }));
