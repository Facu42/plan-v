import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { filterGoalPatients, getGoalSnapshot } from './crm-goals';

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'pat-1',
  name: 'Ana',
  initials: 'AP',
  tone: 'mint',
  status: 'En ritmo',
  billing_status: 'active',
  billing_until: null,
  stage: 'seguimiento',
  goal: 'Organizar las cenas',
  sensitive_hours: '',
  plan_b: '',
  next_focus: '',
  adherence_score: 82,
  adherence_why: '',
  time: 'hoy',
  hydration: 5,
  energy: null,
  sleep_minutes: null,
  appointment: null,
  habit_logs: [],
  todayPlan: [],
  weekPlan: [],
  brief: null,
  timeline: [],
  meal_logs: [],
  messages: [],
  ...overrides,
});

describe('CRM goal helpers', () => {
  it('normalizes legacy patients as active goals without invented progress', () => {
    expect(getGoalSnapshot(patient())).toEqual({
      status: 'active',
      progress: 0,
      history: [],
      updatedAt: null,
    });
  });

  it('preserves stored goal state and history', () => {
    const history = [{
      id: 'goal-1',
      goal: 'Organizar las cenas',
      status: 'paused' as const,
      progress: 55,
      note: 'Pausa por viaje',
      updated_at: '2026-09-08T20:00:00.000Z',
    }];
    expect(getGoalSnapshot(patient({
      goal_status: 'paused',
      goal_progress: 55,
      goal_updated_at: history[0].updated_at,
      goal_history: history,
    }))).toEqual({ status: 'paused', progress: 55, history, updatedAt: history[0].updated_at });
  });

  it('filters goal rows by their normalized status', () => {
    const patients = [
      patient({ id: 'active' }),
      patient({ id: 'paused', goal_status: 'paused' }),
      patient({ id: 'completed', goal_status: 'completed' }),
    ];

    expect(filterGoalPatients(patients, 'all').map(({ id }) => id)).toEqual(['active', 'paused', 'completed']);
    expect(filterGoalPatients(patients, 'paused').map(({ id }) => id)).toEqual(['paused']);
  });
});
