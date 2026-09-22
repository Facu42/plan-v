import { describe, expect, it } from 'vitest';
import { CareError, diaryDbError } from './repository.js';

describe('PV-22 diario', () => {
  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => diaryDbError({ code: '42P01' })).toThrow(CareError);
    try {
      diaryDbError({ code: 'PGRST205' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({
        status: 501,
        message: 'El diario de comidas requiere instalar la migración de este módulo.',
      });
    }
    try {
      diaryDbError({ code: '42883' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
    try {
      diaryDbError({ code: '42703' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
  });
});
