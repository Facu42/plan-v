import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PanelThemePicker } from './PanelThemePicker';
import { PanelNavigation } from './PanelNavigation';
import type { Patient } from '../../types';

function luminance(hex: string) {
  const rgb = hex.match(/\w\w/g)!.map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
const contrast = (a: string, b: string) => { const x = luminance(a); const y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

describe('accesibilidad del armazón', () => {
  it('mantiene AA en texto pequeño en superficies, submenús y botones de ambos temas', () => {
    const css = readFileSync(new URL('./panel-nutri-tokens.css', import.meta.url), 'utf8');
    const blocks = css.split(/\.nv-app[^{}]+\{/).slice(1).map(block => Object.fromEntries([...block.matchAll(/--pn-([\w-]+):\s*(#[\da-f]{6});/gi)].map(m => [m[1], m[2]])));
    expect(blocks).toHaveLength(2);
    const light = blocks[0]; const dark = { ...light, ...blocks[1] };
    for (const palette of [light, dark]) {
      for (const text of ['ink', 'ink2', 'muted']) for (const background of ['cream', 'white', 'fill']) {
        expect(contrast(palette[text], palette[background]), `${text} sobre ${background}`).toBeGreaterThanOrEqual(4.5);
      }
      for (const [text, background] of [['ink', 'lime-light'], ['on-color', 'lime'], ['on-color', 'saffron'], ['on-button', 'button'], ['ok', 'white']]) {
        expect(contrast(palette[text], palette[background]), `${text} sobre ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('permite dos selectores de tema sin mezclar sus grupos de teclado', () => {
    const picker = () => createElement(PanelThemePicker, { value: 'dark', onChange: () => {} });
    const html = renderToStaticMarkup(createElement(Fragment, null, picker(), picker()));
    const names = [...html.matchAll(/name="([^"]+)"/g)].map(m => m[1]);
    expect(names).toHaveLength(6);
    expect(new Set(names).size).toBe(2);
    expect(html.match(/checked=""/g)).toHaveLength(2);
  });
  it('conserva destinos y nombres accesibles con cero o muchas pacientes y menú plegado', () => {
    const patients = Array.from({ length: 1284 }, (_, index) => ({ id: String(index), name: index ? 'Jo' : 'Aleksandra Wiśniewska-Kowalczyk', has_account: false })) as Patient[];
    for (const data of [[], patients]) {
      const html = renderToStaticMarkup(createElement(PanelNavigation, { patients: data, unread: 1284, admin: false, current: '/crm/pacientes', collapsed: true, onCollapse: () => {}, onOpen: () => {} }));
      expect(html).toContain('aria-label="Desplegar el menú"');
      expect(html).toContain('aria-label="Configuración"');
      expect(html).toContain('href="/crm/pacientes?filtro=archived"');
      expect(html).toContain('inert=""');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
    }
  });
});
