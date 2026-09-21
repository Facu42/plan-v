import { describe, expect, it } from 'vitest';
import { appointmentDbError, CareError } from './repository.js';

describe('PV-25 turnos', () => {
  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => appointmentDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['PGRST205', '42883', '42703', 'PGRST202']) {
      try {
        appointmentDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toMatchObject({
          status: 501,
          message: 'Los turnos requieren instalar la migración de este módulo.',
        });
      }
    }
  });

  it('traduce solape y ausencia de turno a 409', () => {
    try {
      appointmentDbError({ code: 'PT409', message: 'appointment_overlap' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 409 });
    }
    try {
      appointmentDbError({ code: 'PT409', message: 'appointment_none' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({
        status: 409,
        message: 'No hay un turno para reprogramar',
      });
    }
  });
});
