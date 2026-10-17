import { describe, expect, it } from 'vitest';
import { boughtLabel, localAmount, productCount, quantityLabel, recentMonths, shoppingShareText, storeOf, whatsappShareUrl } from './shopping-format';

describe('cantidad de un producto', () => {
  it('muestra hasta dos decimales con coma y no redondea 0,25 a 0,3', () => {
    expect(quantityLabel(0.25)).toBe('0,25');
    expect(quantityLabel(3.5)).toBe('3,5');
    expect(quantityLabel(500)).toBe('500');
    expect(quantityLabel(0.333)).toBe('0,33');
  });
  it('sin dato, cero, negativa o inválida se muestra un guion', () => {
    for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -2, 0]) expect(quantityLabel(value)).toBe('-');
  });
  it('un número enorme se abrevia para no pisar las otras columnas', () => {
    expect(quantityLabel(100000)).toBe('100.000');
    expect(quantityLabel(12_500_000)).toBe('12,5 M');
  });
});

describe('textos con plural', () => {
  it('concuerda comprados y productos con el número', () => {
    expect([0, 1, 2].map(boughtLabel)).toEqual(['0 comprados', '1 comprado', '2 comprados']);
    expect([0, 1, 2].map(productCount)).toEqual(['0 productos', '1 producto', '2 productos']);
  });
});

describe('meses del resumen', () => {
  it('termina en el mes de Argentina de la fecha dada y cruza el cambio de año', () => {
    const months = recentMonths(new Date('2027-02-10T12:00:00-03:00'), 4);
    expect(months.map(item => [item.year, item.month])).toEqual([[2026, 10], [2026, 11], [2027, 0], [2027, 1]]);
  });
  it('a las 22:30 del 31 de octubre en Buenos Aires el último mes sigue siendo octubre', () => {
    const original = process.env.TZ; process.env.TZ = 'UTC';
    try { expect(recentMonths(new Date('2026-11-01T01:30:00Z'), 2).map(item => item.month)).toEqual([8, 9]); }
    finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
  });
});

describe('lista para compartir', () => {
  const line = (name: string, extra: Partial<{ quantity: number | null; unit: string | null; checked: boolean }> = {}) => ({ name, quantity: 1, unit: 'u', checked: false, ...extra });

  it('agrupa lo que falta comprar por comercio, en el orden del archivo, y deja afuera lo comprado', () => {
    const text = shoppingShareText([line('Yogur natural', { quantity: 2 }), line('Banana', { quantity: 6 }), line('Pollo', { quantity: 500, unit: 'g' }), line('Avena', { checked: true }), line('Detergente', { quantity: null, unit: null })]);
    expect(text).toBe(['Lista del súper', '', 'VERDULERÍA', '• Banana · 6 u', '', 'PROTEÍNAS', '• Pollo · 1/2 kg', '', 'LÁCTEOS', '• Yogur natural · 2 u', '', 'OTROS', '• Detergente'].join('\n'));
  });

  it('con todo comprado manda la lista completa y sin productos lo dice', () => {
    expect(shoppingShareText([line('Arroz', { checked: true })])).toContain('• Arroz · 1 u');
    expect(shoppingShareText([])).toBe('Lista del súper\n\nTodavía no hay productos.');
  });

  it('arma el enlace de WhatsApp con el texto codificado', () => {
    expect(whatsappShareUrl('Lista del súper\n• Pan')).toBe('https://wa.me/?text=Lista%20del%20s%C3%BAper%0A%E2%80%A2%20Pan');
  });
});

describe('comercio de cada producto', () => {
  it.each([
    ['Salmón rosado', 'Proteínas'], ['Sal fina', 'Almacén'], ['Tomate', 'Verdulería'], ['Té verde', 'Almacén'],
    ['Granola sin azúcar', 'Panadería y cereales'], ['Avena con manzana y canela', 'Panadería y cereales'],
    ['Tapas de empanada', 'Panadería y cereales'], ['Panqueque de avena', 'Otros'], ['Yogur con frutas', 'Lácteos'],
    ['Huevos', 'Proteínas'], ['Detergente', 'Otros'], ['Salvado de avena', 'Panadería y cereales'],
  ] as const)('«%s» va a %s', (name, store) => {
    expect(storeOf(name)).toBe(store);
  });
});

describe('cantidades como se piden en el comercio', () => {
  const shown = (quantity: number | null, unit: string | null, name = '') => { const local = localAmount(quantity, unit, name); return `${local.amount} ${local.unit}`.trim(); };
  it('pasa gramos y mililitros a cuartos de kilo y litros, redondeando para arriba', () => {
    expect(shown(480, 'g')).toBe('1/2 kg');
    expect(shown(250, 'g')).toBe('1/4 kg');
    expect(shown(720, 'g')).toBe('3/4 kg');
    expect(shown(700, 'g')).toBe('700 g');
    expect(shown(960, 'g')).toBe('1 kg');
    expect(shown(1100, 'g')).toBe('1,25 kg');
    expect(shown(1500, 'ml')).toBe('1,5 l');
    expect(shown(500, 'ml')).toBe('1/2 l');
  });
  it('lo que no llega a un cuarto queda en gramos de a 50, y lo chico queda como viene', () => {
    expect(shown(120, 'g')).toBe('150 g');
    expect(shown(90, 'g')).toBe('90 g');
    expect(shown(0.25, 'g')).toBe('0,25 g');
    expect(shown(330, 'ml')).toBe('330 ml');
  });
  it('los huevos van por docena y las unidades enteras', () => {
    expect(shown(4, 'u', 'Huevos')).toBe('1/2 docena');
    expect(shown(12, 'u', 'huevo')).toBe('1 docena');
    expect(shown(14, 'u', 'Huevos de campo')).toBe('1,5 docenas');
    expect(shown(1, 'u', 'Huevo')).toBe('1 u');
    expect(shown(2.5, 'u', 'Palta')).toBe('3 u');
  });
  it('las medidas de cocina y los datos inválidos no cambian', () => {
    expect(shown(3.5, 'cda')).toBe('3,5 cda');
    expect(shown(Number.NaN, 'g')).toBe('- g');
    expect(localAmount(480, 'g').exact).toBe('480 g');
  });
  it('la lista para compartir usa las cantidades del comercio', () => {
    expect(shoppingShareText([{ name: 'Pollo', quantity: 980, unit: 'g', checked: false }])).toContain('• Pollo · 1 kg');
  });
});
