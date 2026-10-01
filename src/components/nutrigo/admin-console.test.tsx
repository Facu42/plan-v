import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdminConsole } from './AdminConsole';
import { isAdminPath } from './app-location';

describe('AdminConsole', () => {
  it('muestra la barra propia y verifica el acceso antes de mostrar el panel', () => {
    const html = renderToStaticMarkup(<AdminConsole darkMode={false} userName="Facundo" onSignOut={() => undefined} />);
    expect(html).toContain('Panel del servicio');
    expect(html).toContain('Facundo');
    expect(html).toContain('Cerrar sesión');
    expect(html).toContain('Estamos verificando tu acceso');
    expect(html).not.toContain('Pacientes');
  });

  it('ofrece el botón del tema y refleja el estado', () => {
    const claro = renderToStaticMarkup(<AdminConsole darkMode={false} onToggleTheme={() => undefined} />);
    expect(claro).toContain('Usar tema oscuro');
    expect(claro).not.toContain('nv-dark');
    const oscuro = renderToStaticMarkup(<AdminConsole darkMode onToggleTheme={() => undefined} />);
    expect(oscuro).toContain('Usar tema claro');
    expect(oscuro).toContain('nv-dark');
  });

  it('reconoce la ruta /admin', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/app')).toBe(false);
  });
});
