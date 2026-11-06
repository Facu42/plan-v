import { describe, expect, it } from 'vitest';
import { filasHorarios, urlMapa, dineroPublico, estadoAtencion, etiquetaTurno, esReseñaGoogle } from './public-page-info';

describe('información pública de /slug', () => {
  it('ordena de lunes a domingo, une tramos pegados y marca los días cerrados', () => {
    const filas = filasHorarios([
      { weekday: 1, start: '15:00', end: '19:00' }, { weekday: 1, start: '09:00', end: '13:00' },
      { weekday: 2, start: '09:00', end: '12:00' }, { weekday: 2, start: '12:00', end: '14:00' },
    ]);
    expect(filas.map(f => f.dia)).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    expect(filas[0].tramos).toBe('09:00 a 13:00 h · 15:00 a 19:00 h');
    expect(filas[1].tramos).toBe('09:00 a 14:00 h');
    expect(filas[6].tramos).toBe('Cerrado');
  });
  it('sin agenda no inventa horarios', () => {
    expect(filasHorarios(undefined)).toEqual([]);
    expect(filasHorarios([])).toEqual([]);
  });
  it('el mapa usa solo la dirección escrita y escapa el texto', () => {
    expect(urlMapa('Cabildo 100 & Juramento', true)).toBe('https://www.google.com/maps?q=Cabildo%20100%20%26%20Juramento&output=embed');
    expect(urlMapa('Cabildo 100', false)).toContain('query=Cabildo%20100');
  });
  it('precio en pesos o «Consultar»', () => {
    expect(dineroPublico(4500000)).toBe('$45.000');
    expect(dineroPublico(0)).toBe('Consultar');
  });
  const horas = [{ weekday: 1, start: '09:00', end: '13:00' }, { weekday: 1, start: '15:00', end: '19:00' }, { weekday: 3, start: '09:00', end: '12:00' }];
  // Lunes 9/11/2026 a las 10:00 en Argentina = 13:00 UTC.
  it('abierto ahora dentro de un tramo y con la hora de cierre', () => {
    expect(estadoAtencion(horas, new Date('2026-11-09T13:00:00Z'))).toEqual({ abierto: true, texto: 'Abierto ahora · atiende hasta las 13:00' });
  });
  it('cerrado entre tramos dice cuándo abre hoy, y de noche el próximo día con atención', () => {
    expect(estadoAtencion(horas, new Date('2026-11-09T16:00:00Z'))?.texto).toBe('Cerrado ahora · abre hoy a las 15:00');
    expect(estadoAtencion(horas, new Date('2026-11-09T23:00:00Z'))?.texto).toBe('Cerrado ahora · abre miércoles a las 09:00');
  });
  it('sin horarios no muestra estado', () => {
    expect(estadoAtencion(undefined)).toBeNull();
  });
  it('etiqueta del próximo turno: hoy, mañana o el día', () => {
    const ahora = new Date('2026-11-09T13:00:00Z');
    expect(etiquetaTurno('2026-11-09T19:30:00Z', ahora)).toBe('hoy 16:30');
    expect(etiquetaTurno('2026-11-10T13:00:00Z', ahora)).toBe('mañana 10:00');
    expect(etiquetaTurno('2026-11-12T13:00:00Z', ahora)).toBe('jueves 12 10:00');
  });
  it('las reseñas solo se enlazan con https', () => {
    expect(esReseñaGoogle('https://g.page/r/abc')).toBe(true);
    expect(esReseñaGoogle('javascript:alert(1)')).toBe(false);
    expect(esReseñaGoogle(undefined)).toBe(false);
  });
});
