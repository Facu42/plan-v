import { describe, expect, it } from 'vitest';
import type { Patient } from '../types';
import type { SchedulingBooking, SchedulingSettings } from '../types/scheduling';
import { agendaDay, buildPanelAgendaEvents, depositMode, hourWindow, mondayOf, nowFraction, weekDays, weekLabel, withHalfDeposit } from './panel-agenda';

const now = new Date('2026-10-21T13:10:00-03:00');
const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: '', sensitive_hours: '', plan_b: '',
  next_focus: '', adherence_score: 0, adherence_why: '', time: '', hydration: 0, energy: null, sleep_minutes: null,
  appointment: null, habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], meal_logs: [], messages: [], ...overrides,
});

describe('agenda del panel', () => {
  it('arma la semana de lunes a sábado en Argentina', () => {
    expect(agendaDay(now)).toBe('2026-10-21');
    expect(mondayOf('2026-10-21')).toBe('2026-10-19');
    expect(weekDays('2026-10-21')).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24']);
    expect(weekLabel(weekDays('2026-10-21'))).toBe('Semana del 19 al 24 de octubre');
  });

  it('colorea turnos, reservas por confirmar y bloqueos sin inventar horarios', () => {
    const booking = { id: 'b1', starts_at: '2026-10-23T14:30:00-03:00', duration_min: 60, status: 'requested', contact_name: 'Agustina Díaz', patient_id: null, type_id: 't1' } as SchedulingBooking;
    const settings = { types: [{ id: 't1', name: 'Primera consulta', channel: 'presencial', duration_min: 60, price_minor: 4000000, deposit_minor: 0, calendar_id: 'c' }], blocks: [{ id: 'k1', calendar_id: 'c', start: '2026-10-20T13:00:00-03:00', end: '2026-10-20T17:00:00-03:00', label: 'Hospital' }] } as SchedulingSettings;
    const events = buildPanelAgendaEvents([
      patient({ appointment: { when: 'Miércoles · 10:30', duration: 40, channel: 'video' } }),
      patient({ id: 'luz', name: 'Luz Paz', appointment: { when: 'Jueves · 09:00', duration: 40, channel: 'presencial' }, appointment_history: [{ id: 'h', when: 'Lunes · 09:00', dateId: '2026-10-12', duration: 40, channel: 'presencial', action: 'elapsed', actor: 'patient', at: '2026-10-12T12:00:00Z' }] }),
    ], settings, [booking], now, weekDays('2026-10-21'));
    expect(events.find(event => event.title === 'Ana Ruiz')?.tone).toBe('online');
    expect(events.find(event => event.title === 'Luz Paz')?.tone).toBe('seguimiento');
    expect(events.find(event => event.bookingId === 'b1')?.tone).toBe('pendiente');
    expect(events.find(event => event.tone === 'bloqueo')?.subtitle).toBe('Hospital');
    expect(events.some(event => event.day === '2026-10-25')).toBe(false);
  });

  it('no presenta una seña a medias como si fuera del cincuenta por ciento', () => {
    expect(depositMode([{ price_minor: 100, deposit_minor: 50 }])).toBe('on');
    expect(depositMode([{ price_minor: 100, deposit_minor: 0 }, { price_minor: 80, deposit_minor: 10 }])).toBe('mixed');
    expect(withHalfDeposit([{ price_minor: 101, deposit_minor: 0 }], true)[0].deposit_minor).toBe(51);
    expect(withHalfDeposit([{ price_minor: 100, deposit_minor: 50 }], false)[0].deposit_minor).toBe(0);
  });

  it('marca la hora actual solo dentro del día y la franja visible', () => {
    const events = buildPanelAgendaEvents([patient({ appointment: { starts_at: '2026-10-21T07:15:00-03:00', when: '', duration: 30, channel: 'presencial' } })], null, [], now, ['2026-10-21']);
    expect(hourWindow(events)).toEqual({ start: 7, end: 20 });
    expect(nowFraction(now, '2026-10-21', 8, 20)).toBeCloseTo((13 * 60 + 10 - 8 * 60) / (12 * 60));
    expect(nowFraction(now, '2026-10-22', 8, 20)).toBeNull();
  });
});
