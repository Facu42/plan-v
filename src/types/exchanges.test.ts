import { describe, expect, it } from 'vitest';
import { exchangeInputSchema, exchangePayloadOf } from './exchanges';

const id = '11111111-1111-4111-8111-111111111111';
const food = '22222222-2222-4222-8222-222222222222';
const item = { food_id: null, name: 'Arroz integral cocido', measure: '1 taza', grams: 180 };
const list = { id, kind: 'list', expected_revision: 0, name: 'Cereales', base: item, items: [{ ...item, food_id: food, name: 'Fideos cocidos', grams: 140 }] };

describe('equivalencias: contrato de entrada', () => {
  it('acepta una lista con alimento base, equivalentes y justificación opcional', () => {
    const parsed = exchangeInputSchema.parse({ ...list, justification: 'Aportan una cantidad similar de hidratos.' });
    expect(parsed.kind).toBe('list');
    expect(parsed).toMatchObject({ description: '', justification: 'Aportan una cantidad similar de hidratos.' });
  });
  it('rechaza listas sin equivalentes, gramos no positivos y claves desconocidas', () => {
    expect(exchangeInputSchema.safeParse({ ...list, items: [] }).success).toBe(false);
    expect(exchangeInputSchema.safeParse({ ...list, base: { ...item, grams: 0 } }).success).toBe(false);
    expect(exchangeInputSchema.safeParse({ ...list, items: [{ ...item, grams: -1 }] }).success).toBe(false);
    expect(exchangeInputSchema.safeParse({ ...list, owner_id: food }).success).toBe(false);
    expect(exchangeInputSchema.safeParse({ ...list, name: '   ' }).success).toBe(false);
  });
  it('acepta un grupo con porción de referencia opcional y exige al menos un alimento', () => {
    const group = { id, kind: 'group', expected_revision: 0, name: 'Lácteos', foods: [{ food_id: null, name: 'Yogur natural' }] };
    expect(exchangeInputSchema.parse(group)).toMatchObject({ portion: null, description: '' });
    expect(exchangeInputSchema.safeParse({ ...group, portion: { measure: '1 pote', grams: 200 } }).success).toBe(true);
    expect(exchangeInputSchema.safeParse({ ...group, foods: [] }).success).toBe(false);
    expect(exchangeInputSchema.safeParse({ ...group, portion: { measure: '', grams: 200 } }).success).toBe(false);
  });
  it('separa el contenido guardado de la identidad y la revisión', () => {
    const parsed = exchangeInputSchema.parse(list);
    const payload = exchangePayloadOf(parsed);
    expect(payload).not.toHaveProperty('id');
    expect(payload).not.toHaveProperty('kind');
    expect(payload).not.toHaveProperty('expected_revision');
    expect(payload).toMatchObject({ name: 'Cereales', items: [{ name: 'Fideos cocidos' }] });
  });
});
