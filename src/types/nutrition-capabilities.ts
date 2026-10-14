import { z } from 'zod';
import { NUTRIENTS, type Food } from './foods';
import type { PlanComponentView } from './plan-components';

export const FORMULAS = ['mifflin', 'harris', 'fao', 'katch', 'scale'] as const;
export type NutritionFormula = typeof FORMULAS[number];
export const FORMULA_LABELS: Record<NutritionFormula,string> = { mifflin:'Mifflin-St Jeor', harris:'Harris-Benedict revisada (1984)', fao:'FAO/OMS/ONU (1985)', katch:'Katch-McArdle', scale:'Basal medido por la balanza' };
const https = z.string().trim().max(500).refine(value => { try { const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password; } catch { return false; } }, 'Usá una referencia HTTPS pública.');
export const formulaApprovalSchema = z.object({ formula:z.enum(FORMULAS), citation:z.string().trim().min(3).max(500), url:https }).strict();
export const micronutrientReferenceSchema = z.object({ key:z.enum(['sodium','calcium','iron','potassium','magnesium','vitamin_c']), value:z.number().finite().positive().max(100000), citation:z.string().trim().min(3).max(500), url:https }).strict();
export const clinicBrandSchema = z.object({ name:z.string().trim().max(120), contact:z.string().trim().max(240), logo:z.string().max(700000).refine(value => !value || /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value),'Usá un logo PNG o JPG de menos de 500 KB.') }).strict();
export type ClinicBrand = z.infer<typeof clinicBrandSchema>;
export const nutritionSettingsSchema = z.object({ approvals:z.array(formulaApprovalSchema).max(5), micronutrients:z.array(micronutrientReferenceSchema).max(6), brand:clinicBrandSchema }).strict().superRefine((value,ctx) => {
  if(new Set(value.approvals.map(item=>item.formula)).size!==value.approvals.length)ctx.addIssue({code:'custom',path:['approvals'],message:'No repitas una fórmula.'});
  if(new Set(value.micronutrients.map(item=>item.key)).size!==value.micronutrients.length)ctx.addIssue({code:'custom',path:['micronutrients'],message:'No repitas un nutriente.'});
});
export type NutritionSettings = z.infer<typeof nutritionSettingsSchema>;
export type NutritionSettingsView = { settings:NutritionSettings; revision:number };
export const defaultNutritionSettings = ():NutritionSettings => ({approvals:[],micronutrients:[],brand:{name:'',contact:'',logo:''}});
export const settingsSaveSchema = z.object({expected_revision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER-1),settings:nutritionSettingsSchema}).strict();
export const exchangeSaveSchema = z.object({id:z.uuid(),expected_revision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER-1),name:z.string().trim().min(2).max(80),reference:z.string().trim().min(3).max(500),reviewed:z.literal(true),items:z.array(z.object({food_id:z.uuid(),food_revision:z.number().int().min(1),grams:z.number().finite().positive().max(100000)}).strict()).min(2).max(5)}).strict().superRefine((value,ctx)=>{if(new Set(value.items.map(item=>item.food_id)).size!==value.items.length)ctx.addIssue({code:'custom',path:['items'],message:'No repitas alimentos en el grupo.'});});
export type ExchangeInput = z.infer<typeof exchangeSaveSchema>;
export type ExchangeGroup = Omit<ExchangeInput,'expected_revision'|'items'|'reviewed'> & {revision:number;owner_id:string;items:Array<{grams:number;food:Food}>;updated_at:string};
/** Grupos aprobados por la profesional: alimentos concretos, cantidades reales, nunca cantidades inferidas. */
export function exchangeComponent(group:ExchangeGroup,foodId:string,units:number,id:string):PlanComponentView {
  if(!Number.isFinite(units)||units<=0||units>20)throw new Error('Indicá una cantidad mayor que cero y de hasta veinte intercambios.');
  const item=group.items.find(row=>row.food.id===foodId);
  if(!item||item.grams*units>100000)throw new Error('Elegí una alternativa del grupo con una cantidad válida.');
  return {id,kind:'food',food_id:item.food.id,food_revision:item.food.revision,food_snapshot:structuredClone(item.food),quantity:item.grams*units,measure:null,public_note:`Grupo ${group.name} · ${units} intercambios. Revisado por tu nutricionista.`};
}
export const micronutrientLabel = (key:string) => NUTRIENTS.find(([id])=>id===key)?.[1]??key;
