import { describe, expect, it } from 'vitest';
import { alternar, conversacionesDe, textoVacio, vistaPrevia, type Marcas } from './mensajes-presentacion';
import type { ShowroomPatient } from './showroom-model';

const mensaje = (id: string, from: 'vero' | 'patient', text: string, sent_at: string) => ({ id, from, text, sent_at, delivered_at: null, read_at: null });
const paciente = (id: string, name: string, messages: ReturnType<typeof mensaje>[]) => ({ id, name, messages }) as unknown as ShowroomPatient;
const sinMarcas: Marcas = { destacadas: new Set(), archivadas: new Set() };

const julia = paciente('j', 'Julia Sosa', [mensaje('1', 'patient', 'Hola Vero', '2026-10-27T10:00:00Z'), mensaje('2', 'vero', 'Hola Julia', '2026-10-27T11:00:00Z')]);
const paula = paciente('p', 'Paula Acosta', [mensaje('3', 'patient', 'Me costó la semana', '2026-10-28T09:00:00Z')]);
const nadie = paciente('n', 'Ana Núñez', []);
const sinLeer = (p: ShowroomPatient) => (p.id === 'p' ? 1 : 0);

describe('bandeja de mensajes', () => {
  it('ordena por el mensaje más nuevo y deja al final a quien no tiene conversación', () => {
    expect(conversacionesDe([nadie, julia, paula], 'all', '', sinMarcas, sinLeer).map(p => p.id)).toEqual(['p', 'j', 'n']);
  });
  it('antepone «Vos: » a lo que escribió la nutri y no inventa texto sin mensajes', () => {
    expect(vistaPrevia(julia)).toBe('Vos: Hola Julia');
    expect(vistaPrevia(paula)).toBe('Me costó la semana');
    expect(vistaPrevia(nadie)).toBe('Todavía no hay mensajes');
  });
  it('filtra sin leer, destacadas y archivadas sin mezclar las archivadas con las demás', () => {
    const marcas: Marcas = { destacadas: new Set(['j']), archivadas: new Set(['n']) };
    expect(conversacionesDe([julia, paula, nadie], 'un', '', marcas, sinLeer).map(p => p.id)).toEqual(['p']);
    expect(conversacionesDe([julia, paula, nadie], 'star', '', marcas, sinLeer).map(p => p.id)).toEqual(['j']);
    expect(conversacionesDe([julia, paula, nadie], 'arch', '', marcas, sinLeer).map(p => p.id)).toEqual(['n']);
    expect(conversacionesDe([julia, paula, nadie], 'all', '', marcas, sinLeer).map(p => p.id)).toEqual(['p', 'j']);
  });
  it('busca por nombre o por mensaje sin importar acentos ni mayúsculas', () => {
    expect(conversacionesDe([julia, paula], 'all', 'COSTO', sinMarcas, sinLeer).map(p => p.id)).toEqual(['p']);
    expect(conversacionesDe([julia, paula, nadie], 'all', 'nunez', sinMarcas, sinLeer).map(p => p.id)).toEqual(['n']);
  });
  it('dice por qué la lista está vacía', () => {
    expect(textoVacio('un', '')).toBe('No tenés mensajes sin leer.');
    expect(textoVacio('all', 'zz')).toBe('No hay conversaciones con ese nombre.');
  });
  it('alterna una marca sin modificar el conjunto original', () => {
    const original = new Set(['a']);
    expect([...alternar(original, 'b')]).toEqual(['a', 'b']);
    expect([...alternar(original, 'a')]).toEqual([]);
    expect([...original]).toEqual(['a']);
  });
});
