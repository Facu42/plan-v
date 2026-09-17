import { beforeEach, describe, expect, it, vi } from 'vitest';

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetPatientById: vi.fn(),
  sbAddMealLog: vi.fn(),
  sbUpdateMealLog: vi.fn(),
  sbUpdateHabits: vi.fn(),
  sbAddTimelineEvent: vi.fn(),
}));

vi.mock('./db/supabase-repo.js', () => sbMocks);

vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-1' } : null),
  getSupabaseAdmin: () => ({}),
}));

import { app } from './index.js';

function authedJson(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
    body: JSON.stringify(body),
  };
}

function fakePatient() {
  return {
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
    briefDismissed: false,
    timeline: [],
    meal_logs: [],
    messages: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('OPENAI_API_KEY', '');
  sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
  sbMocks.sbGetPatientResource.mockResolvedValue({
    id: 'pat-1',
    nutritionistId: 'nutri-1',
    billing_status: 'waived',
    billing_until: null,
  });
  sbMocks.sbGetPatientById.mockResolvedValue(fakePatient());
  sbMocks.sbAddTimelineEvent.mockResolvedValue(undefined);
});

function asNutri() {
  sbMocks.sbGetActor.mockResolvedValue({ role: 'nutri', userId: 'user-1', nutritionistId: 'nutri-1' });
}

describe('timeline emission in Supabase mode (parity with memory)', () => {
  it('emits meal_logged when a patient meal is analyzed and stored', async () => {
    sbMocks.sbAddMealLog.mockResolvedValue({
      id: 'log-1',
      patient_id: 'pat-1',
      slot: 'Almuerzo',
      photo_url: null,
      description: 'Bowl de quinoa',
      foods: [],
      macros: null,
      confidence: 0.62,
      note_for_nutri: '',
      status: 'pending_review',
      logged_at: new Date().toISOString(),
    });

    const res = await app.request('/api/patients/pat-1/meals/analyze', authedJson('POST', {
      slot: 'Almuerzo',
      description: 'Bowl de quinoa',
    }));

    expect(res.status).toBe(200);
    expect(sbMocks.sbAddMealLog).toHaveBeenCalledOnce();
    expect(sbMocks.sbAddTimelineEvent).toHaveBeenCalledOnce();
    const [patientId, event] = sbMocks.sbAddTimelineEvent.mock.calls[0];
    expect(patientId).toBe('pat-1');
    expect(event).toMatchObject({ kind: 'meal_logged', title: 'Almuerzo · foto en revisión' });
    expect(event.body).toContain('estimación');
  });

  it('emits meal_logged confirmado with foods and kcal on review', async () => {
    asNutri();
    sbMocks.sbUpdateMealLog.mockResolvedValue({
      id: 'meal-1',
      patient_id: 'pat-1',
      slot: 'Almuerzo',
      photo_url: null,
      description: null,
      foods: [{ name: 'pollo', portion_est: null, portion_unit: 'u', confidence: 0.9 }],
      macros: { kcal: 520, protein_g: 30, carbs_g: 40, fat_g: 20 },
      confidence: 0.9,
      note_for_nutri: '',
      status: 'confirmed',
      logged_at: new Date().toISOString(),
    });

    const res = await app.request('/api/patients/pat-1/meals/meal-1', authedJson('PATCH', { status: 'confirmed' }));

    expect(res.status).toBe(200);
    expect(sbMocks.sbAddTimelineEvent).toHaveBeenCalledOnce();
    const [patientId, event] = sbMocks.sbAddTimelineEvent.mock.calls[0];
    expect(patientId).toBe('pat-1');
    expect(event).toMatchObject({ kind: 'meal_logged', title: 'Almuerzo · confirmado', body: 'pollo · 520 kcal' });
  });

  it('emits meal_logged ajustado when the review adjusts', async () => {
    asNutri();
    sbMocks.sbUpdateMealLog.mockResolvedValue({
      id: 'meal-1',
      patient_id: 'pat-1',
      slot: 'Cena',
      photo_url: null,
      description: null,
      foods: [{ name: 'ensalada', portion_est: null, portion_unit: 'u', confidence: 0.8 }],
      macros: { kcal: 300, protein_g: 10, carbs_g: 20, fat_g: 15 },
      confidence: 0.8,
      note_for_nutri: '',
      status: 'adjusted',
      logged_at: new Date().toISOString(),
    });

    const res = await app.request('/api/patients/pat-1/meals/meal-1', authedJson('PATCH', {
      status: 'adjusted',
      macros: { kcal: 300, protein_g: 10, carbs_g: 20, fat_g: 15 },
    }));

    expect(res.status).toBe(200);
    const [, event] = sbMocks.sbAddTimelineEvent.mock.calls[0];
    expect(event.title).toBe('Cena · ajustado');
  });

  it('does not emit timeline events on habit updates (memory parity)', async () => {
    sbMocks.sbUpdateHabits.mockResolvedValue(undefined);

    const res = await app.request('/api/patients/pat-1/habits', authedJson('PATCH', { hydration: 5 }));

    expect(res.status).toBe(200);
    expect(sbMocks.sbUpdateHabits).toHaveBeenCalledOnce();
    expect(sbMocks.sbAddTimelineEvent).not.toHaveBeenCalled();
  });
});
