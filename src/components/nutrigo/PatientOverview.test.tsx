import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PatientOverview, macroShares } from './PatientOverview';
import { buildShowroomPatient } from './showroom-model';
import type { Patient } from '../../types';

const patient: Patient = {
  id: 'p', name: 'Ana', initials: 'A', tone: 'mint', status: 'En ritmo',
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 60, adherence_why: '', time: '',
  hydration: 3, energy: null, sleep_minutes: null, appointment: null,
  habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], messages: [], meal_logs: [],
};

describe('Dashboard paciente — composición Nutrigo', () => {
  it('comparte la composición con el CRM sin tratar a la profesional como paciente', () => {
    const p = buildShowroomPatient({ ...patient, todayPlan: [{ slot: 'Almuerzo', title: 'Plan de Ana', time: '13:00' }] });
    const html = renderToStaticMarkup(<PatientOverview patient={p} audience="professional" onNavigate={() => {}} />);
    expect(html).toContain('Objetivo del paciente');
    expect(html).toContain('Seguimiento del paciente');
    expect(html).toContain('Conversación con Ana');
    expect(html).toContain('Plan de Ana');
    expect(html).toContain('np-gauge');
    expect(html).toContain('np-macro-row');
    expect(html).not.toContain('Tu nutricionista');
    expect(html).not.toContain('Ver mis registros');
  });

  it('no mezcla el menú ni el contacto al cambiar el paciente profesional', () => {
    const a = buildShowroomPatient({ ...patient, todayPlan: [{ slot: 'Almuerzo', title: 'Solo Ana', time: '13:00' }] });
    const b = buildShowroomPatient({ ...patient, id: 'b', name: 'Beatriz', initials: 'B', todayPlan: [{ slot: 'Almuerzo', title: 'Solo Beatriz', time: '13:00' }] });
    const render = (p: typeof a) => renderToStaticMarkup(<PatientOverview patient={p} audience="professional" onNavigate={() => {}} />);
    expect(render(a)).toContain('Solo Ana');
    const html = render(b);
    expect(html).toContain('Conversación con Beatriz');
    expect(html).toContain('Solo Beatriz');
    expect(html).not.toContain('Solo Ana');
    expect(html).not.toContain('Conversación con Ana');
  });

  it('calcula distribución energética sin tratarla como meta prescrita', () => {
    expect(macroShares({ kcal: 180, protein_g: 9, carbs_g: 18, fat_g: 8 })).toEqual([20, 40, 40]);
    expect(macroShares({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })).toEqual([0, 0, 0]);
  });
  it('conserva estados sin datos y no inventa peso, pasos ni objetivo calórico', () => {
    const html = renderToStaticMarkup(<PatientOverview patient={buildShowroomPatient(patient)} onNavigate={() => {}} />);
    expect(html).toContain('Sin registro');
    expect(html).toContain('Sin comidas revisadas hoy');
    expect(html).toContain('Tu plan está en camino');
    expect(html).not.toContain('kg');
    expect(html).not.toContain('Calorías restantes');
    expect(html).not.toMatch(/NaN|Infinity/);
    expect(html).toContain('Sin datos nutricionales');
    expect(html).not.toContain('0<small> kcal');
    expect(html).not.toContain('0<small> g');
  });
  it('presenta el menú existente y distingue las imágenes ilustrativas de registros reales', () => {
    const p = buildShowroomPatient({ ...patient, todayPlan: [{ slot: 'Almuerzo', title: 'Mi plato asignado', time: '13:00' }] });
    const html = renderToStaticMarkup(<PatientOverview patient={p} onNavigate={() => {}} />);
    expect(html).toContain('Mi plato asignado');
    expect(html).toContain('Imágenes ilustrativas');
    expect(html).toContain('lunch.webp');
  });

  it('convierte cada KPI en un acceso real a su flujo', () => {
    const html = renderToStaticMarkup(<PatientOverview patient={buildShowroomPatient(patient)} onNavigate={() => {}} />);
    expect(html).toContain('aria-label="Ver detalle de Adherencia"');
    expect(html).toContain('aria-label="Ver detalle de Comidas revisadas"');
    expect(html).toContain('aria-label="Ver detalle de Descanso"');
    expect(html).toContain('aria-label="Ver detalle de Hidratación"');
    expect(html.match(/<button[^>]*class="nv-metric nv-openable/g)?.length).toBe(4);
  });
});
