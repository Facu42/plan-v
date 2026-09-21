import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock('ai', () => ({ ...mocks, Output: { object: vi.fn((value) => value) } }));
vi.mock('@ai-sdk/openai', () => ({ openai: vi.fn() }));

import { generateMenuProposal, generateRecipeProposal } from './jobs.js';
import { buildAiJobContext, hashAiJobContext } from './jobs-context.js';
import { emptyIntakePayload } from '../intake/payload.js';

const context = buildAiJobContext({
  intake: { ...emptyIntakePayload(), preferred_name: 'Privado', conditions_note: 'Nota privada', allergies: { state: 'reported', items: ['Maní'] }, restrictions: { state: 'none', items: [] } },
  weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Bowl' }] }],
  catalog: [],
  periodStart: '2026-09-14',
  focus: 'Simplificar cenas',
});

describe('jobs de propuesta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'test-only');
  });

  it('bloquea alergias desconocidas antes del proveedor', async () => {
    const unknown = buildAiJobContext({ intake: emptyIntakePayload(), weekPlan: [], catalog: [], periodStart: '2026-09-14' });
    await expect(generateRecipeProposal(unknown)).rejects.toMatchObject({ status: 409 });
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('no cambia a demo cuando el proveedor falla y omite datos identificatorios', async () => {
    mocks.generateText.mockRejectedValue(new Error('provider failed'));
    await expect(generateMenuProposal(context)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    const prompt = mocks.generateText.mock.calls[0][0].prompt as string;
    expect(prompt).toContain('Maní');
    expect(prompt).toContain('Simplificar cenas');
    expect(prompt).not.toContain('Privado');
    expect(prompt).not.toContain('Nota privada');
    expect(hashAiJobContext(context)).toHaveLength(64);
  });
});
