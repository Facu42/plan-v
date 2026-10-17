import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildShowroomPatient } from '../../components/nutrigo/showroom-model';
import type { Patient } from '../../types';
import { PatientGoalCard } from './PatientGoalCard';

const patient = {
  id: 'p1', name: 'Ana', initials: 'AR', tone: 'mint', status: 'En ritmo',
  billing_status: 'active', billing_until: '2099-01-01', stage: 'seguimiento',
  goal: 'Organizar las cenas', goal_status: 'paused', goal_progress: 40,
  goal_updated_at: '2026-10-10T15:00:00.000Z',
  goal_history: [{ id: 'g1', goal: 'Organizar las cenas', status: 'paused', progress: 40, note: 'Nota privada del consultorio', updated_at: '2026-10-10T15:00:00.000Z' }],
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 0, adherence_why: '',
  time: '', hydration: 0, energy: null, sleep_minutes: null, appointment: null,
  habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], meal_logs: [], messages: [],
} as Patient;

describe('tarjeta del objetivo de la paciente', () => {
  it('muestra el objetivo, el estado y el avance, y no la nota', () => {
    const html = renderToStaticMarkup(<PatientGoalCard patient={buildShowroomPatient(patient)} history />);
    expect(html).toContain('Organizar las cenas');
    expect(html).toContain('En pausa');
    expect(html).toContain('40%');
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain('No es la meta de calorías del plan.');
    expect(html).not.toContain('Nota privada del consultorio');
  });

  it('sin dato dice que todavía no está cargado, y un cero es un avance real', () => {
    const empty = buildShowroomPatient({ ...patient, goal: '', goal_status: undefined, goal_progress: undefined, goal_history: [], goal_updated_at: null });
    const zero = buildShowroomPatient({ ...patient, goal_progress: 0, goal_history: [] });
    expect(renderToStaticMarkup(<PatientGoalCard patient={empty} />)).toContain('Todavía no hay un objetivo.');
    expect(renderToStaticMarkup(<PatientGoalCard patient={empty} />)).toContain('Tu nutricionista todavía no cargó el estado.');
    expect(renderToStaticMarkup(<PatientGoalCard patient={empty} />)).toContain('Tu nutricionista todavía no cargó el avance.');
    expect(renderToStaticMarkup(<PatientGoalCard patient={zero} />)).toContain('0%');
  });
});
