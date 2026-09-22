import { describe, expect, it } from 'vitest';
import { CareError } from '../care/errors.js';
import {
  assertKnownAllergies,
  buildMenuJobContext,
  buildRecipeJobContext,
  canonicalJson,
  estimateTokens,
  hashAiContext,
} from './context.js';
import { emptyIntakePayload } from '../intake/payload.js';

describe('contexto mínimo de jobs de IA', () => {
  it('exige alergias y restricciones declaradas y no manda nombre ni notas', () => {
    expect(() => assertKnownAllergies(emptyIntakePayload())).toThrow(CareError);
    const intake = {
      ...emptyIntakePayload(),
      preferred_name: 'Sofía Privada',
      conditions_note: 'Nota clínica',
      allergies: { state: 'reported' as const, items: ['Maní'] },
      restrictions: { state: 'none' as const, items: [] },
      cooking_time_minutes: 30,
    };
    const recipe = buildRecipeJobContext({ intake, titleHint: 'Bowl' });
    const encoded = canonicalJson(recipe);
    expect(encoded).toContain('Maní');
    expect(encoded).toContain('recipe_draft.v1');
    expect(encoded).not.toContain('Sofía');
    expect(encoded).not.toContain('Nota clínica');
    const menu = buildMenuJobContext({
      intake,
      periodStart: '2026-09-21',
      periodEnd: '2026-09-22',
      slots: ['Almuerzo'],
      catalogTitles: ['Bowl publicado'],
      weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo' }] }],
    });
    const menuJson = canonicalJson(menu);
    expect(menuJson).toContain('Pollo');
    expect(menuJson).toContain('menu_draft.v1');
    expect(menuJson).not.toContain('Sofía Privada');
    expect(hashAiContext(recipe)).toHaveLength(64);
    expect(estimateTokens(recipe)).toBeGreaterThan(0);
    expect(hashAiContext(recipe)).toBe(hashAiContext({ ...recipe }));
  });
});
