import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildNotices, NoticesSheet, resourceNotice } from './patient-notices';
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

  it('suma el aviso de un plan nuevo y nada más si no hay novedades', () => {
    const { items } = buildNotices({ messages: [], appointment: null } as never, null, now, { title: 'Tenés un plan nuevo', note: 'Empieza el 20 oct. Hasta entonces seguís con el actual.' });
    expect(items).toEqual([expect.objectContaining({ id: 'plan', page: 'plan', title: 'Tenés un plan nuevo' })]);
  });

  it('avisa de un recurso indicado sin leer con su título y lleva a Recursos', () => {
    const library = {
      assignments: [{ id: 'a1', patient_id: 'p', resource_id: 'r1', slug: 'leer-plan-semanal', assigned_at: '2026-10-09T10:00:00Z', read_at: null }],
      resources: [{ id: 'r1', slug: 'leer-plan-semanal', title: 'Cómo leer tu plan semanal' }],
      articles: [],
    } as never;
    const notice = resourceNotice(library);
    expect(notice).toEqual({ title: 'Tu nutricionista te indicó un recurso', note: '«Cómo leer tu plan semanal»', resource: 'leer-plan-semanal' });
    const { items } = buildNotices({ messages: [], appointment: null } as never, null, now, null, notice);
    expect(items).toEqual([expect.objectContaining({ id: 'resources', page: 'recursos', resource: 'leer-plan-semanal' })]);
  });

  it('cuenta varios recursos sin leer y calla cuando ya los leyó', () => {
    const row = (id: string, read_at: string | null) => ({ id, patient_id: 'p', resource_id: id, slug: id, assigned_at: '2026-10-09T10:00:00Z', read_at });
    expect(resourceNotice({ assignments: [row('a', null), row('b', null), row('c', '2026-10-09T11:00:00Z')], resources: [], articles: [] } as never))
      .toEqual({ title: 'Tu nutricionista te indicó 2 recursos', note: 'Están en Recursos, en «Indicados».' });
    expect(resourceNotice({ assignments: [row('c', '2026-10-09T11:00:00Z')], resources: [], articles: [] } as never)).toBeNull();
    expect(resourceNotice(null)).toBeNull();
  });

  it('avisa que la cuenta está archivada y que no puede escribir', () => {
    const patient = { messages: [], appointment: null, archived: true } as never;
    const { items } = buildNotices(patient, null, now);
    expect(items.map(item => item.id)).toEqual(['archived']);
    expect(items[0]).toMatchObject({ title: 'Tu cuenta está archivada', note: 'No podés enviar mensajes.', page: 'mensajes' });
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
