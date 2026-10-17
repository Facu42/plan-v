import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ShowroomSecurity } from './ShowroomSecurity';

describe('Verificación en dos pasos (menú de cuenta)', () => {
  it('abre con título y explicación, antes de saber si ya está activada', () => {
    const html = renderToStaticMarkup(<ShowroomSecurity canDisable onClose={() => {}} />);
    expect(html).toContain('Verificación en dos pasos');
    expect(html).toContain('código de 6 cifras');
    expect(html).toContain('Un momento…');
    expect(html).not.toContain('Quitar');
  });
});
