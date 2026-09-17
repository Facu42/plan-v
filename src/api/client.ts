import type { Brief, DemoNotice, GoalStatus, MealLog, Message, Patient, Stage } from '../types';
import { getSessionToken } from '../lib/supabase';
import type { ClinicalNoteRecord, PatientIntakeView, ProfessionalIntakeView } from '../types/intake';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type PatientInvite = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  email: string;
  status: 'not_sent' | 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_at: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (init?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  const headers = await authHeaders();
  if (init?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  const res = await fetch(path, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new ApiError(res.status, err || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function isAbortError(error: unknown): boolean {
  return (error instanceof DOMException || error instanceof Error) && error.name === 'AbortError';
}

export type PatientListPage = {
  patients: Patient[];
  page: { offset: number; limit: number; has_more: boolean };
  source?: string;
};

export const api = {
  health: (init?: RequestInit) => request<{ status: string; ai: boolean; supabase: boolean }>('/api/health', init),

  getPatients: (query?: { limit?: number; offset?: number }, init?: RequestInit) => {
    const params = new URLSearchParams();
    if (query?.limit != null) params.set('limit', String(query.limit));
    if (query?.offset != null) params.set('offset', String(query.offset));
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<PatientListPage>(`/api/patients${suffix}`, init);
  },

  createPatient: (data: { name: string; email: string; goal: string }) =>
    request<{ patient: Patient; invite: PatientInvite; source: string }>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendInvite: (inviteId: string) =>
    request<{ invite: PatientInvite; source: string }>(`/api/invites/${inviteId}/send`, { method: 'POST' }),

  revokeInvite: (inviteId: string) =>
    request<{ invite: PatientInvite; source: string }>(`/api/invites/${inviteId}/revoke`, { method: 'POST' }),

  acceptInvite: (inviteId: string) =>
    request<{ patient_id: string; source: string }>('/api/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ invite_id: inviteId }),
    }),

  recoverAccount: (email: string) =>
    request<{ message: string }>('/api/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  updatePatientProfile: (patientId: string, data: {
    name?: string;
    status?: string;
    stage?: Stage;
    sensitive_hours?: string;
    plan_b?: string;
    next_focus?: string;
  }) => request<{ patient: Patient }>(`/api/patients/${patientId}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  setPatientArchived: (patientId: string, archived: boolean) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    }),

  getMyPatient: (init?: RequestInit) => request<{ patient: Patient | null; shoppingList: string[] }>('/api/me/patient', init),

  getPatient: (id: string, init?: RequestInit) =>
    request<{ patient: Patient; shoppingList: string[] }>(`/api/patients/${id}`, init),

  setupNutritionist: (displayName: string) =>
    request<{ nutritionist_id: string }>('/api/nutritionist/setup', {
      method: 'POST',
      body: JSON.stringify({ display_name: displayName }),
    }),

  analyzeMeal: (patientId: string, data: { description?: string; imageBase64?: string; slot: string; photoPreview?: string }) =>
    request<{ analysis: unknown; log: MealLog; patient: Patient }>(`/api/patients/${patientId}/meals/analyze`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMeal: (patientId: string, mealId: string, data: Partial<MealLog>) =>
    request<{ log: MealLog; patient: Patient }>(`/api/patients/${patientId}/meals/${mealId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateMenuSlot: (patientId: string, data: { day: string; slot: string; title: string }) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/menu`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  removeMenuSlot: (patientId: string, day: string, slot: string) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/menu/${encodeURIComponent(day)}/${encodeURIComponent(slot)}`, {
      method: 'DELETE',
    }),

  updateAppointment: (patientId: string, appointment: { day: string; time: string; duration: number; channel: string; meet_url?: string } | null) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/appointment`, {
      method: 'PUT',
      body: JSON.stringify({ appointment }),
    }),

  rescheduleAppointment: (patientId: string, appointment: { day: string; time: string }) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/appointment/reschedule`, {
      method: 'POST',
      body: JSON.stringify(appointment),
    }),

  listNotices: (patientId?: string) =>
    request<{ notices: DemoNotice[]; source: string }>(patientId ? `/api/notices?patientId=${encodeURIComponent(patientId)}` : '/api/notices'),

  enqueueReminderNotice: (data: { patientId: string; title: string; detail: string }) =>
    request<{ notice: DemoNotice; source: string }>('/api/notices', {
      method: 'POST',
      body: JSON.stringify({ patientId: data.patientId, kind: 'reminder', title: data.title, detail: data.detail }),
    }),

  updateBilling: (patientId: string, data: { status: 'pending' | 'waived' } | { status: 'active'; billing_until: string }) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/billing`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateGoal: (patientId: string, data: { goal: string; status: GoalStatus; progress: number; note?: string }) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/goal`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  generateBrief: (patientId: string) =>
    request<{ brief: Brief; patient: Patient }>(`/api/patients/${patientId}/copilot`, { method: 'POST' }),

  dismissBrief: (patientId: string) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/brief/dismiss`, { method: 'POST' }),

  sendMessage: (patientId: string, text: string, from: 'vero' | 'patient', suggestedByAi = false) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, from, suggested_by_ai: suggestedByAi }),
    }),

  markMessagesRead: (patientId: string, reader: 'vero' | 'patient') =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/messages/read`, {
      method: 'POST',
      body: JSON.stringify({ reader }),
    }),

  logActivity: (patientId: string, data: { activity: string; duration_minutes: number; intensity: 'suave' | 'moderada' | 'intensa'; note?: string }) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  assignResource: (resourceId: string, patientIds: string[]) =>
    request<{ patients: Patient[]; assigned_count: number; existing_count: number; source: string }>('/api/resources/assign', {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId, patient_ids: patientIds }),
    }),

  markResourceRead: (patientId: string, resourceId: string) =>
    request<{ patient: Patient; source: string }>(`/api/patients/${patientId}/resources/${encodeURIComponent(resourceId)}/read`, {
      method: 'POST',
    }),

  updateHabits: (patientId: string, data: { hydration?: number; energy?: string | null; sleep_minutes?: number }) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/habits`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getConsentCatalog: (init?: RequestInit) => request<{ schema_version: string; consents: Array<{ purpose: string; text_version: string; text: string; text_hash: string; required: boolean }> }>('/api/consents/catalog', init),

  getIntake: (patientId: string, init?: RequestInit) => request<PatientIntakeView & { source: string }>(`/api/patients/${patientId}/intake`, init),
  getProfessionalIntake: (patientId: string, init?: RequestInit) => request<ProfessionalIntakeView>(`/api/patients/${patientId}/intake/professional`, init),
  reviewIntake: (patientId: string, expectedRevision: number) => request<ProfessionalIntakeView>(`/api/patients/${patientId}/intake/review`, { method: 'POST', body: JSON.stringify({ expected_revision: expectedRevision }) }),
  addClinicalNote: (patientId: string, body: string) => request<{ clinical_note: ClinicalNoteRecord }>(`/api/patients/${patientId}/clinical-notes`, { method: 'POST', body: JSON.stringify({ body }) }),

  patchIntake: (patientId: string, data: { expected_revision: number; step?: string; payload?: unknown }) =>
    request<{ intake: { revision: number; status: string }; source: string }>(`/api/patients/${patientId}/intake`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  submitIntake: (patientId: string, expectedRevision: number) =>
    request<{ intake: { revision: number; status: string }; source: string }>(`/api/patients/${patientId}/intake/submit`, {
      method: 'POST',
      body: JSON.stringify({ expected_revision: expectedRevision }),
    }),

  recordConsent: (patientId: string, data: { purpose: string; text_version: string; text_hash: string; decision: 'granted' | 'withdrawn' }) =>
    request<{ consent: unknown; source: string }>(`/api/patients/${patientId}/consents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
