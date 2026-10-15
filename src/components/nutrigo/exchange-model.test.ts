import { describe, expect, it } from 'vitest';
import type { ExchangeEntry } from '../../types/exchanges';
import type { Food } from '../../types/foods';
import { groupContribution, itemNutrition, selectExchanges } from './exchange-model';

const nutrients = { kcal: null, protein: null, carbs: null, fat: null, fiber: null, sodium: null, calcium: null, iron: null, potassium: null, magnesium: null, vitamin_c: null };
const rice: Food = { id: 'f1', owner_id: null, revision: 1, updated_at: '', name: 'Arroz', brand: '', category: '', kind: 'food', source: 'Etiqueta', reference: '', portions: [], nutrients: { ...nutrients, kcal: 130, carbs: 28 } };
const oats: Food = { ...rice, id: 'f2', name: 'Avena', nutrients: { ...nutrients, kcal: 380, carbs: 60 } };
const base = { revision: 1, updated_at: '', description: '' };
const list = (id: string, name: string, owner: string | null): ExchangeEntry => ({ ...base, id, kind: 'list', owner_id: owner, name, justification: '', base: { food_id: null, name: 'Arroz', measure: '1 taza', grams: 180 }, items: [{ food_id: 'f2', name: 'Avena', measure: '3 cucharadas', grams: 30 }] });
const group = (id: string, name: string, owner: string | null): ExchangeEntry => ({ ...base, id, kind: 'group', owner_id: owner, name, portion: { measure: '1 porción', grams: 100 }, foods: [{ food_id: 'f1', name: 'Arroz' }, { food_id: 'f2', name: 'Avena' }, { food_id: null, name: 'Cebada' }] });

describe('equivalencias: modelo de la pantalla', () => {
  const entries = [list('a', 'Equivalentes de cereales', null), list('b', 'Mis proteínas', 'nutri'), group('c', 'Lácteos', null)];
  it('filtra por pestaña, ignora tildes y mayúsculas y filtra por origen', () => {
    expect(selectExchanges(entries, { tab: 'list', query: '', scope: 'all' }).map(e => e.id)).toEqual(['a', 'b']);
    expect(selectExchanges(entries, { tab: 'group', query: '', scope: 'all' }).map(e => e.id)).toEqual(['c']);
    expect(selectExchanges(entries, { tab: 'list', query: 'PROTEINAS', scope: 'all' }).map(e => e.id)).toEqual(['b']);
    expect(selectExchanges(entries, { tab: 'list', query: '', scope: 'system' }).map(e => e.id)).toEqual(['a']);
    expect(selectExchanges(entries, { tab: 'list', query: 'avena', scope: 'own' }).map(e => e.id)).toEqual(['b']);
  });
  it('calcula aporte por gramos sólo con alimentos vinculados y nunca representa lo desconocido como cero', () => {
    const foods = new Map([[rice.id, rice], [oats.id, oats]]);
    expect(itemNutrition({ food_id: 'f2', name: 'Avena', measure: '3 cucharadas', grams: 30 }, foods)?.kcal).toBe(114);
    expect(itemNutrition({ food_id: 'f2', name: 'Avena', measure: 'x', grams: 30 }, foods)?.fat).toBeNull();
    expect(itemNutrition({ food_id: null, name: 'Cebada', measure: 'x', grams: 30 }, foods)).toBeNull();
    expect(itemNutrition({ food_id: 'ajeno', name: 'Otro', measure: 'x', grams: 30 }, foods)).toBeNull();
  });
  it('promedia el aporte de la porción de referencia entre los alimentos con dato', () => {
    const foods = new Map([[rice.id, rice], [oats.id, oats]]);
    const result = groupContribution(group('c', 'Cereales', null) as Extract<ExchangeEntry, { kind: 'group' }>, foods);
    expect(result).toMatchObject({ counted: 2, total: 3, nutrients: { kcal: 255, carbs: 44, fat: null } });
    expect(groupContribution({ ...(group('c', 'x', null) as Extract<ExchangeEntry, { kind: 'group' }>), portion: null }, foods)).toBeNull();
    expect(groupContribution({ ...(group('c', 'x', null) as Extract<ExchangeEntry, { kind: 'group' }>), foods: [{ food_id: null, name: 'Cebada' }] }, foods)).toBeNull();
  });
});
