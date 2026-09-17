import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { buildGoalSummary, ShowroomGoals } from './ShowroomGoals';

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar cuatro cenas',
  goal_status: 'active', goal_progress: 55, goal_updated_at: '2026-09-10T12:00:00.000Z',
  goal_history: [{ id: 'goal-a1', goal: 'Organizar cuatro cenas', status: 'active', progress: 55, note: 'Revisar el domingo', updated_at: '2026-09-10T12:00:00.000Z' }],
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 72, adherence_why: '', time: 'hoy',
  hydration: 4, energy: 'Media', sleep_minutes: 420, appointment: null, habit_logs: [], todayPlan: [],
  weekPlan: [], brief: null, timeline: [], meal_logs: [], messages: [], ...overrides,
});

const patients = [
  patient(),
  patient({ id: 'bea', name: 'Beatriz Paz', initials: 'BP', goal: 'Sostener el desayuno', goal_status: 'paused', goal_progress: 30, goal_history: [] }),
  patient({ id: 'carla', name: 'Carla Sol', initials: 'CS', goal: 'Completar el plan semanal', goal_status: 'completed', goal_progress: 100, goal_history: [] }),
];

describe('Objetivos profesionales en Nutrigo', () => {
  it('resume estados y avance sin inventar métricas clínicas', () => {
    expect(buildGoalSummary(patients)).toEqual({ active: 1, paused: 1, completed: 1, averageProgress: 62 });
  });

  it('conserva el seguimiento multipaciente, filtros y acciones operativas', () => {
    const html = renderToStaticMarkup(<ShowroomGoals patient={patients[0]} patients={patients} onSelect={vi.fn()} onChanged={vi.fn()} onOpenPatient={vi.fn()} />);
    expect(html).toContain('Objetivos de Ana Ruiz');
    expect(html).toContain('Paciente en seguimiento');
    expect((html.match(/class="nvg-stat"/g) ?? [])).toHaveLength(4);
    expect(html).toContain('Filtrar objetivos');
    expect(html).toContain('Organizar cuatro cenas');
    expect(html).toContain('Sostener el desayuno');
    expect(html).toContain('Completar el plan semanal');
    expect(html).toContain('Actualizar objetivo');
    expect(html).toContain('Abrir ficha');
  });

  it('muestra el historial profesional sin sumar peso, IMC ni fotos inexistentes', () => {
    const html = renderToStaticMarkup(<ShowroomGoals patient={patients[0]} patients={patients} onSelect={vi.fn()} onChanged={vi.fn()} onOpenPatient={vi.fn()} />);
    expect(html).toContain('Historial profesional');
    expect(html).toContain('Revisar el domingo');
    expect(html).not.toMatch(/peso actual|IMC|fotos de progreso|medidas corporales/i);
  });
});
