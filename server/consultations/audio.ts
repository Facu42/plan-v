import { CareError } from '../care/errors.js';
import { CONSULTATION_AUDIO_MAX_BYTES } from '../../src/types/consultations.js';

/** Only PCM WAV is accepted: duration comes from verified sample data, never metadata supplied by the caller. */
export function decodeConsultationWav(audio: Uint8Array) {
  if (audio.byteLength > CONSULTATION_AUDIO_MAX_BYTES) throw new CareError(413, 'El segmento de audio supera 8 MB.');
  if (audio.byteLength < 44) throw new CareError(415, 'Cargá audio WAV PCM de 16 bits.');
  const v = new DataView(audio.buffer, audio.byteOffset, audio.byteLength);
  const word = (at: number, length: number) => String.fromCharCode(...audio.slice(at, at + length));
  if (word(0, 4) !== 'RIFF' || word(8, 4) !== 'WAVE' || v.getUint32(4, true) + 8 !== audio.byteLength) throw new CareError(415, 'El audio está incompleto o no es WAV.');
  let rate = 0, channels = 0, format = false, data = 0;
  for (let pos = 12; pos + 8 <= audio.length;) {
    const size = v.getUint32(pos + 4, true), end = pos + 8 + size;
    if (end > audio.length) throw new CareError(415, 'El audio está truncado.');
    if (word(pos, 4) === 'fmt ') {
      if (format || size < 16) throw new CareError(415, 'El formato de audio no es válido.');
      channels = v.getUint16(pos + 10, true); rate = v.getUint32(pos + 12, true);
      if (v.getUint16(pos + 8, true) !== 1 || channels !== 1 || v.getUint16(pos + 22, true) !== 16 || rate < 8000 || rate > 96000 || v.getUint16(pos + 20, true) !== 2 || v.getUint32(pos + 16, true) !== rate * 2) throw new CareError(415, 'Usá WAV PCM mono de 16 bits.');
      format = true;
    }
    if (word(pos, 4) === 'data') { if (data) throw new CareError(415, 'El audio tiene datos duplicados.'); data = size; }
    pos = end + (size % 2);
  }
  if (!format || !data || data % 2) throw new CareError(415, 'El audio no contiene muestras válidas.');
  const durationSeconds = data / (rate * channels * 2);
  if (durationSeconds < 0.1 || durationSeconds > 90) throw new CareError(413, 'Cada segmento debe durar entre 0,1 y 90 segundos.');
  return { durationSeconds, sampleRate: rate };
}
