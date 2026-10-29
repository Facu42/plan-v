import { describe, expect, it } from 'vitest';
import type { Patient } from '../types';
import type { BillingBoard } from '../types/fees';
import { copyHomeBookingLink, homeAppointments, homeNews, homeMonth, homePendingTotal, homeAttention } from './panel-home';
import { vi } from 'vitest';

const now = new Date('2026-10-19T13:00:00Z');
const patient = (extra: Partial<Patient> = {}): Patient => ({ id: 'a', name: 'Ana', initials: 'A', tone: 'mint', meal_logs: [], habit_logs: [], messages: [], appointment: null, adherence_score: 0, ...extra }) as Patient;
describe('Inicio con datos registrados', () => {
  it('copia solo páginas habilitadas con la dirección de la aplicación', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    expect(await copyHomeBookingLink({ enabled: false, slug: 'consultorio' }, 'https://example.test', write)).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(await copyHomeBookingLink({ enabled: true, slug: 'consultorio-vero' }, 'https://example.test', write)).toBe(true);
    expect(write).toHaveBeenCalledWith('https://example.test/consultorio-vero');
    await expect(copyHomeBookingLink({ enabled: true, slug: 'consultorio' }, 'https://example.test', async () => { throw new Error('Sin permiso'); })).rejects.toThrow('Sin permiso');
  });
  it('respeta fecha real y huso argentino: no convierte un turno vencido en uno de la semana siguiente', () => {
    const patients = [patient({ appointment: { starts_at: '2026-10-19T12:00:00Z', when: 'Lunes · 09:00', duration: 30, channel: 'video' } }), patient({ id: 'b', appointment: { starts_at: '2026-10-20T01:00:00Z', when: 'Lunes · 22:00', duration: 30, channel: 'video' } }), patient({ id: 'c', appointment: { starts_at: '2026-10-20T12:00:00Z', when: 'Martes · 09:00', duration: 30, channel: 'video' } })];
    const result = homeAppointments(patients, now);
    expect(result.today.map(e => e.patient.id)).toEqual(['a', 'b']);
    expect(result.next?.patient.id).toBe('b');
  });
  it('mantiene turnos antiguos sin fecha, pero no inventa turnos para textos inválidos', () => {
    expect(homeAppointments([patient({ appointment: { when: 'Lunes · 09:00', duration: 30, channel: 'video' } })], now).today).toHaveLength(1);
    expect(homeAppointments([patient({ appointment: { starts_at: 'inválido', when: 'Lunes · 11:00', duration: 30, channel: 'video' } })], now).next).toBeNull();
    expect(homeAppointments([patient({ appointment: { when: 'Sin turno', duration: 30, channel: 'video' } })], now).today).toEqual([]);
  });
  it('conserva los turnos de hoy en el historial y no los duplica con el próximo turno', () => {
    const p = patient({ appointment: { starts_at: '2026-10-19T15:00:00Z', when: 'Lunes · 12:00', duration: 30, channel: 'video' }, appointment_history: [{ id: 'old', dateId: '2026-10-19', when: 'Lunes · 09:00', duration: 30, channel: 'video', action: 'elapsed', actor: 'system', at: '2026-10-19T13:00:00Z' }, { id: 'same', dateId: '2026-10-19', when: 'Lunes · 12:00', duration: 30, channel: 'video', action: 'scheduled', actor: 'pro', at: '2026-10-19T13:00:00Z' }] });
    expect(homeAppointments([p], now).today).toHaveLength(2);
    expect(homeAppointments([p], now).next?.at.toISOString()).toBe('2026-10-19T15:00:00.000Z');
  });
  it('respeta el contrato del directorio: elapsed sin texto de hora trae at como fin del turno', () => {
    const p = patient({ appointment_history: [{ id: 'real', dateId: '2026-10-19', when: '', duration: 30, channel: 'video', action: 'elapsed', actor: 'system', at: '2026-10-19T12:30:00Z' }] });
    expect(homeAppointments([p], now).today[0]?.at.toISOString()).toBe('2026-10-19T12:00:00.000Z');
  });
  it('usa rachas resumidas por el servidor, sin inferirlas de una ficha truncada', () => {
    expect(homeNews([patient()], now)).toEqual([]);
    expect(homeNews([patient()], now, [{ patient_id: 'a', days: 7, at_least: false }])[0].detail).toBe('7 días seguidos registrando comidas');
    expect(homeNews([patient()], now, [{ patient_id: 'a', days: 30, at_least: true }])[0].detail).toContain('Al menos 30 días');
  });
  it('solo felicita metas recientes y aniversarios reales, excluye archivadas', () => {
    const news = homeNews([patient({ goal_status: 'completed', goal_updated_at: '2026-10-18T15:00:00Z' }), patient({ id: 'b', created_at: '2025-10-19T15:00:00Z' }), patient({ id: 'c', goal_status: 'completed', goal_updated_at: '2026-01-01T15:00:00Z' }), patient({ id: 'd', archived_at: '2026-10-01', created_at: '2025-10-19T15:00:00Z' })], now);
    expect(news.map(n => n.patient.id)).toEqual(['a','b']);
  });
  it('diferencia falta de registros de una adherencia baja y no incluye archivadas', () => {
    expect(homeAttention([patient(), patient({ id: 'b', adherence_score: 60 }), patient({ id: 'c', adherence_score: 40, archived_at: '2026-10-01' })], []) .map(n => n.patient.id)).toEqual(['b']);
  });
  it('calcula cobrado y saldo del mes sin duplicar pagos ni cobrar deudas anteriores como nuevas', () => {
    const board = { patients: [{ patient_id: 'a', fee: null, charges: [{ id: 'old', due_on: '2026-09-01', amount: 100, status: 'open' }, { id: 'new', due_on: '2026-10-01', amount: 200, status: 'open' }], payments: [{ amount: 150, status: 'confirmed', paid_on: '2026-10-10' }, { amount: 900, status: 'reported', paid_on: '2026-10-11' }] }] } as BillingBoard;
    expect(homeMonth([patient()], board, now)).toMatchObject({ active: 1, collected: 150, outstanding: 150 });
    expect(homeMonth([], null, now)).toMatchObject({ active: 0, collected: null, outstanding: null });
  });
  it('no suma consultas a los pendientes: ya están en su propia agenda', () => {
    const counts = { intake: 1, meal: 2, ai_menu: 1, message: 3, payment: 0, appointment: 6, record: 1, fee_overdue: 2, quiet: 1 };
    expect(homePendingTotal(counts)).toBe(11);
    expect(homePendingTotal(counts, 2)).toBe(13);
  });
});
