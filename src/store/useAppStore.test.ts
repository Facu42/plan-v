import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Patient } from '../types';

const apiMocks = vi.hoisted(() => ({
  health: vi.fn(),
  getPatients: vi.fn(),
  getPatient: vi.fn(),
  getMyPatient: vi.fn(),
}));

vi.mock('../api/client', () => ({
  api: apiMocks,
  isAbortError: (error: unknown) => error instanceof Error && error.name === 'AbortError',
}));

import { useAppStore } from './useAppStore';

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'pat-sofia',
    name: 'Sofía',
    initials: 'SR',
    tone: 'mint',
    status: 'En ritmo',
    billing_status: 'waived',
    billing_until: null,
    stage: 'plan',
    goal: 'Ritmo',
    sensitive_hours: '',
    plan_b: '',
    next_focus: '',
    adherence_score: 60,
    adherence_why: '',
    time: 'hoy',
    hydration: 0,
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
    ...overrides,
  };
}

describe('session-scoped app store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.getState().reset();
    apiMocks.health.mockResolvedValue({ status: 'ok', ai: false, supabase: false });
  });

  afterEach(() => {
    useAppStore.getState().reset();
  });

  it('loads directory pages and hydrates only the active patient', async () => {
    const first = patient({ id: 'pat-sofia', meal_logs: [] });
    const second = patient({ id: 'pat-ana', name: 'Ana' });
    apiMocks.getPatients
      .mockResolvedValueOnce({
        patients: [first],
        page: { offset: 0, limit: 50, has_more: true },
        source: 'memory',
      })
      .mockResolvedValueOnce({
        patients: [second],
        page: { offset: 50, limit: 50, has_more: false },
        source: 'memory',
      });
    apiMocks.getPatient.mockResolvedValue({
      patient: { ...first, meal_logs: [{ id: 'meal-1', patient_id: 'pat-sofia', slot: 'Almuerzo', photo_url: null, description: 'Bowl', foods: [], macros: null, confidence: 0.8, note_for_nutri: '', status: 'pending_review', logged_at: '2026-09-17T12:00:00.000Z' }] },
      shoppingList: ['Bowl'],
    });

    await useAppStore.getState().boot({ isNutri: true });

    expect(apiMocks.getPatients).toHaveBeenCalledTimes(2);
    expect(useAppStore.getState().patients.map((item) => item.id)).toEqual(['pat-sofia', 'pat-ana']);
    expect(useAppStore.getState().patients[0].meal_logs).toHaveLength(1);
    expect(useAppStore.getState().shoppingList).toEqual(['Bowl']);
    expect(apiMocks.getPatient).toHaveBeenCalledWith('pat-sofia', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('drops in-flight detail after logout so the next session starts empty', async () => {
    useAppStore.setState({ patients: [patient()], activePatientId: 'pat-sofia' });
    let finish: (value: { patient: Patient; shoppingList: string[] }) => void = () => {};
    apiMocks.getPatient.mockImplementation(() => new Promise((resolve) => {
      finish = resolve;
    }));

    const pending = useAppStore.getState().refreshPatient('pat-sofia');
    useAppStore.getState().reset();
    finish({ patient: patient({ name: 'Otra sesión' }), shoppingList: ['Privado'] });
    await pending;

    expect(useAppStore.getState().patients).toEqual([]);
    expect(useAppStore.getState().shoppingList).toEqual([]);
    expect(useAppStore.getState().activePatientId).toBe('');
  });
});
