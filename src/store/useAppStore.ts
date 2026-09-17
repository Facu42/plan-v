import { create } from 'zustand';
import { api, isAbortError } from '../api/client';
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
  reset: () => void;
  addPatient: (patient: Patient) => void;
  refreshPatient: (id: string) => Promise<void>;
  setActivePatient: (id: string) => void;
  selectCrmPatient: (id: string) => void;
};

const DIRECTORY_PAGE = 50;
const DIRECTORY_MAX = 500;

let sessionGeneration = 0;
let bootController: AbortController | null = null;
const refreshControllers = new Map<string, AbortController>();

function abortInflight() {
  bootController?.abort();
  bootController = null;
  for (const controller of refreshControllers.values()) controller.abort();
  refreshControllers.clear();
}

async function loadDirectory(signal: AbortSignal): Promise<Patient[]> {
  const patients: Patient[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore && offset < DIRECTORY_MAX) {
    const page = await api.getPatients({ limit: DIRECTORY_PAGE, offset }, { signal });
    patients.push(...page.patients);
    hasMore = page.page?.has_more ?? false;
    offset += page.page?.limit ?? DIRECTORY_PAGE;
  }
  return patients;
}

export const useAppStore = create<AppState>((set, get) => ({
  patients: [],
  activePatientId: 'pat-sofia',
  shoppingList: [],
  loading: true,
  aiEnabled: false,
  supabaseEnabled: false,
  error: null,

  reset: () => {
    sessionGeneration += 1;
    abortInflight();
    set({
      patients: [],
      activePatientId: '',
      shoppingList: [],
      loading: false,
      error: null,
    });
  },

  boot: async (opts = {}) => {
    const generation = sessionGeneration;
    bootController?.abort();
    const controller = new AbortController();
    bootController = controller;
    set({ loading: true, error: null });
    try {
      const health = await api.health({ signal: controller.signal });
      if (generation !== sessionGeneration) return;
      set({ aiEnabled: health.ai, supabaseEnabled: health.supabase, error: null });

      if (opts.isPatient) {
        const { patient, shoppingList } = await api.getMyPatient({ signal: controller.signal });
        if (generation !== sessionGeneration) return;
        if (patient) {
          set({ patients: [patient], activePatientId: patient.id, shoppingList, loading: false });
          return;
        }
        set({ patients: [], activePatientId: '', shoppingList: [], loading: false });
        return;
      }

      const patients = await loadDirectory(controller.signal);
      if (generation !== sessionGeneration) return;
      const active = patients[0]?.id ?? '';
      set({
        patients,
        activePatientId: active,
        loading: false,
      });
      if (active) {
        const { shoppingList, patient } = await api.getPatient(active, { signal: controller.signal });
        if (generation !== sessionGeneration) return;
        set((state) => ({
          patients: state.patients.map((current) => (current.id === patient.id ? patient : current)),
          shoppingList,
        }));
      }
    } catch (e) {
      if (isAbortError(e) || generation !== sessionGeneration) return;
      set({ loading: false, error: e instanceof Error ? e.message : 'Error de conexión' });
    } finally {
      if (bootController === controller) bootController = null;
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
    const generation = sessionGeneration;
    refreshControllers.get(id)?.abort();
    const controller = new AbortController();
    refreshControllers.set(id, controller);
    try {
      const { patient, shoppingList } = await api.getPatient(id, { signal: controller.signal });
      if (generation !== sessionGeneration) return;
      set((state) => ({
        patients: state.patients.some((current) => current.id === id)
          ? state.patients.map((current) => (current.id === id ? patient : current))
          : [...state.patients, patient],
        shoppingList: id === state.activePatientId ? shoppingList : state.shoppingList,
      }));
    } catch (error) {
      if (isAbortError(error) || generation !== sessionGeneration) return;
      throw error;
    } finally {
      if (refreshControllers.get(id) === controller) refreshControllers.delete(id);
    }
  },

  setActivePatient: (id: string) => {
    set({ activePatientId: id });
    void get().refreshPatient(id);
  },

  selectCrmPatient: (id: string) => {
    set({ activePatientId: id });
    void get().refreshPatient(id);
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
