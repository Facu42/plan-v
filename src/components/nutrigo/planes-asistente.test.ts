import { describe, expect, it } from 'vitest';
import { datosDeFicha, lineasDePropuesta, notaDuracion, periodoDesdeDuracion, preferenciasDelArmado } from './planes-asistente';
import { recortarPreferencias } from './planes-parte-3';

describe('armado con el asistente', () => {
  it('recorta el pedido a lo que acepta la API', () => {
    const largas = Array.from({ length: 12 }, (_, indice) => `preferencia ${indice} ${'a'.repeat(90)}`);
    const recorte = recortarPreferencias(largas);
    expect(recorte).toHaveLength(10);
    expect(recorte[0]?.length).toBe(80);
    expect(recortarPreferencias(['  Hierro  ', 'hierro', ''])).toEqual(['Hierro']);
  });

  it('una semana entra completa y cuatro semanas se recortan a la primera', () => {
    const semana = periodoDesdeDuracion(1, '2026-10-26');
    expect(semana.desde).toBe('2026-10-26');
    expect(semana.hasta).toBe('2026-11-01');
    expect(semana.recortado).toBe(false);
    expect(semana.slots).toHaveLength(5);
    const mes = periodoDesdeDuracion(3, '2026-10-26');
    expect(mes.recortado).toBe(true);
    expect(mes.hasta).toBe('2026-11-01');
    expect(notaDuracion(true)).toContain('primera semana');
  });

  it('arma las preferencias con la ficha que se eligió usar', () => {
    const ficha = datosDeFicha({ goal: 'Regularidad', plan_b: '', next_focus: 'Cenas', sensitive_hours: '  ' });
    expect(ficha.find(item => item.titulo === 'Plan B')?.texto).toBe('Sin dato');
    const preferencias = preferenciasDelArmado({
      pedido: 'Cenas livianas',
      dieta: 'Vegetariana',
      estrategias: ['Alta en fibra'],
      cuidados: ['Sin lactosa'],
      ficha: ficha.map(item => item.titulo === 'Foco de la consulta' ? { ...item, usar: false } : item),
    });
    expect(preferencias[0]).toBe('Cenas livianas');
    expect(preferencias).toContain('Alimentación: Vegetariana');
    expect(preferencias).toContain('Cuidado: Sin lactosa');
    expect(preferencias.some(item => item.startsWith('Foco'))).toBe(false);
    expect(preferencias.some(item => item.includes('Sin dato'))).toBe(false);
  });

  it('resume las primeras comidas de la propuesta', () => {
    const lineas = lineasDePropuesta([
      { for_date: '2026-10-26', slot: 'Almuerzo', free_text: 'Pollo' },
      { for_date: '2026-10-26', slot: 'Cena', free_text: '   ' },
    ]);
    expect(lineas[0]).toEqual({ etiqueta: 'Almuerzo · 26/10', texto: 'Pollo' });
    expect(lineas[1]?.texto).toBe('Comida propuesta');
  });
});
