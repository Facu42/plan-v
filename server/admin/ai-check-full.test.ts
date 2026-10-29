import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FULL_CHECK_MIN_INTERVAL_MS, resetFullCheckLimit, runFullAiCheck, type FullCheckDeps } from './ai-check-full.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
function deps(over: Partial<FullCheckDeps> = {}): FullCheckDeps {
  return {
    now: () => 1_000_000,
    aiLive: () => true,
    imageEnabled: () => true,
    runRecipe: async () => ({ title: 'Ensalada de lentejas', items: 5, steps: 4 }),
    runImage: async () => ({ status: 'ready', bytes: jpeg, mime: 'image/jpeg', alt: 'x' }),
    ...over,
  };
}
beforeEach(() => resetFullCheckLimit());

describe('runFullAiCheck', () => {
  it('builds a recipe and four photos from the same prompts the app uses', async () => {
    const runImage = vi.fn(deps().runImage);
    const result = await runFullAiCheck(deps({ runImage }));
    expect(result.recipe).toMatchObject({ status: 'ok', items: 5, steps: 4 });
    expect(result.photos.map((p) => p.kind)).toEqual(['plato', 'plato', 'ingrediente', 'ingrediente']);
    expect(result.photos.every((p) => p.status === 'ok' && p.preview?.startsWith('data:image/jpeg;base64,'))).toBe(true);
    expect(runImage).toHaveBeenCalledTimes(4);
    expect(result.photos[0].prompt).toContain('lentils');
    expect(result.photos[2].prompt).toContain('eggs');
    expect(result.photos[3].prompt).toContain('white fish');
  });

  it('flags an incomplete recipe as failed', async () => {
    const result = await runFullAiCheck(deps({ runRecipe: async () => ({ title: 'x', items: 1, steps: 1 }) }));
    expect(result.recipe.status).toBe('failed');
  });

  it('keeps going when the recipe fails and reports off photos without calling Cloudflare', async () => {
    const runImage = vi.fn();
    const result = await runFullAiCheck(deps({ runRecipe: async () => { throw new Error('sk-secret'); }, imageEnabled: () => false, runImage }));
    expect(result.recipe.status).toBe('failed');
    expect(JSON.stringify(result)).not.toContain('sk-secret');
    expect(result.photos.every((p) => p.status === 'off')).toBe(true);
    expect(runImage).not.toHaveBeenCalled();
  });

  it('refuses a second run inside the minimum interval', async () => {
    let clock = 9_000_000;
    const d = deps({ now: () => clock });
    await runFullAiCheck(d);
    await expect(runFullAiCheck(d)).rejects.toMatchObject({ status: 429 });
    clock += FULL_CHECK_MIN_INTERVAL_MS + 1;
    await expect(runFullAiCheck(d)).resolves.toBeDefined();
  });
});
