import type { Patient } from '../../src/types/index.js';
import type { PortfolioIndicators, PortfolioIntent } from '../../src/types/portfolio.js';

export function classifyPortfolioQuestion(question:string):PortfolioIntent {
  const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if (/sin registros|no tienen registros|no registr|falta.*registro/.test(q)) return 'missing_records';
  if (/revis|pendiente|foto/.test(q)) return 'pending_review';
  if (/agua|hidrat/.test(q)) return 'hydration';
  return 'overview';
}
export type IndicatorPatient = Pick<Patient,'id'|'name'|'archived_at'|'deactivated_at'|'anonymized_at'> & {adherence_score?:number;meal_logs:Array<Pick<Patient['meal_logs'][number],'id'|'logged_at'|'status'>>};
export function buildPortfolioIndicators(patients:IndicatorPatient[],days:number,now:Date):PortfolioIndicators {
  if (![7,30,90].includes(days)||!Number.isFinite(now.getTime())) throw new Error('Elegí 7, 30 o 90 días.');
  const start=now.getTime()-days*86400000,previous=start-days*86400000;
  const rows=patients.filter(p=>!p.archived_at&&!p.deactivated_at&&!p.anonymized_at).map(p=>{
    const current=p.meal_logs.filter(m=>Date.parse(m.logged_at)>=start&&Date.parse(m.logged_at)<=now.getTime());
    return {patient_id:p.id,name:p.name,meal_count:current.length,previous_meal_count:p.meal_logs.filter(m=>Date.parse(m.logged_at)>=previous&&Date.parse(m.logged_at)<start).length,pending_review:current.filter(m=>m.status==='pending_review').length,adherence:null,source_ids:current.map(m=>m.id)};
  });
  return {generated_at:now.toISOString(),days,patient_count:rows.length,without_records:rows.filter(r=>!r.meal_count).length,pending_review:rows.reduce((n,r)=>n+r.pending_review,0),rows};
}
export function providerPortfolioContext(data:PortfolioIndicators) {
  return {days:data.days,patient_count:data.patient_count,without_records:data.without_records,pending_review:data.pending_review,meal_count:data.rows.reduce((n,r)=>n+r.meal_count,0),previous_meal_count:data.rows.reduce((n,r)=>n+r.previous_meal_count,0)};
}
export { indicatorsCsv } from '../../src/lib/portfolio-csv.js';
