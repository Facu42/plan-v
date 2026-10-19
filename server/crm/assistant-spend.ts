import {createHash} from 'node:crypto';
import {CareError} from '../care/errors.js';
import {getRequestDb,privilegedDb} from '../db/supabase-client.js';
import {argentinaBudgetMonth,clinicalMemoryBudget,MAX_CLINICAL_MICROS} from '../clinical-processing/budget.js';
import {listAiJobs} from '../ai-jobs/repository.js';
import {readAllRows,type WorkScope} from './repository.js';
import type {AssistantSpend} from '../../src/types/accompaniment.js';

/** No consulta el saldo global ni carga el cache privado de los proveedores. */
export function sumAssistantSpend(rows:Record<string,unknown>[],keys:ReadonlySet<string>,prefix:string,month:string){
 let total=0;const seen=new Set<string>();
 for(const row of rows){const key=String(row.operation_key);if(row.month!==month||(!keys.has(key)&&!key.startsWith(prefix)))continue;if(seen.has(key))throw new CareError(503,'No pudimos verificar el gasto del asistente.');seen.add(key);
  if(!['reserved','uncertain','charged','released'].includes(String(row.status)))throw new CareError(503,'No pudimos verificar el gasto del asistente.');
  const reserved=Number(row.reserved_micros),charged=Number(row.charged_micros);
  if(!Number.isSafeInteger(reserved)||reserved<0||!Number.isSafeInteger(charged)||charged<0||charged>reserved)throw new CareError(503,'No pudimos verificar el gasto del asistente.');
  total+=row.status==='released'?0:row.status==='charged'?charged:reserved;
 }
 if(!Number.isSafeInteger(total)||total>MAX_CLINICAL_MICROS)throw new CareError(503,'No pudimos verificar el gasto del asistente.');
 return total;
}
export async function loadAssistantSpend(scope:WorkScope,now=new Date()):Promise<AssistantSpend>{
 const month=argentinaBudgetMonth(now),prefix=`portfolio:${createHash('sha256').update(JSON.stringify([scope.actorId,scope.nutritionistId])).digest('hex')}:`;
 const ids=scope.persistent?(await readAllRows((start,end)=>getRequestDb().from('ai_jobs').select('id').eq('nutritionist_id',scope.nutritionistId).order('id').range(start,end))).map(r=>String(r.id)):(await Promise.all(scope.patients.map(p=>listAiJobs(scope.nutritionistId,p.id,false)))).flat().map(j=>j.id);
 const keys=new Set(ids.map(id=>`plan-assistant:${id}`));
 if(!scope.persistent)return {month,used_micros:await clinicalMemoryBudget.usedFor(month,keys,prefix),cap_micros:MAX_CLINICAL_MICROS,scope:'plans-and-own-portfolio',source:'memory'};
 const db=privilegedDb(),columns='operation_key,month,status,reserved_micros,charged_micros';
 const rows:Record<string,unknown>[]=[];
 for(let i=0;i<ids.length;i+=100)rows.push(...await readAllRows((start,end)=>db.from('clinical_ai_spend').select(columns).in('operation_key',ids.slice(i,i+100).map(id=>`plan-assistant:${id}`)).eq('month',month).order('operation_key').range(start,end)));
 rows.push(...await readAllRows((start,end)=>db.from('clinical_ai_spend').select(columns).like('operation_key',prefix+'%').eq('month',month).order('operation_key').range(start,end)));
 return {month,used_micros:sumAssistantSpend(rows,keys,prefix,month),cap_micros:MAX_CLINICAL_MICROS,scope:'plans-and-own-portfolio',source:'supabase'};
}
