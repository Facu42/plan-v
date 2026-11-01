import {z} from 'zod';
export const bioimpedanceValuesSchema=z.object({weight_kg:z.number().positive().max(500).nullable(),body_fat_pct:z.number().min(0).max(100).nullable(),muscle_kg:z.number().min(0).max(500).nullable(),water_pct:z.number().min(0).max(100).nullable(),visceral_fat:z.number().min(0).max(100).nullable()}).strict().refine(v=>Object.values(v).some(x=>x!==null),'Revisá al menos una medida.');
export const bioimpedanceReviewSchema=z.object({id:z.uuid(),recorded_on:z.iso.date(),values:bioimpedanceValuesSchema,reviewed:z.literal(true)}).strict();
/** Conservative text extraction: original report stays in the browser; ambiguous lines need review. */
export function parseBioimpedance(text:string){
 const read=(label:string,unit:string,max:number,positive=false)=>{
  const re=new RegExp(`^(?:${label})\\s*[:=]\\s*(\\d+(?:[.,]\\d+)?)\\s*${unit}\\s*$`,'gim');
  const hits=[...text.matchAll(re)];if(hits.length!==1)return null;
  const value=Number(hits[0][1].replace(',','.'));return value<=max&&(!positive||value>0)?value:null;
 };
 return {weight_kg:read('peso(?: corporal)?','kg',500,true),body_fat_pct:read('(?:porcentaje de grasa|grasa(?: corporal)?)','%',100),muscle_kg:read('masa muscular','kg',500),water_pct:read('agua(?: corporal)?','%',100),visceral_fat:read('grasa visceral','(?:nivel|índice)?',100)};
}
