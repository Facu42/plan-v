import { beforeEach,describe,expect,it,vi } from 'vitest';
import { runPendingDocumentOrganizer } from './worker.js';
import { enqueueOrganizer,organizerMemory,readOrganizer,reviewOrganizer } from './repository.js';
import { appendConsent,resetIntakeMemory } from '../intake/memory.js';
import { consentTextByPurpose } from '../intake/consent.js';
import { DEMO_NUTRITIONIST_ID,getPatient,resetStore } from '../store.js';
import { MemoryClinicalBudget } from '../clinical-processing/budget.js';
const scope={patientId:'pat-sofia',nutritionistId:DEMO_NUTRITIONIST_ID,requestedBy:'demo-nutri',persistent:false};
const items=[{text:'Antecedentes originales',category:'history' as const,origin:{file:'test.pdf',fingerprint:'a'.repeat(64),page:2}}];
const env={GROQ_API_KEY:'test',GROQ_ZDR_VERIFIED:'1',GROQ_FREE_TIER_VERIFIED:'1'};
const response=()=>new Response(JSON.stringify({choices:[{message:{content:'{"proposals":[{"index":0,"category":"study","heading":"Antecedentes"}]}'}}]}));
function consent(decision:'granted'|'withdrawn'='granted'){for(const purpose of ['care_relationship','ai_document_import'] as const){const c=consentTextByPurpose(purpose);appendConsent(scope.patientId,{purpose,text_version:c.text_version,text_hash:c.text_hash,decision,actor_id:'demo-patient'});}}
beforeEach(()=>{resetStore();resetIntakeMemory();organizerMemory.clear();getPatient(scope.patientId)!.has_account=true;consent();});
describe('trabajos documentales sin importación automática',()=>{
 it('prepara propuesta y requiere revisión explícita conservando textos y orígenes',async()=>{
  const job=await enqueueOrganizer(scope,{request_key:crypto.randomUUID(),items});const fetch=vi.fn().mockResolvedValue(response());
  expect(await runPendingDocumentOrganizer(1,{env,fetch,budget:new MemoryClinicalBudget()})).toBe(1);
  const generated=await readOrganizer(scope,job.id);expect(generated.status).toBe('review');expect(generated.items).toEqual(items);expect(generated.reviewed).toEqual([]);
  const reviewed=await reviewOrganizer(scope,job.id,generated.revision,generated.proposals);expect(reviewed.status).toBe('reviewed');expect(reviewed.items).toEqual(items);expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('resuelve una etapa generada guardada tras reinicio sin volver a llamar al proveedor',async()=>{
  const j=await enqueueOrganizer(scope,{request_key:crypto.randomUUID(),items}),saved=organizerMemory.get(j.id)!;
  saved.status='running';saved.stage='generated';saved.run_token='old';saved.lease_until='2020-01-01';saved.proposals=[{index:0,category:'history',heading:'originales'}];
  const fetch=vi.fn();await runPendingDocumentOrganizer(1,{env,fetch,budget:new MemoryClinicalBudget()});expect(fetch).not.toHaveBeenCalled();expect((await readOrganizer(scope,j.id)).status).toBe('review');
 });
 it('envío interrumpido no se repite aunque reinicie el trabajador',async()=>{
  const j=await enqueueOrganizer(scope,{request_key:crypto.randomUUID(),items}),saved=organizerMemory.get(j.id)!;saved.status='running';saved.stage='request_issued';saved.lease_until='2020-01-01';
  const fetch=vi.fn();await runPendingDocumentOrganizer(1,{env,fetch,budget:new MemoryClinicalBudget()});expect(fetch).not.toHaveBeenCalled();expect((await readOrganizer(scope,j.id)).status).toBe('uncertain');
 });
 it('retirar permiso durante fetch cancela y bloquea revisión, pero conserva la vía manual',async()=>{
  const j=await enqueueOrganizer(scope,{request_key:crypto.randomUUID(),items}),fetch=vi.fn(async()=>{consent('withdrawn');return response();});
  await runPendingDocumentOrganizer(1,{env,fetch,budget:new MemoryClinicalBudget()});const current=await readOrganizer(scope,j.id);expect(current.status).toBe('cancelled');expect(current.proposals).toEqual([]);expect(items[0].text).toBe('Antecedentes originales');
  await expect(reviewOrganizer(scope,j.id,current.revision,[{index:0,category:'history',heading:'originales'}])).rejects.toThrow();
 });
});
