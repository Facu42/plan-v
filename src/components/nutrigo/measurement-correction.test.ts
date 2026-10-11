import { describe, expect, it } from 'vitest';
import { measurementCorrectionMode } from './CarePanel';

const own = (reviewed_at: string | null, source = 'patient') => ({ reviewed_at, data: { kind: 'weight', source } });

describe('cuándo se corrige una medida', () => {
  it('la propia sin revisar se corrige o se borra', () => {
    expect(measurementCorrectionMode(own(null), false)).toBe('edit');
  });
  it('la propia ya revisada sólo pide corrección', () => {
    expect(measurementCorrectionMode(own('2026-10-01T00:00:00Z'), false)).toBe('request');
  });
  it('la de la nutricionista y el resto de registros no se tocan', () => {
    expect(measurementCorrectionMode(own(null, 'professional'), false)).toBeNull();
    expect(measurementCorrectionMode(own(null), true)).toBeNull();
    expect(measurementCorrectionMode({ reviewed_at: null, data: { kind: 'activity', source: 'patient' } }, false)).toBeNull();
  });
});
