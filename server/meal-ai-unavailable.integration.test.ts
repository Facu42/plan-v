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

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetPatientById: vi.fn(),
  sbAddMealLog: vi.fn(),
  sbAddTimelineEvent: vi.fn(),
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
    sbMocks.sbAddMealLog.mockImplementation(async (_patientId: string, log: Record<string, unknown>) => ({
      id: 'log-fail',
      patient_id: 'pat-1',
      status: 'pending_review',
      logged_at: new Date().toISOString(),
      ...log,
    }));
    sbMocks.sbAddTimelineEvent.mockResolvedValue(undefined);
  });

  it('persists description and photo metadata without substituting demo foods', async () => {
    const response = await app.request('/api/patients/pat-1/meals/analyze', authedJson({
      slot: 'Almuerzo',
      description: 'Milanesa de pollo con ensalada',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(analyzeMocks.analyzeMeal).toHaveBeenCalledOnce();
    expect(sbMocks.sbAddMealLog).toHaveBeenCalledOnce();
    const [, saved] = sbMocks.sbAddMealLog.mock.calls[0];
    expect(saved).toMatchObject({
      slot: 'Almuerzo',
      description: 'Milanesa de pollo con ensalada',
      foods: [],
      macros: null,
      confidence: 0,
      note_for_nutri: UNAVAILABLE_MEAL_NOTE,
    });
    expect(JSON.stringify(saved.foods)).not.toMatch(/pollo a la plancha|quinoa|proteína principal/);
    expect(body.log).toMatchObject({ status: 'pending_review', foods: [], macros: null, confidence: 0 });
    expect(body.log).not.toHaveProperty('note_for_nutri');
    expect(body.analysis).not.toHaveProperty('note_for_nutri');
    expect(sbMocks.sbAddTimelineEvent.mock.calls[0][1].body).toContain('estimación no disponible');
  });
});
