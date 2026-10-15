import { crc32 } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { inspectAndSanitize, sniffKind, stripJpegMetadata, stripPngMetadata, AssetError } from './inspect.js';

function chunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

function png(extra: Buffer[] = []) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = Buffer.from('08d763f8cfc0000000020001e221bc33', 'hex');
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    ...extra,
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function jpegWithExif(includeExif: boolean) {
  const dqt = Buffer.concat([Buffer.from([0xff, 0xdb, 0x00, 0x43, 0x00]), Buffer.alloc(64, 1)]);
  const sof = Buffer.from('ffc0000b080001000101011100', 'hex');
  const sos = Buffer.from('ffda000800010001003f00ffd9', 'hex');
  const body = Buffer.concat([dqt, sof, sos]);
  if (!includeExif) return Buffer.concat([Buffer.from([0xff, 0xd8]), body]);
  const payload = Buffer.from('Exif\0\0GPS-secret');
  const app1 = Buffer.alloc(4 + payload.length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1.writeUInt16BE(payload.length + 2, 2);
  payload.copy(app1, 4);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app1, body]);
}

describe('PV-15 inspección de archivos', () => {
  it('acepta PNG y recorta metadatos textuales', () => {
    const dirty = png([chunk('tEXt', Buffer.from('Comment\0secreto GPS'))]);
    expect(dirty.includes(Buffer.from('secreto GPS'))).toBe(true);
    const clean = inspectAndSanitize('meal_photo', dirty);
    expect(clean.mime).toBe('image/png');
    expect(clean.width).toBe(1);
    expect(clean.height).toBe(1);
    expect(clean.bytes.includes(Buffer.from('secreto GPS'))).toBe(false);
    expect(sniffKind(stripPngMetadata(dirty))).toBe('image/png');
  });

  it('acepta JPEG y recorta EXIF APP1', () => {
    const exif = jpegWithExif(true);
    expect(exif.includes(Buffer.from('GPS-secret'))).toBe(true);
    const clean = inspectAndSanitize('body_progress', exif);
    expect(clean.mime).toBe('image/jpeg');
    expect(clean.width).toBe(1);
    expect(stripJpegMetadata(exif).includes(Buffer.from('GPS-secret'))).toBe(false);
  });

  it('rechaza HTML, SVG, PDF activo y tamaños inflados', () => {
    expect(() => inspectAndSanitize('meal_photo', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toThrow(AssetError);
    expect(() => inspectAndSanitize('clinical_document', Buffer.from('%PDF-1.4\n/JavaScript (app.alert)'))).toThrow(AssetError);
    const huge = Buffer.concat([jpegWithExif(false), Buffer.alloc(11 * 1024 * 1024)]);
    try {
      inspectAndSanitize('meal_photo', huge);
      throw new Error('expected size error');
    } catch (error) {
      expect(error).toBeInstanceOf(AssetError);
      expect((error as AssetError).status).toBe(413);
    }
  });

  it('acepta un PDF plano para estudios', () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
    const clean = inspectAndSanitize('clinical_document', pdf);
    expect(clean.mime).toBe('application/pdf');
  });
});
