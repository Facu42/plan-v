import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PanelMensajes } from './PanelMensajes';
import type { ShowroomPatient } from './showroom-model';

const mensaje = (id: string, from: 'vero' | 'patient', text: string, sent_at: string) => ({ id, from, text, sent_at, delivered_at: null, read_at: null });
const paciente = (id: string, name: string, messages: ReturnType<typeof mensaje>[]) => ({
  id, name, initials: name.slice(0, 2).toUpperCase(), goal: 'Comer más regular', adherence: 81, hydration: 5, waterGoal: 8, appointment: null, messages,
}) as unknown as ShowroomPatient;

const julia = paciente('j', 'Julia Sosa', [mensaje('1', 'patient', 'Hola Vero', '2026-10-28T10:00:00Z'), mensaje('2', 'vero', 'Hola Julia', '2026-10-28T11:00:00Z')]);
const paula = paciente('p', 'Paula Acosta', [mensaje('3', 'patient', 'Me costó la semana', '2026-10-28T09:00:00Z')]);
const props = { pacientes: [julia, paula], seleccionada: 'j', sinLeerRemoto: null, pedidoNuevo: 0, onSelect: () => undefined, onFicha: () => undefined, onAgenda: () => undefined, onPlan: () => undefined };

describe('Mensajes del panel', () => {
  it('arma la bandeja con las clases del boceto: lista, chat y datos de la paciente', () => {
    const html = renderToStaticMarkup(<PanelMensajes vista={0} {...props} />);
    for (const clase of ['id="s-mensajes"', 'id="mwrap"', 'fxp mlist', 'fxp mchatp', 'c mside', 'fxp mctx', 'class="mcomp"', 'class="msug"']) expect(html).toContain(clase);
    expect(html).toContain('Julia Sosa');
    expect(html).toContain('Vos: Hola Julia');
    expect(html).toContain('Escribile a Julia…');
    expect(html).toContain('Le llega a su app. Si no la abre en 2 h, le avisa por mail.');
  });
  it('muestra el cuarto filtro del boceto y marca la conversación abierta', () => {
    const html = renderToStaticMarkup(<PanelMensajes vista={0} {...props} />);
    for (const texto of ['Todas', 'Sin leer', 'Destacadas', 'Archivadas']) expect(html).toContain(texto);
    expect(html).toMatch(/class="mcv on/);
  });
  it('no ofrece grabar audio ni respuestas guardadas mientras no existan', () => {
    const html = renderToStaticMarkup(<PanelMensajes vista={0} {...props} />);
    expect(html).not.toContain('Grabar audio');
    expect(html).toContain('Todavía no hay respuestas guardadas.');
  });
  it('las otras dos solapas dicen qué falta en vez de mostrar datos inventados', () => {
    expect(renderToStaticMarkup(<PanelMensajes vista={1} {...props} />)).toContain('Todavía no se pueden guardar respuestas');
    expect(renderToStaticMarkup(<PanelMensajes vista={2} {...props} />)).toContain('se prenden y editan en Ajustes');
  });
});
