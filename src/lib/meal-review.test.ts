import { describe, expect, it } from 'vitest';
import { mealCountsForGauge, nutriNameOf, patientMealCopy } from './meal-review';

describe('foto confirmada', () => {
  it('el indicador solo cuenta confirmadas o ajustadas con confianza de al menos 0,45', () => {
    expect(mealCountsForGauge({ status: 'confirmed', confidence: 0.45 })).toBe(true);
    expect(mealCountsForGauge({ status: 'adjusted', confidence: 0.9 })).toBe(true);
    expect(mealCountsForGauge({ status: 'confirmed', confidence: 0.449 })).toBe(false);
    expect(mealCountsForGauge({ status: 'pending_review', confidence: 0.9 })).toBe(false);
    expect(mealCountsForGauge({ status: 'adjusted', confidence: Number.NaN })).toBe(false);
  });

  it('la paciente ve el estado con el nombre y no una nota interna', () => {
    expect(patientMealCopy('pending_review', 'Ana')).toBe('Estimación pendiente de Ana');
    expect(patientMealCopy('confirmed', 'Ana')).toBe('Confirmada por Ana');
    expect(patientMealCopy('adjusted', 'Ana')).toBe('Confirmada por Ana');
    expect(patientMealCopy('pending_review', '  ')).toBe('Estimación pendiente de tu nutricionista');
    expect(patientMealCopy('confirmed', 'Ana')).not.toMatch(/nota/i);
  });

  it('limpia saltos de línea del nombre visible', () => {
    expect(nutriNameOf('Ana\nPérez')).toBe('Ana Pérez');
    expect(nutriNameOf(null)).toBe('tu nutricionista');
  });
});
