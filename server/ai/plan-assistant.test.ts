import { describe, expect, it } from 'vitest';
import { sara2Foods } from '../foods/sara2.js';
import { buildAssistantReference, blockedTermsIn, countSaraMatches, planAssistantEnabled } from './plan-assistant.js';
import type { ExchangeGroup } from '../../src/types/nutrition-capabilities.js';
import type { ProfessionalModel } from '../../src/types/models.js';

const foods = sara2Foods();
const named = (name: string) => foods.find((food) => food.name.startsWith(name))!;
const group = (name: string, items: string[]): ExchangeGroup => ({
  id: crypto.randomUUID(), owner_id: 'n1', revision: 1, updated_at: '2026-10-17T00:00:00.000Z', name, reference: 'Criterio propio',
  items: items.map((item) => ({ grams: 100, quantity: 100, unit: 'g' as const, food: named(item) })),
});
const model = (kind: ProfessionalModel['kind'], title: string, lines: string[], published = true): ProfessionalModel => ({
  id: crypto.randomUUID(), kind, revision: crypto.randomUUID(), archived_at: null, updated_at: '2026-10-17T00:00:00.000Z',
  current: { version: 1, title, description: '', lines, published_at: null },
  published: published ? { version: 1, title, description: '', lines, published_at: '2026-10-17T00:00:00.000Z' } : null,
} as ProfessionalModel);

describe('asistente de planes: referencia para el modelo', () => {
  it('está apagado salvo que se encienda a propósito', () => {
    expect(planAssistantEnabled({})).toBe(false);
    expect(planAssistantEnabled({ AI_PLAN_ASSISTANT: 'true' })).toBe(false);
    expect(planAssistantEnabled({ AI_PLAN_ASSISTANT: 'on' })).toBe(true);
  });

  it('arma alimentos de SARA 2 con valores por 100 g y sin suplementos', () => {
    const reference = buildAssistantReference({ foods, exchanges: [], models: [], allergies: [], restrictions: [] });
    expect(reference.foods.length).toBeGreaterThan(40);
    expect(reference.foods.every((food) => food.kcal >= 0 && ['g', 'ml'].includes(food.unit))).toBe(true);
    expect(new Set(reference.foods.map((food) => food.name)).size).toBe(reference.foods.length);
  });

  it('saca del contexto los alimentos que chocan con alergias y restricciones', () => {
    const reference = buildAssistantReference({ foods, exchanges: [], models: [], allergies: ['huevo'], restrictions: ['queso'] });
    expect(reference.foods.some((food) => /huevo|queso/i.test(food.name))).toBe(false);
    const open = buildAssistantReference({ foods, exchanges: [], models: [], allergies: [], restrictions: [] });
    expect(open.foods.some((food) => /huevo/i.test(food.name))).toBe(true);
  });

  it('incluye equivalencias y modelos publicados, y descarta borradores y lo que choca con alergias', () => {
    const reference = buildAssistantReference({
      foods,
      exchanges: [group('Verduras', ['Achicoria', 'Acelga'])],
      models: [
        model('plan', 'Plan base', ['Desayuno liviano con avena']),
        model('avoid', 'Evitar', ['Maní y derivados', 'Gaseosas']),
        model('recommendations', 'Borrador', ['No publicado'], false),
      ],
      allergies: ['maní'],
      restrictions: [],
    });
    expect(reference.exchanges).toHaveLength(1);
    expect(reference.exchanges[0].options.map((option) => option.food).length).toBeGreaterThanOrEqual(2);
    expect(reference.models.map((m) => m.title)).toEqual(expect.arrayContaining(['Plan base', 'Evitar']));
    expect(reference.models.some((m) => m.title === 'Borrador')).toBe(false);
    expect(JSON.stringify(reference.models)).not.toMatch(/maní/i);
    expect(JSON.stringify(reference.models)).toContain('Gaseosas');
  });

  it('nunca supera el tope de tamaño aunque la nutri tenga muchísimo cargado', () => {
    const many = Array.from({ length: 30 }, (_, i) => model('recommendations', `Modelo ${i}`, Array.from({ length: 12 }, (_, j) => `Línea larga número ${j} `.repeat(20))));
    const reference = buildAssistantReference({ foods, exchanges: [], models: many, allergies: [], restrictions: [] });
    expect(JSON.stringify(reference).length).toBeLessThanOrEqual(12_000);
  });

  it('cuenta ingredientes que coinciden exactamente con SARA 2 y avisa de alérgenos', () => {
    const exact = named('Achicoria');
    expect(countSaraMatches([{ name: exact.name, unit: 'g' }, { name: 'Ingrediente inventado', unit: 'g' }], foods)).toEqual({ matched: 1, total: 2 });
    expect(blockedTermsIn('Tostadas con maní', ['maní', 'huevo'])).toEqual(['maní']);
  });
});
