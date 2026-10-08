import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { inspectPrivateFile } from '../assets/inspect.js';
import { simulatedIngredientImage } from './simulated-image.js';

describe('imagen simulada de la demostración', () => {
  it('es un PNG válido que pasa la misma inspección que las fotos reales', () => {
    const png = simulatedIngredientImage('tomate');
    const inspected = inspectPrivateFile('body_progress', png, 'image/png');
    expect(inspected.mime).toBe('image/png');
    expect(png.length).toBeLessThan(20_000);
  });

  it('es determinista por clave y distinta entre ingredientes', () => {
    expect(simulatedIngredientImage('tomate').equals(simulatedIngredientImage('tomate'))).toBe(true);
    expect(simulatedIngredientImage('tomate').equals(simulatedIngredientImage('zanahoria'))).toBe(false);
  });

  it('los datos descomprimidos tienen el tamaño declarado (128x128 RGB)', () => {
    const png = simulatedIngredientImage('papa');
    const idatLength = png.readUInt32BE(8 + 25);
    expect(png.subarray(8 + 25 + 4, 8 + 25 + 8).toString()).toBe('IDAT');
    const raw = inflateSync(png.subarray(8 + 25 + 8, 8 + 25 + 8 + idatLength));
    expect(raw.length).toBe(128 * (1 + 128 * 3));
  });
});
