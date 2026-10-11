import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/features/nutrigo/nutrigo.css', 'utf8');

describe('marco de celular fluido', () => {
  it('la barra superior del archivo (390 px fijos) ocupa todo el ancho entre 391 y 799 px', () => {
    // En el archivo la Navbar mide w-[390px]: sin esta regla queda cortada en pantallas más anchas que un celular.
    expect(css).toMatch(/@media\s*\(max-width:\s*799px\)\s*\{[^}]*\.mcp-nutrigo div\[data-name="Navbar"\]\s*\{[^}]*width:\s*100%/);
  });
});

describe('nombre largo en el perfil del encabezado', () => {
  it('el nombre de la paciente se corta con puntos suspensivos en vez de empujar la campana', () => {
    expect(css).toMatch(/\.mcp-nutrigo \[data-name="User Profile"\] p\s*\{[^}]*text-overflow:\s*ellipsis/);
  });
});
