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

  it('recarga importada: descarta respuesta diferida de A después de reset e ingreso B',async()=>{
    const ownerA=patient({id:'patient-a'}),ownerB=patient({id:'patient-b'});
    useAppStore.setState({patients:[ownerA],activePatientId:ownerA.id,shoppingList:['A']});
    let finish!:(value:unknown)=>void;
    apiMocks.getPatients.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    const pending=useAppStore.getState().refreshDirectory();
    const signal=apiMocks.getPatients.mock.calls[0][1]?.signal as AbortSignal|undefined;
    useAppStore.getState().reset();
    useAppStore.setState({patients:[ownerB],activePatientId:ownerB.id,shoppingList:['B']});
    finish({patients:[ownerA],page:{offset:0,limit:50,has_more:false}});
    await pending;
    expect(useAppStore.getState()).toMatchObject({patients:[ownerB],activePatientId:ownerB.id,shoppingList:['B']});
    expect(signal?.aborted).toBe(true);
  });
  it('recarga importada: no publica página parcial si la segunda falla',async()=>{
    const previous=patient({id:'previous'});useAppStore.setState({patients:[previous],activePatientId:previous.id});
    apiMocks.getPatients.mockResolvedValueOnce({patients:[patient({id:'new-a'})],page:{offset:0,limit:50,has_more:true}})
      .mockImplementationOnce(async()=>{expect(useAppStore.getState().patients).toEqual([previous]);throw new Error('Página interrumpida');});
    await expect(useAppStore.getState().refreshDirectory()).rejects.toThrow('Página interrumpida');
    expect(useAppStore.getState().patients).toEqual([previous]);expect(useAppStore.getState().activePatientId).toBe(previous.id);
  });
  it('recarga importada: publica una sola cartera completa y conserva la paciente activa válida',async()=>{
    const active=patient({id:'active'});useAppStore.setState({patients:[active],activePatientId:active.id,shoppingList:['Lista activa']});
    const changes:Patient[][]=[];const unsubscribe=useAppStore.subscribe((state,previous)=>{if(state.patients!==previous.patients)changes.push(state.patients);});
    apiMocks.getPatients.mockResolvedValueOnce({patients:[patient({id:'new-a'})],page:{offset:0,limit:50,has_more:true}})
      .mockResolvedValueOnce({patients:[active],page:{offset:50,limit:50,has_more:false}});
    try{await useAppStore.getState().refreshDirectory();}finally{unsubscribe();}
    expect(changes.map(list=>list.map(p=>p.id))).toEqual([['new-a','active']]);
    expect(useAppStore.getState()).toMatchObject({activePatientId:'active',shoppingList:['Lista activa']});expect(apiMocks.getPatient).not.toHaveBeenCalled();
  });
  it('recarga importada: una solicitud posterior reemplaza a la anterior sin publicar su respuesta',async()=>{
    let finish!:(value:unknown)=>void;
    apiMocks.getPatients.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    const old=useAppStore.getState().refreshDirectory(),oldSignal=apiMocks.getPatients.mock.calls[0][1].signal as AbortSignal;
    apiMocks.getPatients.mockResolvedValueOnce({patients:[patient({id:'latest'})],page:{offset:0,limit:50,has_more:false}});
    await useAppStore.getState().refreshDirectory();finish({patients:[patient({id:'stale'})],page:{offset:0,limit:50,has_more:false}});await old;
    expect(oldSignal.aborted).toBe(true);expect(useAppStore.getState().patients.map(p=>p.id)).toEqual(['latest']);
  });
  it('recarga importada: limpia la lista anterior cuando desaparece la activa o queda vacía',async()=>{
    const removed=patient({id:'removed'});useAppStore.setState({patients:[removed],activePatientId:removed.id,shoppingList:['Anterior']});
    apiMocks.getPatients.mockResolvedValueOnce({patients:[patient({id:'new-first'})],page:{offset:0,limit:50,has_more:false}});
    await useAppStore.getState().refreshDirectory();expect(useAppStore.getState()).toMatchObject({activePatientId:'new-first',shoppingList:[]});
    apiMocks.getPatients.mockResolvedValueOnce({patients:[],page:{offset:0,limit:50,has_more:false}});
    await useAppStore.getState().refreshDirectory();expect(useAppStore.getState()).toMatchObject({patients:[],activePatientId:'',shoppingList:[]});
  });
  it('recarga importada: conserva la selección hecha mientras llegaban páginas',async()=>{
    const first=patient({id:'first'}),selected=patient({id:'selected'});useAppStore.setState({patients:[first,selected],activePatientId:first.id});
    let finish!:(value:unknown)=>void;apiMocks.getPatients.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    const pending=useAppStore.getState().refreshDirectory();useAppStore.setState({activePatientId:selected.id,shoppingList:['Selección nueva']});
    finish({patients:[first,selected],page:{offset:0,limit:50,has_more:false}});await pending;
    expect(useAppStore.getState()).toMatchObject({activePatientId:selected.id,shoppingList:['Selección nueva']});
  });
  it('recarga importada: un fallo tardío después de reset no altera ni denuncia la sesión nueva',async()=>{
    let fail!:(reason:unknown)=>void;apiMocks.getPatients.mockImplementationOnce(()=>new Promise((_,reject)=>{fail=reject;}));
    const pending=useAppStore.getState().refreshDirectory();useAppStore.getState().reset();const next=patient({id:'next'});useAppStore.setState({patients:[next],activePatientId:next.id});
    fail(new Error('Error anterior'));await expect(pending).resolves.toBeUndefined();expect(useAppStore.getState()).toMatchObject({patients:[next],activePatientId:next.id,error:null});
  });
  it('recarga importada: actualiza metadatos ligeros sin borrar detalles de pacientes existentes',async()=>{
    const details:Partial<Patient>={hydration:7,energy:'Bien',sleep_minutes:480,steps:6000,briefDismissed:true,
      brief:{suggested_action:null,up_next_title:'Revisar',up_next_body:'Dato cargado',draft_message:null,source_ids:['1'],adherence_why:'Revisada'},
      todayPlan:[{slot:'Almuerzo',title:'Plan actual',time:'13:00'}],weekPlan:[{day:'Lunes',meals:[{slot:'Almuerzo',title:'Plan actual'}]}],
      meal_logs:[{id:'meal',patient_id:'active',slot:'Almuerzo',photo_url:null,description:'Comida',foods:[],macros:null,confidence:1,note_for_nutri:'Nota',status:'pending_review',logged_at:'2026-10-13T00:00:00Z'}],
      messages:[{id:'msg',patient_id:'active',from:'vero',text:'Mensaje',suggested_by_ai:false,sent_at:'2026-10-13T00:00:00Z'}],
      timeline:[{id:'event',kind:'profile',atLabel:'Hoy',title:'Detalle cargado',body:'Dato'}],
      habit_logs:[{id:'habit',patient_id:'active',date:'2026-10-13',hydration:7,energy:'Bien',sleep_minutes:480,steps:6000}],
      activity_logs:[{id:'activity',patient_id:'active',activity:'Caminar',duration_minutes:30,intensity:'suave',note:null,logged_at:'2026-10-13T00:00:00Z'}]};
    const active=patient({id:'active',name:'Antes',phone:'123',billing_status:'waived',appointment:{when:'Antes',duration:30,channel:'Meet'},...details});
    const other=patient({id:'other',messages:details.messages});useAppStore.setState({patients:[active,other],activePatientId:active.id});
    const latest=patient({id:active.id,name:'Ahora',phone:'456',billing_status:'pending',goal:'Nuevo objetivo',stage:'seguimiento',appointment:null,resource_assignments:[]});
    const newPatient=patient({id:'new',name:'Nueva'});
    apiMocks.getPatients.mockResolvedValueOnce({patients:[latest,patient({id:'other',name:'Otro actual'}),newPatient],page:{offset:0,limit:50,has_more:false}});
    await useAppStore.getState().refreshDirectory();
    expect(useAppStore.getState().patients[0]).toMatchObject({...details,name:'Ahora',phone:'456',billing_status:'pending',goal:'Nuevo objetivo',stage:'seguimiento',appointment:null,resource_assignments:[]});
    expect(useAppStore.getState().patients[1]).toMatchObject({name:'Otro actual',messages:details.messages});
    expect(useAppStore.getState().patients[2]).toEqual(newPatient);
  });
  it.each([null,{start:'2026-10-14',end:'2026-10-20',recorded_days:2,meals_logged:3,meals_pending:0,water_days:2,water_average:5,pending_review:0}])('recarga importada: prevalece el registro semanal fresco del directorio (%j)',async(latestRegistration)=>{
    const existing=patient({id:'active',weekly_registration:{start:'2026-10-07',end:'2026-10-13',recorded_days:1,meals_logged:1,meals_pending:1,water_days:1,water_average:7,pending_review:1}});
    useAppStore.setState({patients:[existing],activePatientId:existing.id});
    apiMocks.getPatients.mockResolvedValueOnce({patients:[patient({id:existing.id,weekly_registration:latestRegistration})],page:{offset:0,limit:50,has_more:false}});
    await useAppStore.getState().refreshDirectory();
    expect(useAppStore.getState().patients[0].weekly_registration).toEqual(latestRegistration);
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
