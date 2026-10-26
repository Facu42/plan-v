import { describe, expect, it } from 'vitest';
import type { PlanVersionView } from '../../types/plans';
import {
  conteoFiltro, diasHasta, estadoDePlan, filaDePlan, filaProvisoria, filasVisibles, hoyArgentina,
  normalizarBusqueda, planesMuestraEditor, primerNombrePlanes, textoSemana, type FilaPlan,
} from './planes-lista';

const hoy = '2026-10-26';

function version(extra: Partial<PlanVersionView> & Pick<PlanVersionView, 'status' | 'period_start' | 'period_end' | 'version'>): PlanVersionView {
  return { id: 'ver', published_at: extra.status === 'draft' ? null : '2026-10-01T12:00:00Z', items: [], ...extra };
}

const sofia = {
  id: 'pat-sofia', name: 'Sofía R.', initials: 'SR', tone: 'mint' as const, goal: 'Bajar 3 kg',
  weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo' }] }],
};

describe('listado de planes', () => {
  it('cuenta los días hasta el fin del período, incluido un plan ya terminado', () => {
    expect(diasHasta('2026-10-26', '2026-11-02')).toBe(7);
    expect(diasHasta('2026-10-26', '2026-10-20')).toBe(-6);
    expect(hoyArgentina(new Date('2026-10-26T02:30:00Z'))).toBe('2026-10-25');
  });

  it('un plan publicado que cierra dentro de siete días queda por vencer', () => {
    const publicado = version({ status: 'published', version: 2, period_start: '2026-10-20', period_end: '2026-10-30' });
    expect(estadoDePlan({ current: publicado, published: publicado }, hoy).estado).toBe('Por vencer');
    const lejos = version({ status: 'published', version: 2, period_start: '2026-10-20', period_end: '2026-11-09' });
    expect(estadoDePlan({ current: lejos, published: lejos }, hoy).estado).toBe('Publicado');
    const vencido = version({ status: 'published', version: 1, period_start: '2026-10-01', period_end: '2026-10-20' });
    expect(estadoDePlan({ current: vencido, published: vencido }, hoy).estado).toBe('Por vencer');
  });

  it('el borrador gana si el publicado no está por vencer', () => {
    const publicado = version({ status: 'published', version: 1, period_start: '2026-10-20', period_end: '2026-11-16' });
    const borrador = version({ status: 'draft', version: 2, period_start: '2026-10-27', period_end: '2026-11-09' });
    expect(estadoDePlan({ current: borrador, published: publicado }, hoy).estado).toBe('Borrador');
    const porVencer = version({ status: 'published', version: 1, period_start: '2026-10-20', period_end: '2026-10-28' });
    expect(estadoDePlan({ current: borrador, published: porVencer }, hoy).estado).toBe('Por vencer');
    expect(estadoDePlan(null, hoy).estado).toBe('Sin plan');
    expect(estadoDePlan({ current: version({ status: 'draft', version: 1, period_start: '2026-10-26', period_end: '2026-11-01' }), published: null }, hoy).estado).toBe('Borrador');
  });

  it('arma la fila con calorías, semana y la pastilla Por vencer', () => {
    const publicado = version({
      status: 'published', version: 1, period_start: '2026-10-20', period_end: '2026-11-02',
      nutrition_target: { kcal: 1800, protein_g: 90, carbs_g: 180, fat_g: 50, revision: 1, published_at: '2026-10-01T12:00:00Z' },
    });
    const fila = filaDePlan(sofia, { current: publicado, published: publicado }, hoy);
    expect(fila.titulo).toBe('1.800 kcal por día');
    expect(fila.objetivo).toBe('Bajar 3 kg');
    expect(fila.estado).toBe('Por vencer');
    expect(fila.semana).toBe(textoSemana('2026-10-20', '2026-11-02', hoy));
    expect(fila.accion).toBe('Abrir plan');
    expect(fila.estado).not.toBe('Vence el viernes');
    const vacia = filaDePlan({ ...sofia, goal: '  ', weekPlan: [] }, null, hoy);
    expect(vacia).toMatchObject({ titulo: 'Sin plan todavía', objetivo: 'Sin objetivo cargado', accion: 'Crear plan', semana: '—' });
  });

  it('antes de leer el plan usa la semana de la ficha y no inventa un borrador', () => {
    expect(filaProvisoria(sofia, hoy).estado).toBe('Publicado');
    expect(filaProvisoria({ ...sofia, weekPlan: [{ day: 'Lunes', meals: [] }] }, hoy).estado).toBe('Sin plan');
  });

  it('busca sin acentos, filtra y pone primero a quien necesita atención', () => {
    const filas: FilaPlan[] = [
      { ...filaProvisoria(sofia, hoy), estado: 'Publicado', clase: 'p-conf', titulo: 'Plan publicado', accion: 'Abrir plan' },
      { ...filaProvisoria({ ...sofia, id: 'b', name: 'Ángela', goal: 'Mantener' }, hoy), estado: 'Sin plan', clase: 'p-bad', titulo: 'Sin plan todavía', accion: 'Crear plan' },
      { ...filaProvisoria({ ...sofia, id: 'c', name: 'Bruno', goal: 'Subir' }, hoy), estado: 'Borrador', clase: 'p-wait', titulo: 'Borrador sin publicar', accion: 'Abrir plan' },
    ];
    expect(normalizarBusqueda('Ángela')).toBe('angela');
    expect(filasVisibles(filas, 'todos', 'nombre', 'angela').map(fila => fila.nombre)).toEqual(['Ángela']);
    expect(filasVisibles(filas, 'borradores', 'nombre', '').map(fila => fila.nombre)).toEqual(['Bruno']);
    expect(filasVisibles(filas, 'todos', 'atencion', '').map(fila => fila.nombre)).toEqual(['Ángela', 'Bruno', 'Sofía R.']);
    expect(conteoFiltro(filas, 'sin-plan')).toBe(1);
    expect(filasVisibles(filas, 'todos', 'nombre', 'zzzz')).toEqual([]);
  });

  it('el listado es la entrada y el editor viejo conserva sus enlaces', () => {
    expect(primerNombrePlanes([{ id: 'a', name: 'Marina Costa' }, { id: 'b', name: 'Ana López' }], 'b')).toBe('Ana');
    expect(primerNombrePlanes([])).toBe('la paciente');
    expect(planesMuestraEditor(new URLSearchParams())).toBe(false);
    expect(planesMuestraEditor(new URLSearchParams('planes=todos'))).toBe(false);
    expect(planesMuestraEditor(new URLSearchParams('planes=pedidos'))).toBe(false);
    expect(planesMuestraEditor(new URLSearchParams('paciente=pat-sofia'))).toBe(true);
    expect(planesMuestraEditor(new URLSearchParams('paciente=pat-sofia&planes=todos'))).toBe(false);
    expect(planesMuestraEditor(new URLSearchParams('editor=1'))).toBe(true);
    expect(planesMuestraEditor(new URLSearchParams('propuesta=job-1'))).toBe(true);
  });
});
