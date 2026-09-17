import { describe, expect, it } from 'vitest';
import { buildProfessionalSummary } from './professional-summary';

const patients = [
  { id: 'sofia', adherence_score: 60, appointment: null, meal_logs: [{ patient_id: 'sofia', status: 'pending_review' }, { patient_id: 'other', status: 'pending_review' }] },
  { id: 'marina', adherence_score: 80, appointment: { when: 'Jueves' }, meal_logs: [{ patient_id: 'marina', status: 'confirmed' }] },
  { id: 'arch', archived_at: '2026-09-01', adherence_score: 0, appointment: { when: 'Viernes' }, meal_logs: [{ patient_id: 'arch', status: 'pending_review' }] },
];

describe('resumen profesional del showroom', () => {
  it('agrega solo pacientes activos y registros del paciente correspondiente', () => {
    expect(buildProfessionalSummary(patients)).toEqual({ active: 2, pending: 1, appointments: 1, adherence: 70 });
  });
  it('distingue ausencia de datos de adherencia cero', () => {
    expect(buildProfessionalSummary([])).toEqual({ active: 0, pending: 0, appointments: 0, adherence: null });
    expect(buildProfessionalSummary([{ ...patients[0], adherence_score: 0 }]).adherence).toBe(0);
  });
});
