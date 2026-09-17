import { beforeEach, describe, expect, it, vi } from 'vitest';

const analyzeMocks = vi.hoisted(() => ({ analyzeMeal: vi.fn() }));
const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetPatientById: vi.fn(),
  sbAddMessage: vi.fn(),
  sbAddTimelineEvent: vi.fn(),
  computeShoppingList: vi.fn(() => []),
}));

vi.mock('./ai/meal-analyzer.js', () => analyzeMocks);
vi.mock('./db/supabase-repo.js', () => sbMocks);
vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-1' } : null),
  getSupabaseAdmin: () => ({}),
}));

import { app } from './index.js';

function authedJson(body: unknown) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
    body: JSON.stringify(body),
  };
}

describe('AI and persistence failures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('rejects an unsupported persistent photo before calling the analyzer', async () => {
    const response = await app.request('/api/patients/pat-1/meals/analyze', authedJson({
      slot: 'Almuerzo',
      description: 'pollo',
      photoPreview: 'data:image/jpeg;base64,AAAA',
    }));

    expect(response.status).toBe(501);
    expect(analyzeMocks.analyzeMeal).not.toHaveBeenCalled();
  });

  it('does not report a sent message when the insert fails', async () => {
    sbMocks.sbAddMessage.mockRejectedValue({ message: 'synthetic database failure' });
    const response = await app.request('/api/patients/pat-1/messages', authedJson({
      text: 'Hola',
      from: 'patient',
    }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(JSON.stringify(body)).not.toContain('synthetic database failure');
    expect(body).not.toHaveProperty('patient');
    expect(sbMocks.sbAddTimelineEvent).not.toHaveBeenCalled();
  });
});
