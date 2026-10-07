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

  it('todo el movimiento se apaga con «reducir movimiento»', () => {
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\n\}/)?.[0] ?? '';
    expect(reduced).toMatch(/animation:\s*none/);
    expect(reduced).toMatch(/transition:\s*none/);
  });
});
