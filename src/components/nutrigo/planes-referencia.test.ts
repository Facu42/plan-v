import { describe, expect, it } from 'vitest';
import { preferenciasDelArmado } from './planes-asistente';
import { agregarTexto, leerReferencia, lineasDeReferencia, reconocimientoDelNavegador, textoDictado } from './planes-referencia';

const base = { pedido: 'Plan de 7 días', dieta: 'General', estrategias: [], cuidados: [], ficha: [] };

describe('referencias y dictado del armado con IA', () => {
  it('toma las primeras líneas de 80 caracteres con el nombre del archivo', () => {
    const lineas = lineasDeReferencia({ nombre: 'plan-anterior-de-marzo.pdf', texto: `Desayuno ${'avena '.repeat(40)}` });
    expect(lineas).toHaveLength(2);
    expect(lineas[0].startsWith('Ref. plan-anterior-de-m: Desayuno')).toBe(true);
    expect(lineas.every(l => l.length <= 80)).toBe(true);
    expect(lineasDeReferencia({ nombre: 'a.txt', texto: '  \n ' })).toEqual([]);
  });
  it('suma las referencias al pedido sin pasar los límites de la IA', () => {
    const preferencias = preferenciasDelArmado({ ...base, referencias: [{ nombre: 'plan.txt', texto: 'Lunes: tostadas con queso.' }] });
    expect(preferencias[0]).toBe('Plan de 7 días');
    expect(preferencias).toContain('Ref. plan: Lunes: tostadas con queso.');
    expect(preferencias.every(l => l.length <= 80)).toBe(true);
  });
  it('lee un archivo de texto y rechaza lo que no sabe leer', async () => {
    const texto = await leerReferencia(new File(['Cenas livianas'], 'ideas.txt', { type: 'text/plain' }));
    expect(texto).toEqual({ nombre: 'ideas.txt', texto: 'Cenas livianas' });
    await expect(leerReferencia(new File(['x'], 'foto.jpg', { type: 'image/jpeg' }))).rejects.toThrow('PDF con texto');
    await expect(leerReferencia(new File(['  '], 'vacio.txt', { type: 'text/plain' }))).rejects.toThrow('No encontré texto');
  });
  it('suma lo dictado al pedido y detecta si el navegador dicta', () => {
    expect(agregarTexto('Plan', ' de 7 días ')).toBe('Plan de 7 días');
    expect(agregarTexto('', 'Hola')).toBe('Hola');
    expect(agregarTexto('Hola', '  ')).toBe('Hola');
    expect(textoDictado({ results: [[{ transcript: 'cenas' }], [{ transcript: 'livianas' }]] })).toBe('cenas livianas');
    expect(reconocimientoDelNavegador({})).toBeNull();
    class Falso { lang = ''; }
    expect(reconocimientoDelNavegador({ webkitSpeechRecognition: Falso })?.()).toBeInstanceOf(Falso);
  });
});
