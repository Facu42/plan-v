import { describe, expect, it } from 'vitest';
import { chunk, desktopFrames, harvest, hex, ranked, slug } from './figma-pull.mjs';

describe('figma-pull', () => {
  it('nombra los archivos por el frame, sin acentos ni "(Desktop)"', () => {
    expect(slug('01. Dashboard (Desktop)')).toBe('01-dashboard');
    expect(slug('22. Food Diary (Desktop)')).toBe('22-food-diary');
    expect(slug('Nutrición Semanal (Desktop)')).toBe('nutricion-semanal');
  });

  it('toma solo los frames de escritorio de primer nivel', () => {
    const document = {
      children: [
        {
          name: 'Interface',
          children: [
            { id: '12:792', type: 'FRAME', name: '01. Dashboard (Desktop)' },
            { id: '12:900', type: 'FRAME', name: '02. Dashboard (Mobile)' },
            { id: '12:950', type: 'COMPONENT', name: '03. Card (Desktop)' },
            { id: '105:2649', type: 'FRAME', name: '22. Food Diary (Desktop)' },
          ],
        },
        { name: 'Style & Component', children: [] },
      ],
    };
    expect(desktopFrames(document)).toEqual([
      { id: '12:792', name: '01. Dashboard (Desktop)', slug: '01-dashboard', page: 'Interface' },
      { id: '105:2649', name: '22. Food Diary (Desktop)', slug: '22-food-diary', page: 'Interface' },
    ]);
  });

  it('convierte el color 0..1 de Figma a hex', () => {
    expect(hex({ r: 1, g: 1, b: 1 })).toBe('#FFFFFF');
    expect(hex({ r: 0.7607843, g: 0.9019608, b: 0.4313726 })).toBe('#C2E66E');
    expect(hex({ r: 0, g: 0, b: 0, a: 1 })).toBe('#000000');
  });

  it('cosecha colores, tipografía y radios del árbol, salteando lo invisible', () => {
    const acc = { colors: new Map(), strokes: new Map(), type: new Map(), radii: new Map(), layout: new Map() };
    harvest({
      type: 'FRAME',
      cornerRadius: 20,
      layoutMode: 'VERTICAL',
      itemSpacing: 12,
      paddingTop: 28, paddingRight: 28, paddingBottom: 28, paddingLeft: 28,
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
      strokes: [{ type: 'SOLID', color: { r: 0.9333333, g: 0.9333333, b: 0.9372549 } }],
      children: [
        {
          type: 'TEXT',
          style: { fontFamily: 'Poppins', fontWeight: 600, fontSize: 29, lineHeightPx: 34.8 },
          fills: [{ type: 'SOLID', color: { r: 0.153, g: 0.161, b: 0.196 } }],
        },
        {
          type: 'RECTANGLE',
          cornerRadius: 20,
          fills: [
            { type: 'SOLID', color: { r: 1, g: 1, b: 1 } },
            { type: 'SOLID', color: { r: 1, g: 0, b: 0 }, visible: false },
          ],
        },
      ],
    }, acc);

    expect(acc.colors.get('#FFFFFF')).toBe(2);
    expect(acc.colors.has('#FF0000')).toBe(false);
    expect(acc.colors.get('#272932')).toBe(1);
    expect(acc.strokes.get('#EEEEEF')).toBe(1);
    expect(acc.type.get('Poppins 600 29/35')).toBe(1);
    expect(acc.radii.get(20)).toBe(2);
    expect([...acc.layout.keys()][0]).toContain('gap 12');
  });

  it('ordena por frecuencia y agrupa en tandas', () => {
    expect(ranked(new Map([['a', 2], ['b', 9]]))).toEqual([
      { value: 'b', count: 9 },
      { value: 'a', count: 2 },
    ]);
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 5)).toEqual([]);
  });
});
