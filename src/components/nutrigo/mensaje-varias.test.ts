import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { armarAudiencias, destinatarias, enviarAVarias, personalizar } from './mensaje-varias';

const ahora = new Date('2026-10-28T15:00:00Z');
const paciente = (id: string, name: string, extra: Partial<Patient> = {}) => ({ id, name, has_account: true, ...extra }) as unknown as Patient;
const pacientes = [
  paciente('a', 'Ana Gómez', { weekly_registration: { recorded_days: 0, pending_review: 0 } as Patient['weekly_registration'], appointment: { starts_at: '2026-10-30T13:00:00Z' } as Patient['appointment'] }),
  paciente('b', 'Bea Ruiz', { weekly_registration: { recorded_days: 3, pending_review: 0 } as Patient['weekly_registration'] }),
  paciente('c', 'Cora Paz', { has_account: false }),
  paciente('d', 'Dora Sol', { archived_at: '2026-10-01T00:00:00Z' }),
];

describe('mensaje a varias', () => {
  it('ofrece solo opciones con alguien y deja afuera a quien no tiene la app o está archivada', () => {
    const opciones = armarAudiencias(pacientes, [{ label: 'Running', patient_ids: ['b', 'c'] }, { label: 'Vacío', patient_ids: ['d'] }], null, ahora);
    expect(opciones.map(o => [o.id, o.ids])).toEqual([['todas', ['a', 'b']], ['grupo:Running', ['b']], ['sinregistro', ['a']], ['consulta', ['a']]]);
  });

  it('no cuenta la consulta ya pasada ni la de más de una semana', () => {
    const lejos = [paciente('a', 'Ana', { appointment: { starts_at: '2026-11-20T13:00:00Z' } as Patient['appointment'] }), paciente('b', 'Bea', { appointment: { starts_at: '2026-10-20T13:00:00Z' } as Patient['appointment'] })];
    expect(armarAudiencias(lejos, [], null, ahora).some(o => o.id === 'consulta')).toBe(false);
  });

  it('une las elegidas sin repetir pacientes', () => {
    const opciones = armarAudiencias(pacientes, [{ label: 'Running', patient_ids: ['a', 'b'] }], null, ahora);
    expect(destinatarias(opciones, ['todas', 'grupo:Running', 'sinregistro'])).toEqual(['a', 'b']);
    expect(destinatarias(opciones, [])).toEqual([]);
  });

  it('completa {nombre} con el primer nombre de cada una', () => {
    expect(personalizar('¡Hola {nombre}! Y {Nombre}.', 'María Laura Pérez')).toBe('¡Hola María! Y María.');
  });

  it('manda uno por uno, personalizado, y no se frena si alguna falla', async () => {
    const send = vi.fn(async (patientId: string) => { if (patientId === 'b') throw new Error('x'); return {}; });
    let n = 0;
    const r = await enviarAVarias([{ id: 'a', name: 'Ana Gómez' }, { id: 'b', name: 'Bea Ruiz' }, { id: 'c', name: 'Cora Paz' }], 'Hola {nombre}', send, () => `id-${++n}`);
    expect(r).toEqual({ enviados: 2, fallaron: ['Bea Ruiz'] });
    expect(send).toHaveBeenCalledTimes(3);
    expect(send).toHaveBeenNthCalledWith(1, 'a', 'Hola Ana', 'vero', false, 'id-1');
    expect(send).toHaveBeenNthCalledWith(3, 'c', 'Hola Cora', 'vero', false, 'id-3');
  });
});
