import { describe, expect, it } from 'vitest';
import type { Patient } from '../types';
import { contarHechos, elegirUna, fotosDeCola, railHoy, type HechoAccion } from './hoy-accion';

const ahora = new Date('2026-11-02T15:00:00Z');
const base = {
  id: 'p1', name: 'Ana López', initials: 'AL', tone: 'mint', status: 'Activa',
  adherence_score: 90, adherence_why: '', meal_logs: [], todayPlan: [], weekPlan: [],
  brief: null, appointment: null, messages: [],
} as unknown as Patient;

const hecho = (sourceKey: string, doneAt: string, patientId = 'p1'): HechoAccion =>
  ({ patientId, action: 'mensaje', sourceKey, doneAt });

describe('rail Hoy', () => {
  it('deja una sola acción por paciente y no inventa una si no hay nada para hacer', () => {
    const ana = { ...base, meal_logs: [{ id: 'f1', status: 'pending_review' }, { id: 'f2', status: 'pending_review' }], adherence_score: 40, todayPlan: [{ slot: 'Almuerzo', title: 'Pollo', time: '' }], appointment: null } as unknown as Patient;
    const bien = { ...base, id: 'p2', name: 'Julia Sosa', adherence_score: 90 } as unknown as Patient;
    const rail = railHoy([ana, bien, ana], [], [], ahora);
    expect(rail).toHaveLength(1);
    expect(rail[0]).toMatchObject({ patientId: 'p1', action: 'mensaje', titulo: 'Mandarle un mensaje' });
    expect(rail[0]!.href).toContain('accion=mensaje');
    expect(rail[0]!.href).not.toContain('/messages');
    expect(elegirUna(bien, [], [], ahora)).toBeNull();
  });

  it('usa la cola de fotos si el diario de la paciente todavía no las trae', () => {
    const cola = fotosDeCola([{ id: 'meal:foto-9', kind: 'meal', patient_id: 'p1' }, { id: 'msg:1', kind: 'message', patient_id: 'p1' }]);
    const item = elegirUna(base, cola, [], ahora);
    expect(item?.action).toBe('mensaje');
    expect(item?.sourceKey).toBe('fotos:1:foto-9');
    expect(item?.cuerpo).toContain('1 foto sin revisar');
  });

  it('prioriza el brief vigente y, si no hay fotos, ofrece menú o turno', () => {
    const conBrief = { ...base, brief: { suggested_action: 'turno', up_next_title: 'Proponer un turno', up_next_body: 'Hace falta un turno.', draft_message: 'no mandar', source_ids: ['a'], adherence_why: '' }, meal_logs: [{ id: 'f', status: 'pending_review' }] } as unknown as Patient;
    expect(elegirUna(conBrief, [], [], ahora)?.action).toBe('turno');
    expect(elegirUna(conBrief, [], [], ahora)?.borrador).toBeNull();
    const menu = { ...base, adherence_score: 50, todayPlan: [{ slot: 'Cena', title: 'Sopa', time: '' }] } as unknown as Patient;
    expect(elegirUna(menu, [], [], ahora)?.action).toBe('ajuste_menu');
    const turno = { ...base, adherence_score: 70, appointment: null } as unknown as Patient;
    expect(elegirUna(turno, [], [], ahora)?.href).toContain('/crm/agenda?');
  });

  it('esconde la misma fuente ya hecha en 7 días y la vuelve a mostrar si pasó la ventana', () => {
    const ana = { ...base, meal_logs: [{ id: 'f1', status: 'pending_review' }] } as unknown as Patient;
    const clave = elegirUna(ana, [], [], ahora)!.sourceKey;
    expect(elegirUna(ana, [], [hecho(clave, '2026-11-01T15:00:00Z')], ahora)).toBeNull();
    expect(elegirUna(ana, [], [hecho(clave, '2026-10-20T15:00:00Z')], ahora)?.action).toBe('mensaje');
  });

  it('cuenta las hechas de los últimos 7 días y deja afuera la más vieja', () => {
    const recientes = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'].map((dia, i) => hecho(`fotos:${i}:a`, `${dia}T12:00:00Z`, `p${i}`));
    const vieja = hecho('fotos:vieja:a', '2026-10-01T12:00:00Z', 'p9');
    expect(contarHechos([...recientes, vieja], ahora)).toBe(5);
    expect(contarHechos([vieja], ahora)).toBe(0);
  });

  it('no propone acción a una paciente archivada', () => {
    const archivada = { ...base, archived_at: '2026-10-01', meal_logs: [{ id: 'f', status: 'pending_review' }] } as unknown as Patient;
    expect(elegirUna(archivada, [], [], ahora)).toBeNull();
  });
});
