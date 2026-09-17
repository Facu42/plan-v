import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { buildRecentActivity, buildTrackingSummary, filterFollowUpRows, filterRecentActivity, paginateRecentActivity, rankPatientsForFollowUp, ShowroomWorkCenter } from './ShowroomWorkCenter';

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'Requiere atención', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: '', plan_b: 'Cena simple: omelette y vegetales', next_focus: 'Revisar cenas', adherence_score: 55,
  adherence_why: 'Dos comidas pendientes', time: 'hoy', hydration: 4, energy: 'Media', sleep_minutes: 420,
  appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'presencial' }, habit_logs: [], todayPlan: [], weekPlan: [],
  brief: { suggested_action: 'mensaje', up_next_title: 'Revisar registro', up_next_body: 'Hay una comida pendiente.', draft_message: 'Hola Ana', source_ids: [], adherence_why: 'Dos comidas pendientes' },
  timeline: [{ id: 'event-ana', kind: 'meal_logged', atLabel: 'HOY', title: 'Cena registrada', body: 'Pendiente de revisión' }],
  meal_logs: [{ id: 'meal-ana', patient_id: 'ana', slot: 'Cena', photo_url: null, description: 'Omelette', foods: [], macros: null, confidence: 0, note_for_nutri: '', status: 'pending_review', logged_at: '2026-09-13T22:00:00.000Z' }],
  messages: [], ...overrides,
});

const patients = [
  patient(),
  patient({ id: 'bea', name: 'Beatriz Paz', initials: 'BP', tone: 'lilac', plan_b: '', next_focus: 'Sostener hidratación', adherence_score: 88, adherence_why: 'Buen ritmo', appointment: { when: 'Martes · 11:00', duration: 30, channel: 'video', meet_url: 'https://meet.example.com/bea' }, brief: null, timeline: [{ id: 'event-bea', kind: 'habit', atLabel: 'AYER', title: 'Hábitos actualizados', body: 'Registró hidratación' }], meal_logs: [] }),
  patient({ id: 'carla', name: 'Carla Sol', initials: 'CS', tone: 'peach', plan_b: 'Colación de respaldo', next_focus: 'Coordinar consulta', adherence_score: 70, adherence_why: 'Sin turno', appointment: null, brief: null, timeline: [], meal_logs: [] }),
];
const now = new Date(2026, 8, 13, 10, 0, 0);
const callbacks = { onOpenPatient: vi.fn(), onOpenMeals: vi.fn(), onOpenConsultations: vi.fn() };

