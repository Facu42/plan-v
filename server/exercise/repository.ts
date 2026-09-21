import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { addActivityLog, deleteActivityLog, getPatient } from '../store.js';
import {
  catalogExercises,
  extraActivity,
  forgetActivityMeta,
  getAssignment,
  isExerciseHabilitated,
  listAssignments,
  newId,
  putAssignment,
  rememberActivityMeta,
} from './memory.js';
import type {
  ActivityLogView,
  PatientExerciseView,
  RoutineAssignmentView,
} from '../../src/types/exercise.js';

export { CareError } from '../care/errors.js';
export { resetExerciseMemory, setExerciseHabilitation } from './memory.js';

type AssignInput = {
  title: string;
  items: Array<{
    exercise_id: string;
    sets: number;
    reps: number;
    rest_seconds: number;
    note?: string;
    sort?: number;
  }>;
};

type ActivityInput = {
  activity: string;
  duration_minutes: number;
  intensity: 'suave' | 'moderada' | 'intensa';
  note?: string;
  assignment_id?: string;
  sets?: number;
  reps?: number;
};

export function exerciseDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'La biblioteca de ejercicio requiere instalar la migración de este módulo.');
  }
  if (error.code === '42501') {
    if ((error.message ?? '').includes('exercise_habilitation')) {
      throw new CareError(403, 'Hace falta habilitación verificada para asignar una rutina. El rol nutricionista no alcanza.');
    }
    throw new CareError(403, 'No tenés permiso para esta acción.');
  }
  if (error.code === 'P0002' || error.code === 'PGRST116') {
    throw new CareError(404, 'No encontramos ese registro.');
  }
  if (['22023', '23514', '22P02', '23503'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá la rutina, las series y las repeticiones.');
  }
  throw new CareError(503, 'No se pudo guardar el ejercicio. Reintentá en un momento.');
}

function patientActivities(patientId: string): ActivityLogView[] {
  return (getPatient(patientId)?.activity_logs ?? []).map((entry) => {
    const extra = extraActivity(entry.id);
    return {
      id: entry.id,
      patient_id: entry.patient_id,
      activity: entry.activity,
      duration_minutes: entry.duration_minutes,
      intensity: entry.intensity,
      note: entry.note,
      logged_at: entry.logged_at,
      assignment_id: extra?.assignment_id ?? null,
      sets: extra?.sets ?? null,
      reps: extra?.reps ?? null,
    };
  }).sort((a, b) => b.logged_at.localeCompare(a.logged_at));
}

function memorySnapshot(patientId: string, canAssign: boolean): PatientExerciseView {
  const verified = canAssign && isExerciseHabilitated();
  return {
    patient_id: patientId,
    can_assign: verified,
    habilitation_verified: isExerciseHabilitated(),
    library: catalogExercises(),
    assignments: listAssignments(patientId),
    activities: patientActivities(patientId),
  };
}

function asLibrary(value: unknown): PatientExerciseView['library'] {
  if (!Array.isArray(value)) return catalogExercises();
  return value.flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string') return [];
    const category = row.category === 'fuerza' || row.category === 'cardio' || row.category === 'equilibrio' || row.category === 'otro'
      ? row.category : 'movilidad';
    return [{
      id: String(row.id),
      slug: String(row.slug ?? ''),
      name: String(row.name),
      description: String(row.description ?? ''),
      category,
      default_sets: Number(row.default_sets ?? 1),
      default_reps: Number(row.default_reps ?? 1),
      default_rest_seconds: Number(row.default_rest_seconds ?? 0),
    }];
  });
}

function asAssignments(value: unknown): RoutineAssignmentView[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string') return [];
    const items = Array.isArray(row.items) ? row.items.map((item) => {
      const line = item as Record<string, unknown>;
      const category = line.category === 'fuerza' || line.category === 'cardio' || line.category === 'equilibrio' || line.category === 'otro'
        ? line.category : 'movilidad';
      return {
        id: String(line.id),
        exercise_id: String(line.exercise_id),
        name: String(line.name ?? ''),
        category,
        sets: Number(line.sets ?? 1),
        reps: Number(line.reps ?? 1),
        rest_seconds: Number(line.rest_seconds ?? 0),
        note: line.note == null ? null : String(line.note),
        sort: Number(line.sort ?? 0),
      };
    }) : [];
    const feedback = row.feedback && typeof row.feedback === 'object' ? row.feedback as Record<string, unknown> : null;
    return [{
      id: String(row.id),
      patient_id: String(row.patient_id),
      title: String(row.title ?? ''),
      status: row.status === 'paused' || row.status === 'completed' ? row.status : 'active' as const,
      assigned_at: String(row.assigned_at),
      items,
      feedback: feedback ? {
        sets_completed: Number(feedback.sets_completed ?? 0),
        reps_completed: Number(feedback.reps_completed ?? 0),
        note: feedback.note == null ? null : String(feedback.note),
        recorded_at: String(feedback.recorded_at),
      } : null,
    }];
  });
}

