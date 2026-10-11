import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

const SIZE = 128;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CREAM: Rgb = [246, 241, 230];
type Rgb = [number, number, number];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Buffer): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function hslToRgb(h: number, s: number, l: number): Rgb {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
function pixel(x: number, y: number, base: Rgb): Rgb {
  const dx = x - SIZE / 2, dy = y - SIZE / 2, radius = Math.hypot(dx, dy);
  if (radius > 46) return CREAM;
  // Sombra suave hacia abajo a la derecha y un brillo arriba a la izquierda: una esfera mate, sin texto ni formas reconocibles.
  const light = 1 - Math.min(1, Math.hypot(dx + 14, dy + 16) / 70) * 0.35;
  const edge = radius > 43 ? 0.88 : 1;
  return base.map(channel => Math.min(255, Math.round(channel * light * edge))) as Rgb;
}

/**
 * Foto de mentira para la demostración local: una esfera de color propio por ingrediente sobre fondo crema.
 * Sirve para ver el flujo completo sin Cloudflare; nunca se usa con datos reales y no representa al alimento.
 */
export function simulatedIngredientImage(key: string): Buffer {
  const hue = createHash('sha256').update(key).digest().readUInt16BE(0) % 360;
  const base = hslToRgb(hue, 0.55, 0.58);
  const raw = Buffer.alloc(SIZE * (1 + SIZE * 3));
  for (let y = 0; y < SIZE; y += 1) {
    const row = y * (1 + SIZE * 3);
    for (let x = 0; x < SIZE; x += 1) pixel(x, y, base).forEach((channel, index) => { raw[row + 1 + x * 3 + index] = channel; });
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0); header.writeUInt32BE(SIZE, 4); header.writeUInt8(8, 8); header.writeUInt8(2, 9);
  return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

export function simulatedIngredientAlt(key: string): string {
  const label = key.replace(/-/g, ' ');
  return `${label.charAt(0).toLocaleUpperCase('es')}${label.slice(1)} · ilustración simulada de la demostración`;
}
