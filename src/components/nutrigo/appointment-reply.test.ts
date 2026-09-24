import { describe, expect, it } from 'vitest';
import { appointmentReplyKey, appointmentReplyLabel, readAppointmentReply, writeAppointmentReply } from './appointment-reply';

describe('respuesta de asistencia a la consulta', () => {
  it('queda pendiente si no hay valor y no permite cancelar el turno', () => {
    const storage = new Map<string, string>();
    const memory = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
    };
    expect(readAppointmentReply(memory, 'p1', 'Jueves · 14:30')).toBe('pending');
    writeAppointmentReply(memory, 'p1', 'Jueves · 14:30', 'attending');
    expect(memory.getItem(appointmentReplyKey('p1', 'Jueves · 14:30'))).toBe('attending');
    expect(appointmentReplyLabel('needs_change')).toBe('Pidió un cambio de horario');
  });
});
