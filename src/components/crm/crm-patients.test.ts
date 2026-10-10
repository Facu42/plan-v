import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { filterDirectoryPatients, getPatientDirectoryMetrics } from './crm-patients';

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  weekly_registration: {start:'2026-10-03',end:'2026-10-09',recorded_days:0,meals_logged:0,meals_pending:0,water_days:0,water_average:null,pending_review:0},
  id: 'pat-1',
  name: 'Ana Pérez',
  initials: 'AP',
  tone: 'mint',
  status: 'En ritmo',
  archived_at: null,
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

const patients = [
  patient({ id: 'ana', name: 'Ana Pérez', goal: 'Organizar las cenas' }),
  patient({ id: 'sofia', name: 'Sofía Ruiz', status: 'Atención', goal: 'Mejorar la hidratación', adherence_score: 58, weekly_registration: {start:'2026-10-03',end:'2026-10-09',recorded_days:1,meals_logged:1,meals_pending:1,water_days:0,water_average:null,pending_review:1} }),
  patient({ id: 'marina', name: 'Marina Costa', archived_at: '2026-09-08T20:00:00.000Z' }),
];

describe('CRM patient directory helpers', () => {
  it('no convierte falta de registros ni puntaje bajo en un pendiente',()=>{
    const empty=patient({adherence_score:0});
    expect(filterDirectoryPatients([empty],'','attention')).toEqual([]);
    expect(getPatientDirectoryMetrics([patient({weekly_registration:null})]).attention).toBeNull();
  });
  it('searches active patients by name, status and goal', () => {
    expect(filterDirectoryPatients(patients, 'sofía', 'active').map(({ id }) => id)).toEqual(['sofia']);
    expect(filterDirectoryPatients(patients, 'atención', 'active').map(({ id }) => id)).toEqual(['sofia']);
    expect(filterDirectoryPatients(patients, 'cenas', 'active').map(({ id }) => id)).toEqual(['ana']);
  });

  it('separates active, attention and archived records', () => {
    expect(filterDirectoryPatients(patients, '', 'active').map(({ id }) => id)).toEqual(['ana', 'sofia']);
    expect(filterDirectoryPatients(patients, '', 'attention').map(({ id }) => id)).toEqual(['sofia']);
    expect(filterDirectoryPatients(patients, '', 'archived').map(({ id }) => id)).toEqual(['marina']);
  });

  it('summarizes the directory without counting archived records as active', () => {
    expect(getPatientDirectoryMetrics(patients)).toEqual({
      active: 2,
      attention: 1,
      archived: 1,
      appointments: 0,
    });
  });
});
