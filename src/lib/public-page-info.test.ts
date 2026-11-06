import { describe, expect, it } from 'vitest';
import { filasHorarios, urlMapa, dineroPublico } from './public-page-info';

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
});
