import { describe, expect, it } from 'vitest';
import { aiJobDbError, CareError } from './repository.js';

describe('errores de jobs de IA', () => {
  it('falla cerrado si falta el schema y no disfraza un 500', () => {
    expect(() => aiJobDbError({ code: '42P01' })).toThrow(CareError);
    try {
      aiJobDbError({ code: '42883' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
    try {
      aiJobDbError({ code: 'PT429', message: 'ai_job_budget' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 429 });
    }
    try {
      aiJobDbError({ code: 'PT409', message: 'ai_job_allergies' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 409 });
    }
  });
});
