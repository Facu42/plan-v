import { describe, expect, it } from 'vitest';
import { recipeDraftSchema } from '../../src/types/recipes.js';
import { CareError, recipeDbError } from './repository.js';

describe('PV-18 recetas', () => {
  it('exige ingredientes con unidad del catálogo y deja la fuente declarada', () => {
    const parsed = recipeDraftSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Tortilla de verdura',
      yield_portions: 2,
      steps: ['Batir los huevos.', 'Cocinar a fuego medio.'],
      items: [{ name: 'Huevo', quantity: 2, unit: 'u' }],
    });
    expect(parsed.nutrient_source).toBe('');
    expect(recipeDraftSchema.safeParse({ ...parsed, items: [{ name: 'Huevo', quantity: 2, unit: 'oz' }] }).success).toBe(false);
    expect(recipeDraftSchema.safeParse({ ...parsed, kcal: 320 }).success).toBe(false);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => recipeDbError({ code: '42P01' })).toThrow(CareError);
    try {
      recipeDbError({ code: 'PGRST205' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501, message: 'El catálogo de recetas requiere instalar la migración de este módulo.' });
    }
    try {
      recipeDbError({ code: '42883' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
  });
});
