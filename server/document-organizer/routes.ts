import type { Context,Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor,sbGetPatientResource } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID,getPatient } from '../store.js';
import { CareError } from '../care/errors.js';
import { enqueueOrganizer,listOrganizer,readOrganizer,reviewOrganizer,type OrganizerScope } from './repository.js';
const reviewSchema=z.object({revision:z.number().int().positive(),choices:z.unknown()}).strict();
async function scope(c:Context):Promise<OrganizerScope>{
 const auth=c.get('auth'),patientId=c.req.param('id');if(!patientId||patientId.length>80)throw new CareError(400,'Revisá la ficha.');
 const persistent='userId'in auth&&isSupabaseEnabled();
 if(!persistent){if(c.req.query('audience')==='patient')throw new CareError(403,'Sólo profesionales.');if(!getPatient(patientId))throw new CareError(404,'Paciente no encontrado.');return {patientId,nutritionistId:DEMO_NUTRITIONIST_ID,requestedBy:'demo-nutri',persistent:false};}
 const actor=await sbGetActor(auth.userId),patient=await sbGetPatientResource(patientId);if(actor?.role!=='nutri'||patient?.nutritionistId!==actor.nutritionistId)throw new CareError(403,'La ficha no pertenece a tu consultorio.');
 return {patientId,nutritionistId:actor.nutritionistId,requestedBy:auth.userId,persistent:true};
}
async function body(c:Context){const raw=await c.req.text();if(Buffer.byteLength(raw)>120000)throw new CareError(413,'Dividí las fuentes en lotes más chicos.');try{return JSON.parse(raw);}catch{throw new CareError(400,'Revisá el pedido.');}}
export function registerDocumentOrganizerRoutes(app:Hono){
 app.post('/api/patients/:id/document-organizer',async c=>c.json({job:await enqueueOrganizer(await scope(c),await body(c))},202));
 app.get('/api/patients/:id/document-organizer',async c=>{const own=await scope(c),hash=c.req.query('source_hash');if(hash&&!/^[a-f0-9]{64}$/.test(hash))throw new CareError(400,'Las fuentes cambiaron.');return c.json({jobs:await listOrganizer(own,hash)});});
 app.get('/api/patients/:id/document-organizer/:job',async c=>{const own=await scope(c);if(!z.uuid().safeParse(c.req.param('job')).success)throw new CareError(400,'Revisá el trabajo.');return c.json({job:await readOrganizer(own,c.req.param('job'))});});
 app.post('/api/patients/:id/document-organizer/:job/review',async c=>{const own=await scope(c),parsed=reviewSchema.safeParse(await body(c));if(!parsed.success||!z.uuid().safeParse(c.req.param('job')).success)throw new CareError(400,'Revisá la propuesta.');return c.json({job:await reviewOrganizer(own,c.req.param('job'),parsed.data.revision,parsed.data.choices)});});
}
