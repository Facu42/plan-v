import { Children, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { ProfessionalActions } from './ProfessionalActions';
import { NvButton } from './primitives';

const base: Patient = {
  id: 'sofia', name: 'Sofía', initials: 'S', tone: 'mint', status: 'En ritmo',
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 60,
  adherence_why: '', time: '', hydration: 0, energy: null, sleep_minutes: null,
  appointment: null, habit_logs: [], todayPlan: [], weekPlan: [], brief: null,
  timeline: [], messages: [], meal_logs: [],
};
const patients: Patient[] = [
  base,
  { ...base, id: 'marina', name: 'Marina', adherence_score: 80 },
  { ...base, id: 'arch', name: 'Paciente archivado', archived_at: '2026-09-01', adherence_score: 0 },
];

function buttons(node: ReactNode): { disabled?: boolean; onClick: () => void }[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode; disabled?: boolean; onClick: () => void }>(child)) return [];
    return child.type === NvButton ? [child.props] : buttons(child.props.children);
  });
}

function summaryButtons(node: ReactNode): { onClick: () => void; className?: string }[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode; onClick: () => void; className?: string }>(child)) return [];
    return typeof child.props.className === 'string' && child.props.className.includes('nv-pro-summary-item') ? [child.props] : summaryButtons(child.props.children);
  });
}

describe('accesos profesionales del showroom', () => {
  it('separa el resumen agregado de la barra compacta de trabajo, sin otra fila de tarjetas KPI', () => {
    const html = renderToStaticMarkup(<ProfessionalActions patients={patients} selectedId="marina" onSelect={vi.fn()} onOpen={vi.fn()} showMetrics />);
    expect(html).toContain('nv-pro-summary');
    expect(html).toContain('nv-work-toolbar');
    expect(html).not.toContain('nv-metric');
    expect(html).toContain('Pacientes activos');
    expect(html).toContain('Adherencia media');
  });

  it('dirige cada acción al paciente seleccionado, nunca al primero de la lista', () => {
    const onOpen = vi.fn();
    const tree = ProfessionalActions({ patients, selectedId: 'marina', onSelect: vi.fn(), onOpen, showMetrics: true });
    const actions = buttons(tree);
    expect(actions).toHaveLength(6);
    actions.forEach((action) => { expect(action.disabled).toBe(false); action.onClick(); });
    expect(onOpen.mock.calls.map(([entry]) => entry)).toEqual([
      { patientId: 'marina', module: 'fichas' },
      { patientId: 'marina', module: 'fichas', tab: 'comidas' },
      { patientId: 'marina', module: 'fichas', tab: 'plan' },
      { patientId: 'marina', module: 'fichas', tab: 'consultas' },
      { patientId: 'marina', module: 'pacientes' },
      { patientId: 'marina', module: 'objetivos' },
    ]);
  });

  it('convierte el resumen agregado en accesos reales a cada flujo del consultorio', () => {
    const onOpen = vi.fn();
    const html = renderToStaticMarkup(<ProfessionalActions patients={patients} selectedId="marina" onSelect={vi.fn()} onOpen={onOpen} showMetrics />);
    expect(html).toContain('aria-label="Abrir el directorio de pacientes"');
    expect(html).toContain('aria-label="Revisar las comidas pendientes"');
    expect(html).toContain('aria-label="Abrir el centro de seguimiento"');
    expect(html).toContain('aria-label="Abrir la agenda"');
    const tree = ProfessionalActions({ patients, selectedId: 'marina', onSelect: vi.fn(), onOpen, showMetrics: true });
    const items = summaryButtons(tree);
    expect(items).toHaveLength(4);
    items.forEach((item) => item.onClick());
    expect(onOpen.mock.calls.map(([entry]) => entry)).toEqual([
      { patientId: 'marina', module: 'pacientes' },
      { patientId: 'marina', module: 'fichas', tab: 'comidas' },
      { patientId: 'marina', module: 'seguimiento' },
      { patientId: 'marina', module: 'agenda' },
    ]);
  });

  it('deshabilita acciones sin selección activa en lugar de cambiar de paciente silenciosamente', () => {
    for (const selectedId of ['arch', 'missing', '']) {
      const tree = ProfessionalActions({ patients, selectedId, onSelect: vi.fn(), onOpen: vi.fn(), showMetrics: true });
      expect(buttons(tree).every((button) => button.disabled)).toBe(true);
    }
  });

  it('mantiene directorio activo, métricas opcionales y aviso de persistencia demo', () => {
    const props = { patients, selectedId: 'marina', onSelect: vi.fn(), onOpen: vi.fn(), showMetrics: false };
    const html = renderToStaticMarkup(<ProfessionalActions {...props} />);
    expect(html).toContain('value="marina" selected=""');
    expect(html).not.toContain('Paciente archivado');
    expect(html).not.toContain('Resumen del consultorio');
    expect(html).toContain('temporalmente en memoria');
    expect(renderToStaticMarkup(<ProfessionalActions {...props} showMetrics />)).toContain('Resumen del consultorio');
  });
});
