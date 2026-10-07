import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PatientMenuSheet } from './PatientMenuSheet';

const render = (props: Partial<Parameters<typeof PatientMenuSheet>[0]> = {}) =>
  renderToStaticMarkup(<PatientMenuSheet patientName="Sofía R." onNavigate={vi.fn()} onClose={vi.fn()} {...props} />);

describe('menú de la paciente', () => {
  it('lista las diez secciones del archivo y las dos de la cuenta, en español', () => {
    const html = render();
    for (const label of ['Inicio', 'Agenda', 'Mensajes', 'Menú', 'Plan', 'Compras', 'Diario', 'Progreso', 'Ejercicio', 'Recursos', 'Pagos', 'Mi ficha y permisos']) {
      expect(html).toContain(`>${label}<`);
    }
    expect(html).toContain('aria-label="Menú"');
    expect(html).not.toMatch(/Dashboard|Calendar|Healthy Menu/);
  });

  it('muestra el perfil y solo ofrece cerrar sesión si hay con qué', () => {
    expect(render()).toContain('Sofía R.');
    expect(render()).not.toContain('Cerrar sesión');
    expect(render({ onSignOut: vi.fn() })).toContain('Cerrar sesión');
  });

  it('marca los mensajes sin leer y el aviso de cuota junto a Pagos', () => {
    const html = render({ unread: 3, feeNotice: 'Tenés una cuota pendiente de $ 30.000' });
    expect(html).toContain('aria-label="3 sin leer"');
    expect(html).toContain('Tenés una cuota pendiente de $ 30.000');
    expect(render()).not.toContain('sin leer');
  });
});
