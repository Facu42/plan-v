import { describe, expect, it } from 'vitest';
import type { GlobalPatientProgress } from '../types/progress-global';
import { filterRows, mealsNote, sortRows, weightLines } from './progress-global';

const row = (name: string, logged: number, weight: GlobalPatientProgress['weight'] = { state: 'none' }): GlobalPatientProgress => ({ patient_id: name, patient_name: name, weight, meals: { logged, previous: 0, pending: 0 } });
const ok = (delta: number | null): GlobalPatientProgress['weight'] => ({ state: 'ok', unit: 'kg', last: 68.4, last_on: '2026-10-02', from: delta === null ? null : 70, from_on: delta === null ? null : '2026-09-05', delta, points: 1 });

describe('Progreso global: lista', () => {
  const rows = [row('Bea', 0), row('Ana', 5), row('Carla', 0, ok(-1.6))];
  it('filtra por registros sin tratar la falta de registros como un error', () => {
    expect(filterRows(rows, 'with-records').map((r) => r.patient_name)).toEqual(['Ana', 'Carla']);
    expect(filterRows(rows, 'without-records').map((r) => r.patient_name)).toEqual(['Bea']);
    expect(filterRows(rows, 'all')).toHaveLength(3);
  });
  it('ordena sin sacar a nadie de la lista', () => {
    expect(sortRows(rows, 'name').map((r) => r.patient_name)).toEqual(['Ana', 'Bea', 'Carla']);
    expect(sortRows(rows, 'meals').map((r) => r.patient_name)).toEqual(['Ana', 'Bea', 'Carla']);
    expect(sortRows(rows, 'weight-change').map((r) => r.patient_name)).toEqual(['Carla', 'Ana', 'Bea']);
  });
  it('textos de peso en español', () => {
    expect(weightLines({ state: 'no-consent' }).main).toBe('Sin permiso');
    expect(weightLines({ state: 'none' }).main).toBe('Sin peso en el período');
    expect(weightLines(ok(-1.6))).toEqual({ main: '68,4 kg', note: '−1,6 kg desde 70 (05/09)' });
    expect(weightLines(ok(null)).note).toBe('Único registro del período (02/10).');
  });
  it('comidas: aclara cuando no hay datos en ninguno de los períodos', () => {
    expect(mealsNote({ logged: 0, previous: 0, pending: 0 })).toBe('Sin comidas en los dos períodos');
    expect(mealsNote({ logged: 3, previous: 2, pending: 0 })).toBe('2 en el período anterior');
  });
});
