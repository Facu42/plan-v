import { describe, expect, it } from 'vitest';
import { weightGauge } from './weight-gauge';

describe('medidor de peso (misma escala que la regla de la tarjeta)', () => {
  it('sin peso queda vacío', () => {
    expect(weightGauge(null, null, null)).toEqual({ from: null, to: null, pct: 0 });
  });

  it('sin meta usa los extremos de la regla y ubica el peso entre ellos', () => {
    // 66,3 kg → regla 75…55, igual que la tarjeta Peso.
    const gauge = weightGauge(66.3, null, 68.4);
    expect(gauge.from).toBe(75);
    expect(gauge.to).toBe(55);
    expect(gauge.pct).toBeCloseTo(43.5, 1);
  });

  it('con meta mide el avance desde el peso inicial hasta la meta', () => {
    expect(weightGauge(65, 60, 70)).toEqual({ from: 70, to: 60, pct: 50 });
  });

  it('nunca se sale del rango 0–100 %', () => {
    expect(weightGauge(58, 60, 70).pct).toBe(100);
    expect(weightGauge(72, 60, 70).pct).toBe(0);
  });

  it('con meta igual al inicio ya está cumplida', () => {
    expect(weightGauge(70, 70, 70).pct).toBe(100);
  });
});
