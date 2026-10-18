import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const showroom = readFileSync(new URL('./NutrigoShowroom.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./pro-shell.css', import.meta.url), 'utf8');

describe('barra del consultorio', () => {
  it('Inicio no repite el título grande de la página', () => {
    expect(showroom).toContain("const showHeading = page === 'inicio' && role !== 'pro'");
    expect(showroom).not.toContain("const showHeading = page === 'inicio';");
  });

  it('la barra de Inicio queda en el mismo lugar que el resto y muestra el título', () => {
    expect(css).toContain('.nv-app.nv-pro.nv-home:has(.pw-work) .nv-topbar');
    expect(css).toContain('position: relative !important');
    expect(css).toContain('.nv-app.nv-pro.nv-home .nv-topbar .nv-topbar-title');
    expect(css).toMatch(/\.nv-app\.nv-pro\.nv-home \.nv-topbar \.nv-topbar-title \{[\s\S]*display: block !important/);
    expect(css).toContain('.nv-app.nv-pro .nv-desktop-account { display: contents !important; }');
  });
});
