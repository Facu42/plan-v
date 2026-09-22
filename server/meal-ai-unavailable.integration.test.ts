import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_CATALOG } from './intake/consent.js';
import { AIUnavailableError } from './ai/errors.js';
import { UNAVAILABLE_MEAL_NOTE } from './ai/meal-analyzer.js';

const analyzeMocks = vi.hoisted(() => ({ analyzeMeal: vi.fn() }));
vi.mock('./ai/meal-analyzer.js', async () => {
  const actual = await vi.importActual<typeof import('./ai/meal-analyzer.js')>('./ai/meal-analyzer.js');
  return { ...actual, analyzeMeal: analyzeMocks.analyzeMeal };
});

vi.mock('./intake/repository.js', async (original) => ({
  ...await original<typeof import('./intake/repository.js')>(),
  readIntakeBundle: async () => ({
    intake: {},
    consents: CONSENT_CATALOG.map((entry) => ({ ...entry, decision: 'granted' })),
  }),
}));

const diaryMocks = vi.hoisted(() => ({
  saveMealLog: vi.fn(),
  recordMealAnalysis: vi.fn(),
  reviewMealLog: vi.fn(),
}));

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetPatientById: vi.fn(),
  sbAddTimelineEvent: vi.fn(),
}));

vi.mock('./diary/repository.js', async (original) => ({
  ...await original<typeof import('./diary/repository.js')>(),
  saveMealLog: diaryMocks.saveMealLog,
  recordMealAnalysis: diaryMocks.recordMealAnalysis,
  reviewMealLog: diaryMocks.reviewMealLog,
}));

vi.mock('./db/supabase-repo.js', () => sbMocks);
vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-1' } : null),
  getSupabaseAdmin: () => ({}),
  createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
}));

import { app } from './index.js';

function authedJson(body: unknown) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
    body: JSON.stringify(body),
  };
}

describe('meal analyze keeps the log when AI is unavailable (supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyzeMocks.analyzeMeal.mockRejectedValue(new AIUnavailableError());
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    sbMocks.sbGetPatientResource.mockResolvedValue({
      id: 'pat-1',
      nutritionistId: 'nutri-1',
      billing_status: 'waived',
      billing_until: null,
    });
    sbMocks.sbGetPatientById.mockResolvedValue({
      id: 'pat-1',
      name: 'Sofía',
      initials: 'SC',
      tone: 'mint',
      status: 'En ritmo',
      billing_status: 'waived',
      billing_until: null,
      stage: 'plan',
      goal: '',
      sensitive_hours: '',
      plan_b: '',
      next_focus: '',
      adherence_score: 60,
      adherence_why: '',
      time: 'hoy',
      hydration: 3,
      energy: null,
      sleep_minutes: null,
      appointment: null,
      habit_logs: [],
      todayPlan: [],
      weekPlan: [],
      brief: null,
      timeline: [],
      meal_logs: [],
      messages: [],
    });
    sbMocks.sbAddTimelineEvent.mockResolvedValue(undefined);
    diaryMocks.saveMealLog.mockImplementation(async (_patientId: string, input: Record<string, unknown>) => ({
      duplicate: false,
      log: {
        id: 'log-fail',
        patient_id: 'pat-1',
        slot: input.slot,
        photo_url: input.photo_url ?? null,
        description: input.description ?? null,
        foods: [],
        macros: null,
        confidence: 0,
        note_for_nutri: '',
        status: 'pending_review',
        logged_at: new Date().toISOString(),
        analysis_status: 'pending',
      },
    }));
    diaryMocks.recordMealAnalysis.mockImplementation(async (_patientId: string, mealId: string, input: Record<string, unknown>) => ({
      id: mealId,
      patient_id: 'pat-1',
      slot: 'Almuerzo',
      photo_url: null,
      description: 'Milanesa de pollo con ensalada',
      foods: input.foods,
      macros: input.macros,
      confidence: input.confidence,
      note_for_nutri: input.note_for_nutri,
      status: 'pending_review',
      logged_at: new Date().toISOString(),
      analysis_status: input.status,
    }));
  });

  it('persists description and photo metadata without substituting demo foods', async () => {
    const response = await app.request('/api/patients/pat-1/meals/analyze', authedJson({
      slot: 'Almuerzo',
      description: 'Milanesa de pollo con ensalada',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(diaryMocks.saveMealLog).toHaveBeenCalledOnce();
    expect(analyzeMocks.analyzeMeal).toHaveBeenCalledOnce();
    expect(diaryMocks.recordMealAnalysis).toHaveBeenCalledOnce();
    expect(diaryMocks.saveMealLog.mock.invocationCallOrder[0]).toBeLessThan(analyzeMocks.analyzeMeal.mock.invocationCallOrder[0]);
    const [, saved] = diaryMocks.saveMealLog.mock.calls[0];
    expect(saved).toMatchObject({
      slot: 'Almuerzo',
      description: 'Milanesa de pollo con ensalada',
      photo_url: null,
    });
    const [, , analysis] = diaryMocks.recordMealAnalysis.mock.calls[0];
    expect(analysis).toMatchObject({
      status: 'failed',
      foods: [],
      macros: null,
      confidence: 0,
      note_for_nutri: UNAVAILABLE_MEAL_NOTE,
      error_code: 'AI_UNAVAILABLE',
    });
    expect(JSON.stringify(analysis.foods)).not.toMatch(/pollo a la plancha|quinoa|proteína principal/);
    expect(body.log).toMatchObject({ status: 'pending_review', foods: [], macros: null, confidence: 0 });
    expect(body.log).not.toHaveProperty('note_for_nutri');
    expect(body.analysis).not.toHaveProperty('note_for_nutri');
    expect(sbMocks.sbAddTimelineEvent.mock.calls[0][1].body).toContain('estimación no disponible');
  });
});
