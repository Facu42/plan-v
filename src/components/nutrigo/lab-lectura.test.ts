import { describe, expect, it } from 'vitest';
import type { LaboratoryValue } from '../../types/clinical-workspace';
import type { RecordLabSeries } from './panel-record-data';
import { armarLectura } from './lab-lectura';

const valor = (value: number | null, range_text: string, extra: Partial<LaboratoryValue> = {}) => ({ id: 'v', name: 'x', value, operator: '', unit: '', range_text, raw_value: String(value), source_line: 'l', page: 1, reviewed: true, ...extra }) as LaboratoryValue;
const serie = (name: string, unit: string, filas: Array<[string, LaboratoryValue]>): RecordLabSeries => ({
  key: name, name, unit, latest: filas[filas.length - 1]![1], date: filas[filas.length - 1]![0],
  values: filas.map(([date, value]) => ({ date, value })), points: [],
});

describe('lectura automática del laboratorio', () => {
  it('sin valores no inventa nada', () => {
    const l = armarLectura([]);
    expect(l).toMatchObject({ ultima: null, previa: null, filas: [] });
    expect(l.texto).toContain('Todavía no hay valores revisados');
  });

  it('compara con el análisis anterior y nombra lo que sale de rango y lo que está en el límite', () => {
    const l = armarLectura([
      serie('Ferritina', 'ng/ml', [['2026-03-10', valor(11, '15 - 150')], ['2026-10-10', valor(14, '15 - 150')]]),
      serie('Vitamina D', 'ng/ml', [['2026-03-10', valor(25, '30 - 100')], ['2026-10-10', valor(31, '30 - 100')]]),
      serie('Glucemia', 'mg/dl', [['2026-03-10', valor(88, '70 - 100')], ['2026-10-10', valor(86, '70 - 100')]]),
    ]);
    expect([l.ultima, l.previa]).toEqual(['2026-10-10', '2026-03-10']);
    expect(l.filas.map(f => [f.nombre, f.cambio])).toEqual([['Ferritina', 'sube 3'], ['Vitamina D', 'sube 6'], ['Glucemia', 'baja 2']]);
    expect(l.texto).toContain('Fuera de rango: Ferritina 14 ng/ml (bajo).');
    expect(l.texto).toContain('En el límite de abajo: Vitamina D 31 ng/ml.');
    expect(l.texto).toContain('Desde el 10/03/26: Ferritina sube 3, Vitamina D sube 6 y Glucemia baja 2.');
    expect(l.texto).toContain('El criterio clínico es tuyo.');
  });

  it('con un solo análisis dice «primera vez» y no habla de cambios', () => {
    const l = armarLectura([serie('Glucemia', 'mg/dl', [['2026-10-10', valor(86, '70 - 100')]])]);
    expect(l.filas[0]!.cambio).toBe('primera vez');
    expect(l.texto).toContain('ninguno fuera del rango del informe');
    expect(l.texto).not.toContain('Desde el');
  });

  it('no calcula diferencias con resultados que no son un valor exacto', () => {
    const l = armarLectura([serie('Colesterol', 'mg/dl', [['2026-03-10', valor(190, '', { operator: '<' })], ['2026-10-10', valor(200, '')]])]);
    expect(l.filas[0]!.cambio).toMatch(/^antes/);
    expect(l.texto).not.toContain('Desde el');
  });
});
