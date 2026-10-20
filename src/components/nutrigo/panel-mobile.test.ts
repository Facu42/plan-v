import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const shell = readFileSync(new URL('./panel-nutri-shell.css', import.meta.url), 'utf8');
const fase5 = readFileSync(new URL('./panel-fase5.css', import.meta.url), 'utf8');
const showroom = readFileSync(new URL('./NutrigoShowroom.tsx', import.meta.url), 'utf8');
const phone = shell.slice(shell.indexOf('@media (max-width:799px)'));

describe('celular de Agenda y Cobranzas', () => {
  it('en el celular el título queda en la barra y no se repite en la página', () => {
    expect(shell).not.toMatch(/clip:rect/);
    expect(shell).toMatch(/@media \(min-width:800px\) \{\n  \.nv-app\.nv-pro\.pn-panel:is\(\.nv-agenda-page,\.nv-fees-page\) \.nv-topbar-title \{ display:none; \}/);
    expect(phone).toMatch(/\.pn-panel:is\(\.nv-agenda-page,\.nv-fees-page\) \.p5-head h2 \{ display:none; \}/);
    expect(phone).toMatch(/\.nv-app\.nv-pro\.pn-panel \.nv-topbar-label-desktop \{ display:none; \}/);
    expect(phone).toMatch(/\.nv-app\.nv-pro\.pn-panel \.nv-topbar-label-mobile \{ display:inline; \}/);
    expect(showroom).toContain("'agenda', 'cobranzas', 'mensajes'");
    expect(shell).toMatch(/\.pn-panel \.pn-collapse \{[^}]*width:30px; height:30px;/);
    expect(shell).toMatch(/box-shadow:0 2px 8px rgba\(39,41,50,\.12\)/);
    expect(shell).toMatch(/\.pn-panel \.pn-collapse:hover \{ transform:scale\(1\.1\); background:var\(--pn-lime-light\); \}/);
    expect(shell).toMatch(/\.pn-panel \.pn-collapse:active \{ transform:scale\(\.94\); \}/);
    expect(shell).toMatch(/\.pn-panel\.pn-collapsed \.pn-collapse svg \{ transform:rotate\(180deg\); \}/);
    expect(shell).toMatch(/border-bottom-left-radius:8px/);
    expect(shell).toMatch(/\.pn-panel \.pn-submenu>div>div:not\(:last-child\) a::after \{ content:""; position:absolute; left:-16px; top:50%; bottom:0; border-left:1\.5px solid var\(--pn-muted2\); \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-pri \{[^}]*color:#272932; \}/);
    expect(showroom).not.toContain("page === 'agenda' || page === 'cobranzas'");
    expect(showroom).toContain("const moreCurrent = publicPage || moreSection");
  });

  it('fija el menú inferior y separa cada turno con su etiqueta', () => {
    expect(shell).toMatch(/\.nv-app\.nv-pro\.pn-panel \.nv-tabbar \{ position:fixed; z-index:35;/);
    expect(shell).toMatch(/padding-bottom:calc\(108px \+ env\(safe-area-inset-bottom\)\)/);
    expect(shell).toMatch(/padding-bottom:calc\(180px \+ env\(safe-area-inset-bottom\)\)/);
    expect(fase5).toMatch(/repeat\(var\(--p5-rows\),64px\)/);
    expect(fase5).toMatch(/\.pn-panel \.p5-turn \{ display:flex; align-items:center; gap:10px; min-height:44px;/);
    expect(fase5).toMatch(/\.pn-panel \.p5-chip \{/);
    expect(fase5).toMatch(/min-height:44px; min-width:44px;/);
    expect(fase5).toMatch(/\.pn-panel \.p5-seg \{ flex-wrap:wrap; max-width:100%; min-width:0; \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-who b \{ overflow-wrap:break-word; word-break:normal; \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-table-wrap \{ display:none; \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-moves \{ display:flex; flex-direction:column;/);
  });
});
