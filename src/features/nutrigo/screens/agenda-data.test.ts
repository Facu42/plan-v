import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { buildShowroomPatient } from '../../../components/nutrigo/showroom-model';
import type { Patient } from '../../../types';
import type { PatientMealPlan } from '../../../types/plans';
import { agendaDateId, agendaDateLabel, buildAgendaEvents, nextConsultation } from './agenda-data';

const patient = { id: 'p1', logs: [], activities: [], weekPlan: [{ day: 'Sábado', meals: [{ id: 'legacy', label: 'Legacy no publicado' }] }], appointment: null } as unknown as ShowroomPatient;
const now = new Date('2026-10-03T03:20:00Z');
describe('agenda fechada del paciente', () => {
  it('el controlador conserva starts_at y timezone en la vista de paciente', () => {
    const actual = { id:'p1', meal_logs:[], habit_logs:[], todayPlan:[], weekPlan:[], messages:[], appointment:{when:'Lunes · 00:30',starts_at:'2026-10-05T03:30:00Z',timezone:'America/Argentina/Buenos_Aires',duration:30,channel:'video'}, sleep_minutes:null } as unknown as Patient;
    expect(buildShowroomPatient(actual,now).appointment).toMatchObject({starts_at:'2026-10-05T03:30:00Z',timezone:'America/Argentina/Buenos_Aires'});
  });
  it('usa fechas del plan publicado y conserva indicaciones; nunca deduce comidas de la semana legacy', () => {
    const plan = { items: [{ id: 'real', for_date: '2026-10-08', slot: 'Almuerzo', portions: 2, recipe_title: 'Receta publicada', public_note: 'Sin maní' }] } as unknown as PatientMealPlan;
    expect(buildAgendaEvents(patient, plan, now)).toEqual([{ id: 'plan:real', kind: 'plan', day: '2026-10-08', title: 'Receta publicada', detail: 'Almuerzo · 2 porciones · Sin maní', time: 'Almuerzo' }]);
    expect(buildAgendaEvents(patient, null, now)).toEqual([]);
  });
  it.each(['UTC', 'Asia/Tokyo', 'America/Los_Angeles'])('conserva el turno absoluto y el día argentino con dispositivo %s', timezone => {
    const prior = process.env.TZ; process.env.TZ = timezone;
    try {
      const actual = { ...patient, appointment: { when: 'Lunes · 00:30', starts_at: '2026-10-05T03:30:00Z', timezone: 'America/Argentina/Buenos_Aires', duration: 30, channel: 'video' } } as ShowroomPatient;
      expect(buildAgendaEvents(actual, null, now)[0]).toMatchObject({ day: '2026-10-05', time: '00:30', title: 'Videollamada' });
      expect(agendaDateId(new Date('2026-10-03T01:00:00Z'))).toBe('2026-10-02');
      expect(agendaDateLabel('2026-10-05')).toBe('5/10/2026');
    } finally { process.env.TZ = prior; }
  });
  it('no desplaza un turno almacenado vencido a otra semana', () => {
    const actual = { ...patient, appointment: { when: 'Lunes · 15:00', starts_at: '2026-09-28T18:00:00Z', duration: 30, channel: 'presencial' } } as ShowroomPatient;
    expect(buildAgendaEvents(actual, null, now)[0].day).toBe('2026-09-28');
    expect(nextConsultation(actual.appointment!.when, now)?.toISOString()).toBe('2026-10-05T18:00:00.000Z');
  });
});
