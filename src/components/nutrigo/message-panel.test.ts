import { describe, expect, it } from 'vitest';
import { dayDividerLabel, extractLinks, formatBytes, lastSeenAt, listStamp, sharedFiles } from './message-panel';

const msg = (id: string, text: string, extra: object = {}) => ({ id, text, from: 'patient' as const, sent_at: '2026-09-10T15:00:00Z', ...extra });

describe('panel de Mensajes con datos reales', () => {
  it('extrae enlaces http(s) sin puntuación final ni duplicados, del más nuevo al más viejo', () => {
    const links = extractLinks([
      msg('a', 'Guía: https://example.org/a. Y otra www.example.com/b,'),
      msg('b', 'De nuevo https://example.org/a y javascript:alert(1)'),
    ]);
    expect(links.map((l) => l.href)).toEqual(['https://example.org/a', 'https://www.example.com/b']);
    expect(links[1].label).toBe('www.example.com/b');
  });
  it('separa imágenes y documentos y omite los adjuntos que ya no están disponibles', () => {
    const image = { asset_id: '1', filename: 'a.png', mime: 'image/png', byte_size: 10, kind: 'image' as const };
    const pdf = { asset_id: '2', filename: 'b.pdf', mime: 'application/pdf', byte_size: 10, kind: 'pdf' as const };
    const { media, documents } = sharedFiles([
      msg('a', '', { attachment: image }),
      msg('b', '', { attachment: pdf }),
      msg('c', '', { attachment: { ...pdf, asset_id: '3', available: false } }),
    ]);
    expect(media.map((m) => m.messageId)).toEqual(['a']);
    expect(documents.map((m) => m.messageId)).toEqual(['b']);
  });
  it('formatea tamaños y fechas en castellano', () => {
    expect(formatBytes(1_520_000)).toBe('1,45 MB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(0)).toBe('');
    const now = new Date(2026, 8, 8, 18, 0);
    expect(dayDividerLabel(new Date(2026, 8, 8, 9, 40).toISOString(), now)).toMatch(/^Hoy, 8 sept/);
    expect(dayDividerLabel(new Date(2026, 8, 7, 9, 40).toISOString(), now)).toMatch(/^Ayer, 7 sept/);
    expect(listStamp(new Date(2026, 8, 8, 9, 5).toISOString(), now)).toBe('09:05');
    expect(listStamp(new Date(2026, 8, 7, 9, 5).toISOString(), now)).toBe('Ayer');
  });
  it('"visto" sale del último read_at de mis propios mensajes', () => {
    const seen = lastSeenAt([
      { id: 'a', text: '', from: 'vero', sent_at: '2026-09-10T15:00:00Z', read_at: '2026-09-10T16:00:00Z' },
      { id: 'b', text: '', from: 'vero', sent_at: '2026-09-10T17:00:00Z', read_at: '2026-09-10T18:00:00Z' },
      { id: 'c', text: '', from: 'patient', sent_at: '2026-09-10T19:00:00Z', read_at: '2026-09-10T20:00:00Z' },
    ], 'vero');
    expect(seen).toBe('2026-09-10T18:00:00Z');
    expect(lastSeenAt([], 'vero')).toBeNull();
  });
});
