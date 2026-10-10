import { describe, expect, it } from 'vitest';
import { planMeasurementEntry } from './measurement-entry';

const ids = (kind: string) => `00000000-0000-4000-8000-${kind.length.toString().padStart(12, '0')}`;

describe('carga de mediciones por fecha', () => {
  it('pide al menos una medición y no convierte campos vacíos en cero', () => {
    const plan = planMeasurementEntry({ date: '2026-10-01', values: { body_fat_pct: '', thigh: '  ' }, idFor: ids });
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.errors).toEqual(['Completá al menos una medición.']);
  });

  it('separa las métricas nuevas, que van juntas, de peso, cintura y cadera, que van una por una', () => {
    const plan = planMeasurementEntry({ date: '2026-10-01', values: { body_fat_pct: '27,5', thigh: '55', weight: '64,2', waist: '80' }, idFor: ids });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.batch?.captured_on).toBe('2026-10-01');
      expect(plan.batch?.items.map((item) => [item.kind, item.value])).toEqual([['body_fat_pct', 27.5], ['thigh', 55]]);
      expect(plan.legacy.map((entry) => [entry.kind, entry.value])).toEqual([['weight', 64.2], ['waist', 80]]);
    }
  });

  it('sin métricas nuevas no arma carga conjunta', () => {
    const plan = planMeasurementEntry({ date: '2026-10-01', values: { hip: '95' }, idFor: ids });
    expect(plan.ok && plan.batch).toBeNull();
    expect(plan.ok && plan.legacy).toHaveLength(1);
  });

  it('reúne todos los errores de lectura, con el nombre de cada métrica', () => {
    const plan = planMeasurementEntry({ date: '2026-10-01', values: { body_fat_pct: '150', thigh: 'abc', arm: '30' }, idFor: ids });
    expect(plan.ok).toBe(false);
    if (!plan.ok) {
      expect(plan.errors).toHaveLength(2);
      expect(plan.errors.join(' ')).toContain('Grasa corporal');
      expect(plan.errors.join(' ')).toContain('Muslo');
    }
  });

  it('rechaza fecha vacía o futura', () => {
    expect(planMeasurementEntry({ date: '', values: { arm: '30' }, idFor: ids }).ok).toBe(false);
    expect(planMeasurementEntry({ date: '2999-01-01', values: { arm: '30' }, idFor: ids }).ok).toBe(false);
  });

  it('omite las métricas que ya se guardaron en un intento anterior', () => {
    const plan = planMeasurementEntry({ date: '2026-10-01', values: { thigh: '55', weight: '64' }, idFor: ids, alreadySaved: new Set(['thigh', 'weight']) });
    expect(plan.ok).toBe(false);
  });

  it('usa el mismo identificador de cada métrica en cada intento, para reintentar sin duplicar', () => {
    const first = planMeasurementEntry({ date: '2026-10-01', values: { thigh: '55' }, idFor: ids });
    const second = planMeasurementEntry({ date: '2026-10-01', values: { thigh: '55' }, idFor: ids });
    expect(first.ok && first.batch?.items[0].id).toBe(second.ok && second.batch?.items[0].id);
  });
});
