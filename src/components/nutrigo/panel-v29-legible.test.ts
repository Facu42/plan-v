import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./panel-v29.css', import.meta.url), 'utf8');

describe('panel v29: letra legible', () => {
  it('ningún texto del panel baja de 11px', () => {
    const chicos = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1])).filter(px => px < 11);
    expect(chicos).toEqual([]);
  });
  it('el gris de apoyo (ink3) tiene contraste suficiente sobre fondo claro y oscuro', () => {
    expect(css).toContain('--ink3:#666972');
    expect(css).toContain('--ink3:#8C8F98');
    expect(css).not.toContain('--ink3:#71747C');
    expect(css).not.toContain('--ink3:#6E717A');
  });
});
