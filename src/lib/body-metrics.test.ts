import { describe, expect, it } from 'vitest';
import {
  BODY_METRIC_KINDS, METRIC_GROUPS, METRIC_KINDS, bodyMetricBatchSchema, metricDefinition, parseMetricValue, summarizeMetric,
} from './body-metrics';

const row = (value: number, captured_on: string, unit = 'kg', created_at = `${captured_on}T12:00:00Z`) => ({ value, captured_on, unit, created_at });

describe('catálogo de mediciones', () => {
  it('reparte todas las métricas en los tres grupos y cada una tiene unidad y rango', () => {
    for (const kind of METRIC_KINDS) {
      const definition = metricDefinition(kind);
      expect(METRIC_GROUPS.map((group) => group.id)).toContain(definition.group);
      expect(definition.unit).not.toBe('');
      expect(definition.min).toBeLessThan(definition.max);
    }
    expect(METRIC_KINDS.filter((kind) => metricDefinition(kind).group === 'basicas')).toEqual(['height', 'weight', 'waist', 'hip']);
  });

  it('las métricas nuevas no pisan peso, cintura ni cadera, que siguen su camino anterior', () => {
    expect(BODY_METRIC_KINDS).not.toContain('weight');
    expect(BODY_METRIC_KINDS).not.toContain('waist');
    expect(BODY_METRIC_KINDS).not.toContain('hip');
    expect(BODY_METRIC_KINDS).toContain('body_fat_pct');
    expect(BODY_METRIC_KINDS).toContain('thigh');
  });
});

describe('lectura de un valor escrito a mano', () => {
  it('deja vacío lo que no se completó, sin convertirlo en cero', () => {
    expect(parseMetricValue('body_fat_pct', '')).toEqual({ ok: true, empty: true });
    expect(parseMetricValue('body_fat_pct', '   ')).toEqual({ ok: true, empty: true });
  });

  it('acepta coma o punto decimal y respeta el rango de cada métrica', () => {
    expect(parseMetricValue('body_fat_pct', '27,5')).toEqual({ ok: true, empty: false, value: 27.5 });
    expect(parseMetricValue('height', '168.5')).toEqual({ ok: true, empty: false, value: 168.5 });
    expect(parseMetricValue('body_fat_pct', '120')).toMatchObject({ ok: false });
    expect(parseMetricValue('body_fat_pct', '0')).toMatchObject({ ok: false });
    expect(parseMetricValue('thigh', 'abc')).toMatchObject({ ok: false });
    expect(parseMetricValue('thigh', '5')).toMatchObject({ ok: false });
  });

  it('pide números enteros donde corresponde', () => {
    expect(parseMetricValue('metabolic_age', '34')).toEqual({ ok: true, empty: false, value: 34 });
    expect(parseMetricValue('metabolic_age', '34,5')).toMatchObject({ ok: false });
  });

  it('el mensaje de error nombra la métrica y su rango', () => {
    const result = parseMetricValue('body_water_pct', '5');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Agua corporal');
  });
});

