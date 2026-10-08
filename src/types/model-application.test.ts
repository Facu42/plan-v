import { expect, it } from 'vitest';
import { datedModelItems, modelPlanChanges, type ModelCopy } from './models';

const copy: ModelCopy = {
  version: 1,
  title: 'Modelo',
  description: '',
  lines: [],
  published_at: null,
  plan: {
    days: 7,
    items: [
      {
        day: 3,
        slot: 'Almuerzo',
        recipe_id: null,
        recipe_version: null,
        recipe_title: null,
        recipe: null,
        free_text: 'Indicación',
        portions: 2,
        public_note: 'Nota',
      },
    ],
  },
};

it('traslada días relativos incluso al cambiar de mes y conserva la copia original', () => {
  const original = structuredClone(copy);
  const items = datedModelItems(copy, '2026-10-31');
  expect(items[0].for_date).toBe('2026-11-02');
  items[0].public_note = 'Edición de la vista previa';
  expect(copy).toEqual(original);
});

it('compara contenido sin confundir identificadores nuevos con cambios, pero detecta notas y porciones', () => {
  const before = datedModelItems(copy, '2026-10-31');
  const after = structuredClone(before);
  after[0].id = 'new-id';
  expect(modelPlanChanges(before, after)).toEqual({
    added: 0,
    removed: 0,
    changed: 0,
  });
  after[0].public_note = 'Otra nota';
  after[0].portions = 3;
  expect(modelPlanChanges(before, after)).toEqual({
    added: 0,
    removed: 0,
    changed: 1,
  });
  expect(modelPlanChanges(before, datedModelItems(copy, '2026-11-01'))).toEqual(
    { added: 1, removed: 1, changed: 0 },
  );
});
