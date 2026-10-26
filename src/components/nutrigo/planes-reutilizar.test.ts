import { expect, it } from 'vitest';
import { borradorReutilizable } from './planes-reutilizar';
import type { PlanItemView, ProfessionalMealPlan } from '../../types/plans';

const items = [{ id: 'privado', for_date: '2026-10-28', slot: 'Almuerzo', free_text: 'Arroz', public_note: '', portions: 2 }] as PlanItemView[];
it('copia comidas actuales sin ficha, metas ni indicaciones y usa la revisión del destino', () => {
  const destino = { id: crypto.randomUUID(), current: { revision: crypto.randomUUID() } } as ProfessionalMealPlan;
  const copia = borradorReutilizable(items, '2026-10-26', '2026-11-01', destino);
  expect(copia).toMatchObject({ id: destino.id, expected_revision: destino.current.revision, items: [{ free_text: 'Arroz', portions: 2, for_date: '2026-10-28' }] });
  expect(copia).not.toHaveProperty('nutrition_target');
  expect(copia).not.toHaveProperty('guidance');
  expect(copia.items[0]).not.toHaveProperty('id');
});
it('inicia otro plan sin reutilizar la identidad del origen y rechaza contenido vacío', () => {
  expect(borradorReutilizable(items, '2026-10-26', '2026-11-01', null).expected_revision).toBeNull();
  expect(() => borradorReutilizable([], '2026-10-26', '2026-11-01', null)).toThrow();
});
