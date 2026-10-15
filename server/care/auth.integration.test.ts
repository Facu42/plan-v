import { beforeEach,describe,expect,it,vi } from 'vitest';
const mocks=vi.hoisted(()=>({actor:vi.fn(),resource:vi.fn(),records:vi.fn(),save:vi.fn()}));
vi.mock('../db/supabase-client.js',()=>({isSupabaseEnabled:()=>true,verifyAuthToken:async(token?:string)=>token?{userId:'user-a'}:null,getSupabaseAdmin:()=>({}),createActorClient:()=>null,bindActorClient:(_c:unknown,run:()=>unknown)=>run()}));
vi.mock('../db/supabase-repo.js',async original=>({...await original<typeof import('../db/supabase-repo.js')>(),sbGetActor:mocks.actor,sbGetPatientResource:mocks.resource}));
vi.mock('./repository.js',async original=>({...await original<typeof import('./repository.js')>(),listCareRecords:mocks.records,saveCareRecord:mocks.save,getCarePreferences:async()=>({}),listReplacements:async()=>[]}));
vi.mock('../intake/repository.js',async original=>({...await original<typeof import('../intake/repository.js')>(),readIntakeBundle:async()=>({intake:{},consents:[]})}));
import { app } from '../index.js';
const request=(path:string,data?:unknown,method=data?'POST':'GET')=>app.request(path,{method,headers:{Authorization:'Bearer token','Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
const input={id:'20000000-0000-4000-a000-000000000001',recorded_on:'2026-09-10',data:{kind:'activity',activity:'Caminar',minutes:30,intensity:'suave',kcal:100,note:''}};
describe('autorización de seguimiento persistente',()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.actor.mockResolvedValue({role:'paciente',userId:'user-a',patientId:'a'});mocks.resource.mockImplementation(async(id:string)=>({id,nutritionistId:'nutri-a',billing_status:'waived',billing_until:null}));mocks.records.mockResolvedValue([]);mocks.save.mockResolvedValue(input);});
 it('no acepta una audiencia pro para eludir identidad y rechaza otro paciente',async()=>{
   expect((await request('/api/patients/b/care?audience=pro')).status).toBe(403);expect(mocks.records).not.toHaveBeenCalled();
   expect((await request('/api/patients/a/care/records',{...input,data:{kind:'payment',amount:100,currency:'ARS',method:'otro',reference:'',note:''}})).status).toBe(403);
   expect((await request(`/api/patients/a/care/records/${input.id}/review`,{},'PATCH')).status).toBe(403);
   expect((await request(`/api/patients/a/care/replacements/${input.id}/publish`,{})).status).toBe(403);
 });
 it('registra sólo actividad propia y bloquea al profesional no asignado',async()=>{
   expect((await request('/api/patients/a/care/records',input)).status).toBe(200);expect(mocks.save).toHaveBeenCalledWith('a',input,true);
   mocks.actor.mockResolvedValue({role:'nutri',userId:'pro-b',nutritionistId:'nutri-b'});
   expect((await request('/api/patients/a/care')).status).toBe(403);
   mocks.actor.mockResolvedValue({role:'nutri',userId:'pro-a',nutritionistId:'nutri-a'});
   expect((await request('/api/patients/a/care/records',input)).status).toBe(403);
 });
});
