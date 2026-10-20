import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PanelBocetoShell } from './PanelBocetoShell';
import { PANEL_BOCETO_ICONS } from './panel-boceto-icons';

const css = readFileSync(new URL('./panel-boceto.css', import.meta.url), 'utf8');

describe('estilos del boceto en la app', () => {
  it('limita cada regla al panel para no tocar la app de la paciente', () => {
    const selectors: string[] = [];
    postcss.parse(css).walkRules(rule => { if (!/keyframes$/.test((rule.parent as { name?: string })?.name ?? '')) selectors.push(...rule.selectors); });
    expect(selectors.length).toBeGreaterThan(300);
    expect(selectors.filter(s => !s.includes('#pv-panel'))).toEqual([]);
  });
  it('trae los íconos del boceto que usa el menú', () => {
    for (const name of ['grid', 'users', 'cal', 'coin', 'globe', 'spark', 'pulse', 'chat', 'trend', 'clip', 'apple', 'fork', 'swap', 'layers', 'mark', 'help', 'team', 'gear', 'back', 'chev', 'bell', 'search', 'out']) expect(PANEL_BOCETO_ICONS).toHaveProperty(name);
  });
});

describe('armazón del panel', () => {
  const render = (collapsed: boolean) => renderToStaticMarkup(<PanelBocetoShell
    dark collapsed={collapsed} onCollapse={vi.fn()} menuOpen={false} onMenu={vi.fn()} nav={<nav className="nvs" />}
    brand="Tu consultorio" name="Tu consultorio" initials="TC" account={[{ label: 'Tema claro', glyph: 'sun', onSelect: vi.fn() }]} onSignOut={vi.fn()}
    header={{ title: 'Pacientes', search: 'Buscar' }} bell={<button type="button" className="ibtn" />} onSearch={vi.fn()}
    tabs={[{ label: 'Inicio', glyph: 'grid', href: '/crm/inicio', on: true }, { label: 'Más', glyph: 'menu' }]} onOpen={vi.fn()} onMore={vi.fn()} mainKey="pacientes"
  ><p>contenido</p></PanelBocetoShell>);
  it('usa el marcado del boceto con el menú desplegado o plegado', () => {
    const open = render(false);
    expect(open).toContain('class="m desk" id="pv-panel"');
    expect(open).toContain('aria-label="Plegar el menú"');
    expect(open).toContain('<h1>Pacientes</h1>');
    expect(open).toContain('aria-label="Cerrar sesión"');
    expect(open).toContain('<span class="on">');
    expect(render(true)).toContain('class="m desk col"');
    expect(render(true)).toContain('aria-label="Desplegar el menú"');
  });
  it('no deja textos vacíos ni valores rotos', () => {
    const html = render(false);
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });
});
