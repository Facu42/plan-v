export class AssetError extends Error {
  constructor(
    public status: 400 | 403 | 404 | 409 | 413 | 415 | 422 | 501 | 503,
    message: string,
  ) {
    super(message);
  }
}

export const ASSET_CATEGORIES = ['meal_photo', 'clinical_document', 'body_progress'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

const LIMITS: Record<AssetCategory, { maxBytes: number; kinds: ReadonlySet<string> }> = {
  meal_photo: { maxBytes: 10 * 1024 * 1024, kinds: new Set(['image/jpeg', 'image/png', 'image/webp']) },
  body_progress: { maxBytes: 5 * 1024 * 1024, kinds: new Set(['image/jpeg', 'image/png', 'image/webp']) },
  clinical_document: { maxBytes: 20 * 1024 * 1024, kinds: new Set(['application/pdf', 'image/jpeg', 'image/png']) },
};

export const PATIENT_ASSET_QUOTA = { maxFiles: 80, maxBytes: 200 * 1024 * 1024 };
const MAX_EDGE = 8000;

export function sniffKind(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  return null;
}

function jpegSize(bytes: Buffer) {
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i];
    i += 1;
    if (marker === 0xda || marker === 0xd9) break;
    if (i + 1 >= bytes.length) break;
    const len = bytes.readUInt16BE(i);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { width: bytes.readUInt16BE(i + 5), height: bytes.readUInt16BE(i + 3) };
    }
    i += len;
  }
  throw new AssetError(400, 'No se pudo leer el tamaño de la imagen.');
}

function pngSize(bytes: Buffer) {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function webpSize(bytes: Buffer) {
  const fourcc = bytes.subarray(12, 16).toString();
  if (fourcc === 'VP8 ' && bytes.length >= 30) {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L' && bytes.length >= 25) {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8X' && bytes.length >= 30) {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }
  throw new AssetError(400, 'No se pudo leer el tamaño de la imagen.');
}

export function stripJpegMetadata(bytes: Buffer) {
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) throw new AssetError(400, 'El JPEG está dañado.');
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i];
    i += 1;
    if (marker === 0xda) {
      out.push(0xff, marker);
      for (; i < bytes.length; i += 1) out.push(bytes[i]);
      break;
    }
    if (marker === 0xd9) {
      out.push(0xff, 0xd9);
      break;
    }
    if (i + 1 >= bytes.length) throw new AssetError(400, 'El JPEG está dañado.');
    const len = bytes.readUInt16BE(i);
    const start = i + 2;
    const end = start + len - 2;
    i = end;
    if (marker === 0xe1 || marker === 0xe2 || marker === 0xed || marker === 0xfe) continue;
    out.push(0xff, marker, (len >> 8) & 0xff, len & 0xff);
    for (let j = start; j < end; j += 1) out.push(bytes[j]);
  }
  return Buffer.from(out);
}

export function stripPngMetadata(bytes: Buffer) {
  const out = [bytes.subarray(0, 8)];
  let i = 8;
  const skip = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);
  while (i + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(i);
    const type = bytes.subarray(i + 4, i + 8).toString();
    const end = i + 12 + length;
    if (end > bytes.length) throw new AssetError(400, 'El PNG está dañado.');
    if (!skip.has(type)) out.push(bytes.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return Buffer.concat(out);
}

export function inspectAndSanitize(category: AssetCategory, bytes: Buffer) {
  const limit = LIMITS[category];
  if (bytes.length > limit.maxBytes) {
    throw new AssetError(413, category === 'clinical_document' ? 'El archivo debe pesar menos de 20 MB.' : 'La foto debe pesar menos de 10 MB.');
  }
  const head = bytes.subarray(0, 64).toString('utf8').toLowerCase();
  if (head.includes('<svg') || head.includes('<html') || head.includes('<!doctype')) {
    throw new AssetError(415, 'Ese tipo de archivo no está permitido.');
  }
  const kind = sniffKind(bytes);
  if (!kind || !limit.kinds.has(kind)) {
    throw new AssetError(415, category === 'clinical_document' ? 'Usá PDF, JPG o PNG.' : 'Usá una imagen JPG, PNG o WebP.');
  }
  if (kind === 'application/pdf') {
    const text = bytes.toString('latin1');
    if (/\/JavaScript|\/JS[\s<\[]|\/Launch|\/EmbeddedFile/i.test(text)) {
      throw new AssetError(400, 'El PDF incluye contenido activo y no se puede guardar.');
    }
    return { bytes, mime: kind, width: null as number | null, height: null as number | null };
  }
  const size = kind === 'image/jpeg' ? jpegSize(bytes) : kind === 'image/png' ? pngSize(bytes) : webpSize(bytes);
  if (size.width < 1 || size.height < 1 || size.width > MAX_EDGE || size.height > MAX_EDGE) {
    throw new AssetError(400, 'La imagen supera el tamaño permitido.');
  }
  if (size.width * size.height > 24_000_000) throw new AssetError(400, 'La imagen supera el tamaño permitido.');
  const clean = kind === 'image/jpeg' ? stripJpegMetadata(bytes) : kind === 'image/png' ? stripPngMetadata(bytes) : bytes;
  return { bytes: clean, mime: kind, width: size.width, height: size.height };
}

export function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new AssetError(400, 'El archivo no tiene un formato reconocible.');
  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!bytes.length) throw new AssetError(400, 'El archivo está vacío.');
  return bytes;
}

export function destBucket(category: AssetCategory) {
  if (category === 'meal_photo') return 'meal-photos';
  if (category === 'body_progress') return 'care-photos';
  return 'clinical-documents';
}

export function consentPurpose(category: AssetCategory) {
  return category;
}