describe('Centro de trabajo profesional Nutrigo', () => {
  it('calcula sólo indicadores presentes en los registros activos', () => {
    expect(buildTrackingSummary(patients)).toEqual({ patients: 3, pendingMeals: 1, appointments: 2, videoAppointments: 1, averageAdherence: 71, attention: 1 });
  });

  it('ordena el seguimiento por necesidad real sin inventar un score nuevo', () => {
    expect(rankPatientsForFollowUp(patients).map((row) => [row.patient.id, row.pendingMeals])).toEqual([['ana', 1], ['carla', 0], ['bea', 0]]);
  });

  it('filtra el seguimiento por banda de adherencia y revisiones pendientes sin inventar umbrales', () => {
    const rows = rankPatientsForFollowUp(patients);
    expect(filterFollowUpRows(rows, 'attention', 'all').map((row) => row.patient.id)).toEqual(['ana']);
    expect(filterFollowUpRows(rows, 'stable', 'all').map((row) => row.patient.id)).toEqual(['carla']);
    expect(filterFollowUpRows(rows, 'strong', 'all').map((row) => row.patient.id)).toEqual(['bea']);
    expect(filterFollowUpRows(rows, 'all', 'with').map((row) => row.patient.id)).toEqual(['ana']);
    expect(filterFollowUpRows(rows, 'all', 'without').map((row) => row.patient.id)).toEqual(['carla', 'bea']);
    expect(filterFollowUpRows(rows, 'attention', 'without')).toEqual([]);
  });

  it('expone filtros configurables en el Centro de seguimiento', () => {
    const html = renderToStaticMarkup(<ShowroomWorkCenter module="seguimiento" patients={patients} now={now} {...callbacks} />);
    expect(html).toContain('Filtros del centro de seguimiento');
    expect(html).toContain('Necesitan atención');
    expect(html).toContain('Seguimiento estable');
    expect(html).toContain('En buen ritmo');
    expect(html).toContain('Con pendientes');
    expect(html).toContain('Sin pendientes');
    expect(html).toContain('3 de 3');
  });

  it('conserva el orden relativo provisto por la ficha al combinar actividad reciente', () => {
    expect(buildRecentActivity(patients).map((item) => [item.patient.id, item.event.atLabel])).toEqual([['ana', 'HOY'], ['bea', 'AYER']]);
  });

  it('filtra la actividad por paciente y recencia sin reconstruir cronología clínica', () => {
    const items = buildRecentActivity(patients);
    expect(filterRecentActivity(items, 'bea', 'all').map((item) => item.event.atLabel)).toEqual(['AYER']);
    expect(filterRecentActivity(items, 'all', 'today').map((item) => item.patient.id)).toEqual(['ana']);
    expect(filterRecentActivity(items, 'all', 'yesterday').map((item) => item.patient.id)).toEqual(['bea']);
    expect(filterRecentActivity(items, 'all', 'older')).toEqual([]);
    expect(filterRecentActivity(items, 'ana', 'yesterday')).toEqual([]);
  });

  it('pagina la actividad de forma incremental sin duplicar ni omitir movimientos', () => {
    const many = patients.map((p, i) => patient({ ...p, id: `p${i}`, name: `Paciente ${i}`, timeline: Array.from({ length: 3 }, (_, j) => ({ id: `e${i}-${j}`, kind: 'habit' as const, atLabel: 'HOY', title: `Evento ${i}-${j}`, body: '' })) }));
    const items = buildRecentActivity(many);
    const first = paginateRecentActivity(items, 1, 4);
    const second = paginateRecentActivity(items, 2, 4);
    expect(first.items).toHaveLength(4);
    expect(first.hasMore).toBe(true);
    expect(second.items.map((item) => item.event.id)).toEqual(items.slice(0, 8).map((item) => item.event.id));
    expect(new Set([...first.items, ...second.items].map((item) => item.event.id)).size).toBe(second.items.length);
    expect(paginateRecentActivity(items, 3, 4).hasMore).toBe(false);
  });

  it('expone filtros y paginación en Actividad reciente', () => {
    const html = renderToStaticMarkup(<ShowroomWorkCenter module="reciente" patients={patients} now={now} {...callbacks} />);
    expect(html).toContain('Filtros de actividad reciente');
    expect(html).toContain('Todas las pacientes');
    expect(html).toContain('Hoy');
    expect(html).toContain('Ayer');
    expect(html).toContain('Anteriores');
  });

  it.each([
    ['reciente', 'Actividad reciente'],
    ['guardado', 'Guardado y recursos'],
    ['seguimiento', 'Centro de seguimiento'],
    ['paneles', 'Paneles del consultorio'],
    ['videollamadas', 'Videollamadas programadas'],
  ] as const)('renderiza %s como superficie Nutrigo operativa', (module, heading) => {
    const html = renderToStaticMarkup(<ShowroomWorkCenter module={module} patients={patients} now={now} {...callbacks} />);
    expect(html).toContain(heading);
    expect(html).toContain(module === 'videollamadas' ? 'Beatriz Paz' : 'Ana Ruiz');
    expect(html).not.toContain('diseño pendiente');
  });

  it('permite preparar asignaciones individuales o masivas sin ocultar los Planes B existentes', () => {
    const html = renderToStaticMarkup(<ShowroomWorkCenter module="guardado" patients={patients} now={now} {...callbacks} />);
    expect(html).toContain('Asignar recursos');
    expect(html).toContain('Cómo leer tu plan semanal');
    expect(html).toContain('Seleccionar Ana Ruiz');
    expect(html).toContain('Cena simple: omelette y vegetales');
  });

  it('separa acciones por flujo y protege los enlaces externos', () => {
    const seguimiento = renderToStaticMarkup(<ShowroomWorkCenter module="seguimiento" patients={patients} now={now} {...callbacks} />);
    expect(seguimiento).toContain('Revisar comidas');
    expect(seguimiento).toContain('Abrir ficha');
    const video = renderToStaticMarkup(<ShowroomWorkCenter module="videollamadas" patients={patients} now={now} {...callbacks} />);
    expect(video).toContain('Beatriz Paz');
    expect(video).toContain('Gestionar consulta');
    expect(video).toContain('rel="noopener noreferrer"');
    expect(video).not.toContain('Carla Sol');
  });
});
