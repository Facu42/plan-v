import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PanelEquipo } from './PanelEquipo';
import { PanelAjustes } from './PanelAjustes';
import { AjustesAvisos, AjustesPlantillas } from './PanelAjustesVistas';
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
    for (const label of ['Integrantes', 'Permisos', 'Registro de accesos', 'Invitar a alguien', 'Cargando equipo', 'Último ingreso', 'Dos pasos', 'Estado']) expect(html).toContain(label);
    expect(html).not.toContain('Verónica Trenti');
    expect(html).not.toContain('4 personas');
  });
  it('muestra Mi cuenta y cinco pestañas sin métricas del boceto', () => {
    const html = renderToStaticMarkup(<PanelAjustes onOpen={vi.fn()}/>);
    for (const label of ['Mi cuenta', 'Plantillas', 'Avisos automáticos', 'Seguridad', 'Integraciones', 'Datos del consultorio', 'Firma y marca', 'Título y matrícula', 'Tema oscuro']) expect(html).toContain(label);
    expect(html).not.toContain('Fundadora'); expect(html).not.toContain('48 pacientes');
  });
  it('arma Mi cuenta con los bloques del boceto y sin datos inventados', () => {
    const html = renderToStaticMarkup(<PanelAjustes onOpen={vi.fn()}/>);
    for (const label of ['Obras sociales y reservas', 'Tu servicio de Nutridash', 'Apariencia', 'Idioma y horario', 'Avisos para vos', 'Tus datos', 'Sin completar', 'role="switch"', 'class="fx"']) expect(html).toContain(label);
    for (const falso of ['MN 4521', '27-28.456.912-4', 'Av. Cabildo', 'OSDE']) expect(html).not.toContain(falso);
  });
  const plantillas = [
    { id: 'c0000000-0000-4000-8000-000000000001', kind: 'Formulario' as const, name: 'Control de embarazo', when_text: 'Antes de cada turno' as const, questions: ['¿Cómo dormiste?', '¿Náuseas?'], updated_at: '' },
    { id: 'c0000000-0000-4000-8000-000000000002', kind: 'Certificado' as const, name: 'Constancia', when_text: 'Se manda desde la ficha' as const, text: 'Certifico que {nombre} asistió el {fecha}.', updated_at: '' },
  ];
  const nada = vi.fn();
  it('muestra las plantillas guardadas con las piezas del boceto y sin usos inventados', () => {
    const html = renderToStaticMarkup(<AjustesPlantillas marca={{ name: 'Consultorio X', contact: '', logo: '', license: 'MN 9' }} plantillas={plantillas} error="" onNueva={nada} onEditar={nada} onCuando={nada} onReintentar={nada}/>);
    for (const parte of ['ajtps', 'Control de embarazo', 'Constancia', 'ajq', '¿Cómo dormiste?', 'Formularios', 'Certificados', 'Vista de la paciente', 'Cuándo se usa', 'Variables']) expect(html).toContain(parte);
    expect(html).not.toContain('88%'); expect(html).not.toContain('disabled=""><svg');
    const cert = renderToStaticMarkup(<AjustesPlantillas marca={{ name: 'Consultorio X', contact: '', logo: '', license: 'MN 9', signature: 'data:image/png;base64,AAAA' }} plantillas={[plantillas[1]]} error="" onNueva={nada} onEditar={nada} onCuando={nada} onReintentar={nada}/>);
    for (const parte of ['ajcert', 'ajch', 'Consultorio X', 'MN 9', '<u>nombre</u>', 'ajcf', 'alt="Tu firma"']) expect(cert).toContain(parte);
  });
  it('arma Avisos con el estado guardado de cada aviso y deja todo apagado si no hay nada', () => {
    const vacio = renderToStaticMarkup(<AjustesAvisos avisos={[]} error="" irAIntegraciones={nada} onGuardar={nada} onEditar={nada} onReintentar={nada}/>);
    expect(vacio).toContain('0 de 8 prendidos'); expect(vacio).toContain('Apagado'); expect(vacio).toContain('Reglas de regreso');
    const aviso = { key: 'turno_recordatorio' as const, enabled: true, when_text: '48 h antes', message: 'Hola {nombre}, te espero.', updated_at: '' };
    const con = renderToStaticMarkup(<AjustesAvisos avisos={[aviso]} error="" irAIntegraciones={nada} onGuardar={nada} onEditar={nada} onReintentar={nada}/>);
    expect(con).toContain('1 de 8 prendidos'); expect(con).toContain('48 h antes'); expect(con).toContain('Prendido'); expect(con).toContain('Hola Sofía, te espero.');
  });
});
