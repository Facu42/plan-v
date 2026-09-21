import { beforeEach, describe, expect, it, vi } from 'vitest';

const patient = {
  id: 'pat-1',
  name: 'Sofía',
  initials: 'SC',
  tone: 'mint' as const,
  status: 'En ritmo',
  billing_status: 'waived' as const,
  billing_until: null,
  stage: 'plan' as const,
  goal: 'Ritmo',
  sensitive_hours: '',
  plan_b: '',
  next_focus: '',
  adherence_score: 60,
  adherence_why: '',
  time: 'hoy',
  hydration: 3,
  energy: null,
  sleep_minutes: 420,
  appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video' },
  habit_logs: [],
  todayPlan: [],
  weekPlan: [{ day: 'Jueves', meals: [{ slot: 'Almuerzo', title: 'Bowl' }] }],
  brief: {
    suggested_action: 'mensaje' as const,
    up_next_title: 'Mensaje',
    up_next_body: 'Cuerpo',
    draft_message: 'Hola',
    source_ids: [],
    adherence_why: 'privado',
  },
  timeline: [],
  meal_logs: [],
  messages: [],
};

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetPatientById: vi.fn(),
  sbGetProfileRole: vi.fn(),
  sbUpdatePatientProfile: vi.fn(),
  sbUpdateGoal: vi.fn(),
  sbUpdateHabits: vi.fn(),
  sbUpsertMenuSlot: vi.fn(),
  sbDeleteMenuSlot: vi.fn(),
  sbAddTimelineEvent: vi.fn(),
  sbSetAppointment: vi.fn(),
  sbRescheduleAppointment: vi.fn(),
  sbConfirmAppointment: vi.fn(),
  sbGetScheduledAppointment: vi.fn(),
  sbDismissBrief: vi.fn(),
  computeShoppingList: vi.fn(() => []),
  SchemaUnavailableError: class SchemaUnavailableError extends Error {
    constructor(message = 'Persistent invite schema is not available') {
      super(message);
      this.name = 'SchemaUnavailableError';
    }
  },
}));

vi.mock('./db/supabase-repo.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./db/supabase-repo.js')>();
  return { ...actual, ...sbMocks };
});

vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-1' } : null),
  getSupabaseAdmin: () => ({}),
  createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
  getAuthAccount: async () => ({ email: 'vero@example.com', emailConfirmed: true }),
}));

import { app } from './index.js';

function authed(method: string, body?: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

describe('PV-10 persistence parity for 016 domains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sbMocks.sbGetActor.mockResolvedValue({ role: 'nutri', userId: 'user-1', nutritionistId: 'nutri-1' });
    sbMocks.sbGetPatientResource.mockResolvedValue({
      id: 'pat-1',
      nutritionistId: 'nutri-1',
      billing_status: 'waived',
      billing_until: null,
    });
    sbMocks.sbGetPatientById.mockResolvedValue(patient);
    sbMocks.sbGetProfileRole.mockResolvedValue('nutri');
  });

  it('writes a profile change and returns the reloaded patient', async () => {
    const response = await app.request('/api/patients/pat-1/profile', authed('PATCH', { next_focus: 'Cena' }));
    expect(response.status).toBe(200);
    expect(sbMocks.sbUpdatePatientProfile).toHaveBeenCalledWith('pat-1', { next_focus: 'Cena' });
    expect(sbMocks.sbGetPatientById).toHaveBeenCalled();
    expect((await response.json()).source).toBe('supabase');
  });

  it('persists sleep with the habit snapshot', async () => {
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    const response = await app.request('/api/patients/pat-1/habits', authed('PATCH', { sleep_minutes: 390 }));
    expect(response.status).toBe(200);
    expect(sbMocks.sbUpdateHabits).toHaveBeenCalledWith('pat-1', { sleep_minutes: 390 });
  });

  it('writes a menu slot and reloads', async () => {
    const response = await app.request('/api/patients/pat-1/menu', authed('PATCH', {
      day: 'Jueves',
      slot: 'Almuerzo',
      title: 'Bowl de lentejas',
    }));
    expect(response.status).toBe(200);
    expect(sbMocks.sbUpsertMenuSlot).toHaveBeenCalledWith('pat-1', 'Jueves', 'Almuerzo', 'Bowl de lentejas');
    expect(sbMocks.sbAddTimelineEvent).toHaveBeenCalled();
  });

  it('schedules an appointment instead of returning 501', async () => {
    const response = await app.request('/api/patients/pat-1/appointment', authed('PUT', {
      appointment: { day: 'Viernes', time: '10:00', duration: 45, channel: 'video' },
    }));
    expect(response.status).toBe(200);
    expect(sbMocks.sbSetAppointment).toHaveBeenCalled();
  });

  it('reschedules from the persisted slot, not from memory', async () => {
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    sbMocks.sbGetScheduledAppointment.mockResolvedValue({
      day: 'Jueves',
      time: '14:30',
      duration: 45,
      channel: 'video',
    });
    const response = await app.request('/api/patients/pat-1/appointment/reschedule', authed('POST', {
      day: 'Viernes',
      time: '11:00',
    }));
    expect(response.status).toBe(200);
    expect(sbMocks.sbRescheduleAppointment).toHaveBeenCalledWith('pat-1', {
      day: 'Viernes',
      time: '11:00',
    });
  });

  it('dismisses a brief and returns the patient afterwards', async () => {
    const response = await app.request('/api/patients/pat-1/brief/dismiss', authed('POST'));
    expect(response.status).toBe(200);
    expect(sbMocks.sbDismissBrief).toHaveBeenCalledWith('pat-1', 'user-1');
    expect((await response.json()).source).toBe('supabase');
  });

  it('keeps billing, archive and activity as explicit gaps', async () => {
    expect((await app.request('/api/patients/pat-1/billing', authed('PATCH', { status: 'waived' }))).status).toBe(501);
    expect((await app.request('/api/patients/pat-1/archive', authed('PATCH', { archived: true }))).status).toBe(501);
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    expect((await app.request('/api/patients/pat-1/activities', authed('POST', {
      activity: 'Caminata',
      duration_minutes: 30,
      intensity: 'suave',
    }))).status).toBe(501);
  });

  it('does not pretend a menu write succeeded when the schema is missing', async () => {
    sbMocks.sbUpsertMenuSlot.mockRejectedValue(new sbMocks.SchemaUnavailableError());
    const response = await app.request('/api/patients/pat-1/menu', authed('PATCH', {
      day: 'Jueves',
      slot: 'Almuerzo',
      title: 'Bowl',
    }));
    expect(response.status).toBe(501);
    expect(JSON.stringify(await response.json())).not.toContain('source":"supabase');
  });
});
