import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import dashboard from './source/12-792.json';
import { findSource, nodeName, type SourceNode } from './SourceView';
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

  it('con el código del archivo, el menú es el «Menu Nav» original (íconos, activo y submenú) en español', () => {
    const menuNav = findSource(dashboard as SourceNode, node => nodeName(node) === 'Menu Nav')!;
    const html = render({ menuNav });
    expect(html).toContain('data-name="Menu Nav"');
    // Mismos <img> de íconos del archivo y su fondo verde activo (Dashboard).
    expect(html).toMatch(/src="[^"]*assets\/[^"]+\.svg/);
    expect(html).toContain('bg-[#c2e66e]');
    for (const label of ['Inicio', 'Agenda', 'Mensajes', 'Menú', 'Plan', 'Diario', 'Progreso', 'Ejercicio', 'Recursos']) expect(html).toContain(label);
    expect(html).not.toMatch(/Dashboard|Calendar|Healthy Menu|Food Diary/);
    // Dentro del envoltorio que trae los estilos del archivo.
    expect(html).toMatch(/class="[^"]*mcp-nutrigo[^"]*"/);
  });
});
