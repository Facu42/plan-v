import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ExchangeCard, ExchangeCatalog, ExchangeDetail, exchangeInputFromDraft } from './ExchangeCatalog';
import type { ExchangeEntry } from '../../types/exchanges';
import type { Food } from '../../types/foods';

const nutrients = { kcal: null, protein: null, carbs: null, fat: null, fiber: null, sodium: null, calcium: null, iron: null, potassium: null, magnesium: null, vitamin_c: null };
const avena: Food = { id: '22222222-2222-4222-8222-222222222222', owner_id: null, revision: 1, updated_at: '', name: 'Avena', brand: '', category: '', kind: 'food', source: 'Etiqueta', reference: '', portions: [], nutrients: { ...nutrients, kcal: 380, protein: 13 } };
const base = { revision: 1, updated_at: '2026-10-10T10:00:00Z', description: '' };
const system: ExchangeEntry = { ...base, id: '11111111-1111-4111-8111-111111111111', kind: 'list', owner_id: null, name: 'Equivalentes de cereales', justification: 'Aportan hidratos en cantidad similar.', base: { food_id: null, name: 'Arroz', measure: '1 taza', grams: 180 }, items: [{ food_id: avena.id, name: 'Avena', measure: '3 cucharadas', grams: 30 }, { food_id: null, name: 'Fideos', measure: '1 taza', grams: 140 }] };
const own: ExchangeEntry = { ...system, id: '33333333-3333-4333-8333-333333333333', owner_id: 'nutri-a', name: 'Mi lista' };
const group: ExchangeEntry = { ...base, id: '44444444-4444-4444-8444-444444444444', kind: 'group', owner_id: 'nutri-a', name: 'Lácteos', portion: { measure: '1 pote', grams: 200 }, foods: [{ food_id: avena.id, name: 'Avena' }, { food_id: null, name: 'Yogur' }] };
const noop = vi.fn();

describe('Equivalencias: pantalla', () => {
  it('la tarjeta muestra origen Sistema, alimento base con medida y cantidad de equivalentes', () => {
    const html = renderToStaticMarkup(<ExchangeCard entry={system} onOpen={noop} />);
    expect(html).toContain('Equivalentes de cereales');
    expect(html).toContain('Sistema');
    expect(html).toContain('Alimento base');
    expect(html).toContain('1 taza');
    expect(html).toContain('180 g');
    expect(html).toContain('2 equivalentes');
    expect(renderToStaticMarkup(<ExchangeCard entry={own} onOpen={noop} />)).toContain('Propia');
    expect(renderToStaticMarkup(<ExchangeCard entry={{ ...own, items: [own.kind === 'list' ? own.items[0] : (undefined as never)] }} onOpen={noop} />)).toContain('1 equivalente<');
  });
  it('la tarjeta del grupo muestra la porción de referencia y la cantidad de alimentos', () => {
    const html = renderToStaticMarkup(<ExchangeCard entry={group} onOpen={noop} />);
    expect(html).toContain('Porción de referencia');
    expect(html).toContain('1 pote');
    expect(html).toContain('2 alimentos');
  });
  it('el detalle muestra justificación, cantidades y «Sin dato» para lo no vinculado, sin inventar ceros', () => {
    const foods = new Map([[avena.id, avena]]);
    const html = renderToStaticMarkup(<ExchangeDetail entry={system} foods={foods} onEdit={noop} onDuplicate={noop} onArchive={noop} />);
    expect(html).toContain('Aportan hidratos en cantidad similar.');
    expect(html).toContain('114');
    expect(html).toContain('Sin dato');
    expect(html).toContain('3 cucharadas');
    expect(html).toContain('Duplicar para editar');
    expect(html).not.toContain('Editar lista');
    expect(html).not.toContain('Archivar');
  });
  it('lo propio se edita y archiva; lo de Sistema no ofrece esas acciones', () => {
    const html = renderToStaticMarkup(<ExchangeDetail entry={own} foods={new Map()} onEdit={noop} onDuplicate={noop} onArchive={noop} />);
    expect(html).toContain('Editar');
    expect(html).toContain('Archivar');
    expect(html).toContain('Duplicar');
  });
  it('el detalle de un grupo calcula el aporte promedio con los alimentos vinculados e indica la cobertura', () => {
    const html = renderToStaticMarkup(<ExchangeDetail entry={group} foods={new Map([[avena.id, avena]])} onEdit={noop} onDuplicate={noop} onArchive={noop} />);
    expect(html).toContain('760');
    expect(html).toContain('1 de 2');
  });
  it('arranca en estado de carga con pestañas, buscador y botón Crear', () => {
    const html = renderToStaticMarkup(<ExchangeCatalog />);
    expect(html).toContain('Equivalencias');
    expect(html).toContain('Listas de alimentos intercambiables y grupos para armar tus planes');
    expect(html).toContain('Listas de equivalentes');
    expect(html).toContain('Grupos de alimentos');
    expect(html).toContain('Crear');
    expect(html).toContain('Cargando');
  });
});

describe('Equivalencias: borrador del editor', () => {
  const draft = { id: own.id, revision: 1, kind: 'list' as const, name: ' Mi lista ', description: '', justification: '', base: { food_id: null, name: 'Arroz', measure: '1 taza', grams: '180' }, items: [{ food_id: null, name: 'Fideos', measure: '1 taza', grams: '140,5' }], hasPortion: false, portion: { measure: '', grams: '' }, foods: [] };
  it('acepta decimales con coma y rechaza campos vacíos con un mensaje claro', () => {
    const ok = exchangeInputFromDraft(draft);
    expect(ok.success).toBe(true);
    if (ok.success && ok.data.kind === 'list') expect(ok.data.items[0].grams).toBe(140.5);
    const noItems = exchangeInputFromDraft({ ...draft, items: [] });
    expect(noItems).toMatchObject({ success: false, message: 'Sumá al menos un alimento equivalente.' });
    expect(exchangeInputFromDraft({ ...draft, name: '  ' })).toMatchObject({ success: false, message: 'Ingresá el nombre.' });
    expect(exchangeInputFromDraft({ ...draft, items: [{ ...draft.items[0], grams: '0' }] })).toMatchObject({ success: false, message: 'Cada cantidad necesita gramos mayores que cero.' });
    expect(exchangeInputFromDraft({ ...draft, items: [{ ...draft.items[0], measure: '' }] })).toMatchObject({ success: false, message: 'Cada alimento necesita una medida, por ejemplo 1 taza.' });
  });
  it('un grupo sin porción de referencia es válido y con porción exige gramos', () => {
    const group = { ...draft, kind: 'group' as const, items: [], foods: [{ food_id: null, name: 'Yogur' }] };
    expect(exchangeInputFromDraft(group).success).toBe(true);
    expect(exchangeInputFromDraft({ ...group, hasPortion: true, portion: { measure: '1 pote', grams: '' } })).toMatchObject({ success: false });
  });
});
