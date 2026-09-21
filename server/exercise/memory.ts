import { randomUUID } from 'node:crypto';
import { SEEDED_EXERCISES, type RoutineAssignmentView } from '../../src/types/exercise.js';

const DEMO_NUTRI = 'nutri-demo';

type ExtraActivity = { assignment_id: string | null; sets: number | null; reps: number | null };

const assignments = new Map<string, RoutineAssignmentView>();
const extraActivities = new Map<string, ExtraActivity>();
let habilitated = new Set<string>([DEMO_NUTRI]);

export function resetExerciseMemory() {
  assignments.clear();
  extraActivities.clear();
  habilitated = new Set<string>([DEMO_NUTRI]);
}

export function setExerciseHabilitation(nutritionistId: string, verified: boolean) {
  if (verified) habilitated.add(nutritionistId);
  else habilitated.delete(nutritionistId);
}

export function isExerciseHabilitated(nutritionistId = DEMO_NUTRI) {
  return habilitated.has(nutritionistId);
}

export function catalogExercises() {
  return SEEDED_EXERCISES.map((entry) => ({ ...entry }));
}

export function listAssignments(patientId: string) {
  return [...assignments.values()]
    .filter((row) => row.patient_id === patientId)
    .sort((a, b) => b.assigned_at.localeCompare(a.assigned_at));
}

export function extraActivity(id: string) {
  return extraActivities.get(id);
}

export function rememberActivityMeta(id: string, meta: ExtraActivity) {
  extraActivities.set(id, meta);
}

export function forgetActivityMeta(id: string) {
  extraActivities.delete(id);
}

export function putAssignment(row: RoutineAssignmentView) {
  assignments.set(row.id, row);
}

export function getAssignment(id: string) {
  return assignments.get(id);
}

export function newId() {
  return randomUUID();
}
