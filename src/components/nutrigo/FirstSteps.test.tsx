import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FirstSteps } from './FirstSteps';

describe('primer uso de la nutricionista', () => {
  const html = renderToStaticMarkup(<FirstSteps onStart={() => undefined} onExplore={() => undefined} />);

  it('muestra los tres pasos en orden', () => {
    const order = ['Crear paciente', 'Compartir invitación', 'Armar su plan'].map((step) => html.indexOf(step));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('nombra los botones que de verdad existen en la app', () => {
    expect(html).toContain('WhatsApp');
    expect(html).toContain('Crear mi primer paciente');
    expect(html).toContain('Explorar consultorio');
    expect(html).toContain('disabled');
  });

  it('habilita invitación y plan cuando existen las acciones para un paciente', () => {
    const ready = renderToStaticMarkup(<FirstSteps patientName="Sofi" onStart={() => undefined} onExplore={() => undefined} onInvite={() => undefined} onPlan={() => undefined} />);
    expect(ready).not.toContain('disabled');
    expect(ready).toContain('Abrí la invitación de Sofi.');
    expect(ready).toContain('Abrí el plan de Sofi.');
  });
});
