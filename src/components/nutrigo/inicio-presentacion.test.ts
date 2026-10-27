import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import type { BillingBoard } from '../../types/fees';
import { armarAtencion, armarConsultas, armarKpis, armarPendientes, compacto, cuotaDe } from './inicio-presentacion';

const ahora = new Date('2026-10-19T13:00:00Z'); // 10:00 en Buenos Aires
const paciente = (extra: Partial<Patient> = {}): Patient => ({ id: 'a', name: 'Ana López', initials: 'AL', tone: 'mint', goal: '', adherence_score: 0, meal_logs: [], habit_logs: [], messages: [], appointment: null, ...extra }) as Patient;
const turno = (starts_at: string, extra: Partial<NonNullable<Patient['appointment']>> = {}) => ({ starts_at, when: '', duration: 30, channel: 'video', ...extra });
const libro = (extra: object) => ({ patient_id: 'a', full_name: 'Ana López', fee: null, charges: [], payments: [], ...extra });
const tablero = (patients: object[]): BillingBoard => ({ settings: { default_fee: null, alias: '', payment_link: '', instructions: '' }, patients } as unknown as BillingBoard);
const datos = (pacientes: Patient[], extra: object = {}) => ({ pacientes, ahora, data: null, novedades: [], atencion: [], reservas: [], rachas: [], ...extra });

