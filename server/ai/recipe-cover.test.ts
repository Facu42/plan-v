import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('ai', () => ({
  generateImage: vi.fn(),
}));

import { generateImage } from 'ai';
import { generateRecipeCoverImage, recipeCoverEnabled } from './recipe-cover.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const context = { title: 'Bowl de pollo y vegetales', items: [{ name: 'Pechuga de pollo' }, { name: 'Vegetales' }] };

describe('PV-42 recipe-cover', () => {
  it('configuración inválida no escapa como excepción después de publicar', async () => {
    vi.stubEnv('APP_MODE', 'production'); vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect(recipeCoverEnabled()).toBe(false);
    expect(await generateRecipeCoverImage(context)).toEqual({ status: 'failed' });
    expect(generateImage).not.toHaveBeenCalled();
  });
  it('nunca llama al proveedor si AI_MODE no es live (sin costo en demo/disabled)', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'demo');
    const result = await generateRecipeCoverImage(context);
    expect(result).toEqual({ status: 'failed' });
    expect(generateImage).not.toHaveBeenCalled();
  });

  it('no intenta generar una portada con sólo OpenRouter configurado', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    vi.stubEnv('OPENAI_API_KEY', '');
    expect(await generateRecipeCoverImage(context)).toEqual({ status: 'failed' });
    expect(generateImage).not.toHaveBeenCalled();
  });

  it('no inventa una URL si el proveedor falla en modo vivo', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    vi.mocked(generateImage).mockRejectedValueOnce(new Error('provider unavailable'));
    const result = await generateRecipeCoverImage(context);
    expect(result).toEqual({ status: 'failed' });
  });

  it('no inventa una URL si el proveedor no devuelve imagen', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    vi.mocked(generateImage).mockResolvedValueOnce({ image: null } as never);
    const result = await generateRecipeCoverImage(context);
    expect(result).toEqual({ status: 'failed' });
  });

  it('devuelve bytes para Storage cuando el proveedor genera la imagen en modo vivo', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    vi.mocked(generateImage).mockResolvedValueOnce({ image: { base64: 'AAAA', mediaType: 'image/png' } } as never);
    const result = await generateRecipeCoverImage(context);
    expect(result).toEqual({ status: 'ready', bytes: Buffer.from('AAAA', 'base64'), mime: 'image/png', alt: context.title });
    expect(vi.mocked(generateImage).mock.calls[0][0]).toMatchObject({ maxRetries: 0, abortSignal: expect.any(AbortSignal) });
  });
  it('el timeout aborta una única llamada y no inventa imagen', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APP_MODE', 'test'); vi.stubEnv('AI_MODE', 'live'); vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => {
      const controller = new AbortController(); setTimeout(() => controller.abort(), ms); return controller.signal;
    });
    vi.mocked(generateImage).mockImplementationOnce(({ abortSignal }) => new Promise((_, reject) => {
      abortSignal!.addEventListener('abort', () => reject(new Error('timeout')), { once: true });
    }));
    try {
      const result = generateRecipeCoverImage(context);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(await result).toEqual({ status: 'failed' });
      expect(generateImage).toHaveBeenCalledTimes(1);
    } finally { vi.restoreAllMocks(); vi.useRealTimers(); }
  });
});
