import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn().mockRejectedValue(new Error('provider unavailable')),
  Output: { object: vi.fn((value) => value) },
}));

import { generateText } from 'ai';
import { analysisOrUnavailable, analyzeMeal, UNAVAILABLE_MEAL_ANALYSIS } from './meal-analyzer.js';
import { AIUnavailableError } from './errors.js';
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
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    await expect(analyzeMeal({ description: 'comida de prueba', slot: 'Almuerzo' }))
      .rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    expect(generateText).toHaveBeenCalled();
  });

  it('rejects empty provider output in live mode', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
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

describe('analysisOrUnavailable', () => {
  it('keeps an empty pending analysis and does not swallow other errors', () => {
    expect(analysisOrUnavailable(new AIUnavailableError())).toEqual(UNAVAILABLE_MEAL_ANALYSIS);
    expect(UNAVAILABLE_MEAL_ANALYSIS.foods).toEqual([]);
    expect(UNAVAILABLE_MEAL_ANALYSIS.macros).toBeNull();
    expect(UNAVAILABLE_MEAL_ANALYSIS.confidence).toBe(0);
    expect(() => analysisOrUnavailable(new Error('db'))).toThrow('db');
  });
});

describe('copilot provider failures', () => {
  beforeEach(() => {
    resetStore();
  });

  it('never substitutes a demo brief when live generation fails', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    const patient = getStore().patients[0];
    await expect(generateCopilotBrief(patient)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
  it('sends only aggregate follow-up signals, without identity or private free text', async () => {
    vi.stubEnv('APP_MODE', 'test');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    const patient = getStore().patients[0];
    patient.name = 'PRIVATE_NAME_SENTINEL';
    patient.goal = 'PRIVATE_GOAL_SENTINEL';
    patient.adherence_why = 'PRIVATE_ADHERENCE_SENTINEL';
    patient.timeline = [{ id: 'PRIVATE_ID_SENTINEL', kind: 'message', atLabel: 'hoy', title: 'PRIVATE_TITLE_SENTINEL', body: 'PRIVATE_BODY_SENTINEL' }];
    patient.meal_logs.forEach(log => {
      log.note_for_nutri = 'PRIVATE_NOTE_SENTINEL';
      log.slot = 'PRIVATE_SLOT_SENTINEL' as typeof log.slot;
    });
    vi.mocked(generateText).mockResolvedValueOnce({ output: { suggested_action: null, up_next_title: null, up_next_body: null, draft_message: null, source_ids: [], adherence_why: 'Seguimiento pendiente' } } as never);
    await generateCopilotBrief(patient);
    const sent = vi.mocked(generateText).mock.calls[0][0];
    expect(sent.prompt).not.toContain('PRIVATE_');
    expect(JSON.parse(String(sent.prompt))).toMatchObject({ adherence_score: patient.adherence_score, hydration: patient.hydration });
  });
});
