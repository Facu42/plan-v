import { describe, expect, it } from 'vitest';
import { buildProfessionalSummary, upcomingAppointmentDate } from './professional-summary';

const now = new Date('2026-09-26T12:00:00Z');

const patients = [
  { id: 'sofia', adherence_score: 60, appointment: null, meal_logs: [{ patient_id: 'sofia', status: 'pending_review' }, { patient_id: 'other', status: 'pending_review' }] },
  { id: 'marina', adherence_score: 80, appointment: { when: 'Jueves · 14:30', starts_at: '2026-09-28T14:30:00Z' }, meal_logs: [{ patient_id: 'marina', status: 'confirmed' }] },
  { id: 'arch', archived_at: '2026-09-01', adherence_score: 0, appointment: { when: 'Viernes' }, meal_logs: [{ patient_id: 'arch', status: 'pending_review' }] },
];

describe('resumen profesional del showroom', () => {
  it('agrega solo pacientes activos y registros del paciente correspondiente', () => {
    expect(buildProfessionalSummary(patients, now)).toEqual({ active: 2, pending: 1, appointments: 1, adherence: 70 });
  });
  it('distingue ausencia de datos de adherencia cero', () => {
    expect(buildProfessionalSummary([])).toEqual({ active: 0, pending: 0, appointments: 0, adherence: null });
    expect(buildProfessionalSummary([{ ...patients[0], adherence_score: 0 }]).adherence).toBe(0);
  });
  it('excluye los turnos vencidos y fechas inválidas del resumen', () => {
    const expired = { ...patients[1], appointment: { when: 'Jueves · 14:30', starts_at: '2026-09-24T14:30:00Z' } };
    expect(upcomingAppointmentDate(expired.appointment, now)).toBeNull();
    expect(buildProfessionalSummary([expired], now).appointments).toBe(0);
    expect(upcomingAppointmentDate({ when: 'Jueves · 14:30', starts_at: 'fecha inválida' }, now)).toBeNull();
  });
});
