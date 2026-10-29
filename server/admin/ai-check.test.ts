import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_CHECK_MIN_INTERVAL_MS, demoAiCheck, resetAiCheckLimit, runAiCheck, type AiCheckDeps } from './ai-check.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

function deps(overrides: Partial<AiCheckDeps> = {}): AiCheckDeps {
  let clock = 1_000_000;
  return {
    now: () => (clock += 500),
    textMode: () => 'live',
    textModel: () => 'openrouter/free',
    runText: async () => 'OK',
    imageEnabled: () => true,
    runImage: async () => ({ status: 'ready', bytes: jpeg, mime: 'image/jpeg', alt: 'x' }),
    ...overrides,
  };
}

beforeEach(() => resetAiCheckLimit());

describe('runAiCheck', () => {
  it('reports text and image working, with the photo as a preview', async () => {
    const result = await runAiCheck(deps());
    expect(result.text).toMatchObject({ status: 'ok', model: 'openrouter/free' });
    expect(result.image.status).toBe('ok');
    expect(result.image.preview).toBe(`data:image/jpeg;base64,${jpeg.toString('base64')}`);
  });

  it('says the image provider is off, without calling it, when Cloudflare variables are missing', async () => {
    const runImage = vi.fn();
    const result = await runAiCheck(deps({ imageEnabled: () => false, runImage }));
    expect(result.image).toMatchObject({ status: 'off', preview: null });
    expect(result.image.detail).toContain('CLOUDFLARE_API_TOKEN');
    expect(runImage).not.toHaveBeenCalled();
  });

  it('explains a rejected key or exhausted daily quota', async () => {
    const result = await runAiCheck(deps({ runImage: async () => ({ status: 'failed', blocked: true }) }));
    expect(result.image.status).toBe('failed');
    expect(result.image.detail).toMatch(/cuota|clave/);
  });

  it('reports text as off when AI is not live or no free model is configured', async () => {
    const runText = vi.fn();
    expect((await runAiCheck(deps({ textMode: () => 'disabled', runText }))).text.status).toBe('off');
    resetAiCheckLimit();
    expect((await runAiCheck(deps({ textModel: () => null, runText }))).text.status).toBe('off');
    expect(runText).not.toHaveBeenCalled();
  });

  it('turns a provider error or an empty answer into a failure without leaking the error', async () => {
    const boom = await runAiCheck(deps({ runText: async () => { throw new Error('sk-secret-token exploded'); } }));
    expect(boom.text.status).toBe('failed');
    expect(JSON.stringify(boom)).not.toContain('sk-secret');
    resetAiCheckLimit();
    expect((await runAiCheck(deps({ runText: async () => '  ' }))).text.status).toBe('failed');
  });

  it('refuses a second run inside the minimum interval so the free photo quota is not burned', async () => {
    let clock = 5_000_000;
    const timed = deps({ now: () => clock });
    await runAiCheck(timed);
    await expect(runAiCheck(timed)).rejects.toMatchObject({ status: 429 });
    clock += AI_CHECK_MIN_INTERVAL_MS + 1;
    await expect(runAiCheck(timed)).resolves.toBeDefined();
  });
});

describe('demoAiCheck', () => {
  it('has no real provider data', () => {
    expect(demoAiCheck().text.status).toBe('demo');
    expect(demoAiCheck().image.preview).toBeNull();
  });
});