describe('Inicio: lo que se dibuja sale de datos reales', () => {
  it('abre con la próxima consulta y suma cada tarea con su texto en español', () => {
    const ana = paciente({ appointment: turno('2026-10-19T14:00:00Z', { channel: 'presencial', duration: 40 }), goal: 'Bajar 4 kg' });
    const data = { items: [{ id: 'm1', kind: 'message', patient_id: 'a', patient_name: 'Ana López', status: 'x', updated_at: '', href: '/crm/mensajes', title: 'Escribió ayer' }, { id: 'q1', kind: 'quiet', patient_id: 'a', patient_name: 'Ana López', status: 'x', updated_at: '', href: '/x', title: 'Sin registros' }], counts: { message: 4 }, total: 2, next_cursor: null, source: 'supabase' };
    const filas = armarPendientes(datos([ana], { data }) as never, {});
    expect(filas.map(f => f.titulo)).toEqual(['Preparar la consulta de Ana López', 'Responderle a Ana López']);
    expect(filas[0]!.detalle.hero).toBe('11:00');
    expect(filas[0]!.detalle.live).toBeUndefined();
    expect(filas[0]!.detalle.unidad).toBe('hoy');
    const pronto = armarPendientes(datos([paciente({ appointment: turno('2026-10-19T13:40:00Z') })]) as never, {});
    expect(pronto[0]!.detalle.live).toBe('en 40 min');
    expect(filas[1]!.detalle).toMatchObject({ hero: '4', unidad: 'mensajes' });
    expect(filas[1]!.detalle.acciones[1]).toMatchObject({ texto: 'Responder', principal: true });
  });
  it('lo que no se sabe dice «Sin dato» y no inventa números', () => {
    const [fila] = armarPendientes(datos([paciente({ appointment: turno('2026-10-19T14:00:00Z') })]) as never, {});
    expect(fila!.detalle.grid).toEqual([['Adherencia', 'Sin dato', 'registrada'], ['Último peso', 'Sin dato'], ['Objetivo', 'Sin definir', undefined], ['Próxima consulta', '11:00']]);
    expect(fila!.detalle.leyenda).toBeUndefined();
  });
  it('felicitar y necesitan atención salen de los avisos reales', () => {
    const ana = paciente({ adherence_score: 40 });
    const aviso = { id: 'a:streak', patient: ana, detail: '14 días seguidos registrando comidas' };
    const [fila] = armarPendientes(datos([ana], { novedades: [aviso], rachas: [{ patient_id: 'a', days: 14, at_least: false }] }) as never, {});
    expect(fila).toMatchObject({ filtro: 'fel', tipo: 'Felicitar' });
    expect(fila!.detalle).toMatchObject({ hero: '14', unidad: 'días' });
    const [atn] = armarAtencion(datos([ana], { atencion: [{ id: 'a', patient: ana, detail: '40% de adherencia registrada' }] }) as never, {});
    expect(atn).toMatchObject({ motivo: 'Adherencia', tono: 'r', sub: '40% de adherencia registrada' });
  });
  it('arma Hoy, Mañana y Semana con el estado real de cada turno', () => {
    const hecha = paciente({ id: 'h', name: 'Hecha', appointment: turno('2026-10-19T11:00:00Z') });
    const sin = paciente({ id: 's', name: 'Sin', appointment: turno('2026-10-19T19:00:00Z') });
    const conf = paciente({ id: 'c', name: 'Conf', appointment: turno('2026-10-19T16:00:00Z', { confirmed_at: '2026-10-18T10:00:00Z' }) });
    const manana = paciente({ id: 'm', name: 'Manana', appointment: turno('2026-10-20T13:00:00Z') });
    const todos = [hecha, sin, conf, manana];
    expect(armarConsultas(todos, ahora, 'hoy', null).map(f => [f.nombre, f.estado])).toEqual([['Hecha', 'Hecha'], ['Conf', 'Próxima'], ['Sin', 'Sin confirmar']]);
    expect(armarConsultas(todos, ahora, 'manana', null).map(f => f.nombre)).toEqual(['Manana']);
    const semana = armarConsultas(todos, ahora, 'semana', null);
    expect(semana).toHaveLength(4);
    expect(semana[semana.length - 1]!.dia).toBe('mar 20/10');
  });
  it('la cuota sale del libro de cobros', () => {
    expect(cuotaDe(null, 'a', '2026-10-19')).toEqual({ texto: '—', hoy: false });
    expect(cuotaDe(tablero([libro({ fee: { amount: 1000 }, charges: [{ id: '1', due_on: '2026-10-01', amount: 1000, status: 'open' }] })]), 'a', '2026-10-19').texto).toBe('Vencida');
    expect(cuotaDe(tablero([libro({ fee: { amount: 1000 }, charges: [{ id: '1', due_on: '2026-10-19', amount: 1000, status: 'open' }] })]), 'a', '2026-10-19')).toEqual({ texto: 'Vence hoy', hoy: true });
    expect(cuotaDe(tablero([]), 'a', '2026-10-19').texto).toBe('Sin cuota');
  });
  it('los cinco números cuentan lo que hay, y sin cobros lo dicen', () => {
    const a = paciente({ id: '1', adherence_score: 80, created_at: '2026-10-02T12:00:00Z', appointment: turno('2026-10-19T11:00:00Z') });
    const b = paciente({ id: '2', adherence_score: 60, created_at: '2026-06-02T12:00:00Z' });
    const sinCobros = armarKpis([a, b], ahora, null, false);
    expect(sinCobros.consultas).toMatchObject({ valor: '1', unidad: 'consulta', puntos: ['s1'] });
    expect(sinCobros.pacientes).toMatchObject({ valor: '2', pie: { destacado: '+1', resto: 'este mes' } });
    expect(sinCobros.pacientes.columnas.map(c => c.mes)).toEqual(['may', 'jun', 'jul', 'ago', 'sep', 'oct']);
    expect(sinCobros.adherencia).toMatchObject({ valor: '70', unidad: '%', anillo: 70 });
    expect(sinCobros.cobrado.valor).toBe('—');
    expect(sinCobros.porCobrar.pie.destacado).toBe('Consultando…');
    expect(armarKpis([a], ahora, null, true).porCobrar).toMatchObject({ reintentar: true });
    const conCobros = armarKpis([a], ahora, tablero([libro({ fee: { amount: 54000 }, charges: [{ id: '1', due_on: '2026-10-07', amount: 54000, status: 'open' }], payments: [{ id: 'p', status: 'confirmed', amount: 30000, paid_on: '2026-10-12' }] })]), false);
    expect(conCobros.cobrado).toMatchObject({ valor: '$30', unidad: 'mil', semanas: [0, 100, 0, 0], pie: { destacado: 'Sin dato' } });
    expect(conCobros.porCobrar.pie).toEqual({ clase: 'wa', destacado: '1 vencida', resto: 'la más vieja, 12 días' });
    expect(conCobros.porCobrar.barras).toEqual([{ alto: 24, dias: 12 }]);
  });
  it('abrevia los montos como el boceto', () => {
    expect(compacto(1_280_000)).toEqual({ valor: '$1,28', unidad: 'M' });
    expect(compacto(162_000)).toEqual({ valor: '$162', unidad: 'mil' });
    expect(compacto(0)).toEqual({ valor: '$0' });
  });
});
