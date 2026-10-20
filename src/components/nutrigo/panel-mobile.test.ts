import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const shell = readFileSync(new URL('./panel-nutri-shell.css', import.meta.url), 'utf8');
const fase5 = readFileSync(new URL('./panel-fase5.css', import.meta.url), 'utf8');
const preview = readFileSync(new URL('./SubscriptionPreview.tsx', import.meta.url), 'utf8');
const showroom = readFileSync(new URL('./NutrigoShowroom.tsx', import.meta.url), 'utf8');
const mobile = fase5.slice(fase5.indexOf('@media (max-width:800px)'));
const phone = shell.slice(shell.indexOf('@media (max-width:799px)'));

describe('celular de cobranzas', () => {
  it('deja el menú inferior fijo y reserva espacio con el área segura', () => {
    expect(shell).toMatch(/\.nv-app\.nv-pro\.pn-panel \.nv-tabbar \{ position:fixed; z-index:35;/);
    expect(shell).toMatch(/padding-bottom:calc\(108px \+ env\(safe-area-inset-bottom\)\)/);
  });

  it('apila el débito y los movimientos, y no parte los nombres por letra', () => {
    expect(fase5).toMatch(/\.pn-panel \.p5-tx b,\.pn-panel \.p5-tx span,\.pn-panel \.p5-link \{ display:block; overflow-wrap:break-word; word-break:normal; \}/);
    expect(fase5).toMatch(/\.pn-panel \.p5-who b \{ overflow-wrap:break-word; word-break:normal; \}/);
    expect(mobile).toMatch(/\.pn-panel \.p5-debit \{ flex-direction:column; align-items:stretch; \}/);
    expect(mobile).toMatch(/\.pn-panel \.p5-table-wrap \{ display:none; \}/);
    expect(mobile).toMatch(/\.pn-panel \.p5-moves \{ display:flex; flex-direction:column;/);
    expect(mobile).toMatch(/\.pn-panel \.p5-seg \{ flex-wrap:wrap;/);
    expect(mobile).toMatch(/\.pn-panel \.p5-phone>\.p5-preview-cta \{ flex:none; width:100%; min-height:44px; \}/);
    expect(mobile).toMatch(/\.pn-panel \.p5-phone>div \.p5-preview-cta \{ flex:1 0 100%; width:auto; min-height:44px; \}/);
    expect(mobile).toMatch(/min-height:44px; min-width:44px;/);
  });

  it('en el celular el título queda en la barra y la sección activa es Más', () => {
    expect(shell).toMatch(/@media \(min-width:800px\) \{\n  \.nv-app\.nv-pro\.pn-panel:is\(\.nv-agenda-page,\.nv-fees-page\) \.nv-topbar-title \{ display:none; \}/);
    expect(phone).toMatch(/\.pn-panel:is\(\.nv-agenda-page,\.nv-fees-page\) \.p5-head h2 \{ display:none; \}/);
    expect(phone).toMatch(/\.nv-app\.nv-pro\.pn-panel \.nv-topbar-label-desktop \{ display:none; \}/);
    expect(phone).toMatch(/\.nv-app\.nv-pro\.pn-panel \.nv-topbar-label-mobile \{ display:inline; \}/);
    expect(preview).toContain("const title = screen === 'publica' ? 'Página pública' : 'Cobranzas'");
    expect(preview).toContain("const moreCurrent = screen.startsWith('cobranzas') || screen === 'publica'");
    expect(preview).not.toContain("tab.id === 'agenda'");
    expect(showroom).toContain("panelQuery.get('agenda') === 'publica'");
    expect(showroom).toContain("const moreCurrent = publicPage || moreSection");
  });
});