function asActivities(value: unknown): ActivityLogView[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string') return [];
    const intensity = row.intensity === 'suave' || row.intensity === 'intensa' ? row.intensity : 'moderada';
    return [{
      id: String(row.id),
      patient_id: String(row.patient_id),
      activity: String(row.activity ?? ''),
      duration_minutes: Number(row.duration_minutes ?? 0),
      intensity,
      note: row.note == null ? null : String(row.note),
      logged_at: String(row.logged_at),
      assignment_id: row.assignment_id == null ? null : String(row.assignment_id),
      sets: row.sets == null ? null : Number(row.sets),
      reps: row.reps == null ? null : Number(row.reps),
    }];
  });
}

export function asExerciseView(data: unknown, patientId: string): PatientExerciseView {
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    patient_id: String(row.patient_id ?? patientId),
    can_assign: Boolean(row.can_assign),
    habilitation_verified: Boolean(row.habilitation_verified),
    library: asLibrary(row.library),
    assignments: asAssignments(row.assignments),
    activities: asActivities(row.activities),
  };
}

async function rpc(name: string, args: Record<string, unknown>) {
  let result: { data: unknown; error: { code?: string; message?: string } | null };
  try {
    result = await getRequestDb().rpc(name, args);
  } catch {
    throw new CareError(501, 'La biblioteca de ejercicio requiere instalar la migración de este módulo.');
  }
  exerciseDbError(result.error);
  return result.data;
}

export async function getPatientExercise(patientId: string, persistent: boolean, canAssign: boolean): Promise<PatientExerciseView> {
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    return memorySnapshot(patientId, canAssign);
  }
  return asExerciseView(await rpc('get_patient_exercise', { target_patient: patientId }), patientId);
}

export async function logPatientActivity(patientId: string, input: ActivityInput, persistent: boolean): Promise<PatientExerciseView> {
  if (!persistent) {
    const patient = addActivityLog(patientId, input);
    if (!patient) throw new CareError(404, 'Paciente no encontrado.');
    const created = patient.activity_logs?.[0];
    if (created && (input.assignment_id || input.sets || input.reps)) {
      rememberActivityMeta(created.id, {
        assignment_id: input.assignment_id ?? null,
        sets: input.sets ?? null,
        reps: input.reps ?? null,
      });
    }
    return memorySnapshot(patientId, false);
  }
  return asExerciseView(await rpc('log_patient_activity', {
    target_patient: patientId,
    input_activity: input.activity,
    input_duration: input.duration_minutes,
    input_intensity: input.intensity,
    input_note: input.note ?? null,
    input_assignment: input.assignment_id ?? null,
    input_sets: input.sets ?? null,
    input_reps: input.reps ?? null,
  }), patientId);
}

export async function deletePatientActivity(patientId: string, activityId: string, persistent: boolean): Promise<PatientExerciseView> {
  if (!persistent) {
    const patient = deleteActivityLog(patientId, activityId);
    if (!patient) throw new CareError(404, 'No encontramos ese registro.');
    forgetActivityMeta(activityId);
    return memorySnapshot(patientId, false);
  }
  return asExerciseView(await rpc('delete_patient_activity', {
    target_patient: patientId,
    activity_id: activityId,
  }), patientId);
}

export async function assignExerciseRoutine(patientId: string, input: AssignInput, persistent: boolean, canAssign: boolean): Promise<PatientExerciseView> {
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    if (!canAssign || !isExerciseHabilitated()) {
      throw new CareError(403, 'Hace falta habilitación verificada para asignar una rutina. El rol nutricionista no alcanza.');
    }
    const items = input.items.map((item, index) => {
      const exercise = catalogExercises().find((entry) => entry.id === item.exercise_id);
      if (!exercise) throw new CareError(400, 'Revisá la rutina, las series y las repeticiones.');
      return {
        id: newId(),
        exercise_id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: item.sets,
        reps: item.reps,
        rest_seconds: item.rest_seconds,
        note: item.note?.trim() || null,
        sort: item.sort ?? index,
      };
    });
    putAssignment({
      id: newId(),
      patient_id: patientId,
      title: input.title.trim(),
      status: 'active',
      assigned_at: new Date().toISOString(),
      items,
      feedback: null,
    });
    return memorySnapshot(patientId, true);
  }
  return asExerciseView(await rpc('assign_exercise_routine', {
    target_patient: patientId,
    input_title: input.title,
    input_items: input.items,
  }), patientId);
}

export async function saveRoutineFeedback(
  patientId: string,
  assignmentId: string,
  input: { sets_completed: number; reps_completed: number; note?: string },
  persistent: boolean,
): Promise<PatientExerciseView> {
  if (!persistent) {
    const row = getAssignment(assignmentId);
    if (!row || row.patient_id !== patientId) throw new CareError(404, 'No encontramos ese registro.');
    putAssignment({
      ...row,
      feedback: {
        sets_completed: input.sets_completed,
        reps_completed: input.reps_completed,
        note: input.note?.trim() || null,
        recorded_at: new Date().toISOString(),
      },
    });
    return memorySnapshot(patientId, false);
  }
  return asExerciseView(await rpc('save_routine_feedback', {
    target_patient: patientId,
    assignment_id: assignmentId,
    input_sets: input.sets_completed,
    input_reps: input.reps_completed,
    input_note: input.note ?? null,
  }), patientId);
}
