import { beforeEach, describe, expect, it, vi } from 'vitest';
const generated = vi.hoisted(() => vi.fn());
vi.mock('ai', () => ({ generateText: generated, Output: { object: (value: unknown) => value } }));
vi.mock('./provider.js', () => ({ getAiModel: () => 'model' }));
vi.mock('./mode.js', () => ({ resolveAiMode: () => 'live', logProviderFailure: vi.fn() }));
import { generateCopilotBrief } from './copilot.js';
import { getStore, resetStore } from '../store.js';

describe('copiloto de un servicio con múltiples consultorios', () => {
  beforeEach(() => { resetStore(); generated.mockResolvedValue({ output: { suggested_action: null } }); });
  it('no impone la identidad de una nutricionista a los demás consultorios', async () => {
    vi.stubEnv('AI_MODE', 'live');
    try {
      await generateCopilotBrief(getStore().patients[0]);
      expect(generated.mock.calls[0][0].system).not.toMatch(/Verónica|Vero|Trenti/);
      expect(generated.mock.calls[0][0].system).toMatch(/profesional/);
    } finally { vi.unstubAllEnvs(); }
  });
});
