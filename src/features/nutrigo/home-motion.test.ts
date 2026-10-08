import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/features/nutrigo/home-motion.css', 'utf8');
const home = readFileSync('src/features/nutrigo/screens/Home.tsx', 'utf8');

describe('movimiento de las tarjetas de Inicio', () => {
  it('Inicio carga la hoja de movimiento', () => {
    expect(home).toContain("import '../home-motion.css'");
  });

  it.each(['Card Statistic - Dashboard', 'Widget Weight Data', 'Widget Calories Intake', 'Card Recommended Menu', 'Card Recommended Exercise'])(
    'la tarjeta «%s» se levanta al pasar el mouse (solo con puntero fino)', name => {
      const hover = css.match(/@media\s*\(hover:\s*hover\)[\s\S]*?\n\}/)?.[0] ?? '';
      expect(hover).toContain(`[data-name="${name}"]:hover`);
      expect(hover).toMatch(/translateY\(-\d+px\)/);
    });

  it('las tarjetas entran con un movimiento escalonado', () => {
    expect(css).toMatch(/@keyframes mcp-rise/);
    expect(css).toMatch(/animation-delay/);
  });

  it('todo el movimiento vive dentro de «sin preferencia de reducir movimiento»', () => {
    // Fuera de ese bloque no puede quedar ninguna regla: así «reducir movimiento» apaga todo sin pelear especificidad.
    const [before, inside] = css.split('@media (prefers-reduced-motion: no-preference)');
    expect(inside).toBeDefined();
    expect(before.replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('');
    expect(inside).toMatch(/animation:\s*mcp-rise/);
    expect(css).not.toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
