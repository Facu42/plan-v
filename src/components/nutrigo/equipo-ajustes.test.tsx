import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PanelEquipo } from './PanelEquipo';
import { PanelAjustes } from './PanelAjustes';
import { panelNavGroups, panelNavCurrent } from './PanelNavigation';
import { isAllowedPage } from './app-location';

describe('Equipo y Ajustes v29', () => {
  it('ofrece rutas propias y conserva selección de enlaces anteriores', () => {
    const items = panelNavGroups([], 0, false).flatMap(g => g.items);
    expect(items.find(x => x.label === 'Ajustes')?.href).toBe('/crm/ajustes');
    expect(items.find(x => x.label === 'Equipo')?.href).toBe('/crm/equipo');
    expect(panelNavCurrent('/crm/ajustes', '/crm/desarrollo?modulo=configuracion')).toBe(true);
    expect(panelNavCurrent('/crm/equipo', '/crm/desarrollo?modulo=equipo')).toBe(true);
    for (const p of ['equipo', 'ajustes']) { expect(isAllowedPage('pro', p)).toBe(true); expect(isAllowedPage('patient', p)).toBe(false); }
  });
  it('muestra las pestañas de Equipo sin afirmar personas ni accesos antes de cargar', () => {
    const html = renderToStaticMarkup(<PanelEquipo/>);
    for (const label of ['Integrantes', 'Permisos', 'Registro de accesos', 'Invitar a alguien', 'Cargando equipo']) expect(html).toContain(label);
    expect(html).not.toContain('Verónica Trenti');
    expect(html).not.toContain('4 personas');
  });
  it('muestra Mi cuenta y cinco pestañas sin métricas del boceto', () => {
    const html = renderToStaticMarkup(<PanelAjustes onOpen={vi.fn()} appearance={<button>Tema oscuro</button>}/>);
    for (const label of ['Mi cuenta', 'Plantillas', 'Avisos automáticos', 'Seguridad', 'Integraciones', 'Datos del consultorio', 'Firma y marca', 'Título y matrícula', 'Tema oscuro']) expect(html).toContain(label);
    expect(html).not.toContain('Fundadora'); expect(html).not.toContain('48 pacientes');
  });
});
