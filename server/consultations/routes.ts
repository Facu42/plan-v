import type { Context,Hono } from 'hono';
import { z } from 'zod';
import { getPatient,DEMO_NUTRITIONIST_ID } from '../store.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { authorizePatientAction } from '../security/authorization.js';
import { CareError } from '../care/errors.js';
import { consultationCommandSchema,consultationChunkSchema,consultationCompletionSchema,type ConsultationScope } from '../../src/types/consultations.js';
import { commandConsultation,consultationView,enqueueConsultationAudio,consultationCompletionView,completeConsultationAppointment } from './repository.js';

async function access(c:Context,patientId:string,professionalOnly:boolean,ownerOnly=false) {
 const auth=c.get('auth'); const persistent='userId' in auth && isSupabaseEnabled();
 if(!persistent) { if(!getPatient(patientId)) throw new CareError(404,'Paciente no encontrada.'); return {persistent:false,professional:professionalOnly || c.req.query('audience')==='pro',scope:{patientId,nutritionistId:DEMO_NUTRITIONIST_ID,requestedBy:'demo'} satisfies ConsultationScope}; }
 const actor=await authorizePatientAction(auth.userId,patientId,professionalOnly?'write_clinical_note':'read_patient',{getActor:sb.sbGetActor,getPatientResource:sb.sbGetPatientResource});
 if(!actor || (professionalOnly && actor.role!=='nutri')) throw new CareError(403,'No tenés permiso para esta consulta.');
 const resource=await sb.sbGetPatientResource(patientId); if(!resource) throw new CareError(404,'Paciente no encontrada.');
 if(ownerOnly&&(actor.role!=='nutri'||actor.nutritionistId!==resource.nutritionistId))throw new CareError(403,'Sólo la profesional titular puede confirmar una consulta realizada.');
 return {persistent:true,professional:actor.role==='nutri',scope:{patientId,nutritionistId:resource.nutritionistId,requestedBy:auth.userId} satisfies ConsultationScope};
}
async function body<T>(c:Context,schema:z.ZodType<T>,max=7_000_000):Promise<T> {
 if(Number(c.req.header('Content-Length'))>max) throw new CareError(413,'El contenido es demasiado grande.');
 const text=await c.req.text(); if(new TextEncoder().encode(text).length>max) throw new CareError(413,'El contenido es demasiado grande.');
 try{return schema.parse(JSON.parse(text));}catch{throw new CareError(400,'Revisá los campos de la consulta.');}
}
export function registerConsultationRoutes(app:Hono) {
 app.get('/api/patients/:id/consultations/completions',async c=>{
  const {persistent,scope}=await access(c,c.req.param('id'),true,true);const offset=Number(c.req.query('offset')??0),limit=Number(c.req.query('limit')??50);
  if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>100)throw new CareError(400,'Revisá la página de consultas realizadas.');
  return c.json(await consultationCompletionView(scope,persistent,offset,limit));
 });
 app.post('/api/patients/:id/consultations/completions',async c=>{
  const {persistent,scope}=await access(c,c.req.param('id'),true,true);const input=await body(c,consultationCompletionSchema,4096);
  return c.json({completion:await completeConsultationAppointment(scope,input,persistent)});
 });
 app.get('/api/patients/:id/consultations',async c=>{
  const id=c.req.param('id'), {persistent,professional}=await access(c,id,false);
  const offset=Number(c.req.query('offset')??0),limit=Number(c.req.query('limit')??50);
  if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>100) throw new CareError(400,'Revisá la página de consultas.');
  return c.json(await consultationView(id,professional,persistent,offset,limit));
 });
 app.post('/api/patients/:id/consultations',async c=>{
  const {persistent,scope}=await access(c,c.req.param('id'),true); const input=await body(c,consultationCommandSchema);
  return c.json({session:await commandConsultation(scope,input,persistent)},input.action==='start'?201:200);
 });
 app.post('/api/patients/:id/consultations/:sessionId/chunks',async c=>{
  const {persistent,scope}=await access(c,c.req.param('id'),true); const id=z.uuid().safeParse(c.req.param('sessionId')); if(!id.success) throw new CareError(400,'Revisá la consulta.');
  const input=await body(c,consultationChunkSchema,11_201_000); return c.json(await enqueueConsultationAudio(scope,id.data,input,persistent),202);
 });
}