describe('resumen de una métrica', () => {
  it('sin registros no devuelve resumen', () => {
    expect(summarizeMetric([])).toBeNull();
  });

  it('calcula cantidad, mínimo, promedio, máximo y diferencia con la medición anterior', () => {
    const summary = summarizeMetric([row(70, '2026-09-01'), row(68, '2026-09-15'), row(69, '2026-10-01')])!;
    expect(summary).toMatchObject({ unit: 'kg', count: 3, min: 68, max: 70, average: 69, first: { value: 70, date: '2026-09-01' }, last: { value: 69, date: '2026-10-01' } });
    expect(summary.changeFromPrevious).toBe(1);
    expect(summary.changeFromFirst).toBe(-1);
    expect(summary.trend).toBe('up');
  });

  it('ordena por fecha y luego por hora de carga, sin importar el orden de llegada', () => {
    const summary = summarizeMetric([row(69, '2026-10-01'), row(70, '2026-09-01'), row(71, '2026-10-01', 'kg', '2026-10-01T18:00:00Z')])!;
    expect(summary.last.value).toBe(71);
    expect(summary.history.map((entry) => entry.value)).toEqual([71, 69, 70]);
  });

  it('el historial va de lo nuevo a lo viejo con la diferencia contra el registro anterior', () => {
    const summary = summarizeMetric([row(70, '2026-09-01'), row(68.5, '2026-09-15'), row(69, '2026-10-01')])!;
    expect(summary.history.map((entry) => entry.change)).toEqual([0.5, -1.5, null]);
    expect(summary.history[0].isLatest).toBe(true);
    expect(summary.history[1].isLatest).toBe(false);
  });

  it('con un solo registro no hay diferencia ni tendencia', () => {
    const summary = summarizeMetric([row(70, '2026-09-01')])!;
    expect(summary.changeFromPrevious).toBeNull();
    expect(summary.trend).toBe('none');
  });

  it('una diferencia nula es estable', () => {
    expect(summarizeMetric([row(70, '2026-09-01'), row(70, '2026-09-08')])!.trend).toBe('flat');
  });

  it('no mezcla unidades: usa la del último registro y avisa cuántos quedaron afuera', () => {
    const summary = summarizeMetric([row(150, '2026-09-01', 'lb'), row(68, '2026-09-15'), row(69, '2026-10-01')])!;
    expect(summary.unit).toBe('kg');
    expect(summary.count).toBe(2);
    expect(summary.otherUnits).toBe(1);
  });

  it('redondea el promedio y las diferencias a un decimal sin arrastrar error de coma flotante', () => {
    const summary = summarizeMetric([row(0.1, '2026-09-01'), row(0.2, '2026-09-02'), row(0.4, '2026-09-03')])!;
    expect(summary.average).toBe(0.2);
    expect(summary.changeFromPrevious).toBe(0.2);
  });
});

describe('carga agrupada por fecha', () => {
  const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  it('acepta varias métricas nuevas de una misma fecha', () => {
    const parsed = bodyMetricBatchSchema.safeParse({ captured_on: '2026-10-01', items: [{ id: id(1), kind: 'body_fat_pct', value: 27.5 }, { id: id(2), kind: 'thigh', value: 55 }] });
    expect(parsed.success).toBe(true);
  });

  it('rechaza peso, cintura y cadera, que se cargan por el camino de siempre', () => {
    for (const kind of ['weight', 'waist', 'hip']) {
      expect(bodyMetricBatchSchema.safeParse({ captured_on: '2026-10-01', items: [{ id: id(1), kind, value: 60 }] }).success).toBe(false);
    }
  });

  it('rechaza lista vacía, métricas repetidas, valores fuera de rango y campos de más', () => {
    expect(bodyMetricBatchSchema.safeParse({ captured_on: '2026-10-01', items: [] }).success).toBe(false);
    expect(bodyMetricBatchSchema.safeParse({ captured_on: '2026-10-01', items: [{ id: id(1), kind: 'thigh', value: 55 }, { id: id(2), kind: 'thigh', value: 56 }] }).success).toBe(false);
    expect(bodyMetricBatchSchema.safeParse({ captured_on: '2026-10-01', items: [{ id: id(1), kind: 'body_fat_pct', value: 150 }] }).success).toBe(false);
    expect(bodyMetricBatchSchema.safeParse({ captured_on: '2026-10-01', items: [{ id: id(1), kind: 'thigh', value: 55, unit: 'in' }] }).success).toBe(false);
  });

  it('rechaza fechas futuras', () => {
    expect(bodyMetricBatchSchema.safeParse({ captured_on: '2999-01-01', items: [{ id: id(1), kind: 'thigh', value: 55 }] }).success).toBe(false);
  });

  it('rechaza identificadores repetidos', () => {
    expect(bodyMetricBatchSchema.safeParse({ captured_on: '2026-10-01', items: [{ id: id(1), kind: 'thigh', value: 55 }, { id: id(1), kind: 'arm', value: 30 }] }).success).toBe(false);
  });
});
