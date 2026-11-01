import {Hono} from 'hono';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({actor:vi.fn(),patient:vi.fn(),consent:vi.fn(),rpc:vi.fn()}));
vi.mock('../db/supabase-client.js',()=>({isSupabaseEnabled:()=>true,getRequestDb:()=>({rpc:m.rpc})}));
vi.mock('../db/supabase-repo.js',()=>({sbGetActor:m.actor,sbGetPatientResource:m.patient}));
vi.mock('../care/consents.js',()=>({requireCareConsent:m.consent}));
vi.mock('../crm/repository.js',()=>({queueDbError:(e:unknown)=>{if(e)throw Error('db');}}));
import {registerBioimpedanceRoutes} from './bioimpedance-routes.js';
function send(suffix:string,data:unknown){const a=new Hono();a.use('*',async(c,next)=>{c.set('auth',{userId:'owner'});await next();});a.onError((e,c)=>c.json({error:e.message},'status'in e?e.status as 400:500));registerBioimpedanceRoutes(a);return a.request('/api/patients/patient/clinical-workspace/bioimpedance'+suffix,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});}
beforeEach(()=>{vi.stubEnv('BIOIMPEDANCE_ENABLED','true');m.actor.mockResolvedValue({role:'nutri',nutritionistId:'clinic'});m.patient.mockResolvedValue({nutritionistId:'clinic'});m.consent.mockResolvedValue({});m.rpc.mockReset();});afterEach(()=>vi.unstubAllEnvs());
describe('bioimpedancia: vista previa y guardado revisado',()=>{
 it('apagada no lee ficha; otra profesional no accede',async()=>{vi.stubEnv('BIOIMPEDANCE_ENABLED','false');expect((await send('/preview',{text:'Peso: 68 kg'})).status).toBe(503);vi.stubEnv('BIOIMPEDANCE_ENABLED','true');m.patient.mockResolvedValue({nutritionistId:'other'});expect((await send('/preview',{text:'Peso: 68 kg'})).status).toBe(403);});
 it('preview no guarda y deja revisión pendiente',async()=>{const r=await send('/preview',{text:'Peso: 68 kg'});expect(r.status).toBe(200);expect(await r.json()).toMatchObject({values:{weight_kg:68},reviewed:false});expect(m.rpc).not.toHaveBeenCalled();});
 it('solo guarda con revisión explícita y permiso vigente',async()=>{const data={id:crypto.randomUUID(),recorded_on:'2026-10-01',values:{weight_kg:68,body_fat_pct:null,muscle_kg:null,water_pct:null,visceral_fat:null}};expect((await send('',data)).status).toBe(400);m.rpc.mockResolvedValue({data:{...data,reviewed_at:'2026-11-01'},error:null});expect((await send('',{...data,reviewed:true})).status).toBe(201);expect(m.rpc).toHaveBeenCalledWith('save_bioimpedance_review',{target:'patient',payload:{...data,reviewed:true}});m.rpc.mockResolvedValue({error:{code:'42501'}});expect((await send('',{...data,reviewed:true})).status).toBe(403);});
});
