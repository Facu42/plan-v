import { describe, expect, it } from 'vitest';
import { CareError } from '../care/errors.js';
import {
  assertKnownAllergies,
  buildMenuJobContext,
  buildRecipeJobContext,
  canonicalJson,
  estimateTokens,
  hashAiContext,
  labSlices,
  measurementSlices,
} from './context.js';
import { emptyIntakePayload } from '../intake/payload.js';

describe('contexto mínimo de jobs de IA', () => {
  it('exige alergias y restricciones declaradas y manda la ficha pero nunca nombre ni teléfono', () => {
    expect(() => assertKnownAllergies(emptyIntakePayload())).toThrow(CareError);
    const intake = {
      ...emptyIntakePayload(),
      preferred_name: 'Sofía Privada',
      phone: '1155550000',
      conditions_note: 'Nota clínica',
      allergies: { state: 'reported' as const, items: ['Maní'] },
      restrictions: { state: 'none' as const, items: [] },
      cooking_time_minutes: 30,
    };
    const recipe = buildRecipeJobContext({ intake, titleHint: 'Bowl' });
    const encoded = canonicalJson(recipe);
    expect(encoded).toContain('Maní');
    expect(encoded).toContain('recipe_draft.v2');
    expect(encoded).not.toContain('Sofía');
    expect(encoded).not.toContain('1155550000');
    expect(encoded).toContain('Nota clínica');
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
    expect(menuJson).toContain('menu_draft.v2');
    expect(menuJson).not.toContain('Sofía Privada');
    expect(menuJson).not.toContain('1155550000');
    expect(menuJson).toContain('Nota clínica');
    expect(hashAiContext(recipe)).toHaveLength(64);
    expect(estimateTokens(recipe)).toBeGreaterThan(0);
    expect(hashAiContext(recipe)).toBe(hashAiContext({ ...recipe }));
  });
});

describe('medidas y laboratorios para la IA', () => {
  const peso = (captured_on: string, value_numeric: number) => ({ kind: 'weight', value_numeric, unit: 'kg', captured_on });

  it('toma las últimas 4 lecturas de cada medida, de la más nueva a la más vieja', () => {
    const rows = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01'].map((day, i) => peso(day, 70 + i));
    const slices = measurementSlices(rows);
    expect(slices).toHaveLength(4);
    expect(slices[0]).toEqual({ kind: 'weight', value: 74, unit: 'kg', on: '2026-05-01' });
    expect(slices[slices.length - 1]?.on).toBe('2026-02-01');
  });

  it('manda solo estudio, valor, unidad, rango y fecha de los laboratorios', () => {
    const lab = { id: 'x', patient_id: 'p', recorded_on: '2026-10-01', created_at: '', data: { kind: 'laboratory', document_id: 'd', values: [
      { id: 'v', name: 'Glucemia', value: 92, operator: '', unit: 'mg/dl', range_text: '70-110', raw_value: '92', source_line: 'Glucemia 92 PRIVADO', page: 1, reviewed: true },
    ] } } as never;
    const slices = labSlices([lab]);
    expect(slices).toEqual([{ name: 'Glucemia', value: '92', unit: 'mg/dl', range: '70-110', on: '2026-10-01' }]);
    expect(JSON.stringify(slices)).not.toContain('PRIVADO');
  });

  it('llegan al contexto del menú y de la receta sin nombre ni teléfono', () => {
    const intake = { ...emptyIntakePayload(), preferred_name: 'Sofía', phone: '1155550000', allergies: { state: 'none' as const, items: [] }, restrictions: { state: 'none' as const, items: [] } };
    const clinical = { measurements: measurementSlices([peso('2026-05-01', 70)]), labs: [] };
    for (const context of [buildRecipeJobContext({ intake, clinical }), buildMenuJobContext({ intake, clinical })]) {
      const json = canonicalJson(context);
      expect(json).toContain('"value":70');
      expect(json).not.toContain('Sofía');
      expect(json).not.toContain('1155550000');
    }
  });
});
