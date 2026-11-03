import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const carpeta = new URL('./', import.meta.url);

describe('cajones laterales del panel', () => {
  const cajones = readdirSync(carpeta).filter(nombre => nombre.endsWith('.tsx') && !nombre.endsWith('.test.tsx'))
    .map(nombre => [nombre, readFileSync(new URL(nombre, carpeta), 'utf8')] as const)
    .filter(([, fuente]) => fuente.includes('id="actw"'));

  it('encuentra los cajones del panel', () => {
    expect(cajones.length).toBeGreaterThanOrEqual(10);
  });

  // Los que ya cierran con Escape por su cuenta quedan anotados; los demás usan el foco compartido (teclado adentro y Escape).
  const PROPIOS = new Set(['PanelSeguimiento.tsx', 'PanelBiblioteca.tsx', 'HelpCenter.tsx', 'PanelAlimentos.tsx']);
  it('todo cajón mantiene el teclado adentro y se cierra con Escape', () => {
    const sin = cajones.filter(([nombre, fuente]) => !PROPIOS.has(nombre) && !fuente.includes('useModalFocus')).map(([nombre]) => nombre);
    expect(sin).toEqual([]);
  });

  it('los propios siguen cerrando con Escape', () => {
    for (const [nombre, fuente] of cajones) if (PROPIOS.has(nombre)) expect(fuente, nombre).toContain('Escape');
  });
});
