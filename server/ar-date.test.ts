import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { localDateId, menuWeekdayIndex, timelineAtLabel } from './db/supabase-repo.js';

// 2026-10-09T01:30:00Z = jueves 8 de octubre, 22:30 en Buenos Aires.
const NIGHT_IN_ARGENTINA = new Date('2026-10-09T01:30:00Z');

describe('el día del servidor es el de Argentina aunque la máquina esté en otra zona', () => {
  const original = process.env.TZ;
  beforeEach(() => { process.env.TZ = 'UTC'; });
  afterEach(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });

  it('a las 22:30 de Argentina todavía es el mismo día', () => {
    expect(localDateId(NIGHT_IN_ARGENTINA)).toBe('2026-10-08');
  });

  it('el día de la semana del plan también es el argentino (jueves = 3, lunes = 0)', () => {
    expect(menuWeekdayIndex(NIGHT_IN_ARGENTINA)).toBe(3);
  });

  it('pasada la medianoche argentina ya es el día siguiente', () => {
    expect(localDateId(new Date('2026-10-09T03:05:00Z'))).toBe('2026-10-09');
  });

  it('HOY y AYER del historial se cuentan con el calendario argentino', () => {
    expect(timelineAtLabel('2026-10-08T15:00:00Z', NIGHT_IN_ARGENTINA)).toBe('HOY');
    expect(timelineAtLabel('2026-10-07T20:00:00Z', NIGHT_IN_ARGENTINA)).toBe('AYER');
    expect(timelineAtLabel('2026-10-05T20:00:00Z', NIGHT_IN_ARGENTINA)).toBe('05/10');
  });
});
