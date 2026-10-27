import { describe, expect, it } from 'vitest';
import type { PanelAgendaEvent } from '../../lib/panel-agenda';
import { claseDeEvento, consultasDelDia, encabezadoAgenda, etiquetaDeEvento, franjaDeHoras, lugaresLibres, miniMes, proximoEvento, recortarLugares, textoDelPedido, tituloDelPedido } from './agenda-presentacion';

const ahora = new Date('2026-10-27T13:10:00-03:00'); // martes 13:10
const evento = (extra: Partial<PanelAgendaEvent>): PanelAgendaEvent => ({ id: 'e', tone: 'seguimiento', title: 'Ana', subtitle: 'Consultorio', day: '2026-10-27', startMin: 15 * 60, endMin: 15 * 60 + 45, ...extra });

describe('Agenda: colores y textos del boceto', () => {
  it('pinta de gris lo que ya pasó, de negro solo la próxima y de su color el resto', () => {
    const hecha = evento({ id: 'a', startMin: 9 * 60, endMin: 9 * 60 + 45 });
    const proxima = evento({ id: 'b', startMin: 15 * 60, endMin: 15 * 60 + 45 });
    const otra = evento({ id: 'c', day: '2026-10-28', tone: 'online' });
    const primera = evento({ id: 'd', day: '2026-10-29', tone: 'primera' });
    const lista = [hecha, proxima, otra, primera];
    const proximo = proximoEvento(lista, ahora);
    expect(proximo?.id).toBe('b');
    expect(lista.map(e => claseDeEvento(e, ahora, proximo))).toEqual(['d', 'n', 'v', 'f']);
    expect(claseDeEvento(evento({ tone: 'pendiente' }), ahora, proximo)).toBe('w');
    expect(claseDeEvento(evento({ tone: 'bloqueo' }), ahora, proximo)).toBe('blk');
  });
  it('escribe la hora y el estado como el boceto', () => {
    expect(etiquetaDeEvento(evento({ tone: 'online' }), 'n')).toBe('15:00 · Próxima · videollamada');
    expect(etiquetaDeEvento(evento({}), 'd')).toBe('15:00 · Hecha');
    expect(etiquetaDeEvento(evento({ tone: 'bloqueo', subtitle: 'Trámites' }), 'blk')).toBe('15:00 · Trámites');
  });
  it('la franja es de 8 a 19 y solo se ensancha si hay turnos afuera', () => {
    expect(franjaDeHoras([])).toEqual({ start: 8, end: 19 });
    expect(franjaDeHoras([evento({ startMin: 7 * 60 + 30, endMin: 8 * 60 }), evento({ startMin: 20 * 60, endMin: 20 * 60 + 30 })])).toEqual({ start: 7, end: 21 });
  });
});

describe('Agenda: números reales', () => {
  const semana = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'];
  const config = { types: [{ id: 't', name: 'Seguimiento', calendar_id: 'c', duration_min: 60, channel: 'presencial' as const, price_minor: 0, deposit_minor: 0 }], weekly: [{ calendar_id: 'c', weekday: 3, start: '09:00', end: '12:00' }] };
  it('cuenta lugares libres sin pisar turnos ni bloqueos, sin pasado y sin inventar si no hay tipos', () => {
    const turnos = [evento({ day: '2026-10-28', startMin: 10 * 60, endMin: 11 * 60 })];
    const libres = lugaresLibres(config, turnos, ahora, semana);
    expect(libres.map(l => `${l.dia} ${l.hora}`)).toEqual(['Mié 28 09:00', 'Mié 28 11:00']);
    expect(lugaresLibres({ ...config, types: [] }, [], ahora, semana)).toEqual([]);
    expect(lugaresLibres(config, [], new Date('2026-10-28T10:30:00-03:00'), semana).map(l => l.hora)).toEqual(['11:00']);
    expect(recortarLugares(Array.from({ length: 15 }, () => libres[0]!))).toMatchObject({ ocultos: 7 });
  });
  it('arma el encabezado con singular y plural', () => {
    const turnos = [evento({ id: '1' }), evento({ id: '2', tone: 'bloqueo' }), evento({ id: '3', tone: 'pendiente' })];
    expect(consultasDelDia(turnos, '2026-10-27')).toBe(1);
    expect(encabezadoAgenda('semana', '2026-10-27', semana, turnos, 1, 0)).toEqual({ sufijo: '· 26 al 31 de octubre', cuando: '1 consulta · 1 lugar libre · 0 pedidos de turno' });
    expect(encabezadoAgenda('dia', '2026-10-27', ['2026-10-27'], turnos, 6, 3).cuando).toBe('1 consulta · 6 lugares libres · 3 pedidos de turno');
    expect(encabezadoAgenda('mes', '2026-10-27', semana, [], 0, 1).sufijo).toBe('· octubre 2026');
  });
  it('marca en el mes chico hoy, la semana y los días con turnos', () => {
    const celdas = miniMes('2026-10-27', '2026-10-27', semana, [evento({ day: '2026-10-28' }), evento({ day: '2026-10-29', tone: 'bloqueo' })]);
    const por = (day: string) => celdas.find(c => c.day === day)!.clase;
    expect(por('2026-10-27')).toBe('td');
    expect(por('2026-10-28')).toBe('wk has');
    expect(por('2026-10-29')).toBe('wk');
    expect(por('2026-09-30')).toBe('o');
  });
  it('escribe el pedido con el horario que eligió la persona', () => {
    const types = [{ id: 't', name: 'x', calendar_id: 'c', duration_min: 45, channel: 'video' as const, price_minor: 0, deposit_minor: 0 }];
    expect(textoDelPedido({ starts_at: '2026-10-29T17:00:00-03:00', type_id: 't' }, types)).toBe('Pide jueves 29, 17:00 · videollamada');
    expect(textoDelPedido({ starts_at: 'no', type_id: 't' }, types)).toBe('Horario por revisar');
    expect(tituloDelPedido({ contact_name: 'Carolina Ríos', patient_id: null })).toBe('Carolina Ríos · primera vez');
    expect(tituloDelPedido({ contact_name: 'Julia Sosa', patient_id: 'p' })).toBe('Julia Sosa · seguimiento');
  });
});
