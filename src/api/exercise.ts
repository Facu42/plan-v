import { request } from './client';
import type { PatientExerciseView } from '../types/exercise';

export const exerciseApi = {
  get: (patientId: string, professional = false, signal?: AbortSignal) =>
    request<{ exercise: PatientExerciseView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/exercise${professional ? '?audience=pro' : ''}`,
      { signal },
    ),
  assign: (patientId: string, body: { title: string; items: Array<{ exercise_id: string; sets: number; reps: number; rest_seconds: number; note?: string }> }) =>
    request<{ exercise: PatientExerciseView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/routines?audience=pro`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  feedback: (patientId: string, assignmentId: string, body: { sets_completed: number; reps_completed: number; note?: string }) =>
    request<{ exercise: PatientExerciseView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/routines/${encodeURIComponent(assignmentId)}/feedback`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
};
