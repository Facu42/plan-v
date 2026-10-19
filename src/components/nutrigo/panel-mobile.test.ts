import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const shell = readFileSync(new URL('./panel-nutri-shell.css', import.meta.url), 'utf8');
const fase5 = readFileSync(new URL('./panel-fase5.css', import.meta.url), 'utf8');
const mobile = fase5.slice(fase5.indexOf('@media (max-width:800px)'));

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
});
