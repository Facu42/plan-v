import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { PanelFichaChat, enviadosDe } from './PanelFichaChat';

const mensaje = (id: string, from: 'vero' | 'patient', sent_at: string, text: string) => ({ id, from, sent_at, text });
const paciente = {
  id: 'pat-1', name: 'Sofía Gómez', initials: 'SG',
  messages: [
    mensaje('m2', 'vero', '2026-10-27T19:20:00-03:00', 'Perfecto, Sofía.'),
    mensaje('m1', 'patient', '2026-10-27T19:02:00-03:00', 'Mañana te llevo los análisis.'),
    mensaje('m0', 'patient', '', 'Borrador sin enviar'),
  ],
} as unknown as Patient;

describe('PanelFichaChat', () => {
  it('ordena del más viejo al más nuevo y deja afuera lo que no se envió', () => {
    expect(enviadosDe(paciente).map(m => m.id)).toEqual(['m1', 'm2']);
  });

  it('dibuja el cajón del boceto: globos entrantes y salientes, y cerrado no recibe foco', () => {
    const cerrado = renderToStaticMarkup(<PanelFichaChat patient={paciente} open={false} onClose={() => undefined} />);
    const abierto = renderToStaticMarkup(<PanelFichaChat patient={paciente} open onClose={() => undefined} />);

    expect(cerrado).toContain('class="chatd"');
    expect(cerrado).toContain('inert');
    expect(abierto).toContain('class="chatd open"');
    expect(abierto).toContain('bub in');
    expect(abierto).toContain('bub out');
    expect(abierto.indexOf('Mañana te llevo')).toBeLessThan(abierto.indexOf('Perfecto, Sofía.'));
  });
});
