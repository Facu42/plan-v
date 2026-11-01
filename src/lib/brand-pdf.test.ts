import { describe, expect, it } from 'vitest';
import { brandHex, DEFAULT_BRAND_ACCENT, DEFAULT_BRAND_INK, embedBrandLogo, hexToRgb01 } from './brand-pdf';

describe('marca del PDF', () => {
  it('usa el color de la nutri y cae al lima / tinta de Nutridash si falta o es inválido', () => {
    expect(brandHex('#112233', DEFAULT_BRAND_INK)).toBe('#112233');
    expect(brandHex('verde', DEFAULT_BRAND_INK)).toBe(DEFAULT_BRAND_INK);
    expect(brandHex(undefined, DEFAULT_BRAND_ACCENT)).toBe(DEFAULT_BRAND_ACCENT);
    expect(hexToRgb01('#C2E66E')).toEqual([194 / 255, 230 / 255, 110 / 255]);
  });

  it('ignora un logo roto y no tira el documento', async () => {
    const document = {
      embedPng: async () => { throw new Error('png roto'); },
      embedJpg: async () => { throw new Error('jpg roto'); },
    };
    expect(await embedBrandLogo(document, null)).toBeNull();
    expect(await embedBrandLogo(document, 'data:image/png;base64,xxxx')).toBeNull();
    expect(await embedBrandLogo(document, 'https://cdn.example/logo.png')).toBeNull();
  });
});
