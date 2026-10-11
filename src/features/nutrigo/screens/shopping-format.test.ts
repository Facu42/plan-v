import { describe, expect, it } from 'vitest';
import { boughtLabel, productCount, quantityLabel, recentMonths } from './shopping-format';

describe('cantidad de un producto', () => {
  it('muestra hasta dos decimales con coma y no redondea 0,25 a 0,3', () => {
    expect(quantityLabel(0.25)).toBe('0,25');
    expect(quantityLabel(3.5)).toBe('3,5');
    expect(quantityLabel(500)).toBe('500');
    expect(quantityLabel(0.333)).toBe('0,33');
  });
  it('sin dato, cero, negativa o inválida se muestra un guion', () => {
    for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -2, 0]) expect(quantityLabel(value)).toBe('-');
  });
  it('un número enorme se abrevia para no pisar las otras columnas', () => {
    expect(quantityLabel(100000)).toBe('100.000');
    expect(quantityLabel(12_500_000)).toBe('12,5 M');
  });
});

describe('textos con plural', () => {
  it('concuerda comprados y productos con el número', () => {
    expect([0, 1, 2].map(boughtLabel)).toEqual(['0 comprados', '1 comprado', '2 comprados']);
    expect([0, 1, 2].map(productCount)).toEqual(['0 productos', '1 producto', '2 productos']);
  });
});

describe('meses del resumen', () => {
  it('termina en el mes de Argentina de la fecha dada y cruza el cambio de año', () => {
    const months = recentMonths(new Date('2027-02-10T12:00:00-03:00'), 4);
    expect(months.map(item => [item.year, item.month])).toEqual([[2026, 10], [2026, 11], [2027, 0], [2027, 1]]);
  });
  it('a las 22:30 del 31 de octubre en Buenos Aires el último mes sigue siendo octubre', () => {
    const original = process.env.TZ; process.env.TZ = 'UTC';
    try { expect(recentMonths(new Date('2026-11-01T01:30:00Z'), 2).map(item => item.month)).toEqual([8, 9]); }
    finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
  });
});
