import { afterEach, describe, expect, it } from 'vitest';
import { argentinaDate, argentinaDay, argentinaMonth, argentinaTime } from './ar-time';

const original = process.env.TZ;
const inZone = (zone: string) => { process.env.TZ = zone; };
afterEach(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });

describe('hora y fecha en Argentina, sin importar la zona del navegador', () => {
  it('una comida de las 22:30 de Buenos Aires sigue siendo del mismo día y hora desde otra zona', () => {
    inZone('UTC');
    expect(argentinaTime('2026-10-03T22:30:00-03:00')).toBe('10:30 p. m.');
    expect(argentinaDate('2026-10-03T22:30:00-03:00')).toBe('3/10/2026');
  });
  it('el límite de mes se cuenta en Argentina: 31 de octubre 22:30 no es noviembre', () => {
    inZone('UTC');
    expect(argentinaMonth(new Date('2026-11-01T01:30:00Z'))).toEqual({ year: 2026, month: 9 });
    expect(argentinaMonth(new Date('2026-12-31T23:30:00-03:00'))).toEqual({ year: 2026, month: 11 });
    expect(argentinaMonth(new Date('2027-01-01T00:30:00-03:00'))).toEqual({ year: 2027, month: 0 });
  });
  it('una fecha sin hora no se corre de día', () => {
    inZone('America/Los_Angeles');
    expect(argentinaDate('2026-10-03')).toBe('3/10/2026');
  });
  it('una fecha que no existe devuelve vacío en lugar de un texto raro', () => {
    expect(argentinaTime('no es una fecha')).toBe('');
    expect(argentinaDate('no es una fecha')).toBe('');
    expect(argentinaDate('')).toBe('');
    expect(argentinaDay(new Date('no es una fecha'))).toBe('');
  });
});
