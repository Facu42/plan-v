import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CountUp } from './CountUp';

describe('número que sube contando', () => {
  it('sin animar muestra siempre el valor final con su formato', () => {
    expect(renderToStaticMarkup(<CountUp value={2140} format={n => `${Math.round(n)} kcal`} />)).toBe('2140 kcal');
  });
  it('un valor en cero se muestra tal cual', () => {
    expect(renderToStaticMarkup(<CountUp value={0} format={n => String(n)} />)).toBe('0');
  });
});
