import { describe, expect, it } from 'vitest';
import { greeting, money, num, stateLabel } from './centro-format';

describe('textos del centro de mando', () => {
  it('formatea plata y números en español', () => {
    expect(money(25000)).toBe('$ 25.000');
    expect(num(11)).toBe('11');
    expect(stateLabel('vencida')).toBe('Vencida');
  });
  it('saluda con el primer nombre', () => {
    expect(greeting('Facundo Pérez')).toMatch(/Facundo\.$/);
  });
});
