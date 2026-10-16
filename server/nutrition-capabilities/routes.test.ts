import { Hono } from 'hono';
import { beforeEach,describe,expect,it,vi } from 'vitest';
import { registerNutritionCapabilityRoutes } from './routes.js';
import { registerTargetRoutes } from '../targets/routes.js';
import { registerFoodRoutes } from '../foods/routes.js';
import { resetNutritionCapabilities } from './repository.js';
import { resetTargetMemory } from '../targets/repository.js';
import { resetFoodsMemory } from '../foods/repository.js';
import { CareError } from '../care/errors.js';
import { defaultNutritionSettings } from '../../src/types/nutrition-capabilities.js';
import { defaultsForGoal } from '../../src/lib/nutrition-target.js';
import { foodInputSchema } from '../../src/types/foods.js';
const mock=vi.hoisted(()=>({actor:vi.fn(),enabled:false}));
vi.mock('../db/supabase-client.js',()=>({isSupabaseEnabled:()=>mock.enabled,getRequestDb:vi.fn()}));
vi.mock('../db/supabase-repo.js',async original=>({...await original<typeof import('../db/supabase-repo.js')>(),sbGetActor:mock.actor}));
function app(real=false){const api=new Hono();api.use('*',async(c,next)=>{c.set('auth',real?{userId:'actor'}:{demo:true});await next();});api.onError((error,c)=>error instanceof CareError?c.json({error:error.message},error.status):c.json({error:'error'},500));registerNutritionCapabilityRoutes(api);registerTargetRoutes(api);registerFoodRoutes(api);return api;}
const send=(api:Hono,path:string,value:unknown,method='POST')=>api.request(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
beforeEach(()=>{resetNutritionCapabilities();resetTargetMemory();resetFoodsMemory();mock.enabled=false;mock.actor.mockReset();});
describe('Rutas nutricionales reales',()=>{
  it('exige aprobar la fórmula antes de cambiar la meta',async()=>{
    const api=app(),input={sex:'femenino',age:35,weight_kg:70,height_cm:165,activity:'moderada',formula:'harris',...defaultsForGoal('mantener')};
    const patient='pat-sofia';
    expect((await send(api,`/api/patients/${patient}/nutrition-target?audience=pro`,{inputs:input,publish:true,expected_revision:0},'PUT')).status).toBe(400);
    const settings={...defaultNutritionSettings(),approvals:[{formula:'harris',citation:'Roza y Shizgal 1984',url:'https://pubmed.ncbi.nlm.nih.gov/6741850/'}]};expect((await send(api,'/api/nutrition/settings',{settings,expected_revision:0},'PUT')).status).toBe(200);
    const saved=await send(api,`/api/patients/${patient}/nutrition-target?audience=pro`,{inputs:input,publish:true,expected_revision:0},'PUT');expect(saved.status).toBe(200);expect((await saved.json()).target.inputs.formula).toBe('harris');
  });
  it('crea grupos con fuente congelada y consulta alimentos por páginas',async()=>{
    const api=app(),first='a0000000-0000-4000-8000-000000000001',second='a0000000-0000-4000-8000-000000000002';
    for(const[id,name]of[[first,'Manzana'],[second,'Pera']])expect((await send(api,'/api/foods',foodInputSchema.parse({id,expected_revision:0,name,kind:'food',source:'Fuente de prueba',nutrients:{kcal:50},portions:[]}))).status).toBe(200);
    const saved=await send(api,'/api/nutrition/exchanges',{id:'b0000000-0000-4000-8000-000000000001',expected_revision:0,name:'Frutas',reference:'Porciones revisadas',reviewed:true,items:[{food_id:first,food_revision:1,grams:120},{food_id:second,food_revision:1,grams:150}]});expect(saved.status).toBe(200);expect((await saved.json()).group.items[0].food.source).toBe('Fuente de prueba');
    const result=await(await api.request('/api/foods/search?scope=own&page=1&page_size=1')).json();expect(result.total).toBe(2);expect(result.foods).toHaveLength(1);expect(result.summary.own).toBe(2);expect(result.summary.platform).toBe(930);
  });
  it('niega todos los recursos nutricionales a paciente y administrador',async()=>{
    mock.enabled=true;for(const actor of[{role:'paciente',patientId:'patient',userId:'actor'},{role:'admin',userId:'actor'}]){mock.actor.mockResolvedValue(actor);for(const path of['/api/nutrition/settings','/api/nutrition/exchanges','/api/nutrition/external-foods?q=apple'])expect((await app(true).request(path)).status).toBe(403);}
  });
  it('rechaza consultas y logos inválidos antes de guardar',async()=>{
    const api=app();expect((await api.request('/api/nutrition/external-foods?q=ap')).status).toBe(400);expect((await send(api,'/api/nutrition/settings',{settings:{...defaultNutritionSettings(),brand:{name:'',contact:'',logo:'https://bad.test/patient-tracking'}},expected_revision:0},'PUT')).status).toBe(400);
  });
});
