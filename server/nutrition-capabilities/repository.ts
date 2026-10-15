import { getRequestDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { CareError } from '../care/errors.js';
import { listFoods } from '../foods/repository.js';
import { defaultNutritionSettings, type ExchangeGroup, type ExchangeInput, type NutritionSettingsView, type NutritionSettings, type NutritionFormula } from '../../src/types/nutrition-capabilities.js';
const settings=new Map<string,NutritionSettingsView>(),groups=new Map<string,ExchangeGroup>();
registerDemoState('nutrition-capabilities',()=>({settings,groups}));
export function resetNutritionCapabilities(){settings.clear();groups.clear();}
export function nutritionDbError(error:{code?:string}|null){if(!error)return;if(error.code==='42501')throw new CareError(403,'No tenés permiso para esa configuración.');if(['PT409','23505'].includes(error.code??''))throw new CareError(409,'La configuración o el alimento cambió. Recargá antes de guardar.');if(['22023','23514','22P02'].includes(error.code??''))throw new CareError(400,'Revisá los datos y las referencias.');if(['42P01','42883','PGRST202','PGRST205'].includes(error.code??''))throw new CareError(501,'Esta función necesita instalar la migración de capacidades nutricionales.');throw new CareError(503,'No pudimos confirmar el guardado. Tus cambios siguen en el formulario.');}
export async function getNutritionSettings(owner:string,persistent:boolean):Promise<NutritionSettingsView>{
  if(!persistent)return structuredClone(settings.get(owner)??{revision:0,settings:defaultNutritionSettings()});
  const {data,error}=await getRequestDb().from('nutrition_settings').select('revision,payload').eq('owner_id',owner).maybeSingle();nutritionDbError(error);
  return data?{revision:data.revision,settings:data.payload}:{revision:0,settings:defaultNutritionSettings()};
}
export async function saveNutritionSettings(owner:string,input:NutritionSettings,expected:number,persistent:boolean):Promise<NutritionSettingsView>{
  if(persistent){const{data,error}=await getRequestDb().rpc('save_nutrition_settings',{expected_revision:expected,settings:input});nutritionDbError(error);return data;}
  const prior=await getNutritionSettings(owner,false);if(prior.revision!==expected)throw new CareError(409,'La configuración cambió. Recargá antes de guardar.');
  const view={settings:structuredClone(input),revision:expected+1};settings.set(owner,view);return structuredClone(view);
}
export async function assertFormulaApproval(owner:string,formula:NutritionFormula|undefined,persistent:boolean){
  if(!formula||formula==='mifflin')return;
  const view=await getNutritionSettings(owner,persistent);if(!view.settings.approvals.some(row=>row.formula===formula))throw new CareError(400,'Revisá y aprobá la referencia de esta fórmula en Configuración nutricional antes de usarla.');
}
export async function listNutritionExchanges(owner:string,persistent:boolean):Promise<ExchangeGroup[]>{
  if(!persistent)return [...groups.values()].filter(group=>group.owner_id===owner).map(group=>structuredClone(group));
  const{data,error}=await getRequestDb().from('nutrition_exchanges').select('id,owner_id,revision,payload,updated_at').eq('owner_id',owner).order('id').limit(100);nutritionDbError(error);
  return (data??[]).map(row=>({...row.payload,id:row.id,owner_id:row.owner_id,revision:row.revision,updated_at:row.updated_at}));
}
export async function saveNutritionExchange(owner:string,input:ExchangeInput,persistent:boolean):Promise<ExchangeGroup>{
  if(persistent){const{data,error}=await getRequestDb().rpc('save_nutrition_exchange',{request:input});nutritionDbError(error);return data;}
  const prior=groups.get(input.id);if(prior&&prior.owner_id!==owner)throw new CareError(403,'Este grupo pertenece a otro consultorio.');if((prior?.revision??0)!==input.expected_revision)throw new CareError(409,'El grupo cambió. Recargá antes de guardar.');
  if(!prior&&(await listNutritionExchanges(owner,false)).length>=100)throw new CareError(400,'Tu consultorio alcanzó el límite de cien grupos. Revisá los existentes.');const foods=await listFoods(owner,false);const items=input.items.map(item=>{const food=foods.find(food=>food.id===item.food_id);if(!food)throw new CareError(403,'Un alimento no está disponible para tu consultorio.');if(food.revision!==item.food_revision)throw new CareError(409,'El alimento cambió. Revisá los valores antes de guardar el grupo.');return{grams:item.grams,food:structuredClone(food)};});
  const group:ExchangeGroup={id:input.id,name:input.name,reference:input.reference,items,owner_id:owner,revision:input.expected_revision+1,updated_at:new Date().toISOString()};groups.set(input.id,group);return structuredClone(group);
}
