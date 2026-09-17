import { create } from 'zustand';
import { api } from '../api/client';
import type { Patient } from '../types';

type BootOptions = { isNutri?: boolean; isPatient?: boolean };

type AppState = {
  patients: Patient[];
  activePatientId: string;
  shoppingList: string[];
  loading: boolean;
  aiEnabled: boolean;
  supabaseEnabled: boolean;
  error: string | null;
  boot: (opts?: BootOptions) => Promise<void>;
  addPatient: (patient: Patient) => void;
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
  supabaseEnabled: false,
  error: null,

  boot: async (opts = {}) => {
    try {
      const health = await api.health();
      set({ aiEnabled: health.ai, supabaseEnabled: health.supabase, error: null });

      if (opts.isPatient) {
        const { patient, shoppingList } = await api.getMyPatient();
        if (patient) {
          set({ patients: [patient], activePatientId: patient.id, shoppingList, loading: false });
          return;
        }
      }

      const { patients } = await api.getPatients();
      set({
        patients,
        activePatientId: patients[0]?.id ?? '',
        loading: false,
      });
      const active = patients[0]?.id;
      if (active) {
        const { shoppingList } = await api.getPatient(active);
        set({ shoppingList });
      }
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Error de conexión' });
    }
  },

  addPatient: (patient) => {
    set((state) => ({
      patients: state.patients.some((current) => current.id === patient.id)
        ? state.patients.map((current) => (current.id === patient.id ? patient : current))
        : [...state.patients, patient],
      activePatientId: patient.id,
    }));
  },

  refreshPatient: async (id: string) => {
    const { patient, shoppingList } = await api.getPatient(id);
    set((s) => ({
      patients: s.patients.some((p) => p.id === id)
        ? s.patients.map((p) => (p.id === id ? patient : p))
        : [...s.patients, patient],
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
