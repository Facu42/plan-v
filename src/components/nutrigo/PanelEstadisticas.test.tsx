import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { comparado, estadisticasCsv, PanelEstadisticasVista, tasaAusencias } from './PanelEstadisticas';
import { avisoDeInvitacion } from './PanelEquipo';
import { codigoDelEnlace } from './TeamWorkspace';
import type { EstadisticasConsultorio } from '../../types/estadisticas';

const mes = (m: string, rotulo: string, extra: Partial<EstadisticasConsultorio['meses'][number]> = {}) => ({ mes: m, rotulo, consultas: 0, ausencias: 0, canceladas: 0, nuevas: 0, ingresos: 0, ...extra });
const datos: EstadisticasConsultorio = {
  hoy: '2026-11-05',
  meses: [mes('2026-10', 'oct', { consultas: 8, ausencias: 2, nuevas: 3, ingresos: 240000 }), mes('2026-11', 'nov', { consultas: 3, ausencias: 1, canceladas: 1, nuevas: 1, ingresos: 90000 })],
  total: { mes: 'total', rotulo: 'Total', consultas: 11, ausencias: 3, canceladas: 1, nuevas: 4, ingresos: 330000, primeraVez: 4, seguimiento: 7, presencial: 6, online: 5, pacientesAtendidas: 9 },
  porSede: [{ id: 'a', nombre: 'Centro', detalle: 'Presencial · Av. 1', consultas: 6, ausencias: 2, online: 0, presencial: 6 }, { id: 'b', nombre: 'Online', detalle: 'Online', consultas: 5, ausencias: 1, online: 5, presencial: 0 }],
  masAusencias: [{ id: 'p1', nombre: 'Bea Gómez', ausencias: 2, ultima: '2026-11-02' }],
  sedesInstaladas: true,
};

describe('Estadísticas del consultorio', () => {
  it('muestra todos los bloques con las clases de Cobranzas del boceto', () => {
    const html = renderToStaticMarkup(<PanelEstadisticasVista datos={datos} error="" cargando={false} onReintentar={() => {}} onAbrir={() => {}} onSedes={() => {}} />);
    for (const texto of ['Consultas en noviembre', 'Ausencias', '25%', 'Pacientes nuevas', 'Consultas por mes', 'Mes a mes', 'Ingresos de los últimos 2 meses', 'Por sede', 'Centro', 'Presencial · Av. 1', 'Primera vez y seguimiento', 'Presencial y online', 'Las que más faltaron', 'Bea Gómez', 'Ver ficha'])
      expect(html).toContain(texto);
    for (const clase of ['class="fx"', 'fxtiles cob4', 'fxp fxtile', 'fxtb', 'fxdk', 'fxr', 'fxstk', 'fxcols']) expect(html).toContain(clase);
  });

  it('sin datos no oculta la pantalla: dice que carga o el error con Reintentar', () => {
    expect(renderToStaticMarkup(<PanelEstadisticasVista datos={null} error="" cargando onReintentar={() => {}} onAbrir={() => {}} onSedes={() => {}} />)).toContain('Cargando estadísticas');
    expect(renderToStaticMarkup(<PanelEstadisticasVista datos={null} error="Sin conexión" cargando={false} onReintentar={() => {}} onAbrir={() => {}} onSedes={() => {}} />)).toContain('Reintentar');
  });

  it('calcula la tasa de ausencias, la comparación y la planilla', () => {
    expect(tasaAusencias({ consultas: 3, ausencias: 1 })).toBe(25);
    expect(tasaAusencias({ consultas: 0, ausencias: 0 })).toBe(0);
    expect(comparado(5, 3)).toBe('+2 contra el mes pasado');
    expect(comparado(1, 3)).toBe('−2 contra el mes pasado');
    expect(comparado(2, 2)).toBe('igual que el mes pasado');
    expect(estadisticasCsv(datos).split('\n')[2]).toBe('"noviembre 2026","3","1","25","1","1","90000"');
  });
});

describe('Secretaria', () => {
  it('explica qué pasó con la invitación', () => {
    expect(avisoDeInvitacion('s@m.com', { mail: 'enviado', expires_in_days: 7, link: 'https://x' })).toContain('Le mandamos un mail a s@m.com');
    expect(avisoDeInvitacion('s@m.com', { mail: 'apagado', expires_in_days: 7, link: 'https://x' })).toContain('Copiá el enlace');
    expect(avisoDeInvitacion('s@m.com', { mail: 'fallo', expires_in_days: 7, link: null })).toContain('No pudimos mandar el mail. Compartí el código');
  });

  it('lee el código del enlace solo si tiene la forma de un código', () => {
    const codigo = 'a'.repeat(43);
    expect(codigoDelEnlace(`?codigo=${codigo}`)).toBe(codigo);
    expect(codigoDelEnlace('?codigo=<script>')).toBe('');
    expect(codigoDelEnlace('')).toBe('');
  });
});
