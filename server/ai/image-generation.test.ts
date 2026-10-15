import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateRecipeImage } from './image-generation.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('vista previa de receta vía OpenRouter', () => {
  it('llama Ming con datos de receta acotados y devuelve el formato recibido', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: 'aGVsbG8=', media_type: 'image/webp' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateRecipeImage({ title: 'Sopa de calabaza', ingredients: ['calabaza', 'cebolla'] });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/images');
    expect(options.headers).toMatchObject({ Authorization: 'Bearer synthetic-only' });
    expect(JSON.parse(String(options.body))).toMatchObject({
      model: 'inclusionai/ming-image-0.1-design',
      prompt: expect.stringContaining('Sopa de calabaza'),
      output_format: 'webp',
    });
    expect(result).toEqual({ image: 'data:image/webp;base64,aGVsbG8=', model: 'inclusionai/ming-image-0.1-design' });
  });

  it('rechaza respuestas que no contienen una imagen base64 válida', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: '<script>' }] }), { status: 200 })));
    await expect(generateRecipeImage({ title: 'Sopa', ingredients: ['calabaza'] })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
});
