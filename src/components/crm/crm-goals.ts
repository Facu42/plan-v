import type { GoalHistoryEntry, GoalStatus, Patient } from '../../types';

export type GoalFilter = 'all' | GoalStatus;

export type GoalSnapshot = {
  status: GoalStatus;
  progress: number;
  history: GoalHistoryEntry[];
  updatedAt: string | null;
};

export function getGoalSnapshot(patient: Patient): GoalSnapshot {
  return {
    status: patient.goal_status ?? 'active',
    progress: patient.goal_progress ?? 0,
    history: patient.goal_history ?? [],
    updatedAt: patient.goal_updated_at ?? null,
  };
}

export function filterGoalPatients(patients: Patient[], filter: GoalFilter): Patient[] {
  if (filter === 'all') return patients;
  return patients.filter((patient) => getGoalSnapshot(patient).status === filter);
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Activo',
  paused: 'En pausa',
  completed: 'Completado',
};
