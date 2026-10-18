import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const showroom = readFileSync(new URL('./NutrigoShowroom.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./pro-shell.css', import.meta.url), 'utf8');

describe('barra del consultorio', () => {
  it('Inicio no repite el título grande de la página', () => {
    expect(showroom).toContain("const showHeading = page === 'inicio' && role !== 'pro'");
    expect(showroom).not.toContain("const showHeading = page === 'inicio';");
  });

  it('el buscador ocupa la barra y la ficha no deja una columna fija a la derecha', () => {
    expect(showroom).toContain('<ProCommandBar');
    expect(showroom).not.toContain('<ProRail');
    expect(css).toContain('Plus Jakarta Sans');
    expect(css).toContain('.nv-app.nv-pro .pv-sheet-grid');
    expect(css).toContain('grid-template-columns: minmax(0, 1fr) !important');
  });
});
