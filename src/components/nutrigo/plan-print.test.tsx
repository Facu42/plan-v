import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { foodInputSchema, type Food } from '../../types/foods';
import type { PlanVersionView, ProfessionalMealPlan } from '../../types/plans';
import { calculateRecipeCatalog } from '../../types/recipe-catalog-nutrition';
import { planPrintHtml } from './PlanPrintDocument';
import { PlanPrintDialog } from './PlanPrintDialog';

const food: Food = { ...foodInputSchema.parse({ id: '11111111-1111-4111-8111-111111111111', expected_revision: 0, name: 'Avena histórica', kind: 'food', source: 'Etiqueta revisada', nutrients: { kcal: 400, protein: 10, carbs: 60, fat: 0 }, portions: [{ name: 'Cucharada', grams: 10 }] }), revision: 2, owner_id: null, updated_at: '' };
const version: PlanVersionView = { id: 'private-version-id', revision: 'private-revision', version: 3, status: 'draft', period_start: '2026-10-07', period_end: '2026-10-13', published_at: null, items: [{ id: 'private-item-id', for_date: '2026-10-07', slot: 'Almuerzo', recipe_id: null, recipe_version: null, recipe_title: null, recipe: null, free_text: null, portions: null, public_note: 'Comer despacio', components: [
  { id: 'food-line', kind: 'food', food_id: food.id, food_revision: 2, quantity: 2, measure: 'Cucharada', public_note: 'Medida rasa', food_snapshot: food },
  { id: 'recipe-line', kind: 'recipe', recipe_id: 'recipe-id', recipe_version: 1, portions: 3, public_note: '', recipe_snapshot: { title: 'Receta histórica', version: 1, yield_portions: 2, nutrient_source: 'Consultorio', ingredients: [{ id: 'ingredient-id', name: 'Lentejas', quantity: 80, unit: 'g' }], steps: ['Lavar.', 'Cocinar.'] } },
  { id: 'text-line', kind: 'text', free_text: 'Agua', public_note: '' },
] }] };
const copy = { version, patientName: 'Paciente ficticia', professionalName: 'Profesional de prueba', demo: true };

it('imprime la copia guardada con medidas históricas, receta escalada y notas, sin inventar nutrientes', () => {
  const html = planPrintHtml(copy);
  expect(html).toContain('BORRADOR GUARDADO · NO PUBLICADO');
  expect(html).toContain('DEMOSTRACIÓN');
  expect(html).toContain('2 Cucharada (20 g)');
  expect(html).toContain('Etiqueta revisada · revisión 2');
  expect(html).toContain('Lentejas: 120 g');
  expect(html).toContain('Receta publicada · versión 1');
  expect(html).toContain('Nutrientes no disponibles');
  expect(html).toContain('Nota de la comida: Comer despacio');
  expect(html).toContain('Medida rasa');
  expect(html).toContain('Agua');
  expect(html.match(/Sin indicaciones para este día/g)).toHaveLength(6);
  expect(html).not.toContain('private-revision');
  expect(html).not.toContain('private-item-id');
  expect(html).not.toContain('recipe-id');
  expect(html).not.toMatch(/NaN|undefined|\b0 kcal\b/);
});

it('escapa nombres, instrucciones y notas antes de incluirlos en el documento', () => {
  const html = planPrintHtml({ ...copy, patientName: '<script>alert(1)</script>', professionalName: '<img onerror="alert(2)">', version: { ...version, items: [{ ...version.items[0], public_note: '<script>alert(3)</script>' }] } });
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img onerror');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(html).toContain('&lt;script&gt;alert(3)&lt;/script&gt;');
});

it('no redondea cantidades indicadas ni convierte cantidades positivas pequeñas en cero', () => {
  const changed = structuredClone(version);
  const component = changed.items[0].components![0];
  if (component.kind !== 'food') throw new Error('Fixture');
  component.quantity = 1.234567;
  expect(planPrintHtml({ ...copy, version: changed })).toContain('1,234567 Cucharada');
  component.quantity = 0.000001;
  expect(planPrintHtml({ ...copy, version: changed })).toContain('0,000001 Cucharada (0,00001 g)');
});

it('conserva procedencia IA incluso cuando faltan nutrientes de catálogo', () => {
  const changed = structuredClone(version);
  const component = changed.items[0].components![1];
  component.recipe_snapshot!.catalog_recipe = { ...calculateRecipeCatalog({ yield_portions: 2, items: [{ name: 'Lentejas', quantity: 80, unit: 'g' }] }, []), estimate_origin: true };
  const html = planPrintHtml({ ...copy, version: changed });
  expect(html).toContain('Nutrientes no disponibles');
  expect(html).toContain('Procedencia de IA conservada');
});

it('identifica la publicada y conserva los días vacíos también en períodos más largos', () => {
  const html = planPrintHtml({ ...copy, demo: false, version: { ...version, status: 'published', published_at: '2026-10-08T01:00:00Z', period_end: '2026-10-28' } });
  expect(html).toContain('PLAN PUBLICADO · v3');
  expect(html).toContain('Publicada el 7/10/2026');
  expect(html).not.toContain('DEMOSTRACIÓN');
  expect(html).not.toContain('NO PUBLICADO');
  expect(html.match(/class="pv-day"/g)).toHaveLength(22);
});

it('permite revisar sólo la copia publicada cuando el formulario no coincide y espera la carga antes de imprimir', () => {
  const published = { ...version, version: 2, status: 'published' as const, published_at: '2026-10-07T12:00:00Z' };
  const plan: ProfessionalMealPlan = { id: 'plan-id', patient_id: 'private-patient-id', timezone: 'America/Argentina/Buenos_Aires', created_at: '', current: version, published };
  const html = renderToStaticMarkup(<PlanPrintDialog plan={plan} patientName="Paciente ficticia" demo currentAllowed={false} onClose={() => undefined} />);
  expect(html).toContain('<option value="current" disabled="">');
  expect(html).toContain('<option value="published" selected="">');
  expect(html).toContain('Copia publicada · v2');
  expect(html).toContain('no publica ni envía');
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Imprimir \/ guardar PDF/);
  expect(html).not.toContain('private-patient-id');
});
