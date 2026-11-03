import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FirstSteps } from './FirstSteps';

describe('primer uso de la nutricionista', () => {
  const html = renderToStaticMarkup(<FirstSteps onStart={() => undefined} onExplore={() => undefined} />);

  it('muestra los seis pasos en orden, con las piezas del panel', () => {
    const pasos = ['datos de tu consultorio', 'horarios de atención', 'página de reservas', 'primera paciente', 'Invitala a la app', 'Armá su plan'];
    const orden = pasos.map(paso => html.indexOf(paso));
    expect(orden.every(indice => indice > -1)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(html).toContain('class="fxp');
    expect(html).toContain('fxb');
  });

  it('nombra los botones que de verdad existen en la app', () => {
    expect(html).toContain('copiar el enlace');
    expect(html).not.toContain('WhatsApp');
    expect(html).toContain('Crear mi primera paciente');
    expect(html).toContain('Explorar consultorio');
    expect(html).toContain('disabled');
  });

  it('con el estado conocido tilda lo hecho y cuenta el avance', () => {
    const listo = renderToStaticMarkup(<FirstSteps onStart={() => undefined} onExplore={() => undefined} onOpen={() => undefined} estado={{ datos: true, horarios: false, pagina: false }} />);
    expect(listo).toContain('1 de 4 listos');
    expect(listo).toContain('(hecho)');
  });

  it('habilita invitación y plan con una paciente, sin repetir el punto del nombre', () => {
    const lista = renderToStaticMarkup(<FirstSteps patientName="Sofi R." onStart={() => undefined} onExplore={() => undefined} onInvite={() => undefined} onPlan={() => undefined} />);
    expect(lista).toContain('Abrí la invitación de Sofi R.');
    expect(lista).toContain('Abrí el plan de Sofi R.');
    expect(lista).not.toContain('R..');
    expect(lista).toContain('Crear otra paciente');
  });
});
