import { describe, expect, it } from 'vitest';
import { bodyMassReference } from './body-mass-reference';

describe('referencia de IMC para planificación', () => {
  it('calcula con talla en metros y deriva el intervalo de peso de referencia', () => {
    const r = bodyMassReference(65, 165, 30)!;
    expect(r.bmi).toBeCloseTo(23.8751, 4);
    expect(r.category).toBe('En rango de referencia');
    expect(r.weightMin).toBeCloseTo(18.5 * 1.65 ** 2);
    expect(r.weightUpperExclusive).toBeCloseTo(25 * 1.65 ** 2);
  });
  it.each([[18.499, 'Por debajo del rango'], [18.5, 'En rango de referencia'], [24.999, 'En rango de referencia'], [25, 'Por encima del rango'], [30, 'IMC elevado'], [35, 'IMC elevado'], [40, 'IMC elevado']])('clasifica el valor original %s sin redondearlo', (bmi, category) => {
    expect(bodyMassReference(Number(bmi) * 4, 200, 25)?.category).toBe(category);
  });
  it('no aplica referencias de adultos a una paciente menor de 20 años', () => {
    const r = bodyMassReference(65, 165, 19)!;
    expect(r.bmi).toBeGreaterThan(0);
    expect(r.category).toBeNull();
    expect(r.weightMin).toBeNull();
    expect(bodyMassReference(65, 165, 20)?.category).not.toBeNull();
  });
  it.each([[0, 165, 30], [65, 0, 30], [NaN, 165, 30], [65, Infinity, 30], [65, 165, 0]])('rechaza datos incompletos o no finitos', (weight, height, age) => {
    expect(bodyMassReference(weight, height, age)).toBeNull();
  });
});
