import { beforeEach,describe,expect,it } from 'vitest';
import { Hono } from 'hono';
import { registerDocumentOrganizerRoutes } from './routes.js';
import { CareError } from '../care/errors.js';
import { appendConsent,resetIntakeMemory } from '../intake/memory.js';
import { consentTextByPurpose } from '../intake/consent.js';
import { getPatient,resetStore } from '../store.js';
import { organizerMemory } from './repository.js';
const items=[{text:'Antecedentes originales',category:'history',origin:{file:' archivo.pdf ',fingerprint:'a'.repeat(64),page:2}}];
function app(){const a=new Hono();a.use('/api/*',async(c,next)=>{c.set('auth',{demo:true});await next();});a.onError((e,c)=>e instanceof CareError?c.json({error:e.message},e.status):c.json({error:'unexpected'},500));registerDocumentOrganizerRoutes(a);return a;}
beforeEach(()=>{resetStore();resetIntakeMemory();organizerMemory.clear();});
describe('contrato HTTP de organización opcional',()=>{
 it('permiso viejo de seguimiento no activa IA documental y contactos nuevos necesitan cuenta vinculada',async()=>{
  const a=app(),body=JSON.stringify({request_key:crypto.randomUUID(),items});
  for(const purpose of ['care_relationship','ai_followup'] as const){const text=consentTextByPurpose(purpose);appendConsent('pat-sofia',{purpose,decision:'granted',actor_id:'patient',text_version:text.text_version,text_hash:text.text_hash});}
  getPatient('pat-sofia')!.has_account=true;
  expect((await a.request('/api/patients/pat-sofia/document-organizer',{method:'POST',body})).status).toBe(403);
  expect((await a.request('/api/patients/pat-sofia/document-organizer?audience=patient')).status).toBe(403);
 });
 it('acepta fuentes exactas y nunca ejecuta importación al encolar',async()=>{
  const a=app();getPatient('pat-sofia')!.has_account=true;
  for(const purpose of ['care_relationship','ai_document_import'] as const){const text=consentTextByPurpose(purpose);appendConsent('pat-sofia',{purpose,decision:'granted',actor_id:'patient',text_version:text.text_version,text_hash:text.text_hash});}
  const response=await a.request('/api/patients/pat-sofia/document-organizer',{method:'POST',body:JSON.stringify({request_key:crypto.randomUUID(),items})});
  expect(response.status).toBe(202);const {job}=await response.json();expect(job.items).toEqual(items);expect(job.status).toBe('queued');expect(job.proposals).toEqual([]);expect(job.reviewed).toEqual([]);
 });
});
