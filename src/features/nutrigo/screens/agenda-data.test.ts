import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { buildShowroomPatient } from '../../../components/nutrigo/showroom-model';
import type { Patient } from '../../../types';
import { agendaDateId, agendaDateLabel, buildAgendaEvents, nextConsultation } from './agenda-data';

const patient = { id: 'p1', logs: [], activities: [], weekPlan: [{ day: 'Sábado', meals: [{ id: 'legacy', label: 'Legacy no publicado' }] }], appointment: null } as unknown as ShowroomPatient;
const now = new Date('2026-10-03T03:20:00Z');
describe('agenda fechada del paciente', () => {
  it('el controlador conserva starts_at y timezone en la vista de paciente', () => {
    const actual = { id:'p1', meal_logs:[], habit_logs:[], todayPlan:[], weekPlan:[], messages:[], appointment:{when:'Lunes · 00:30',starts_at:'2026-10-05T03:30:00Z',timezone:'America/Argentina/Buenos_Aires',duration:30,channel:'video'}, sleep_minutes:null } as unknown as Patient;
    expect(buildShowroomPatient(actual,now).appointment).toMatchObject({starts_at:'2026-10-05T03:30:00Z',timezone:'America/Argentina/Buenos_Aires'});
  });
  it('la agenda es solo de citas con la nutricionista: no mezcla comidas, actividad ni plan', () => {
    const busy = { ...patient,
      logs: [{ id: 'l1', slot: 'Almuerzo', description: 'Pollo', logged_at: '2026-10-02T15:00:00Z' }],
      activities: [{ id: 'a1', activity: 'Caminata', duration_minutes: 30, intensity: 'Suave', logged_at: '2026-10-02T12:00:00Z' }],
    } as unknown as ShowroomPatient;
    expect(buildAgendaEvents(busy, now)).toEqual([]);
    const withSlot = { ...busy, appointment: { when: 'Lunes · 00:30', starts_at: '2026-10-05T03:30:00Z', duration: 30, channel: 'presencial' } } as ShowroomPatient;
    expect(buildAgendaEvents(withSlot, now).map(event => event.kind)).toEqual(['consult']);
  });
  it('sin cita no hay eventos', () => {
    expect(buildAgendaEvents(patient, now)).toEqual([]);
  });
  it.each(['UTC', 'Asia/Tokyo', 'America/Los_Angeles'])('conserva el turno absoluto y el día argentino con dispositivo %s', timezone => {
    const prior = process.env.TZ; process.env.TZ = timezone;
    try {
      const actual = { ...patient, appointment: { when: 'Lunes · 00:30', starts_at: '2026-10-05T03:30:00Z', timezone: 'America/Argentina/Buenos_Aires', duration: 30, channel: 'video' } } as ShowroomPatient;
      expect(buildAgendaEvents(actual, now)[0]).toMatchObject({ day: '2026-10-05', time: '00:30', title: 'Videollamada' });
      expect(agendaDateId(new Date('2026-10-03T01:00:00Z'))).toBe('2026-10-02');
      expect(agendaDateLabel('2026-10-05')).toBe('5/10/2026');
    } finally { process.env.TZ = prior; }
  });
  it('no desplaza un turno almacenado vencido a otra semana', () => {
    const actual = { ...patient, appointment: { when: 'Lunes · 15:00', starts_at: '2026-09-28T18:00:00Z', duration: 30, channel: 'presencial' } } as ShowroomPatient;
    expect(buildAgendaEvents(actual, now)[0].day).toBe('2026-09-28');
    expect(nextConsultation(actual.appointment!.when, now)?.toISOString()).toBe('2026-10-05T18:00:00.000Z');
  });
});
