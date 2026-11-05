import { describe, expect, it } from 'vitest';
import { mealPlanDraftSchema } from '../../types/plans';
import type { Food } from '../../types/foods';
import { alimentosDelPlan, componenteDe, elegirAlimento, leerParte, partesDeComida, resumenAlimentos } from './planes-importar-alimentos';
import { borradorImportado, planDesdeDocumento } from './planes-importar';

const comida = (id: string, name: string, portions: { name: string; grams: number }[] = [], extra: Partial<Food> = {}) => ({
  id, name, brand: '', category: '', kind: 'food', source: 'SARA 2', reference: '', revision: 1, owner_id: null, updated_at: '',
  nutrients: { kcal: 100, protein: null, carbs: null, fat: null, fiber: null, sodium: null, calcium: null, iron: null, potassium: null, magnesium: null, vitamin_c: null },
  portions, ...extra,
}) as Food;
const POLLO = comida('7c9e6679-7425-40de-944b-e07fc1f90ae7', 'Pollo, pechuga, cocida');
const PAN = comida('0e4c8a3b-1f2d-4c5b-9a6e-7d8f9a0b1c2d', 'Pan integral', [{ name: 'Rebanada', grams: 25 }]);
const LECHE = comida('11111111-2222-4333-8444-555555555555', 'Leche descremada', [{ name: 'Taza', grams: 200 }]);
const buscar = async (q: string) => [POLLO, PAN, LECHE].filter(f => f.name.toLowerCase().includes(q.toLowerCase().split(' ')[0].replace(/s$/, '')));

describe('alimentos del plan importado', () => {
  it('lee cantidad, medida y nombre', () => {
    expect(leerParte('200 g de pollo')).toMatchObject({ cantidad: 200, unidad: 'g', nombre: 'pollo' });
    expect(leerParte('1 taza de leche descremada')).toMatchObject({ cantidad: 1, unidad: 'taza', nombre: 'leche descremada' });
    expect(leerParte('2 tostadas integrales')).toMatchObject({ cantidad: 2, unidad: null, nombre: 'tostadas integrales' });
    expect(leerParte('ensalada').cantidad).toBeNull();
    expect(partesDeComida('2 tostadas con queso · té')).toEqual(['2 tostadas', 'queso', 'té']);
  });
  it('elige el alimento que contiene todas las palabras', () => {
    expect(elegirAlimento('pollo', [PAN, POLLO])).toBe(POLLO);
    expect(elegirAlimento('pan blanco', [PAN])).toBeNull();
  });
  it('mide en gramos o con una medida de la base y no inventa lo demás', () => {
    expect(componenteDe(leerParte('200 g de pollo'), POLLO)).toMatchObject({ kind: 'food', quantity: 200, measure: null });
    expect(componenteDe(leerParte('1 taza de leche'), LECHE)).toMatchObject({ quantity: 1, measure: 'Taza' });
    expect(componenteDe(leerParte('3 manzanas'), PAN)).toBeNull();
    expect(componenteDe(leerParte('pollo'), POLLO)).toBeNull();
  });
  it('arma un borrador válido que mezcla alimentos de la base y texto', async () => {
    const plan = planDesdeDocumento({ pages: [{ page: 1, text: 'Lunes\nDesayuno: 1 taza de leche descremada, 2 rebanadas de pan\nAlmuerzo: ensalada libre\nCena: 200 g de pollo' }], tables: [] });
    const medidos = await alimentosDelPlan(plan, buscar);
    expect(medidos.comidas).toBe(2);
    expect(medidos.alimentos).toBe(3);
    const borrador = borradorImportado(plan, '2026-11-05', null, medidos.componentes);
    expect(mealPlanDraftSchema.safeParse(borrador).success).toBe(true);
    const almuerzo = borrador.items.find(i => i.slot === 'Almuerzo')!;
    expect(almuerzo.free_text).toBe('ensalada libre');
    expect(borrador.items.find(i => i.slot === 'Cena')!.components).toHaveLength(1);
    expect(resumenAlimentos(medidos)).toContain('3 alimentos quedaron cargados');
  });
  it('si la búsqueda falla deja todo como texto', async () => {
    const plan = planDesdeDocumento({ pages: [{ page: 1, text: 'Cena: 200 g de pollo' }], tables: [] });
    const medidos = await alimentosDelPlan(plan, async () => { throw new Error('sin red'); });
    expect(medidos.alimentos).toBe(0);
    expect(resumenAlimentos(medidos)).toContain('quedó todo como texto');
  });
});
