import { describe,expect,it,vi } from 'vitest';
import { createDocumentOrganizerProvider } from './provider.js';
import { MemoryClinicalBudget } from '../clinical-processing/budget.js';
import type { OrganizerJob } from '../../src/types/document-organizer.js';
import { documentSourceHash } from './source.js';
const item={text:'Antecedentes: vegetarianismo.',category:'history' as const,origin:{file:'test.pdf',fingerprint:'a'.repeat(64),page:2}};
const input={id:'job',patient_id:'patient',nutritionist_id:'clinic',requested_by:'professional',items:[item],source_hash:documentSourceHash([item]),run_token:'token',operation_key:'organizer-job-token',consent_version:'ai_document_import.v1',revision:1} as OrganizerJob;
const env={GROQ_API_KEY:'test',GROQ_ZDR_VERIFIED:'1',GROQ_FREE_TIER_VERIFIED:'1'};
const response=()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({proposals:[{index:0,category:'history',heading:'Antecedentes'}]})}}]}));
describe('organización documental privada y sin texto inventado',()=>{
 it('sólo propone categorías y encabezados presentes, sin nombres de archivos al proveedor',async()=>{
  const fetch=vi.fn().mockResolvedValue(response()),save=vi.fn().mockResolvedValue(true);
  const provider=createDocumentOrganizerProvider({env,fetch,budget:new MemoryClinicalBudget(),authorize:async()=>true,markIssued:async()=>true,saveGenerated:save});
  expect(await provider.organize(input)).toEqual([{index:0,category:'history',heading:'Antecedentes'}]);
  const request=JSON.parse(fetch.mock.calls[0][1].body);expect(request.model).toBe('openai/gpt-oss-120b');expect(request.tools).toBeUndefined();expect(request.messages[1].content).not.toContain('test.pdf');expect(item.text).toBe('Antecedentes: vegetarianismo.');expect(save).toHaveBeenCalled();
 });
 it('bloquea antes del fetch por retención no verificada, cuota o baja durante reserva',async()=>{
  const fetch=vi.fn(),settle=vi.fn();let permit=true;
  for(const opts of [{env:{GROQ_API_KEY:'test'},budget:new MemoryClinicalBudget()},{env:{...env,CLINICAL_AI_COST_MODE:'paid'},budget:new MemoryClinicalBudget(1)}]){
   await expect(createDocumentOrganizerProvider({...opts,fetch,authorize:async()=>true,markIssued:async()=>true,saveGenerated:async()=>true}).organize(input)).rejects.toThrow();
  }
  await expect(createDocumentOrganizerProvider({env,fetch,budget:{reserve:async()=>{permit=false;},settle},authorize:async()=>permit,markIssued:async()=>true,saveGenerated:async()=>true}).organize(input)).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();expect(settle).toHaveBeenCalledWith(input.operation_key,'released',0);
 });
 it('mantiene cobro confirmado y no muestra salida si retiran permiso durante fetch',async()=>{
  const budget=new MemoryClinicalBudget();let permit=true;const save=vi.fn();
  const provider=createDocumentOrganizerProvider({env:{...env,CLINICAL_AI_COST_MODE:'paid'},budget,authorize:async()=>permit,markIssued:async()=>true,saveGenerated:save,fetch:vi.fn(async()=>{permit=false;return response();})});
  await expect(provider.organize(input)).rejects.toThrow();expect(save).not.toHaveBeenCalled();expect(await budget.used(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit'}).format(new Date()))).toBeGreaterThan(0);
 });
 it('rechaza valores inventados, índices extra, salida con texto y red incierta sin reintentos',async()=>{
  for(const content of [{proposals:[{index:0,category:'history',heading:'Diabetes nueva'}]},{proposals:[{index:1,category:'study',heading:'Antecedentes'}]},{proposals:[{index:0,category:'history',heading:'Antecedentes',text:'inventado'}]}]){
   const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(content)}}]})));
   await expect(createDocumentOrganizerProvider({env,fetch,budget:new MemoryClinicalBudget(),authorize:async()=>true,markIssued:async()=>true,saveGenerated:async()=>true}).organize(input)).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(1);
  }
  const fetch=vi.fn().mockRejectedValue(new Error('timeout')),budget=new MemoryClinicalBudget();const p=createDocumentOrganizerProvider({env,fetch,budget,authorize:async()=>true,markIssued:async()=>true,saveGenerated:async()=>true});
  await expect(p.organize(input)).rejects.toMatchObject({code:'uncertain'});await expect(p.organize(input)).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(1);
 });
});
