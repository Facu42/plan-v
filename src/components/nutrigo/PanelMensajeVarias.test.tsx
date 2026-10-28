import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { PanelMensajeVarias } from './PanelMensajeVarias';

describe('PanelMensajeVarias', () => {
  it('dibuja el cajón del boceto con el texto de ejemplo y el aviso de {nombre}', () => {
    const html = renderToStaticMarkup(<PanelMensajeVarias pacientes={[{ id: 'a', name: 'Ana Gómez', has_account: true } as unknown as Patient]} ahora={new Date('2026-10-28T15:00:00Z')} onClose={() => undefined} />);
    expect(html).toContain('Mensaje a varias');
    expect(html).toContain('Le llega a cada una por separado, como un chat');
    expect(html).toContain('Todas las activas · 1');
    expect(html).toContain('¡Hola {nombre}! ');
    expect(html).toContain('se completa con el nombre de cada paciente');
    expect(html).toContain('>Enviar<');
  });
});
