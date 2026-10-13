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
    for(const mock of Object.values(apiMocks))mock.mockReset();
    useAppStore.getState().reset();
    apiMocks.health.mockResolvedValue({ status: 'ok', ai: false, supabase: false });
  });

  afterEach(() => {
    useAppStore.getState().reset();
  });

  it('boot real carga mil pacientes y sólo publica la cartera al terminar todas las páginas',async()=>{
    apiMocks.getPatients.mockImplementation(async(query:{limit:number;offset:number})=>{
      expect(useAppStore.getState().patients).toEqual([]);
      return{patients:Array.from({length:Math.min(query.limit,1000-query.offset)},(_,i)=>patient({id:`patient-${query.offset+i}`,name:'Nombre repetido'})),page:{offset:query.offset,limit:query.limit,has_more:query.offset+query.limit<1000}};
    });
    apiMocks.getPatient.mockResolvedValue({patient:patient({id:'patient-0'}),shoppingList:[]});
    await useAppStore.getState().boot({isNutri:true});
    expect(apiMocks.getPatients).toHaveBeenCalledTimes(20);expect(apiMocks.getPatients.mock.calls.map(([query])=>query.offset)).toEqual(Array.from({length:20},(_,i)=>i*50));
    expect(useAppStore.getState().patients).toHaveLength(1000);expect(useAppStore.getState().patients[999].id).toBe('patient-999');expect(useAppStore.getState().error).toBeNull();
    expect(apiMocks.getPatient).toHaveBeenCalledTimes(1);
  });
  it('un fallo de la segunda página no publica las primeras pacientes ni hidrata una ficha',async()=>{
    apiMocks.getPatients.mockResolvedValueOnce({patients:[patient()],page:{offset:0,limit:50,has_more:true}}).mockRejectedValueOnce(new Error('Página interrumpida'));
    await useAppStore.getState().boot({isNutri:true});expect(useAppStore.getState().patients).toEqual([]);expect(useAppStore.getState().error).toBe('Página interrumpida');expect(apiMocks.getPatient).not.toHaveBeenCalled();
  });
  it('una página vacía que anuncia más no progresa ni se presenta como cartera completa',async()=>{
    apiMocks.getPatients.mockResolvedValue({patients:[],page:{offset:0,limit:50,has_more:true}});
    await useAppStore.getState().boot({isNutri:true});expect(apiMocks.getPatients).toHaveBeenCalledTimes(1);expect(useAppStore.getState().error).toBeTruthy();expect(useAppStore.getState().patients).toEqual([]);
  });
  it('detecta una página repetida en vez de acumular quinientas copias',async()=>{
    apiMocks.getPatients.mockImplementation(async(query:{limit:number;offset:number})=>({patients:[patient()],page:{...query,has_more:true}}));
    await useAppStore.getState().boot({isNutri:true});expect(apiMocks.getPatients).toHaveBeenCalledTimes(2);expect(useAppStore.getState().error).toBeTruthy();expect(useAppStore.getState().patients).toEqual([]);
  });
  it('rechaza metadatos inválidos y mantiene válido el fin vacío de la cartera',async()=>{
    for(const page of [{offset:0,limit:0,has_more:true},{offset:50,limit:50,has_more:true},undefined]){apiMocks.getPatients.mockReset();let calls=0;apiMocks.getPatients.mockImplementation(async()=>{if(++calls>2)throw new Error('Protección de la prueba ante bucle');return{patients:[patient()],page};});await useAppStore.getState().boot({isNutri:true});expect(apiMocks.getPatients).toHaveBeenCalledTimes(1);expect(useAppStore.getState().error).toBeTruthy();expect(useAppStore.getState().patients).toEqual([]);}
    apiMocks.getPatients.mockResolvedValue({patients:[],page:{offset:0,limit:50,has_more:false}});await useAppStore.getState().boot({isNutri:true});expect(useAppStore.getState().error).toBeNull();expect(useAppStore.getState().patients).toEqual([]);
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
