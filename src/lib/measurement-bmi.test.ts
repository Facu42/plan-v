import { describe, expect, it } from 'vitest';
import { latestBmi } from './measurement-bmi';

const m = (kind: string, value_numeric: number, captured_on: string, unit: string) => ({ id: `${kind}${captured_on}`, patient_id: 'p', kind, value_numeric, unit, source: 'professional', captured_on, created_at: `${captured_on}T10:00:00Z` }) as never;

describe('IMC desde las mediciones', () => {
  it('usa el último peso en kg y la última altura', () => {
    const r = latestBmi([m('weight', 70, '2026-09-01', 'kg'), m('weight', 65, '2026-10-01', 'kg'), m('height', 160, '2026-08-01', 'cm')], 30)!;
    expect(r.bmi).toBeCloseTo(25.4, 1);
    expect(r.category).toBe('Por encima del rango');
    expect(r.weightDate).toBe('2026-10-01');
  });
  it('sin peso o sin altura no calcula', () => {
    expect(latestBmi([m('weight', 64, '2026-10-01', 'kg')], 30)).toBeNull();
    expect(latestBmi([m('height', 160, '2026-10-01', 'cm')], 30)).toBeNull();
  });
  it('ignora pesos en libras para no mezclar unidades', () => {
    expect(latestBmi([m('weight', 140, '2026-10-01', 'lb'), m('height', 160, '2026-10-01', 'cm')], 30)).toBeNull();
  });
  it('sin edad conocida o menor de 20 no clasifica', () => {
    const rows = [m('weight', 64, '2026-10-01', 'kg'), m('height', 160, '2026-10-01', 'cm')];
    expect(latestBmi(rows, null)!.category).toBeNull();
    expect(latestBmi(rows, 17)!.category).toBeNull();
  });
});
