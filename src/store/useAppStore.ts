import { create } from 'zustand';
import { api } from '../api/client';
import type { Patient } from '../types';

type AppState = {
  patients: Patient[];
  activePatientId: string;
  shoppingList: string[];
  loading: boolean;
  aiEnabled: boolean;
  error: string | null;
  boot: () => Promise<void>;
  refreshPatient: (id: string) => Promise<void>;
  setActivePatient: (id: string) => void;
  selectCrmPatient: (id: string) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  patients: [],
  activePatientId: 'pat-sofia',
  shoppingList: [],
  loading: true,
  aiEnabled: false,
  error: null,

  boot: async () => {
    try {
      const [health, { patients }] = await Promise.all([api.health(), api.getPatients()]);
      set({ patients, aiEnabled: health.ai, loading: false, error: null });
      const active = get().activePatientId;
      const { shoppingList } = await api.getPatient(active);
      set({ shoppingList });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Error de conexión' });
    }
  },

  refreshPatient: async (id: string) => {
    const { patient, shoppingList } = await api.getPatient(id);
    set((s) => ({
      patients: s.patients.map((p) => (p.id === id ? patient : p)),
      shoppingList: id === s.activePatientId ? shoppingList : s.shoppingList,
    }));
  },

  setActivePatient: (id: string) => {
    set({ activePatientId: id });
    get().refreshPatient(id);
  },

  selectCrmPatient: (id: string) => {
    set({ activePatientId: id });
    get().refreshPatient(id);
  },
}));

export function useActivePatient(): Patient | undefined {
  const { patients, activePatientId } = useAppStore();
  return patients.find((p) => p.id === activePatientId);
}

export function pendingReviewCount(patient: Patient): number {
  return patient.meal_logs.filter((l) => l.status === 'pending_review').length;
}

export function confidenceBand(c: number): 'high' | 'medium' | 'low' {
  if (c >= 0.75) return 'high';
  if (c >= 0.45) return 'medium';
  return 'low';
}

export function scoreBand(score: number): 0 | 1 | 2 | 3 {
  if (score >= 80) return 0;
  if (score >= 70) return 1;
  if (score >= 55) return 2;
  return 3;
}

export function gaugeLabel(score: number): string {
  if (score >= 80) return 'en ritmo';
  if (score >= 60) return 'irregular';
  return 'a mirar';
}

export const UP_NEXT_CTA = {
  mensaje: 'Preparar mensaje',
  ajuste_menu: 'Abrir el slot',
  turno: 'Abrir preparación',
} as const;

export const STAGE_RAIL = ['ingreso', 'plan', 'seguimiento', 'alta'] as const;
