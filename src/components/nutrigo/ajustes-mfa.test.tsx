import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { email: 'ana@consultorio.test' } }, requestPasswordReset: vi.fn() }),
}));
vi.mock('./AjustesAccount', () => ({
  useDosPasos: () => ({ mfa: 'Apagada', error: '' }),
  useAvisosProfesional: () => ({ prefs: null, error: '', status: '', busy: false, toggle: vi.fn(), retry: vi.fn() }),
}));

import { AjustesSeguridad } from './PanelAjustesVistas';

describe('Ajustes · verificación en dos pasos', () => {
  it('el interruptor de la nutricionista abre la alta y se puede apagar', () => {
    const html = renderToStaticMarkup(<AjustesSeguridad onOpen={() => undefined} onSecurity={() => undefined} />);
    expect(html).toContain('Verificación en dos pasos');
    expect(html).toContain('Apagada');
    const personal = html.slice(html.indexOf('aria-label="Dos pasos para vos"') - 80, html.indexOf('aria-label="Dos pasos para vos"') + 80);
    expect(personal).toContain('aria-checked="false"');
    expect(personal).not.toContain('disabled');
    expect(html).toContain('Abre la pantalla para configurarla.');
  });

  it('sin la pantalla de alta el interruptor no se puede usar', () => {
    const html = renderToStaticMarkup(<AjustesSeguridad onOpen={() => undefined} />);
    const personal = html.slice(html.indexOf('aria-label="Dos pasos para vos"') - 40, html.indexOf('aria-label="Dos pasos para vos"') + 90);
    expect(personal).toContain('disabled');
  });
});
