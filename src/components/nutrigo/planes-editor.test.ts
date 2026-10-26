import { describe, expect, it } from 'vitest';
import type { PlanItemView } from '../../types/plans';
import {
  cambiarCantidad, comidaDelDia, controlEntrega, copiarPlan, duplicarDia, filasDeVersiones,
  listaDeCompras, lunesDeSemana, quitarLinea, semanasDelPeriodo, sumarMacros,
} from './planes-editor';

function plato(extra: Partial<PlanItemView> = {}): PlanItemView {
  return {
    id: 'item-1',
    for_date: '2026-10-26',
    slot: 'Almuerzo',
    recipe_id: 'rec-1',
    recipe_version: 1,
    recipe_title: 'Pollo al horno',
    recipe: null,
    free_text: null,
    portions: 1,
    public_note: '',
    ...extra,
  };
}

describe('editor de la semana', () => {
  it('la semana vacía arranca el lunes, también si hoy es domingo', () => {
    expect(lunesDeSemana('2026-10-25')).toBe('2026-10-19');
    expect(lunesDeSemana('2026-10-26')).toBe('2026-10-26');
  });

  it('arma la comida con el nombre y las porciones guardadas', () => {
    const comida = comidaDelDia([plato()], '2026-10-26', 'Almuerzo', '13:00');
    expect(comida.titulo).toBe('Pollo al horno');
    expect(comida.lineas[0]?.cantidad).toBe(1);
    expect(comida.lineas[0]?.unidad).toBe('porción');
    expect(comidaDelDia([], '2026-10-26', 'Cena', '20:30').titulo).toBe('Sin alimentos');
  });

  it('cambia la porción y no acepta una cantidad vacía', () => {
    const items = [plato()];
    const clave = 'item-1:plato';
    expect(cambiarCantidad(items, clave, 1.5)?.[0]?.portions).toBe(1.5);
    expect(cambiarCantidad(items, clave, 0)).toBeNull();
    expect(cambiarCantidad(items, clave, 80)).toBeNull();
  });

  it('duplicar un día reemplaza el destino y no toca el origen', () => {
    const origen = [plato(), plato({ id: 'item-2', for_date: '2026-10-27', slot: 'Cena', recipe_title: 'Sopa' })];
    const copia = duplicarDia(origen, '2026-10-26', '2026-10-27');
    expect(copia.filter(item => item.for_date === '2026-10-26')).toHaveLength(1);
    expect(copia.filter(item => item.for_date === '2026-10-27').map(item => item.recipe_title)).toEqual(['Pollo al horno']);
    expect(copia.find(item => item.for_date === '2026-10-27')?.id).not.toBe('item-1');
    expect(duplicarDia(origen, '2026-10-26', '2026-10-26')).toBe(origen);
    expect(duplicarDia(origen, '2026-10-28', '2026-10-29')).toBe(origen);
  });

  it('copiar un plan corre las fechas desde el día elegido', () => {
    const copia = copiarPlan([plato(), plato({ id: 'item-2', for_date: '2026-10-27', slot: 'Cena' })], '2026-11-02');
    expect(copia.map(item => item.for_date).sort()).toEqual(['2026-11-02', '2026-11-03']);
    expect(new Set(copia.map(item => item.id)).size).toBe(2);
  });

  it('quitar la única línea saca la comida', () => {
    expect(quitarLinea([plato()], 'item-1:plato')).toEqual([]);
  });

  it('la entrega cuenta comidas vacías y los días lejos de la meta', () => {
    const control = controlEntrega('2026-10-26', '2026-10-27', [plato({
      recipe: { title: 'Pollo', version: 1, yield_portions: 1, steps: [], nutrient_source: 'declarado', ingredients: [], nutrition: { origin: 'declared', source: 'ficha', per_portion: { kcal: 800, protein_g: 40, carbs_g: 20, fat_g: 10 } } },
    })], 500);
    expect(control.conAlimentos).toBe(1);
    expect(control.vacias).toBe(9);
    expect(control.diasFuera).toEqual(['2026-10-26']);
    const parcial = sumarMacros([{ kcal: 100, protein: null, carbs: 1, fat: 1, fiber: null }]);
    expect(parcial.kcal).toBe(100);
    expect(parcial.protein).toBeNull();
  });

  it('la lista de compras suma lo de la semana y las versiones muestran la publicada', () => {
    const compras = listaDeCompras([plato({ portions: 2 }), plato({ id: 'item-2', for_date: '2026-11-02', portions: 1 })], ['2026-10-26']);
    expect(compras[0]?.items[0]?.cantidad).toBe('2 porción');
    const filas = filasDeVersiones(null, [
      { id: 'a', version: 1, status: 'published', period_start: '2026-10-01', period_end: '2026-10-07', published_at: '2026-10-01', items: [] },
      { id: 'b', version: 2, status: 'draft', period_start: '2026-10-01', period_end: '2026-10-07', published_at: null, items: [] },
    ]);
    expect(filas.map(fila => fila.titulo)).toEqual(['Versión 2', 'Versión 1']);
    expect(filas[1]?.restaurar).toBe(true);
    expect(filas[0]?.restaurar).toBe(false);
    expect(semanasDelPeriodo('2026-10-26', '2026-11-08')).toBe(2);
  });
});
