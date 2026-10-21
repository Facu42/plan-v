import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PanelSoon } from './PanelSoon';

describe('Próximamente', () => {
  it('nombra Asistente IA, Centro de ayuda y Equipo', () => {
    for (const [id, title] of [['asistente-ia', 'Asistente IA'], ['ayuda', 'Centro de ayuda'], ['equipo', 'Equipo']] as const) {
      const html = renderToStaticMarkup(<PanelSoon moduleId={id} />);
      expect(html).toContain(title);
      expect(html).toContain('Próximamente');
      expect(html).toContain('Volver al inicio');
    }
  });
});
