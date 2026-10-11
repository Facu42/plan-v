import { describe, expect, it } from 'vitest';
import { buildProNotices, markAllRead, markRead, unreadProNotices, type ProNoticeStorage } from './pro-notices';
import type { BoardRow } from './cobranzas-utils';

const memory = (): ProNoticeStorage & { store: Record<string, string> } => {
  const store: Record<string, string> = {};
  return { store, getItem: (key) => store[key] ?? null, setItem: (key, value) => { store[key] = value; } };
};
const now = new Date('2026-10-10T15:00:00Z');
const message = (id: string, from: 'vero' | 'patient', read_at: string | null = null) => ({ id, patient_id: 'ana', from, text: 'Hola', suggested_by_ai: false, sent_at: `2026-10-10T1${id}:00:00Z`, read_at });
const ana = (extra: object = {}) => ({ id: 'ana', name: 'Ana Ruiz', messages: [] as ReturnType<typeof message>[], appointment: null, ...extra });
const row = (patient_id: string, full_name: string, summary: Partial<BoardRow['summary']>): BoardRow => ({ patient: { patient_id, full_name } as BoardRow['patient'], summary: { pending_reports: 0, state: 'al_dia', owed: 0, ...summary } as BoardRow['summary'] });

describe('Avisos de la nutricionista', () => {
  it('suma un aviso por paciente con mensajes sin leer', () => {
    const items = buildProNotices({ patients: [ana({ messages: [message('1', 'patient'), message('2', 'patient'), message('3', 'vero')] })], board: [], now });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'messages', patientId: 'ana', page: 'mensajes', title: 'Ana Ruiz te escribió', detail: '2 mensajes sin leer' });
  });

  it('no avisa de mensajes ya leídos ni de los que mandó ella', () => {
    const items = buildProNotices({ patients: [ana({ messages: [message('1', 'patient', '2026-10-10T16:00:00Z'), message('3', 'vero')] })], board: [], now });
    expect(items).toEqual([]);
  });

  it('avisa cuando la paciente pide cambiar la consulta o la confirma', () => {
    const ask = buildProNotices({ patients: [ana({ appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', starts_at: '2026-10-15T17:30:00Z', patient_reply: 'needs_change' } })], board: [], now });
    expect(ask[0]).toMatchObject({ kind: 'appointment', title: 'Ana Ruiz pide cambiar la consulta', page: 'consultas' });
    const ok = buildProNotices({ patients: [ana({ appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', starts_at: '2026-10-15T17:30:00Z', patient_reply: 'attending' } })], board: [], now });
    expect(ok[0].title).toBe('Ana Ruiz confirmó la consulta');
    const none = buildProNotices({ patients: [ana({ appointment: { when: 'x', duration: 45, channel: 'video', starts_at: '2026-10-15T17:30:00Z' } })], board: [], now });
    expect(none).toEqual([]);
  });

  it('ignora respuestas de consultas que ya pasaron', () => {
    const items = buildProNotices({ patients: [ana({ appointment: { when: 'x', duration: 45, channel: 'video', starts_at: '2026-10-01T17:30:00Z', patient_reply: 'attending' } })], board: [], now });
    expect(items).toEqual([]);
  });

  it('avisa de pagos por confirmar y de cuotas vencidas', () => {
    const items = buildProNotices({ patients: [], board: [row('ana', 'Ana Ruiz', { pending_reports: 1 }), row('luz', 'Luz Paz', { state: 'debe', owed: 30000, debt_since: '2026-09-01' })], now });
    expect(items.map(item => [item.kind, item.title, item.page])).toEqual([
      ['payment', 'Ana Ruiz avisó un pago', 'cobranzas'],
      ['debt', 'Luz Paz tiene una cuota vencida', 'cobranzas'],
    ]);
  });

  it('un mensaje nuevo vuelve a mostrar el aviso aunque el anterior esté leído', () => {
    const storage = memory();
    const first = buildProNotices({ patients: [ana({ messages: [message('1', 'patient')] })], board: [], now });
    markRead(storage, first[0].id);
    expect(unreadProNotices(first, storage)).toEqual([]);
    const second = buildProNotices({ patients: [ana({ messages: [message('1', 'patient'), message('2', 'patient')] })], board: [], now });
    expect(unreadProNotices(second, storage)).toHaveLength(1);
  });

  it('marcar todas como leídas las apaga y sobrevive entre sesiones', () => {
    const storage = memory();
    const items = buildProNotices({ patients: [ana({ messages: [message('1', 'patient')] })], board: [row('luz', 'Luz Paz', { pending_reports: 2 })], now });
    expect(unreadProNotices(items, storage)).toHaveLength(2);
    markAllRead(storage, items);
    expect(unreadProNotices(items, storage)).toEqual([]);
  });

  it('sin almacenamiento todo queda sin leer y no falla', () => {
    const items = buildProNotices({ patients: [], board: [row('luz', 'Luz Paz', { pending_reports: 1 })], now });
    expect(() => markRead(null, items[0].id)).not.toThrow();
    expect(unreadProNotices(items, null)).toHaveLength(1);
  });
});
