import { describe, expect, it } from 'vitest';
import type { ConsultationAppointmentCompletion, ConsultationSession } from '../../types/consultations';
import { acuerdosDeNota, asistenciaDe, estadoDeConsulta, filasDeConsultas, partirNota, proximoTurno, sugerirProximoTurno, tipoDeConsulta, versionParaPaciente } from './ficha-consultas';

const turno = (id: string, starts_at: string, extra: Partial<ConsultationAppointmentCompletion> = {}): ConsultationAppointmentCompletion => ({ appointment_id: id, starts_at, duration_min: 30, channel: 'video', status: 'scheduled', completed: true, revision: 1, marked_at: null, marked_by: null, appointment_starts_at: null, ...extra });
const sesion = (appointment_id: string): ConsultationSession => ({ id: `s-${appointment_id}`, patient_id: 'p', appointment_id, nutritionist_id: 'n', source: 'manual', status: 'finished', revision: 1, started_at: '2026-10-14T13:00:00Z', finished_at: null, duration_seconds: 0, microphone: false, remote_audio: false, incomplete: false, transcript: '', draft: 'S: algo', manual_transcript: false });
const ahora = new Date('2026-10-28T12:00:00Z');
const turnos = [turno('a', '2026-03-12T12:00:00Z'), turno('b', '2026-08-19T13:00:00Z', { status: 'cancelled', completed: false }), turno('c', '2026-10-14T13:00:00Z'), turno('d', '2026-11-18T13:30:00Z', { completed: false })];

describe('consultas de la ficha', () => {
  it('la primera consulta real es «Primera consulta» y el resto «Seguimiento»', () => {
    expect(tipoDeConsulta(turnos[0]!, turnos)).toBe('Primera consulta');
    expect(tipoDeConsulta(turnos[2]!, turnos)).toBe('Seguimiento');
  });

  it('marca la nota sin aprobar, la publicada, la cancelada y la próxima', () => {
    const filas = filasDeConsultas(turnos, [sesion('c')], [], ahora);
    expect(filas.map(f => f.estado.texto)).toEqual(['Nota por aprobar', 'Cancelada', 'Realizada']);
    expect(estadoDeConsulta(turnos[3]!, undefined, false, ahora).texto).toBe('Próxima');
    expect(filasDeConsultas(turnos, [sesion('c')], [{ id: 'x', session_id: 's-c', patient_id: 'p', version: 1, summary: 'r', published_at: '', consultation_date: '' }], ahora)[0]!.estado.texto).toBe('Publicada');
  });

  it('calcula la asistencia con realizadas y canceladas', () => {
    expect(asistenciaDe(turnos, ahora)).toEqual({ pct: 67, realizadas: 2, canceladas: 1, desde: 'marzo', proxima: '18/11' });
    expect(asistenciaDe([], ahora).pct).toBe(0);
  });

  it('elige el próximo turno y sugiere uno cuatro semanas después', () => {
    expect(proximoTurno(turnos, ahora)?.appointment_id).toBe('d');
    expect(sugerirProximoTurno(turnos, ahora)).toBe('miércoles 11/11, 10:00');
  });

  it('parte la nota en S, O, A y P y deja la nota entera si no trae encabezados', () => {
    const partes = partirNota('S: le cuesta la merienda\nO: peso 68,4\nA: buena evolución\nP: sumar yogur. Repetir hierro.');
    expect(partes.map(p => p.l)).toEqual(['S', 'O', 'A', 'P']);
    expect(partes[3]!.d).toBe('sumar yogur. Repetir hierro.');
    expect(partirNota('Charla libre')).toEqual([{ l: 'N', t: 'Nota', d: 'Charla libre' }]);
  });

  it('saca los acuerdos del Plan y arma la versión para la paciente', () => {
    const nota = 'P: Sumar yogur en la merienda. Repetir hierro en 60 días. Próxima consulta en 4 semanas.';
    expect(acuerdosDeNota(nota)).toEqual(['Sumar yogur en la merienda', 'Repetir hierro en 60 días']);
    expect(versionParaPaciente('Hola', ['A'])).toBe('Hola\n\nAcuerdos:\n- A');
    expect(versionParaPaciente('Hola', [])).toBe('Hola');
  });
});
