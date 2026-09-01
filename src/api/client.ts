import type { Brief, MealLog, Message, Patient } from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; ai: boolean }>('/api/health'),

  getPatients: () => request<{ patients: Patient[] }>('/api/patients'),

  getPatient: (id: string) =>
    request<{ patient: Patient; shoppingList: string[] }>(`/api/patients/${id}`),

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

  generateBrief: (patientId: string) =>
    request<{ brief: Brief; patient: Patient }>(`/api/patients/${patientId}/copilot`, { method: 'POST' }),

  sendMessage: (patientId: string, text: string, from: 'vero' | 'patient', suggestedByAi = false) =>
    request<{ message: Message; patient: Patient }>(`/api/patients/${patientId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, from, suggested_by_ai: suggestedByAi }),
    }),

  updateHabits: (patientId: string, data: { hydration?: number; energy?: string | null }) =>
    request<{ patient: Patient }>(`/api/patients/${patientId}/habits`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
