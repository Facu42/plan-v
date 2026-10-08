import { afterEach, describe, expect, it } from 'vitest';
import { attachmentHref, dayLabel, fileSize, listTime, openedAttachmentUrl, orderedMessages } from './message-format';

const original = process.env.TZ;
afterEach(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });
const at = (id: string, sent_at: string) => ({ id, sent_at });
const now = new Date('2026-10-03T12:00:00-03:00');

describe('orden de los mensajes del chat', () => {
  it('ordena por el instante real aunque las horas vengan con distinta zona', () => {
    const list = [at('b', '2026-10-03T14:00:00Z'), at('a', '2026-10-03T11:30:00-03:00'), at('c', '2026-10-03T08:00:00-03:00')];
    // 14:00Z = 11:00 en Buenos Aires: va antes que las 11:30 aunque como texto sea mayor.
    expect(orderedMessages(list).map(item => item.id)).toEqual(['c', 'b', 'a']);
  });
  it('los que no tienen fecha válida van al final, en su orden, en lugar de desaparecer', () => {
    const list = [at('mala', 'ayer a la tarde'), at('ok', '2026-10-03T14:00:00Z'), at('vacía', ''), at('ok2', '2026-10-03T15:00:00Z')];
    expect(orderedMessages(list).map(item => item.id)).toEqual(['ok', 'ok2', 'mala', 'vacía']);
  });
  it('mantiene el orden de llegada cuando dos mensajes tienen el mismo instante', () => {
    const list = [at('x', '2026-10-03T14:00:00Z'), at('y', '2026-10-03T14:00:00Z')];
    expect(orderedMessages(list).map(item => item.id)).toEqual(['x', 'y']);
  });
  it('no modifica la lista original', () => {
    const list = [at('b', '2026-10-03T14:00:00Z'), at('a', '2026-10-03T10:00:00Z')];
    orderedMessages(list);
    expect(list.map(item => item.id)).toEqual(['b', 'a']);
  });
});

describe('tamaño de archivo', () => {
  it('usa KB y MB con coma decimal', () => {
    expect(fileSize(2048)).toBe('2 KB');
    expect(fileSize(2.5 * 1048576)).toBe('2,5 MB');
    expect(fileSize(10)).toBe('1 KB');
  });
  it('sin dato o con un valor imposible no escribe NaN', () => {
    for (const value of [undefined, null, Number.NaN, -5, Number.POSITIVE_INFINITY]) expect(fileSize(value as number)).toBe('');
  });
});

describe('dirección para abrir un adjunto', () => {
  it('acepta direcciones firmadas https y las rutas propias de la API', () => {
    expect(attachmentHref('https://x.supabase.co/storage/v1/object/sign/a.pdf?token=1')).toBe('https://x.supabase.co/storage/v1/object/sign/a.pdf?token=1');
    expect(attachmentHref('/api/assets/access/abc123')).toBe('/api/assets/access/abc123');
  });
  it('acepta http sólo cuando el almacenamiento está en la propia máquina (entorno local)', () => {
    expect(attachmentHref('http://127.0.0.1:54321/storage/v1/object/sign/a.pdf?token=1')).toBe('http://127.0.0.1:54321/storage/v1/object/sign/a.pdf?token=1');
    expect(attachmentHref('http://localhost:3001/api/assets/access/abc')).toBe('http://localhost:3001/api/assets/access/abc');
    for (const value of ['http://evil.example/a.pdf', 'http://127.0.0.1.evil.example/a.pdf', 'http://user@evil.example/a.pdf']) expect(attachmentHref(value)).toBeNull();
  });
  it('rechaza esquemas que ejecutan código o no son de archivos', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,<b>x</b>', '//evil.example/x', 'ftp://x', '', '   ', undefined, null, 5]) expect(attachmentHref(value)).toBeNull();
  });
});

describe('día y hora de la lista y del chat', () => {
  it('rotula hoy, ayer y fechas anteriores en Argentina aunque el navegador esté en otra zona', () => {
    process.env.TZ = 'UTC';
    expect(dayLabel('2026-10-03T22:30:00-03:00', now)).toBe('Hoy, 3 oct');
    expect(dayLabel('2026-10-02T22:30:00-03:00', now)).toBe('Ayer, 2 oct');
    expect(dayLabel('2026-09-26T10:00:00-03:00', now)).toBe('Sábado, 26 sept');
    expect(listTime('2026-10-03T22:30:00-03:00', now)).toBe('10:30 p. m.');
    expect(listTime('2026-10-02T22:30:00-03:00', now)).toBe('Ayer');
    expect(listTime('2026-09-26T10:00:00-03:00', now)).toBe('26 sept');
  });
  it('una fecha inválida da texto vacío en lugar de un error', () => {
    expect(dayLabel('ayer', now)).toBe(''); expect(listTime('ayer', now)).toBe('');
  });
});

describe('respuesta de la API al abrir un adjunto', () => {
  it('devuelve la dirección segura', () => { expect(openedAttachmentUrl({ url: 'https://x.supabase.co/a.pdf?t=1' })).toBe('https://x.supabase.co/a.pdf?t=1'); });
  it('rechaza javascript:, // y data: con un error en español, sin abrir nada', () => {
    for (const url of ['javascript:alert(1)', '//evil.example/x', 'data:text/html,x', '']) expect(() => openedAttachmentUrl({ url })).toThrow('El adjunto no se pudo abrir.');
    expect(() => openedAttachmentUrl(null)).toThrow('El adjunto no se pudo abrir.');
  });
});
