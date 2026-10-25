import { describe, expect, it } from 'vitest';
import { foodInputSchema, SARA2_SOURCE, type Food } from '../../types/foods';
import {
  anchoEnergia, borradorEdicion, borradorNuevo, nutrientesDePorcion, origenCorto, porcionesDe, repartoMacros, seEdita, sigueEnVista,
} from './alimentos-presentacion';

function alimento(nombre: string, extras: Partial<Food> = {}): Food {
  const { expected_revision: _, ...base } = foodInputSchema.parse({
    id: 'a0000000-0000-4000-8000-000000000001',
    expected_revision: 0,
    name: nombre,
    kind: 'food',
    source: 'Rótulo del envase',
    category: 'Propios',
    nutrients: { kcal: 180, protein: 8, carbs: 20, fat: 4, fiber: 2 },
    portions: [{ name: 'Porción', grams: 80 }],
  });
  return { ...base, owner_id: 'nutri-a', revision: 3, updated_at: '2026-10-25T00:00:00Z', ...extras };
}

describe('alimentos, los datos del boceto', () => {
  it('SARA 2 no se edita y un propio sí', () => {
    expect(seEdita(alimento('Tarta'))).toBe(true);
    expect(seEdita(alimento('Avena', { owner_id: null, source: SARA2_SOURCE }))).toBe(false);
    expect(seEdita(alimento('Avena', { owner_id: null, source: 'Otra' }))).toBe(false);
    expect(seEdita(alimento('Avena', { composition: { dataset: 'sara2-2022-v1', source_sha256: 'a', record_id: '1', basis: { amount: 100, unit: 'g' }, carbohydrates: 'available', source_page: 1 } }))).toBe(false);
  });

  it('en gramos siempre están las tres porciones del boceto y el origen de SARA 2 es corto', () => {
    const propio = alimento('Tarta', { portions: [{ name: 'Porción', grams: 80 }, { name: 'Tacita', grams: 30 }] });
    expect(porcionesDe(propio).map(porcion => porcion.etiqueta)).toEqual(['100 g', '1 taza (30 g)', '1 cucharada (10 g)', 'Porción (80 g)']);
    const sara = alimento('Avena', { owner_id: null, source: SARA2_SOURCE, portions: [], nutrients: { kcal: 367, protein: 13.2, carbs: 59.4, fat: 7.1, fiber: null, sodium: null, calcium: null, iron: null, potassium: null, magnesium: null, vitamin_c: null } });
    expect(porcionesDe(sara).map(porcion => porcion.etiqueta)).toEqual(['100 g', '1 taza (30 g)', '1 cucharada (10 g)']);
    expect(nutrientesDePorcion(sara, 30).kcal).toBe(110.1);
    expect(nutrientesDePorcion(sara, 10).protein).toBe(1.32);
    const liquido = alimento('Leche', { owner_id: null, source: SARA2_SOURCE, portions: [{ name: 'Vaso', grams: 200 }], composition: { dataset: 'sara2-2022-v1', source_sha256: 'a', record_id: '1', basis: { amount: 100, unit: 'ml' }, carbohydrates: 'available', source_page: 1 } });
    expect(porcionesDe(liquido).map(porcion => porcion.etiqueta)).toEqual(['100 ml']);
    expect(origenCorto(sara)).toBe('SARA 2');
    expect(origenCorto(liquido)).toBe('SARA 2');
    expect(origenCorto(propio)).toBe('Rótulo del envase');
    const sinGrasa = alimento('Claro', { nutrients: { ...propio.nutrients, fat: null, carbs: null } });
    expect(repartoMacros(sinGrasa).barras).toEqual([100, 0, 0]);
    expect(repartoMacros(alimento('Vacío', { nutrients: { ...propio.nutrients, protein: null, carbs: null, fat: null, kcal: null } })).barras).toEqual([0, 0, 0]);
    expect(anchoEnergia(null)).toBe(0);
    expect(anchoEnergia(367)).toBe(92);
  });

  it('el alta deja vacíos los nutrientes que el formulario no pide', () => {
    const alta = borradorNuevo({ nombre: 'Tarta de verdura', fuente: 'Rótulo del envase', kcal: '180', proteina: '8', medida: 'Porción', gramos: '120' });
    expect(alta.ok).toBe(true);
    if (!alta.ok) return;
    expect(alta.input.nutrients.kcal).toBe(180);
    expect(alta.input.nutrients.protein).toBe(8);
    expect(alta.input.nutrients.carbs).toBeNull();
    expect(alta.input.nutrients.fat).toBeNull();
    expect(alta.input.portions).toEqual([{ name: 'Porción', grams: 120 }]);
    expect(alta.input.category).toBe('Propios');
    expect(borradorNuevo({ nombre: 'Tarta', fuente: 'Rótulo', kcal: '', proteina: '', medida: 'Porción', gramos: '' }).ok).toBe(false);
    expect(borradorNuevo({ nombre: 'Tarta', fuente: SARA2_SOURCE, kcal: '1', proteina: '', medida: '', gramos: '' }).ok).toBe(false);
  });

  it('editar un propio conserva el resto y SARA 2 no arma un guardado', () => {
    const propio = alimento('Tarta');
    const editado = borradorEdicion(propio, 'Tarta de acelga', '210');
    expect(editado.ok).toBe(true);
    if (!editado.ok) return;
    expect(editado.input.name).toBe('Tarta de acelga');
    expect(editado.input.nutrients.kcal).toBe(210);
    expect(editado.input.nutrients.fiber).toBe(2);
    expect(editado.input.nutrients.carbs).toBe(20);
    expect(editado.input.portions).toEqual(propio.portions);
    expect(editado.input.source).toBe(propio.source);
    const sara = alimento('Avena', { owner_id: null, source: SARA2_SOURCE });
    expect(borradorEdicion(sara, 'Avena retocada', '10').ok).toBe(false);
  });

  it('la búsqueda de propios no deja ver SARA 2 como si fuera propio', () => {
    const sara = alimento('Avena', { owner_id: null, source: SARA2_SOURCE, category: 'Cereales' });
    const propio = alimento('Tarta');
    expect(sigueEnVista(sara, 'sara', 'avena')).toBe(true);
    expect(sigueEnVista(sara, 'prop', '')).toBe(false);
    expect(sigueEnVista(propio, 'prop', 'tarta')).toBe(true);
    expect(sigueEnVista(propio, 'todos', 'manzana')).toBe(false);
  });
});
