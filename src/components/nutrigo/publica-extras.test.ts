import { describe, expect, it } from 'vitest';
import { celdasQr, conHorarioDelDia, leerHorario, pedidosAlReservar, qrComoSvg, textoModo } from './publica-extras';

describe('leerHorario', () => {
  it('entiende dos franjas como en el boceto', () => {
    expect(leerHorario('9 a 13 · 15 a 19')).toEqual([{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }]);
  });
  it('acepta minutos y texto sobrante después de la franja', () => {
    expect(leerHorario('15 a 19 · videollamada')).toEqual([{ start: '15:00', end: '19:00' }]);
    expect(leerHorario('9:30 a 12:15')).toEqual([{ start: '09:30', end: '12:15' }]);
  });
  it('devuelve vacío si no atiende y null si no se entiende o se pisa', () => {
    expect(leerHorario('No atiendo')).toEqual([]);
    expect(leerHorario('')).toEqual([]);
    expect(leerHorario('mañana')).toBeNull();
    expect(leerHorario('13 a 9')).toBeNull();
    expect(leerHorario('9 a 13 · 12 a 15')).toBeNull();
  });
});

describe('conHorarioDelDia', () => {
  it('reemplaza solo ese día y conserva el calendario que ya tenía', () => {
    const semana = [{ calendar_id: 'a', weekday: 1, start: '09:00', end: '13:00' }, { calendar_id: 'b', weekday: 2, start: '09:00', end: '13:00' }];
    const resultado = conHorarioDelDia(semana, 2, [{ start: '10:00', end: '12:00' }], 'a');
    expect(resultado).toContainEqual(semana[0]);
    expect(resultado.filter(franja => franja.weekday === 2)).toEqual([{ calendar_id: 'b', weekday: 2, start: '10:00', end: '12:00' }]);
    expect(conHorarioDelDia(semana, 1, [], 'a').some(franja => franja.weekday === 1)).toBe(false);
  });
});

describe('pedidosAlReservar', () => {
  it('arranca con lo que la página pide hoy y respeta lo guardado', () => {
    expect(pedidosAlReservar(undefined).filter(item => item.on).map(item => item.text)).toEqual(['Nombre, teléfono y mail']);
    expect(pedidosAlReservar({ intake: [{ text: 'Motivo de la consulta', on: true }] }).find(item => item.text === 'Motivo de la consulta')?.on).toBe(true);
  });
});

describe('QR', () => {
  it('arma una matriz cuadrada con celdas y un SVG', () => {
    const { lado, celdas } = celdasQr('https://plan-v-eight.vercel.app/reservar/vero');
    expect(lado).toBeGreaterThanOrEqual(21);
    expect(celdas.length).toBeGreaterThan(50);
    expect(qrComoSvg('https://plan-v-eight.vercel.app/reservar/vero')).toContain('<rect');
  });
  it('escribe el copago con su monto', () => {
    expect(textoModo('copago', '$8.000')).toBe('Copago $8.000');
    expect(textoModo('reintegro', '')).toBe('Reintegro');
  });
});
