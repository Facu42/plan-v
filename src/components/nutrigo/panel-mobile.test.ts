import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const shell = readFileSync(new URL('./panel-nutri-shell.css', import.meta.url), 'utf8');
const fase5 = readFileSync(new URL('./panel-fase5.css', import.meta.url), 'utf8');
const showroom = readFileSync(new URL('./NutrigoShowroom.tsx', import.meta.url), 'utf8');

describe('celular de Agenda y Cobranzas', () => {
  it('no repite el título y no muestra los accesos de paciente en esas pantallas', () => {
    expect(shell).toMatch(/\.nv-app\.nv-pro\.pn-panel:is\(\.nv-agenda-page,\.nv-fees-page\) \.nv-topbar-title \{ position:absolute;/);
    expect(showroom).toContain("'agenda', 'cobranzas'");
    expect(showroom).toContain("page === 'agenda' || page === 'cobranzas'");
  });

  it('fija el menú inferior y separa cada turno con su etiqueta', () => {
    expect(shell).toMatch(/\.nv-app\.nv-pro\.pn-panel \.nv-tabbar \{ position:fixed; z-index:35;/);
    expect(shell).toMatch(/padding-bottom:calc\(108px \+ env\(safe-area-inset-bottom\)\)/);
    expect(fase5).toMatch(/\.pn-panel \.p5-turn \{ display:flex; align-items:center; gap:10px; min-height:44px;/);
    expect(fase5).toMatch(/\.pn-panel \.p5-chip \{/);
    expect(fase5).toMatch(/min-height:44px; min-width:44px;/);
    expect(fase5).toMatch(/\.pn-panel \.p5-seg \{ flex-wrap:wrap; max-width:100%; min-width:0; \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-who b \{ overflow-wrap:break-word; word-break:normal; \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-table-wrap \{ display:none; \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-moves \{ display:flex; flex-direction:column;/);
  });
});
