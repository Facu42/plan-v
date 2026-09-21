import { describe, expect, it } from 'vitest';
import {
  detectMagic,
  inspectPrivateFile,
  jpegDimensions,
  stripJpegMetadata,
  stripPngMetadata,
} from './inspect.js';
import { hasRequiredBuckets } from './storage.js';
import { CareError } from '../care/errors.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=', 'base64');

function jpegWithExif() {
  const payload = Buffer.from([0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03]);
  const app1 = Buffer.alloc(4 + payload.length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1.writeUInt16BE(payload.length + 2, 2);
  payload.copy(app1, 4);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]),
    app1,
    Buffer.from([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00]),
    Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0x3f, 0xff, 0xd9]),
  ]);
}

describe('PV-15 inspección de archivos privados', () => {
  it('acepta PNG 1×1 y rechaza magic bytes falsos', () => {
    expect(detectMagic(PNG)).toBe('image/png');
    const inspected = inspectPrivateFile('body_progress', PNG, 'image/png');
    expect(inspected.width).toBe(1);
    expect(inspected.height).toBe(1);
    expect(() => inspectPrivateFile('body_progress', Buffer.from('AAAA'), 'image/png')).toThrow(CareError);
  });

  it('saca EXIF del JPEG y conserva el tamaño', () => {
    const raw = jpegWithExif();
    expect(raw.includes(Buffer.from('Exif'))).toBe(true);
    const cleaned = stripJpegMetadata(raw);
    expect(cleaned.includes(Buffer.from('Exif'))).toBe(false);
    expect(jpegDimensions(cleaned)).toEqual({ width: 1, height: 1 });
    const inspected = inspectPrivateFile('meal_photo', raw, 'image/jpeg');
    expect(inspected.bytes.includes(Buffer.from('Exif'))).toBe(false);
  });

  it('saca chunks de texto/EXIF del PNG', () => {
    const textChunk = Buffer.concat([
      PNG.subarray(0, PNG.length - 12),
      Buffer.from([0x00, 0x00, 0x00, 0x0a, 0x74, 0x45, 0x58, 0x74, 0x41, 0x00, 0x42, 0x00, 0x43, 0x00, 0x44, 0x00, 0x45, 0x00]),
      Buffer.alloc(4),
      PNG.subarray(PNG.length - 12),
    ]);
    const cleaned = stripPngMetadata(PNG);
    expect(cleaned.subarray(0, 8).equals(PNG.subarray(0, 8))).toBe(true);
    expect(stripPngMetadata(textChunk).includes(Buffer.from('tEXt'))).toBe(false);
  });

  it('rechaza PDF con JavaScript y cuenta páginas', () => {
    const safe = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
    expect(inspectPrivateFile('clinical_document', safe, 'application/pdf').pages).toBe(1);
    const active = Buffer.from('%PDF-1.4\n1 0 obj<</S/JavaScript/JS(app.alert(1))>>endobj\n%%EOF');
    expect(() => inspectPrivateFile('clinical_document', active, 'application/pdf')).toThrow(/contenido activo/);
  });

  it('falla cerrado si faltan buckets de producto', () => {
    expect(hasRequiredBuckets([], ['care-quarantine'])).toBe(false);
    expect(hasRequiredBuckets(null, ['care-photos'])).toBe(false);
    expect(hasRequiredBuckets(['care-photos', 'care-documents', 'meal-photos', 'care-quarantine'], ['care-quarantine', 'care-photos'])).toBe(true);
  });
});
