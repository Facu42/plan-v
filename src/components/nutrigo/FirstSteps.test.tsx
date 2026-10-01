import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FirstSteps } from './FirstSteps';

describe('primer uso de la nutricionista', () => {
  const html = renderToStaticMarkup(<FirstSteps onStart={() => undefined} />);

  it('muestra los tres pasos en orden', () => {
    const order = ['Creá tu primer paciente', 'Compartile el enlace', 'Armá su plan'].map((step) => html.indexOf(step));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('nombra los botones que de verdad existen en la app', () => {
    expect(html).toContain('Nuevo paciente');
    expect(html).toContain('WhatsApp');
    expect(html).toContain('Ir a Pacientes');
  });
});
