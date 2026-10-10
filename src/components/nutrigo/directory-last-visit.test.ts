import { describe, expect, it } from 'vitest';
import { daysAgoText, lastVisit } from './directory-last-visit';

const entry = (action: 'elapsed' | 'scheduled' | 'cancelled', dateId: string | null) => ({ action, dateId });

describe('última consulta del directorio', () => {
  it('toma la consulta ya vencida más reciente y cuenta los días hasta hoy', () => {
    expect(lastVisit([entry('elapsed', '2026-09-20'), entry('elapsed', '2026-10-01'), entry('scheduled', '2026-10-20')], '2026-10-10')).toEqual({ dateId: '2026-10-01', daysAgo: 9 });
  });

  it('no cuenta turnos cancelados ni agendados, ni consultas futuras', () => {
    expect(lastVisit([entry('cancelled', '2026-10-01'), entry('scheduled', '2026-10-05'), entry('elapsed', '2026-11-01')], '2026-10-10')).toBeNull();
  });

  it('sin historial no hay dato', () => {
    expect(lastVisit(undefined, '2026-10-10')).toBeNull();
    expect(lastVisit([entry('elapsed', null)], '2026-10-10')).toBeNull();
  });

  it('redacta los días en español', () => {
    expect([0, 1, 9].map(daysAgoText)).toEqual(['Hoy', 'Ayer', 'Hace 9 días']);
  });
});
