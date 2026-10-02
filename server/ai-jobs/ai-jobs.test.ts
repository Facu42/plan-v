import { describe, expect, it } from 'vitest';
import { aiJobDbError, CareError } from './repository.js';
import { aiJobEnqueueSchema } from '../../src/types/ai-jobs.js';

describe('errores de jobs de IA', () => {
  it('rechaza fechas imposibles y períodos excesivos antes de generar', () => {
    const input = { patient_id: 'patient', job_type: 'menu_draft', period_start: '2026-10-01', period_end: '2026-10-22' };
    expect(aiJobEnqueueSchema.safeParse(input).success).toBe(true);
    for (const dates of [
      { period_end: '2026-10-23' },
      { period_start: '2026-02-30', period_end: '2026-03-03' },
      { period_start: '2026-13-01', period_end: '2026-13-02' },
    ]) expect(aiJobEnqueueSchema.safeParse({ ...input, ...dates }).success).toBe(false);
  });
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
