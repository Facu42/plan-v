import { describe, expect, it } from 'vitest';
import { careDataSchema } from '../../src/types/care.js';
import { CareError, careDbError } from './repository.js';

describe('PV-17 medidas', () => {
  it('completa unidad y origen por defecto y no acepta un peso colado en una foto', () => {
    expect(careDataSchema.parse({ kind: 'weight', value: 64.5, note: '' })).toMatchObject({ unit: 'kg', source: 'patient' });
    expect(careDataSchema.parse({ kind: 'hip', value: 98, note: '', unit: 'in', source: 'professional' })).toMatchObject({ unit: 'in', source: 'professional' });
    expect(careDataSchema.safeParse({ kind: 'body_photo', path: 'p/x', note: '', value: 70 }).success).toBe(false);
    expect(careDataSchema.safeParse({ kind: 'weight', value: 64.5, note: '', unit: 'cm' }).success).toBe(false);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => careDbError({ code: '42P01' })).toThrow(CareError);
    try {
      careDbError({ code: 'PGRST205' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501, message: 'El seguimiento requiere instalar la migración de este módulo.' });
    }
  });
});
