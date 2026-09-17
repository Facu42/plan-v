import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn().mockRejectedValue(new Error('provider unavailable')),
  Output: { object: vi.fn((value) => value) },
}));

import { generateText } from 'ai';
import { analyzeMeal } from './meal-analyzer.js';
import { generateCopilotBrief } from './copilot.js';
import { getStore, resetStore } from '../store.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('meal provider failures', () => {
  it('never substitutes demo food when live generation fails', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    await expect(analyzeMeal({ description: 'comida de prueba', slot: 'Almuerzo' }))
      .rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    expect(generateText).toHaveBeenCalled();
  });

  it('rejects empty provider output in live mode', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    vi.mocked(generateText).mockResolvedValueOnce({ output: null } as never);
    await expect(analyzeMeal({ description: 'comida de prueba', slot: 'Cena' }))
      .rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });

  it('does not call the provider when AI is disabled', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'disabled');
    await expect(analyzeMeal({ description: 'comida de prueba', slot: 'Almuerzo' }))
      .rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    expect(generateText).not.toHaveBeenCalled();
  });

  it('keeps explicit demo mocks without calling the provider', async () => {
    vi.stubEnv('APP_MODE', 'demo');
    vi.stubEnv('AI_MODE', 'demo');
    const analysis = await analyzeMeal({ description: 'pollo con arroz', slot: 'Almuerzo' });
    expect(analysis.foods.length).toBeGreaterThan(0);
    expect(generateText).not.toHaveBeenCalled();
  });
});

describe('copilot provider failures', () => {
  beforeEach(() => {
    resetStore();
  });

  it('never substitutes a demo brief when live generation fails', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    const patient = getStore().patients[0];
    await expect(generateCopilotBrief(patient)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
});
