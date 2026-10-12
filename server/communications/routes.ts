import type { Hono } from 'hono';
import { z } from 'zod';
import { getRequestDb, isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { queueDbError, readAllRows, resolveWorkScope } from '../crm/repository.js';
import { CareError } from '../care/errors.js';
import { DeliveryError, isOptOut, normalPhone, readApprovedTemplate, sendApprovedTemplate, templateHash, verifyWhatsAppSignature, whatsappConfig } from './provider.js';
import { apiHeaders, createBodyGuard } from '../security/http.js';
const createSchema=z.object({request_key:z.uuid(),template:z.string().regex(/^\w{1,100}$/),language:z.string().regex(/^\w{2,10}$/),template_hash:z.string().regex(/^[a-f0-9]{64}$/),patient_ids:z.array(z.uuid()).min(1).max(100)}).strict();
const preferencesSchema=z.object({phone:z.string().refine(p=>Boolean(normalPhone(p))),reminders:z.boolean(),broadcasts:z.boolean(),consent_version:z.literal('whatsapp.v1')}).strict();
function rpcError(error:{code?:string}|null) {
 if(error?.code==='22023')throw new CareError(400,'Revisá los datos del envío.');
 if(error?.code==='23505')throw new CareError(409,'Este pedido ya se confirmó con otros datos.');
 queueDbError(error);
}
export function registerCommunicationRoutes(app:Hono) {
 app.use('/webhooks/whatsapp',apiHeaders());
 app.use('/webhooks/whatsapp',createBodyGuard(262144));
 const professional=async (auth:{userId:string}|{demo:true})=>resolveWorkScope('userId'in auth?auth.userId:null,'userId'in auth&&isSupabaseEnabled());
 const patient=async (userId:string)=>{
  const result=await getRequestDb().from('patients').select('id').eq('user_id',userId).is('archived_at',null).is('deactivated_at',null).is('anonymized_at',null).maybeSingle();
  queueDbError(result.error);if(!result.data)throw new CareError(403,'Sólo la paciente puede cambiar sus preferencias.');return String(result.data.id);
 };
 app.get('/api/portfolio/communications',async c=>{
  const scope=await professional(c.get('auth'));
  const enabled=Boolean(whatsappConfig()?.enabled);
  if(!scope.persistent)return c.json({mode:'demo',enabled:false,patients:scope.patients.map(p=>({id:p.id,name:p.name,broadcasts:false,reminders:false})),broadcasts:[],deliveries:[]});
  const db=getRequestDb();
  const [preferences,broadcasts]=await Promise.all([
   readAllRows((from,to)=>db.from('ops_contact_preferences').select('patient_id,reminders,broadcasts').order('patient_id').range(from,to)),
   readAllRows((from,to)=>db.from('ops_broadcasts').select('id,template,language,created_at').eq('nutritionist_id',scope.nutritionistId).order('created_at',{ascending:false}).order('id').range(from,to)),
  ]);
  const deliveries=await readAllRows((from,to)=>db.from('ops_deliveries').select('id,broadcast_id,patient_id,state,delivery_status,updated_at').order('updated_at',{ascending:false}).order('id').range(from,to));
  const prefs=new Map(preferences.map(p=>[p.patient_id,p]));
  return c.json({mode:'persistent',enabled,patients:scope.patients.filter(p=>!p.archived_at&&!p.deactivated_at&&!p.anonymized_at).map(p=>({id:p.id,name:p.name,broadcasts:prefs.get(p.id)?.broadcasts===true,reminders:prefs.get(p.id)?.reminders===true})),broadcasts,deliveries});
 });
 app.post('/api/portfolio/communications',async c=>{
  const scope=await professional(c.get('auth'));
  if(!scope.persistent)throw new CareError(501,'La demo no envía mensajes externos.');
  if(!whatsappConfig()?.enabled)throw new CareError(503,'WhatsApp no está activado.');
  const parsed=createSchema.safeParse(await c.req.json().catch(()=>null));if(!parsed.success)throw new CareError(400,'Revisá plantilla y destinatarios.');
  const allowed=new Set(scope.patients.map(p=>p.id));if(parsed.data.patient_ids.some(id=>!allowed.has(id)))throw new CareError(403,'Un destinatario no pertenece a tu consultorio.');
  const result=await getRequestDb().rpc('ops_create_broadcast',{p_key:parsed.data.request_key,p_template:parsed.data.template,p_language:parsed.data.language,p_patients:parsed.data.patient_ids,p_template_hash:parsed.data.template_hash});
  rpcError(result.error);return c.json({id:result.data},201);
 });
 app.get('/api/portfolio/communications/template',async c=>{
  const scope=await professional(c.get('auth')),config=whatsappConfig();if(!scope.persistent||!config)throw new CareError(503,'La cuenta oficial todavía no está configurada.');
  try{const text=await readApprovedTemplate(config,c.req.query('name')??'',c.req.query('language')??'');return c.json({text,hash:templateHash(text)});}
  catch{throw new CareError(422,'No encontramos una plantilla estática aprobada con instrucciones de baja.');}
 });
 app.post('/api/portfolio/communications/:id/dispatch',async c=>{
  const scope=await professional(c.get('auth'));
  if(!scope.persistent)throw new CareError(501,'La demo no envía mensajes externos.');
  const config=whatsappConfig();if(!config?.enabled)throw new CareError(503,'WhatsApp no está activado.');
  const id=c.req.param('id');if(!z.uuid().safeParse(id).success)throw new CareError(400,'Revisá el envío.');
  // Actor/RLS before service credential: no claim can be made for another clinic.
  const owned=await getRequestDb().from('ops_deliveries').select('id').eq('id',id).maybeSingle();queueDbError(owned.error);
  if(!owned.data)throw new CareError(404,'No encontramos el envío.');
  const claim=await privilegedDb().rpc('ops_claim_delivery',{p_nutritionist:scope.nutritionistId,p_item:id});rpcError(claim.error);
  if(!claim.data)return c.json({claimed:false});
  const data=claim.data as {token:string;phone:string;template:string;language:string;template_hash:string};
  let state='accepted',provider:string|null=null,revoked=false;
  try{provider=await sendApprovedTemplate(config,data.phone,data.template,data.language,fetch,async()=>{
   const checked=await privilegedDb().rpc('ops_check_delivery',{p_nutritionist:scope.nutritionistId,p_item:id,p_token:data.token});rpcError(checked.error);
   revoked=checked.data!==true;return !revoked;
  },data.template_hash);}
  catch(error){state=revoked?'cancelled':error instanceof DeliveryError&&error.uncertain?'uncertain':'failed';}
  const finish=await privilegedDb().rpc('ops_finish_delivery',{p_item:id,p_token:data.token,p_state:state,p_provider:provider});rpcError(finish.error);
  if(!finish.data)throw new CareError(409,'La reserva venció. El envío requiere revisión y no se repetirá automáticamente.');
  return c.json({claimed:true,state});
 });
 app.get('/api/portfolio/preferences/me',async c=>{
  const auth=c.get('auth');if(!('userId'in auth)||!isSupabaseEnabled())return c.json({mode:'demo',preferences:null});
  const id=await patient(auth.userId);
  const result=await getRequestDb().from('ops_contact_preferences').select('phone,reminders,broadcasts,consent_version,updated_at').eq('patient_id',id).maybeSingle();queueDbError(result.error);
  return c.json({mode:'persistent',preferences:result.data});
 });
 app.put('/api/portfolio/preferences/me',async c=>{
  const auth=c.get('auth');if(!('userId'in auth)||!isSupabaseEnabled())throw new CareError(501,'Las preferencias se guardan desde tu cuenta vinculada.');
  const id=await patient(auth.userId),parsed=preferencesSchema.safeParse(await c.req.json().catch(()=>null));
  if(!parsed.success)throw new CareError(400,'Usá teléfono internacional, por ejemplo +5491112345678.');
  const p=parsed.data,result=await getRequestDb().rpc('ops_set_preferences',{p_patient:id,p_phone:p.phone,p_reminders:p.reminders,p_broadcasts:p.broadcasts,p_version:p.consent_version});rpcError(result.error);
  return c.json({preferences:result.data});
 });
 // External webhook uses Meta HMAC, deliberately outside authenticated /api/*.
 app.get('/webhooks/whatsapp',c=>{
  const token=process.env.WHATSAPP_VERIFY_TOKEN;
  if(!token||c.req.query('hub.mode')!=='subscribe'||c.req.query('hub.verify_token')!==token)return c.text('Forbidden',403);
  return c.text(c.req.query('hub.challenge')??'');
 });
 app.post('/webhooks/whatsapp',async c=>{
  const raw=await c.req.text();if(Buffer.byteLength(raw)>262144)return c.text('Too large',413);
  if(!verifyWhatsAppSignature(raw,c.req.header('x-hub-signature-256'),process.env.WHATSAPP_APP_SECRET??''))return c.text('Forbidden',403);
  const config=whatsappConfig();if(!config||!isSupabaseEnabled())return c.text('Unavailable',503);
  let body:unknown;try{body=JSON.parse(raw);}catch{return c.text('Invalid',400);}
  const webhook=z.object({object:z.literal('whatsapp_business_account'),entry:z.array(z.object({id:z.string(),changes:z.array(z.object({value:z.object({metadata:z.object({phone_number_id:z.string()}),statuses:z.array(z.object({id:z.string().max(250),status:z.enum(['sent','delivered','read','failed'])})).optional(),messages:z.array(z.object({from:z.string(),text:z.object({body:z.string()}).optional()})).optional()})}))}))}).safeParse(body);
  if(!webhook.success)return c.text('Ignored',200);
  for(const entry of webhook.data.entry){if(entry.id!==config.businessId)continue;for(const change of entry.changes){if(change.value.metadata.phone_number_id!==config.phoneId)continue;
   for(const status of change.value.statuses??[]){const result=await privilegedDb().rpc('ops_whatsapp_event',{p_provider:status.id,p_status:status.status,p_optout_phone:null});rpcError(result.error);}
   for(const message of change.value.messages??[]){if(message.text&&isOptOut(message.text.body)&&normalPhone('+'+message.from)){const result=await privilegedDb().rpc('ops_whatsapp_event',{p_provider:null,p_status:null,p_optout_phone:'+'+message.from});rpcError(result.error);}}
  }}
  return c.text('OK');
 });
}
