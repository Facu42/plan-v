import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PanelSoon } from './PanelSoon';

describe('Próximamente', () => {
  it('nombra Asistente IA y Centro de ayuda', () => {
    for (const [id, title] of [['asistente-ia', 'Asistente IA'], ['ayuda', 'Centro de ayuda']] as const) {
      const html = renderToStaticMarkup(<PanelSoon moduleId={id} />);
      expect(html).toContain(title);
      expect(html).toContain('Próximamente');
      expect(html).toContain('Volver al inicio');
    }
  });
  it('ya no presenta Equipo como pantalla pendiente', () => {
    const html = renderToStaticMarkup(<PanelSoon moduleId="equipo" />);
    expect(html).toContain('Esta sección');
    expect(html).not.toContain('Equipo');
  });
});
