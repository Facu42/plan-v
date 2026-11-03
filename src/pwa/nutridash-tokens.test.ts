import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function channel(hex: string, index: number): number {
  const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground: string, background: string): number {
  const luminance = (hex: string) => 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('degradé de los botones principales', () => {
  const css = readFileSync(new URL('../../public/brand/nutridash-tokens.css', import.meta.url), 'utf8');

  it('toma los colores del logo nuevo: azul, celeste y lima', () => {
    expect(css).toContain('--nd-blue: #0054d3');
    expect(css).toContain('--nd-cyan: #00d5fd');
    expect(css).toContain('--nd-lime: #9efa7e');
    expect(css).toContain('--nd-ribbon');
    expect(css).not.toContain('#f3f8e8');
  });

  it('mantiene tinta oscura con contraste AA sobre los cuatro tramos del botón', () => {
    for (const stop of ['#c9f4ff', '#b7f7a0', '#9fe9fb', '#8cec72']) {
      expect(css).toContain(stop);
      expect(contrast('#10241c', stop)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el favicon publicado es el ícono nuevo', () => {
    const svg = readFileSync(new URL('../../public/favicon.svg', import.meta.url), 'utf8');
    expect(svg).toContain('data:image/png;base64,');
    expect(svg).toContain('<image');
  });
});

describe('logo en vectores', () => {
  it('el isotipo SVG usa la cinta azul → celeste → lima y la hoja lima, sin imágenes adentro', () => {
    for (const archivo of ['nutridash-isotipo.svg', 'nutridash-marca.svg']) {
      const svg = readFileSync(new URL(`../../public/brand/${archivo}`, import.meta.url), 'utf8');
      expect(svg, archivo).toContain('#0054D3');
      expect(svg, archivo).toContain('#00D5FD');
      expect(svg, archivo).toContain('#9EFA7E');
      expect(svg, archivo).not.toContain('<image');
    }
  });
});
