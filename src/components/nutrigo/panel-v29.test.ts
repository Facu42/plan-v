import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { PANEL_V29_ICONS } from './panel-v29-icons';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const css = readFileSync(new URL('./panel-v29.css', import.meta.url), 'utf8');
const hojaVieja = readFileSync(new URL('./panel-boceto.css', import.meta.url), 'utf8');
const shell = readFileSync(new URL('./PanelBocetoShell.tsx', import.meta.url), 'utf8');
const fuente = readFileSync(resolve(raiz, 'design/panel-nutri/v29/panel-trabajo.html'), 'utf8');
const piezas = ['.app', '.side', '.logo', '.mk', '.fold', '.srch', '.grp', '.nv', '.ct', '.acct', '.main', '.top', '.ibtn', '.cta'];

describe('herramientas del boceto v29', () => {
  it('limita cada regla a #pv-panel-v29 para no tocar la app de la paciente', () => {
    const selectors: string[] = [];
    postcss.parse(css).walkRules(rule => { if (!/keyframes$/.test((rule.parent as { name?: string })?.name ?? '')) selectors.push(...rule.selectors); });
    expect(selectors.length).toBeGreaterThan(300);
    expect(selectors.filter(s => !s.includes('#pv-panel-v29'))).toEqual([]);
  });

  it('trae los íconos del menú del boceto v29', () => {
    for (const name of ['grid', 'users', 'cal', 'coin', 'globe', 'clip', 'chat', 'team', 'gear', 'bell', 'plus', 'spark', 'fork', 'heart', 'trend', 'search', 'chev', 'shield', 'file']) {
      expect(PANEL_V29_ICONS).toHaveProperty(name);
    }
  });

  it('no pisa la hoja ni el armazón que ve la nutri hoy', () => {
    expect(hojaVieja.startsWith('/* GENERADO por scripts/panel-boceto-css.mjs desde design/panel-nutri/bocetos.html.')).toBe(true);
    expect(shell).toContain("import './panel-boceto.css'");
    expect(shell).not.toContain('panel-v29.css');
    expect(css).toContain('No importar en la app hasta la fase del armazón');
  });

  it('falla si una pieza del armazón no está en el boceto v29', () => {
    for (const marca of piezas) expect(fuente, marca).toContain(marca);
    expect(fuente).toContain('class="app"');
    expect(fuente).toContain('class="side"');
    expect(fuente).toContain('class="nv on"');
    expect(fuente).toContain('aria-label="Plegar menú"');
  });
});
