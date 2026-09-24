import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PLAN_V_PALETTE } from './brand';
import { Mark } from './components/shared/Icon';

describe('identidad visual de Plan V', () => {
  it('expone la paleta principal tomada del isotipo oficial', () => {
    expect(PLAN_V_PALETTE).toEqual({
      forest: '#083A30',
      green: '#23955D',
      leaf: '#62AA66',
      gold: '#F9B343',
      coral: '#F87D6D',
      orange: '#F86648',
      apricot: '#F5A067',
      cream: '#F9F6EE',
    });
  });

  it('renderiza el isotipo oficial como marca compartida', () => {
    const html = renderToStaticMarkup(<Mark />);

    expect(html).toContain('<img');
    expect(html).toContain('Logo Plan V Nutrición');
    expect(html).not.toContain('<span>V</span>');
  });
});
