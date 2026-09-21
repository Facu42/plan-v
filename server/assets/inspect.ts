import { createHash } from 'node:crypto';
import { CareError } from '../care/errors.js';
import {
  BYTE_LIMIT_BY_CATEGORY,
  MIME_BY_CATEGORY,
  PATIENT_QUOTA,
  type AssetCategory,
  type InspectedFile,
} from './types.js';

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const DANGEROUS_PDF = /\/(?:JavaScript|JS|Launch|EmbeddedFile|RichMedia|OpenAction)\b/;

export function checksumSha256(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function detectMagic(bytes: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIG)) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') {
    return 'image/webp';
  }
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  return null;
}

function readU16(bytes: Buffer, offset: number) {
  if (offset + 1 >= bytes.length) throw new CareError(400, 'El archivo está incompleto.');
  return bytes.readUInt16BE(offset);
}

export function jpegDimensions(bytes: Buffer) {
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i];
    i += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    const length = readU16(bytes, i);
    if (i + length > bytes.length) throw new CareError(400, 'El JPEG está incompleto.');
    if (marker >= 0xc0 && marker <= 0xc3) {
      if (i + 6 >= bytes.length) throw new CareError(400, 'El JPEG no declara tamaño.');
      return { height: readU16(bytes, i + 3), width: readU16(bytes, i + 5) };
    }
    i += length;
  }
  throw new CareError(400, 'No se pudo leer el tamaño de la imagen JPEG.');
}

export function stripJpegMetadata(bytes: Buffer) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new CareError(400, 'El contenido no es un JPEG válido.');
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) {
      out.push(...bytes.subarray(i));
      break;
    }
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i];
    i += 1;
    if (marker === 0xd9) {
      out.push(0xff, 0xd9);
      break;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      out.push(0xff, marker);
      continue;
    }
    if (marker === 0xda) {
      out.push(0xff, 0xda, ...bytes.subarray(i));
      break;
    }
    const length = readU16(bytes, i);
    if (i + length > bytes.length) throw new CareError(400, 'El JPEG está incompleto.');
    const skip = marker === 0xe1 || marker === 0xe2 || marker === 0xed || marker === 0xfe;
    if (!skip) out.push(0xff, marker, ...bytes.subarray(i, i + length));
    i += length;
  }
  return Buffer.from(out);
}

export function pngDimensions(bytes: Buffer) {
  if (bytes.length < 24) throw new CareError(400, 'El PNG está incompleto.');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const PNG_STRIP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);

export function stripPngMetadata(bytes: Buffer) {
  if (!bytes.subarray(0, 8).equals(PNG_SIG)) throw new CareError(400, 'El contenido no es un PNG válido.');
  const chunks: Buffer[] = [bytes.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(i);
    const type = bytes.subarray(i + 4, i + 8).toString('ascii');
    const end = i + 12 + length;
    if (end > bytes.length) throw new CareError(400, 'El PNG está incompleto.');
    if (!PNG_STRIP.has(type)) chunks.push(bytes.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return Buffer.concat(chunks);
}

function readWebpU24(bytes: Buffer, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

export function webpDimensions(bytes: Buffer) {
  let i = 12;
  while (i + 8 <= bytes.length) {
    const type = bytes.subarray(i, i + 4).toString('ascii');
    const size = bytes.readUInt32LE(i + 4);
    const data = i + 8;
    if (type === 'VP8X' && data + 10 <= bytes.length) {
      return { width: readWebpU24(bytes, data + 4) + 1, height: readWebpU24(bytes, data + 7) + 1 };
    }
    if (type === 'VP8 ' && data + 10 <= bytes.length) {
      return {
        width: bytes.readUInt16LE(data + 6) & 0x3fff,
        height: bytes.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    if (type === 'VP8L' && data + 5 <= bytes.length) {
      const bits = bytes.readUInt32LE(data + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    i = data + size + (size % 2);
  }
  throw new CareError(400, 'No se pudo leer el tamaño de la imagen WebP.');
}

export function stripWebpMetadata(bytes: Buffer) {
  if (bytes.subarray(0, 4).toString() !== 'RIFF' || bytes.subarray(8, 12).toString() !== 'WEBP') {
    throw new CareError(400, 'El contenido no es un WebP válido.');
  }
  const kept: Buffer[] = [];
  let i = 12;
  while (i + 8 <= bytes.length) {
    const type = bytes.subarray(i, i + 4).toString('ascii');
    const size = bytes.readUInt32LE(i + 4);
    const end = i + 8 + size + (size % 2);
    if (end > bytes.length + (size % 2)) throw new CareError(400, 'El WebP está incompleto.');
    if (type !== 'EXIF' && type !== 'XMP ') kept.push(bytes.subarray(i, Math.min(end, bytes.length)));
    i = end;
  }
  const payload = Buffer.concat(kept);
  const header = Buffer.from('RIFF....WEBP');
  header.writeUInt32LE(payload.length + 4, 4);
  return Buffer.concat([header, payload]);
}

export function countPdfPages(bytes: Buffer) {
  const text = bytes.toString('latin1');
  const named = [...text.matchAll(/\/Type\s*\/Page(?!s)\b/g)].length;
  return Math.max(named, 1);
}

export function inspectPrivateFile(category: AssetCategory, bytes: Buffer, declaredMime: string): InspectedFile {
  if (bytes.length === 0) throw new CareError(400, 'El archivo está vacío.');
  const limit = BYTE_LIMIT_BY_CATEGORY[category];
  if (bytes.length > limit) throw new CareError(413, `El archivo debe pesar menos de ${Math.round(limit / (1024 * 1024))} MB.`);
  const magic = detectMagic(bytes);
  if (!magic) throw new CareError(400, 'El contenido no corresponde a un tipo permitido.');
  const allowed = MIME_BY_CATEGORY[category] as readonly string[];
  if (!allowed.includes(magic) || (declaredMime && declaredMime !== magic)) {
    throw new CareError(415, 'El tipo declarado no coincide con el contenido.');
  }
  if (magic === 'application/pdf') {
    const latin1 = bytes.toString('latin1');
    if (DANGEROUS_PDF.test(latin1)) throw new CareError(400, 'El PDF incluye contenido activo y no se puede guardar.');
    const pages = countPdfPages(bytes);
    if (pages > PATIENT_QUOTA.maxPdfPages) throw new CareError(400, 'El PDF supera el máximo de páginas permitido.');
    return { bytes, mime: magic, checksum: checksumSha256(bytes), pages };
  }
  const cleaned = magic === 'image/jpeg'
    ? stripJpegMetadata(bytes)
    : magic === 'image/png'
      ? stripPngMetadata(bytes)
      : stripWebpMetadata(bytes);
  const size = magic === 'image/jpeg'
    ? jpegDimensions(cleaned)
    : magic === 'image/png'
      ? pngDimensions(cleaned)
      : webpDimensions(cleaned);
  if (size.width < 1 || size.height < 1) throw new CareError(400, 'La imagen no tiene un tamaño válido.');
  if (size.width * size.height > PATIENT_QUOTA.maxPixels) {
    throw new CareError(400, 'La imagen supera el máximo de píxeles permitido.');
  }
  return {
    bytes: cleaned,
    mime: magic,
    checksum: checksumSha256(cleaned),
    width: size.width,
    height: size.height,
  };
}

export function parseDataUrl(dataUrl: string) {
  const match = /^data:(application\/pdf|image\/jpeg|image\/png|image\/webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new CareError(400, 'Usá un archivo PDF, JPG, PNG o WebP.');
  return { mime: match[1], bytes: Buffer.from(match[2], 'base64') };
}
