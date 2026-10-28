import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { PanelFichaChat, enviadosDe, sugerenciaDe } from './PanelFichaChat';

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

  it('ofrece la respuesta que dejó el copiloto solo si es un mensaje y no se descartó', () => {
    const brief = { suggested_action: 'mensaje', up_next_title: null, up_next_body: null, draft_message: ' Hola, ¿cómo vas? ', source_ids: [], adherence_why: '' };

    expect(sugerenciaDe({ brief, briefDismissed: false } as unknown as Patient)).toBe('Hola, ¿cómo vas?');
    expect(sugerenciaDe({ brief, briefDismissed: true } as unknown as Patient)).toBeNull();
    expect(sugerenciaDe({ brief: { ...brief, suggested_action: 'turno' } } as unknown as Patient)).toBeNull();
    expect(sugerenciaDe({ brief: null } as unknown as Patient)).toBeNull();
  });

  it('muestra Usar con la sugerencia y Pedir una cuando no hay', () => {
    const brief = { suggested_action: 'mensaje', up_next_title: null, up_next_body: null, draft_message: 'Hola', source_ids: [], adherence_why: '' };
    const con = renderToStaticMarkup(<PanelFichaChat patient={{ ...paciente, brief } as unknown as Patient} open onClose={() => undefined} />);
    const sin = renderToStaticMarkup(<PanelFichaChat patient={paciente} open onClose={() => undefined} />);

    expect(con).toContain('Respuesta sugerida');
    expect(con).toContain('>Usar<');
    expect(sin).toContain('Sin respuesta sugerida por ahora.');
    expect(sin).toContain('>Pedir una<');
  });
});
