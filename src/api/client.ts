import type { Brief, DemoNotice, GoalStatus, MealLog, Message, Patient, Stage } from '../types';
import { getSessionToken } from '../lib/supabase';

export type PatientInvite = {
  patient_id: string;
  email: string;
  status: 'not_sent';
  created_at: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; ai: boolean; supabase: boolean }>('/api/health'),

  getPatients: () => request<{ patients: Patient[]; source?: string }>('/api/patients'),

  createPatient: (data: { name: string; email: string; goal: string }) =>
    request<{ patient: Patient; invite: PatientInvite; source: string }>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
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

  getMyPatient: () => request<{ patient: Patient | null; shoppingList: string[] }>('/api/me/patient'),

  getPatient: (id: string) =>
    request<{ patient: Patient; shoppingList: string[] }>(`/api/patients/${id}`),

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
};
