import { beforeEach, describe, expect, it, vi } from 'vitest';

const SENTINEL = 'PRIVATE_AUDIT_SENTINEL';

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetPatientById: vi.fn(),
  sbGetPatientForUser: vi.fn(),
  sbGetProfileRole: vi.fn(),
  computeShoppingList: vi.fn(() => []),
}));

vi.mock('./db/supabase-repo.js', () => sbMocks);

vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-1' } : null),
  getSupabaseAdmin: () => ({}),
}));

import { app } from './index.js';
import type { Patient } from '../src/types/index.js';

function authed() {
  return { headers: { Authorization: 'Bearer test-token' } };
}

function patientRecord(): Patient {
  return {
    id: 'pat-1',
    name: 'Sofía',
    initials: 'SC',
    tone: 'mint',
    status: 'En ritmo',
    billing_status: 'waived',
    billing_until: null,
    stage: 'plan',
    goal: 'Ritmo',
    sensitive_hours: SENTINEL,
    plan_b: SENTINEL,
    next_focus: SENTINEL,
    adherence_score: 60,
    adherence_why: SENTINEL,
    time: 'hoy',
    hydration: 3,
    energy: null,
    sleep_minutes: null,
    appointment: { when: 'Mañana 10:00', duration: 45, channel: 'Meet', prep_note: SENTINEL } as Patient['appointment'],
    habit_logs: [],
    todayPlan: [],
    weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Ensalada', internalNote: SENTINEL }] as unknown as Patient['weekPlan'][number]['meals'] }],
    brief: {
      suggested_action: 'mensaje',
      up_next_title: SENTINEL,
      up_next_body: SENTINEL,
      draft_message: SENTINEL,
      source_ids: [],
      adherence_why: SENTINEL,
    },
    timeline: [{ id: 'private', kind: 'goal', atLabel: 'HOY', title: SENTINEL, body: SENTINEL }],
    meal_logs: [],
    messages: [{
      id: 'sent-message',
      patient_id: 'pat-1',
      from: 'vero',
      text: 'Hola',
      suggested_by_ai: false,
      sent_at: '2026-09-05T00:00:00.000Z',
    }],
  };
}

describe('patient JSON privacy for real auth actors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const record = patientRecord();
    sbMocks.sbGetPatientById.mockResolvedValue(record);
    sbMocks.sbGetPatientForUser.mockResolvedValue(record);
    sbMocks.sbGetPatientResource.mockResolvedValue({
      id: 'pat-1',
      nutritionistId: 'nutri-1',
      billing_status: 'waived',
      billing_until: null,
    });
  });

  it('strips sentinels from /api/me/patient', async () => {
    sbMocks.sbGetProfileRole.mockResolvedValue('paciente');
    const response = await app.request('/api/me/patient', authed());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain(SENTINEL);
    expect(body.patient.id).toBe('pat-1');
  });

  it('strips sentinels from /api/patients/:id for the patient actor', async () => {
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    const response = await app.request('/api/patients/pat-1', authed());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain(SENTINEL);
    expect(body.patient.id).toBe('pat-1');
  });

  it('keeps professional notes and timeline for the nutritionist', async () => {
    sbMocks.sbGetActor.mockResolvedValue({ role: 'nutri', userId: 'user-1', nutritionistId: 'nutri-1' });
    const response = await app.request('/api/patients/pat-1', authed());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.patient.plan_b).toBe(SENTINEL);
    expect(body.patient.timeline[0].title).toBe(SENTINEL);
    expect(body.patient.brief.draft_message).toBe(SENTINEL);
  });

  it('keeps patient A isolated from patient B', async () => {
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    sbMocks.sbGetPatientResource.mockResolvedValue({
      id: 'pat-2',
      nutritionistId: 'nutri-1',
      billing_status: 'waived',
      billing_until: null,
    });
    const response = await app.request('/api/patients/pat-2', authed());
    expect(response.status).toBe(403);
  });
});
