import {randomUUID} from 'node:crypto';
import type {Context,Hono} from 'hono';
import {CareError} from '../care/errors.js';
import {getRequestDb,isSupabaseEnabled} from '../db/supabase-client.js';
import {resolveWorkScope,type WorkScope} from './repository.js';
import {messageSettingsSchema,saveMessageSettingsSchema,type MessageSettings,type SaveMessageSettings} from '../../src/types/message-settings.js';

const memory=new Map<string,MessageSettings>();
export const resetMessageSettingsMemory=()=>memory.clear();
const empty=():MessageSettings=>({revision:null,replies:[],starred_patient_ids:[]});
function dbError(error:{code?:string}|null){if(!error)return;if(['42P01','PGRST205','42703'].includes(error.code??''))throw new CareError(501,'Las respuestas guardadas necesitan habilitar este módulo en el entorno.');if(error.code==='23505')throw new CareError(409,'Otra pestaña guardó cambios. Actualizá antes de continuar.');throw new CareError(503,'No pudimos guardar o consultar las respuestas. Reintentá.');}
function activeIds(scope:WorkScope){return new Set(scope.patients.filter(p=>!p.archived_at&&!p.deactivated_at&&!p.anonymized_at).map(p=>p.id));}
function visible(value:MessageSettings,scope:WorkScope){const active=activeIds(scope);return {...value,starred_patient_ids:value.starred_patient_ids.filter(id=>active.has(id))};}

export async function loadMessageSettings(scope:WorkScope):Promise<MessageSettings>{
 if(!scope.persistent)return visible(structuredClone(memory.get(scope.nutritionistId)??empty()),scope);
 const {data,error}=await getRequestDb().from('professional_message_settings').select('revision,replies,starred_patient_ids').eq('nutritionist_id',scope.nutritionistId).maybeSingle();dbError(error);
 if(!data)return empty();const parsed=messageSettingsSchema.safeParse(data);if(!parsed.success)throw new CareError(503,'No pudimos leer las respuestas guardadas. Reintentá.');return visible(parsed.data,scope);
}
export async function saveMessageSettings(scope:WorkScope,input:SaveMessageSettings):Promise<MessageSettings>{
 const active=activeIds(scope);if(input.starred_patient_ids.some(id=>!active.has(id)))throw new CareError(403,'Una paciente ya no está disponible en tu consultorio.');
 const next:MessageSettings={revision:randomUUID(),replies:input.replies,starred_patient_ids:input.starred_patient_ids};
 if(!scope.persistent){const old=memory.get(scope.nutritionistId);if((old?.revision??null)!==input.expected_revision)throw new CareError(409,'Otra pestaña guardó cambios. Actualizá antes de continuar.');memory.set(scope.nutritionistId,structuredClone(next));return next;}
 const db=getRequestDb(),payload={...next,nutritionist_id:scope.nutritionistId,updated_at:new Date().toISOString()};
 const result=input.expected_revision===null?await db.from('professional_message_settings').insert(payload).select('revision,replies,starred_patient_ids').single():await db.from('professional_message_settings').update({revision:next.revision,replies:next.replies,starred_patient_ids:next.starred_patient_ids,updated_at:payload.updated_at}).eq('nutritionist_id',scope.nutritionistId).eq('revision',input.expected_revision).select('revision,replies,starred_patient_ids').maybeSingle();
 dbError(result.error);if(!result.data)throw new CareError(409,'Otra pestaña guardó cambios. Actualizá antes de continuar.');return next;
}
async function scopeFor(c:Context){const auth=c.get('auth'),persistent='userId'in auth&&isSupabaseEnabled();if(!persistent&&c.req.query('audience')==='patient')throw new CareError(403,'Sólo profesionales del consultorio.');return resolveWorkScope('userId'in auth?auth.userId:null,persistent);}
export function registerMessageSettingsRoutes(app:Hono){
 app.get('/api/crm/message-settings',async c=>c.json(await loadMessageSettings(await scopeFor(c))));
 app.put('/api/crm/message-settings',async c=>{const scope=await scopeFor(c),text=await c.req.text();if(text.length>128000)throw new CareError(413,'Las respuestas son demasiado largas.');let raw:unknown;try{raw=JSON.parse(text);}catch{throw new CareError(400,'Revisá el texto de la respuesta.');}const parsed=saveMessageSettingsSchema.safeParse(raw);if(!parsed.success)throw new CareError(400,'Revisá los títulos, textos y pacientes.');return c.json(await saveMessageSettings(scope,parsed.data));});
}
