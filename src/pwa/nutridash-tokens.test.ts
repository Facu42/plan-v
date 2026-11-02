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

  it('usa el blanco verdoso y la menta de la cinta nueva, no el celeste anterior', () => {
    expect(css).toContain('--nd-foam: #f3f8e8');
    expect(css).toContain('--nd-mint: #c8ed88');
    expect(css).toContain('--nd-foam-deep: #e7f7c0');
    expect(css).toContain('--nd-mint-deep: #9ed456');
    expect(css).not.toContain('#07d2fd');
    expect(css).not.toContain('#03eac5');
    expect(css).not.toContain('#00b7fa');
  });

  it('mantiene tinta oscura con contraste AA sobre los cuatro tramos', () => {
    for (const stop of ['#f3f8e8', '#c8ed88', '#e7f7c0', '#9ed456']) {
      expect(contrast('#10241c', stop)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el favicon publicado es el ícono nuevo', () => {
    const svg = readFileSync(new URL('../../public/favicon.svg', import.meta.url), 'utf8');
    expect(svg).toContain('data:image/png;base64,');
    expect(svg).not.toContain('pWbeZxk');
  });
});
