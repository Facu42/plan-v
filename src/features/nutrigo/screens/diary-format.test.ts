import { describe, expect, it } from 'vitest';
import { macroCell, mealTitle, newestFirst, nutrientTotal, statNumber } from './diary-format';

type Row = { id: string; logged_at: string; status: string; macros: Record<string, number> | null; description: string; foods: { name: string }[] };
const row = (id: string, logged_at: string, extra: Partial<Row> = {}): Row => ({ id, logged_at, status: 'reviewed', macros: { kcal: 100, carbs_g: 10, protein_g: 5, fat_g: 2 }, description: '', foods: [], ...extra });

describe('registros del diario más nuevos primero', () => {
  it('compara el instante real aunque las horas vengan con distinta zona', () => {
    const list = [row('a', '2026-10-03T11:30:00-03:00'), row('b', '2026-10-03T14:00:00Z'), row('c', '2026-10-03T20:00:00-03:00')];
    // 14:00Z son las 11:00 de Buenos Aires: queda último aunque como texto «14» sea mayor que «11» y «20».
    expect(newestFirst(list).map(item => item.id)).toEqual(['c', 'a', 'b']);
  });
  it('los registros sin fecha válida van al final y no rompen el orden', () => {
    const list = [row('mala', 'sin fecha'), row('ok', '2026-10-03T11:30:00-03:00')];
    expect(newestFirst(list).map(item => item.id)).toEqual(['ok', 'mala']);
  });
  it('no modifica la lista recibida', () => {
    const list = [row('a', '2026-10-01T10:00:00-03:00'), row('b', '2026-10-02T10:00:00-03:00')];
    newestFirst(list);
    expect(list.map(item => item.id)).toEqual(['a', 'b']);
  });
});

describe('total de un nutriente', () => {
  it('suma sólo comidas revisadas con nutrientes', () => {
    const list = [row('a', '2026-10-03T10:00:00-03:00'), row('b', '2026-10-03T11:00:00-03:00', { status: 'pending_review' }), row('c', '2026-10-03T12:00:00-03:00', { macros: null })];
    expect(nutrientTotal(list, 'kcal')).toBe(100);
  });
  it('ignora valores inválidos: NaN, infinito, negativos y textos', () => {
    const bad = [Number.NaN, Number.POSITIVE_INFINITY, -50, '300' as unknown as number, undefined as unknown as number];
    const list = bad.map((kcal, index) => row(`m${index}`, '2026-10-03T10:00:00-03:00', { macros: { kcal, carbs_g: 0, protein_g: 0, fat_g: 0 } }));
    expect(nutrientTotal([...list, row('ok', '2026-10-03T10:00:00-03:00', { macros: { kcal: 250, carbs_g: 1, protein_g: 1, fat_g: 1 } })], 'kcal')).toBe(250);
  });
  it('sin registros es cero, no NaN', () => { expect(nutrientTotal([], 'fat_g')).toBe(0); });
});

describe('cifra de las tarjetas', () => {
  it('usa punto de miles y entra en la tarjeta aun con valores absurdos', () => {
    expect(statNumber(12615)).toBe('12.615');
    expect(statNumber(0)).toBe('0');
    expect(statNumber(1234.6)).toBe('1.235');
    expect(statNumber(12_345_678)).toBe('12,3 M');
    expect(statNumber(Number.NaN)).toBe('0');
  });
});

describe('nombre de la comida en la tabla', () => {
  it('usa la descripción, luego los alimentos y al final un texto corto', () => {
    expect(mealTitle(row('a', '2026-10-03T10:00:00-03:00', { description: '  Milanesa  ' }))).toBe('Milanesa');
    expect(mealTitle(row('a', '2026-10-03T10:00:00-03:00', { foods: [{ name: 'Pan' }, { name: 'Queso' }] }))).toBe('Pan, Queso');
    expect(mealTitle(row('a', '2026-10-03T10:00:00-03:00', { description: '   ' }))).toBe('Comida registrada');
  });
});

describe('celda de nutrientes', () => {
  it('muestra el valor con coma decimal y un guion cuando no hay dato válido', () => {
    expect(macroCell(12.34)).toBe('12,3'); expect(macroCell(0)).toBe('0'); expect(macroCell(1540)).toBe('1.540'); expect(macroCell(250_000)).toBe('250 k'); expect(macroCell(9e9)).toBe('9000 M');
    for (const value of [undefined, null, Number.NaN, -1, '5', Number.POSITIVE_INFINITY]) expect(macroCell(value)).toBe('—');
  });
});
