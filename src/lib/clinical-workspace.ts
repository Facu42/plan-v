import type { LaboratoryValue,SegmentValue } from '../types/clinical-workspace';
import { parseImportNumber } from './patient-import';
export type LaboratoryPreview=Omit<LaboratoryValue,'reviewed'>&{reviewed:false};
export function parseLaboratoryPages(pages:{page:number;text:string}[]):LaboratoryPreview[]{
  const result:LaboratoryPreview[]=[];
  for(const page of pages)for(const raw of page.text.split(/\r?\n/)){
    const line=raw.trim();
    const match=/^([\p{L}][\p{L}\d ()/.,%+-]*?)\s+([<>]=?)?\s*(-?\d+(?:[.,]\d+)?)\s+([^\s\d][^\s]*)\s*(.*)$/u.exec(line);
    if(!match)continue;const value=parseImportNumber(match[3]);if(value===null)continue;
    result.push({id:crypto.randomUUID(),name:match[1].trim(),operator:(match[2]??'') as LaboratoryValue['operator'],value,raw_value:`${match[2]??''}${match[3]}`,unit:match[4],range_text:match[5],source_line:line,page:page.page,reviewed:false});
  }
  if(result.length>200)throw new Error('El estudio tiene más de 200 valores. Dividilo antes de revisar.');return result;
}
export function compareSegmental<T extends {segment:string;component:string;value:number;unit:string}>(before:T[],after:T[]){
  return after.map(current=>{const previous=before.find(p=>p.segment===current.segment&&p.component===current.component&&p.unit===current.unit);return {...current,previous:previous?.value??null,delta:previous?current.value-previous.value:null};});
}
export function bariatricSummary(preop:number,current:number,reference:number|null){
  if(!Number.isFinite(preop)||!Number.isFinite(current)||preop<=0||current<=0||reference!==null&&(!Number.isFinite(reference)||reference<=0))throw new Error('Revisá los pesos antes de calcular el cambio.');
  return {lost_kg:preop-current,total_loss_pct:(preop-current)/preop*100,excess_loss_pct:reference!==null&&reference<preop?(preop-current)/(preop-reference)*100:null};
}
export function kerrSummary(components:Record<string,number|null>,weight:number){
  const masses=['skin','adipose','muscle','bone','residual'].map(key=>components[key]);
  const complete=masses.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0);const total=complete?masses.reduce<number>((n,v)=>n+(v??0),0):null;
  return {complete,total_kg:total,difference_kg:total===null?null:total-weight};
}
export function parseSegmentalPages(pages:{page:number;text:string}[]):SegmentValue[]{
  const result:SegmentValue[]=[];let component:SegmentValue['component']|null=null;
  const segments:[RegExp,SegmentValue['segment']][]=[[/brazo\s+derecho/i,'arm_right'],[/brazo\s+izquierdo/i,'arm_left'],[/tronco/i,'trunk'],[/pierna\s+derecha/i,'leg_right'],[/pierna\s+izquierda/i,'leg_left']];
  for(const page of pages)for(const line of page.text.split(/\r?\n/)){
    const normalized=line.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/muscul|masa magra/i.test(normalized))component='muscle';else if(/grasa/i.test(normalized))component='fat';else if(/agua/i.test(normalized))component='water';else if(/impedancia/i.test(normalized))component='impedance';
    const segment=segments.find(([pattern])=>pattern.test(normalized))?.[1];const match=/(-?\d+(?:[.,]\d+)?)\s*(kg|%|L|ohm|Ω)(?![a-z])/i.exec(normalized);
    if(!segment||!component||!match)continue;const value=parseImportNumber(match[1]);if(value===null)continue;
    const unit=match[2].toLowerCase()==='kg'?'kg':match[2]==='%'?'%':match[2].toLowerCase()==='l'?'L':'ohm';
    result.push({segment,component,value,unit,original:`Página ${page.page}: ${line.trim()}`});
  }
  return result;
}

/** Export the declared questionnaire, never infer absent clinical facts. */
export function intakeExportLines(payload:Record<string,unknown>):string[]{
  const text=(key:string)=>typeof payload[key]==='string'&&String(payload[key]).trim()?String(payload[key]).trim():'Sin informar';
  const fact=(key:string)=>{
    const value=payload[key];if(!value||typeof value!=='object')return 'Sin informar';
    const row=value as {state?:unknown;items?:unknown};
    if(row.state==='none')return 'Declaró que no tiene';
    if(row.state==='reported'&&Array.isArray(row.items)){const items=row.items.filter((item):item is string=>typeof item==='string'&&Boolean(item.trim()));if(items.length)return items.join(', ');}
    return 'Sin informar';
  };
  const number=(key:string,unit:string)=>typeof payload[key]==='number'&&Number.isFinite(payload[key])?`${payload[key]} ${unit}`:'Sin informar';
  return [`Nombre preferido: ${text('preferred_name')}`,`Teléfono declarado: ${text('phone')}`,`Pedido de la paciente: ${text('patient_intent')}`,
    `Alergias declaradas: ${fact('allergies')}`,`Restricciones declaradas: ${fact('restrictions')}`,
    `Antecedentes declarados: ${text('conditions_note')}`,`Prefiere conversar los antecedentes en consulta: ${payload.prefers_to_discuss===true?'Sí':payload.prefers_to_discuss===false?'No':'Sin informar'}`,
    `Tiempo disponible para cocinar: ${number('cooking_time_minutes','minutos')}`,`Agua declarada: ${number('hydration_glasses','vasos por día')}`,
    `Sueño declarado: ${number('sleep_hours','horas')}`,`Energía declarada: ${text('energy')}`];
}
