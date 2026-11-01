import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AjustesSeguridad } from './PanelAjustesVistas';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ session: null, requestPasswordReset: async () => ({}) }),
}));

describe('Ajustes · verificación en dos pasos', () => {
  it('muestra el interruptor para que la nutri active o quite el código', () => {
    const html = renderToStaticMarkup(<AjustesSeguridad onOpen={vi.fn()} onSecurity={vi.fn()} />);
    expect(html).toContain('Verificación en dos pasos');
    expect(html).toContain('Dos pasos para vos');
    expect(html).toContain('App de códigos');
    expect(html).toContain('aria-label="Dos pasos para vos"');
  });
});
