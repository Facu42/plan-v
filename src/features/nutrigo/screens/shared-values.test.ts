import { describe, expect, it } from 'vitest';
import { barFill, dateId, dateLabel, percent, timeLabel } from './shared';

describe('percent: tolera datos inválidos', () => {
  it('conserva el comportamiento normal', () => {
    expect(percent(50, 200)).toBe(25);
    expect(percent(500, 200)).toBe(100);
    expect(percent(-5, 200)).toBe(0);
    expect(percent(null, 200)).toBeNull();
    expect(percent(5, 0)).toBeNull();
  });
  it('NaN o infinito no llegan al CSS', () => {
    expect(percent(Number.NaN, 200)).toBeNull();
    expect(percent(10, Number.NaN)).toBeNull();
    expect(percent(Number.POSITIVE_INFINITY, 200)).toBeNull();
    expect(percent(10, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('dateId: día de Buenos Aires', () => {
  it('toma el día argentino, no el del dispositivo', () => {
    expect(dateId(new Date('2026-10-03T01:00:00Z'))).toBe('2026-10-02');
  });
  it('una fecha inválida no tira la pantalla', () => {
    expect(() => dateId(new Date('no es fecha'))).not.toThrow();
    expect(dateId(new Date('no es fecha'))).toBe('');
  });
});

describe('horas y fechas con marca de tiempo: siempre de Argentina', () => {
  const withZone = (zone: string, run: () => void) => { const prior = process.env.TZ; process.env.TZ = zone; try { run(); } finally { process.env.TZ = prior; } };
  it.each(['UTC', 'Asia/Tokyo', 'America/Los_Angeles'])('timeLabel no depende de la zona del dispositivo (%s)', zone => {
    withZone(zone, () => {
      // 01:00 UTC = 22:00 del día anterior en Buenos Aires.
      expect(timeLabel('2026-10-03T01:00:00Z').replace(/[  ]/g, ' ')).toMatch(/^10:00 p\. ?m\.$/);
      expect(timeLabel('no es fecha')).toBe('');
    });
  });
  it.each(['UTC', 'Asia/Tokyo', 'America/Los_Angeles'])('dateLabel de una marca de tiempo cuenta el día argentino (%s)', zone => {
    withZone(zone, () => {
      expect(dateLabel('2026-10-03T01:00:00Z')).toBe('2/10/2026');
      expect(dateLabel('2026-10-03')).toBe('3/10/2026');
    });
  });
});

describe('barFill: la barra del archivo nunca se esconde', () => {
  const style = (pct: number | null, part: 'filled' | 'empty') => barFill(pct, part).props?.style as Record<string, unknown>;
  it('reparte el ancho con el porcentaje real', () => {
    expect(style(30, 'filled').flex).toBe('30 1 0%');
    expect(style(30, 'empty').flex).toBe('70 1 0%');
  });
  it('con 0 % o 100 % el tramo queda con ancho 0, pero visible en el DOM (sin display:none)', () => {
    expect(style(0, 'filled').display).toBeUndefined();
    expect(style(100, 'empty').display).toBeUndefined();
    expect(style(null, 'filled').flex).toBe('0 1 0%');
  });
  it('NaN o fuera de rango no llegan al CSS', () => {
    expect(style(Number.NaN, 'filled').flex).toBe('0 1 0%');
    expect(style(250, 'filled').flex).toBe('100 1 0%');
    expect(style(-20, 'empty').flex).toBe('100 1 0%');
  });
});
