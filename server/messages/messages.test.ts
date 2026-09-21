import { describe, expect, it } from 'vitest';
import { CareError, messageDbError } from './repository.js';

describe('PV-23 hilos', () => {
  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => messageDbError({ code: '42P01' })).toThrow(CareError);
    try {
      messageDbError({ code: 'PGRST205' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({
        status: 501,
        message: 'Los hilos de mensajes requieren instalar la migración de este módulo.',
      });
    }
    try {
      messageDbError({ code: '42883' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
    try {
      messageDbError({ code: '42703' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
    try {
      messageDbError({ code: 'PT409' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 409 });
    }
    try {
      messageDbError({ code: 'PT404', message: 'thread_attachment_missing' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 404, message: 'El adjunto ya no está disponible.' });
    }
  });
});
