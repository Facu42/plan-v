import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./motion.css', import.meta.url), 'utf8');
const showroom = readFileSync(new URL('./NutrigoShowroom.tsx', import.meta.url), 'utf8');

// Quita los bloques @media con "no-preference": lo que queda afuera se ve siempre.
function outsideNoPreference(source: string) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const start = source.indexOf('@media (prefers-reduced-motion: no-preference)', i);
    if (start === -1) { out += source.slice(i); break; }
    out += source.slice(i, start);
    let depth = 0;
    let j = source.indexOf('{', start);
    for (; j < source.length; j++) {
      if (source[j] === '{') depth++;
      if (source[j] === '}' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}

describe('movimiento', () => {
  it('se carga después del resto de los estilos de la app', () => {
    const imports = [...showroom.matchAll(/^import '\.\/([\w-]+\.css)';$/gm)].map((m) => m[1]);
    expect(imports[imports.length - 1]).toBe('motion.css');
  });

  it('cada pantalla vuelve a entrar aunque comparta bloques con la anterior', () => {
    expect(showroom).toMatch(/<main key=\{`\$\{role\}:\$\{page\}:\$\{selected\?\.id \?\? ''\}`\} id="nv-main"/);
  });

  it('nada se mueve para quien pidió reducir movimiento', () => {
    const always = outsideNoPreference(css.replace(/\/\*[\s\S]*?\*\//g, ''));
    expect(always).not.toMatch(/\banimation(-name)?\s*:/);
    expect(always).not.toMatch(/\btransition(-property)?\s*:/);
  });

  it('las duraciones quedan entre 150 y 250 ms', () => {
    const durations = [...css.matchAll(/--nv-motion-\w+:\s*(\d+)ms/g)].map((m) => Number(m[1]));
    expect(durations.length).toBeGreaterThan(0);
    durations.forEach((ms) => { expect(ms).toBeGreaterThanOrEqual(150); expect(ms).toBeLessThanOrEqual(250); });
    expect(css).not.toMatch(/\d+(\.\d+)?s\b(?!\w)/);
  });

  it('las entradas no dejan nada corrido al terminar', () => {
    const entries = [...css.matchAll(/animation:[^;]+;/g)].map((m) => m[0]);
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((rule) => expect(rule).toMatch(/backwards/));
  });
});
