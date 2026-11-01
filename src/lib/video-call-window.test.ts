import { describe, expect, it } from 'vitest';
import { appointmentStart, inVideoCallWindow } from './video-call-window';

const start = new Date('2026-11-01T13:00:00Z');

describe('franja para entrar a la videollamada', () => {
  it('abre 10 minutos antes y cierra cuando termina el turno', () => {
    expect(inVideoCallWindow(new Date('2026-11-01T12:50:00Z'), start, 45)).toBe(true);
    expect(inVideoCallWindow(new Date('2026-11-01T12:49:59Z'), start, 45)).toBe(false);
    expect(inVideoCallWindow(new Date('2026-11-01T13:20:00Z'), start, 45)).toBe(true);
    expect(inVideoCallWindow(new Date('2026-11-01T13:44:59Z'), start, 45)).toBe(true);
    expect(inVideoCallWindow(new Date('2026-11-01T13:45:00Z'), start, 45)).toBe(false);
  });

  it('si el turno de hoy ya empezó, no lo pasa a la semana que viene', () => {
    const ahora = new Date(2026, 8, 17, 14, 40, 0);
    const cuando = appointmentStart({ when: 'Jueves · 14:30' }, ahora);
    expect(cuando?.getDate()).toBe(17);
    expect(cuando && inVideoCallWindow(ahora, cuando, 45)).toBe(true);
    const temprano = new Date(2026, 8, 17, 14, 19, 0);
    const antes = appointmentStart({ when: 'Jueves · 14:30' }, temprano);
    expect(antes && inVideoCallWindow(temprano, antes, 45)).toBe(false);
  });
});
