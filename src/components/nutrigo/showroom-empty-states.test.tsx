import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { ShowroomWorkCenter } from './ShowroomWorkCenter';
import { ShowroomGoals } from './ShowroomGoals';
import { ShowroomPatients } from './ShowroomPatients';

const now = new Date(2026, 8, 15, 10, 0, 0);
const callbacks = { onOpenPatient: vi.fn(), onOpenMeals: vi.fn(), onOpenConsultations: vi.fn() };

const patient: Patient = {
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: '',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 0,
  adherence_why: '', time: '', hydration: 0, energy: null, sleep_minutes: null,
  appointment: null, habit_logs: [], todayPlan: [], weekPlan: [], brief: null,
  timeline: [], messages: [], meal_logs: [],
};

describe('matriz de estados vacíos de las superficies del consultorio', () => {
  it.each([
    ['reciente', 'Sin actividad en este filtro'],
    ['seguimiento', 'Sin pacientes en este filtro'],
    ['guardado', 'Sin Planes B guardados'],
    ['paneles', 'Sin alertas de adherencia'],
    ['videollamadas', 'Sin videollamadas programadas'],
  ] as const)('%s muestra un estado vacío explícito sin pacientes activos', (module, empty) => {
    const html = renderToStaticMarkup(<ShowroomWorkCenter module={module} patients={[]} now={now} {...callbacks} />);
    expect(html).toContain(empty);
    expect(html).toContain('0 pacientes activos');
    expect(html).not.toMatch(/NaN|undefined/);
  });

  it('paneles mantiene indicadores en cero sin dividir por pacientes inexistentes', () => {
    const html = renderToStaticMarkup(<ShowroomWorkCenter module="paneles" patients={[]} now={now} {...callbacks} />);
    expect(html).toContain('Pacientes activos');
    expect(html.match(/<strong>0<\/strong>/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it('objetivos conserva estados vacíos de directorio e historial sin objetivos cargados', () => {
    const html = renderToStaticMarkup(<ShowroomGoals patient={patient} patients={[]} onSelect={vi.fn()} onChanged={vi.fn()} onOpenPatient={vi.fn()} />);
    expect(html).toContain('No hay objetivos en este estado.');
    expect(html).toContain('Todavía no hay cambios registrados.');
    expect(html).not.toMatch(/NaN|undefined/);
  });

  it('el directorio de pacientes muestra métricas en cero y estado vacío accionable', () => {
    const html = renderToStaticMarkup(<ShowroomPatients patients={[]} query="" onChanged={vi.fn()} onFollow={vi.fn()} />);
    expect(html).toContain('Sin coincidencias');
    expect(html).toContain('Nuevo paciente');
    expect(html).not.toMatch(/NaN|undefined/);
  });
});
