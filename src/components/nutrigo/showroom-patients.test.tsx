import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { ShowroomPatientCreate, ShowroomPatientEdit, ShowroomPatients } from './ShowroomPatients';

const base: Patient = {
  id: 'sofia', name: 'Sofía', initials: 'S', tone: 'mint', status: 'En ritmo',
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: 'después de las 20:30', plan_b: 'Ensalada a mano', next_focus: 'Sumar proteína',
  adherence_score: 85, adherence_why: '', time: '', hydration: 0, energy: null, sleep_minutes: null,
  appointment: { when: 'Jueves · 14:30', duration: 30, channel: 'Videollamada' },
  habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], messages: [], meal_logs: [],
};
const patients: Patient[] = [
  base,
  { ...base, id: 'marina', name: 'Marina', initials: 'M', adherence_score: 55, status: 'A mirar', appointment: null },
  { ...base, id: 'laura', name: 'Laura', initials: 'L', adherence_score: 92, archived_at: '2026-09-01T00:00:00.000Z' },
];

const render = (props?: Partial<Parameters<typeof ShowroomPatients>[0]>) =>
  renderToStaticMarkup(<ShowroomPatients patients={patients} query="" onChanged={vi.fn()} onFollow={vi.fn()} {...props} />);

describe('directorio de pacientes del showroom', () => {
  it('resume el directorio completo y muestra activos por defecto', () => {
    const html = render();
    expect(html).toContain('Pacientes activos');
    expect(html).toContain('Necesitan atención');
    expect(html).toContain('Archivados');
    expect(html).toContain('Sofía');
    expect(html).toContain('Marina');
    expect(html).not.toContain('Laura');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Nuevo paciente');
  });

  it('ofrece acciones accesibles por paciente activo', () => {
    const html = render();
    expect(html).toContain('aria-label="Ver seguimiento de Sofía"');
    expect(html).toContain('aria-label="Editar ficha de Sofía"');
    expect(html).toContain('aria-label="Archivar Sofía"');
    expect(html).toContain('Jueves · 14:30');
    expect(html).toContain('Sumar proteína');
  });

  it('lista archivados con restaurar y sin acciones operativas', () => {
    const html = render({ initialFilter: 'archived' });
    expect(html).toContain('Laura');
    expect(html).toContain('aria-label="Restaurar Laura"');
    expect(html).not.toContain('Ver seguimiento');
    expect(html).not.toContain('Archivar Laura');
    expect(html).not.toContain('Sofía');
  });

  it('necesitan atención lista solo adherencias bajas activas', () => {
    const html = render({ initialFilter: 'attention' });
    expect(html).toContain('Marina');
    expect(html).not.toContain('Sofía');
    expect(html).not.toContain('Laura');
  });

  it('aplica la búsqueda externa sobre nombre, estado u objetivo', () => {
    expect(render({ query: 'marina' })).toContain('Marina');
    expect(render({ query: 'marina' })).not.toContain('Sofía');
    expect(render({ query: 'sin coincidencias' })).toContain('Sin coincidencias');
  });

  it('el alta nueva es un diálogo accesible y no promete envío de email', () => {
    const html = renderToStaticMarkup(<ShowroomPatientCreate onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Nombre completo');
    expect(html).toContain('Email para la invitación');
    expect(html).toContain('Objetivo declarado');
    expect(html).toContain('no se envía ningún email');
    expect(html).toContain('Crear alta');
  });

  it('el editor precarga la ficha operativa existente', () => {
    const html = renderToStaticMarkup(<ShowroomPatientEdit patient={base} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(html).toContain('aria-label="Cerrar editor"');
    expect(html).toContain('value="Sofía"');
    expect(html).toContain('value="En ritmo"');
    expect(html).toContain('value="después de las 20:30"');
    expect(html).toContain('Ensalada a mano');
    expect(html).toContain('Sumar proteína');
    expect(html).toContain('<option value="seguimiento" selected="">Seguimiento</option>');
    expect(html).toContain('Guardar cambios');
  });
});
