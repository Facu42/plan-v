import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildNotices, NoticesSheet } from './patient-notices';
import { iconButtonAction, iconButtonLabel, mapIconButtons } from './icon-buttons';
import type { SourceNode } from './SourceView';

const node = (name: string, children: SourceNode[] = []): SourceNode => ({ tag: 'div', props: { 'data-name': name }, children });
const now = new Date('2026-10-09T12:00:00Z');

describe('avisos de la paciente', () => {
  it('lista mensajes sin leer, consulta por confirmar y cuota, nada más', () => {
    const patient = {
      messages: [{ id: 'm1', from: 'vero', sent_at: '2026-10-09T10:00:00Z', read_at: null }, { id: 'm2', from: 'vero', sent_at: '2026-10-09T10:05:00Z', read_at: null }],
      appointment: { when: 'Jueves 15 · 11:30', starts_at: '2026-10-15T14:30:00Z' },
    } as never;
    const { items, unreadMessages } = buildNotices(patient, 'Tu cuota vence el 10', now);
    expect(unreadMessages).toBe(2);
    expect(items.map(item => item.page)).toEqual(['mensajes', 'agenda', 'pagos']);
    expect(items[0].title).toBe('Tenés 2 mensajes sin leer');
  });

  it('sin novedades no inventa avisos', () => {
    const patient = { messages: [], appointment: { when: 'x', starts_at: '2026-10-15T14:30:00Z', patient_reply: 'attending' } } as never;
    expect(buildNotices(patient, null, now).items).toEqual([]);
    expect(renderToStaticMarkup(<NoticesSheet items={[]} onNavigate={() => undefined} onClose={() => undefined} />)).toContain('No tenés avisos nuevos.');
  });

  it('no pide confirmar una consulta que ya pasó', () => {
    const patient = { messages: [], appointment: { when: 'x', starts_at: '2026-10-01T14:30:00Z' } } as never;
    expect(buildNotices(patient, null, now).items).toEqual([]);
  });
});

describe('botones de solo ícono del archivo', () => {
  const bell = node('Button Icon', [node('Badge')]);
  const chat = node('Button Icon');
  const weightMore = node('Button More');
  const tree = node('Frame', [node('Header Menu', [chat, bell]), node('Widget Weight Data', [node('Header-Section', [weightMore])])]);
  const map = mapIconButtons(tree);

  it('el ícono con globo abre los avisos y el otro va a Mensajes', () => {
    expect(iconButtonAction(bell, map.get(bell))).toEqual({ kind: 'notices' });
    expect(iconButtonAction(chat, map.get(chat))).toEqual({ kind: 'page', page: 'mensajes' });
  });

  it('los «…» de cada tarjeta llevan a su pantalla, no al menú', () => {
    const action = iconButtonAction(weightMore, map.get(weightMore));
    expect(action).toEqual({ kind: 'page', page: 'progreso' });
    expect(iconButtonLabel(action)).toBe('Ver mi progreso');
  });

  it('un botón sin pantalla conocida conserva el menú', () => {
    expect(iconButtonAction(node('Button More'), undefined)).toEqual({ kind: 'menu' });
  });
});
