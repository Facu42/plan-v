import type { LaboratoryValue } from '../types/clinical-workspace';
import { parseImportNumber } from './patient-import';
export function parseLaboratoryPages(pages:{page:number;text:string}[]):LaboratoryValue[]{
  const result:LaboratoryValue[]=[];
  for(const page of pages)for(const raw of page.text.split(/\r?\n/)){
    const line=raw.trim();
    const match=/^([\p{L}][\p{L}\d ()/.,%+-]*?)\s+([<>]=?)?\s*(-?\d+(?:[.,]\d+)?)\s+([^\s\d][^\s]*)\s*(.*)$/u.exec(line);
    if(!match)continue;const value=parseImportNumber(match[3]);if(value===null)continue;
    result.push({id:crypto.randomUUID(),name:match[1].trim(),operator:(match[2]??'') as LaboratoryValue['operator'],value,raw_value:`${match[2]??''}${match[3]}`,unit:match[4],range_text:match[5],source_line:line,page:page.page,reviewed:true});
  }
  if(result.length>200)throw new Error('El estudio tiene más de 200 valores. Dividilo antes de revisar.');return result;
}
export function compareSegmental(before:{segment:string;component:string;value:number;unit:string}[],after:{segment:string;component:string;value:number;unit:string}[]){
  return after.map(current=>{const previous=before.find(p=>p.segment===current.segment&&p.component===current.component&&p.unit===current.unit);return {...current,previous:previous?.value??null,delta:previous?current.value-previous.value:null};});
}
export function bariatricSummary(preop:number,current:number,reference:number|null){
  return {lost_kg:preop-current,total_loss_pct:(preop-current)/preop*100,excess_loss_pct:reference!==null&&reference<preop?(preop-current)/(preop-reference)*100:null};
}
export function kerrSummary(components:Record<string,number|null>,weight:number){
  const complete=Object.values(components).every(n=>n!==null);const total=complete?Object.values(components).reduce<number>((n,v)=>n+(v??0),0):null;
  return {complete,total_kg:total,difference_kg:total===null?null:total-weight};
}
