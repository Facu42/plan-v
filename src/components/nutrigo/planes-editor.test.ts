import { describe, expect, it } from 'vitest';
import type { PlanItemView } from '../../types/plans';
import {
  cambiarCantidad, cambiarComida, comidaDelDia, controlEntrega, copiarPlan, duplicarDia, filasDeVersiones,
  finVisible, listaDeCompras, lunesDeSemana, pasaElTope, quitarLinea, semanasDelPeriodo, sumarComponente, sumarMacros,
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

  it('al empezar vacío se ven las cuatro semanas, y un plan corto muestra solo las suyas', () => {
    expect(finVisible('2026-10-19', '2026-10-25', true)).toBe('2026-11-15');
    expect(finVisible('2026-10-19', '2026-10-25', false)).toBe('2026-10-25');
    expect(finVisible('2026-10-19', '2026-11-20', true)).toBe('2026-11-20');
    expect(pasaElTope('2026-10-19', '2026-11-09')).toBe(false);
    expect(pasaElTope('2026-10-19', '2026-11-10')).toBe(true);
  });

  it('suma un alimento a una comida vacía y a una que ya tiene cosas, sin repetir fecha y comida', () => {
    const arroz = { kind: 'text', id: 'c-1', free_text: 'Arroz integral', public_note: '', portions: 1 } as const;
    const solo = sumarComponente([], '2026-10-26', 'Cena', arroz);
    expect(solo).toHaveLength(1);
    expect(solo[0]).toMatchObject({ for_date: '2026-10-26', slot: 'Cena', components: [arroz] });
    const otro = { kind: 'text', id: 'c-2', free_text: 'Ensalada', public_note: '', portions: 1 } as const;
    const dos = sumarComponente(solo, '2026-10-26', 'Cena', otro);
    expect(dos).toHaveLength(1);
    expect(dos[0]?.components?.map(pieza => pieza.id)).toEqual(['c-1', 'c-2']);
  });

  it('al sumar a una comida que tenía una receta suelta, conserva la receta como parte', () => {
    const arroz = { kind: 'text', id: 'c-1', free_text: 'Arroz', public_note: '', portions: 1 } as const;
    const con = sumarComponente([plato()], '2026-10-26', 'Almuerzo', arroz);
    expect(con).toHaveLength(1);
    expect(con[0]?.recipe_id).toBeNull();
    expect(con[0]?.components).toHaveLength(2);
    expect(con[0]?.components?.[0]).toMatchObject({ kind: 'recipe', recipe_id: 'rec-1', portions: 1 });
  });

  it('cambiar la comida reemplaza lo que había y no toca otras comidas', () => {
    const items = [plato(), plato({ id: 'item-2', slot: 'Cena' })];
    const arroz = { kind: 'text', id: 'c-1', free_text: 'Arroz', public_note: '', portions: 1 } as const;
    const nuevo = cambiarComida(items, '2026-10-26', 'Almuerzo', arroz);
    expect(nuevo).toHaveLength(2);
    expect(nuevo.find(item => item.slot === 'Almuerzo')?.components).toEqual([arroz]);
    expect(nuevo.find(item => item.slot === 'Cena')?.id).toBe('item-2');
  });
});
