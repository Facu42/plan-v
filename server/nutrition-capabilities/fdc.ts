import { CareError } from '../care/errors.js';
import { foodInputSchema,NUTRIENTS,type FoodInput,type FoodNutrients } from '../../src/types/foods.js';
const IDS:Record<string,number>={kcal:1008,protein:1003,carbs:1005,fat:1004,fiber:1079,sodium:1093,calcium:1087,iron:1089,potassium:1092,magnesium:1090,vitamin_c:1162};
type FdcFood={fdcId?:number;description?:string;dataType?:string;foodCategory?:{description?:string}|string;foodNutrients?:Array<{nutrient?:{id?:number;unitName?:string};amount?:number;nutrientId?:number;unitName?:string;value?:number}>};
/** USDA Foundation/SR Legacy declaran composición por100g. No extrapola medidas ni usa datos Branded. */
export function mapFdcFood(food:FdcFood,id:string):FoodInput{
  if(!Number.isInteger(food.fdcId)||food.fdcId!<=0||typeof food.description!=='string'||!food.description.trim()||!['Foundation','SR Legacy'].includes(food.dataType??''))throw new CareError(400,'Esta entrada no pertenece a las fuentes USDA habilitadas.');
  const declared=Array.isArray(food.foodNutrients)?food.foodNutrients:[];
  const nutrients=Object.fromEntries(NUTRIENTS.map(([key,,unit,max])=>{const row=declared.find(row=>row&&typeof row==='object'&&(row.nutrient?.id??row.nutrientId)===IDS[key]&&String(row.nutrient?.unitName??row.unitName).toLowerCase()===unit.toLowerCase());const value=row?.amount??row?.value;return[key,typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=max?value:null];})) as FoodNutrients;
  return foodInputSchema.parse({id,expected_revision:0,name:food.description.slice(0,160),brand:'',category:(typeof food.foodCategory==='string'?food.foodCategory:food.foodCategory?.description??'').slice(0,80),kind:'food',source:`USDA FoodData Central · ${food.dataType}`,reference:`FDC ${food.fdcId} · datos USDA de dominio público · https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients?fdcId=${food.fdcId} · documentación: https://fdc.nal.usda.gov/data-documentation.html`,nutrients,portions:[]});
}
async function fdc(path:string,body?:unknown):Promise<unknown>{
  const key=process.env.FDC_API_KEY;if(!key)throw new CareError(501,'Configurá una clave válida de USDA FoodData Central para buscar en esta fuente externa.');
  const url=new URL(`https://api.nal.usda.gov/fdc/v1/${path}`);url.searchParams.set('api_key',key);
  let response:Response;try{response=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});}catch{throw new CareError(503,'No pudimos consultar USDA. Reintentá; tu catálogo propio sigue disponible.');}
  if(!response.ok)throw new CareError(response.status===429?429:503,response.status===429?'USDA alcanzó su límite temporal. Reintentá más tarde.':'No pudimos consultar USDA. Revisá la clave y la disponibilidad del servicio.');
  const raw=await response.text();if(raw.length>3000000)throw new CareError(503,'La respuesta de USDA supera el límite de lectura.');try{return JSON.parse(raw);}catch{throw new CareError(503,'USDA no devolvió datos legibles.');}
}
export async function searchFdcFoods(query:string,page:number){
  const result=await fdc('foods/search',{query,dataType:['Foundation','SR Legacy'],pageSize:25,pageNumber:page}) as {foods?:FdcFood[];totalHits?:number;currentPage?:number};
  if(!Array.isArray(result.foods)||result.foods.length>25||!Number.isSafeInteger(result.totalHits)||result.totalHits!<0)throw new CareError(503,'USDA devolvió una búsqueda incompleta.');
  return{foods:result.foods.filter(food=>food&&Number.isInteger(food.fdcId)&&typeof food.description==='string'&&['Foundation','SR Legacy'].includes(food.dataType??'')).map(food=>({fdc_id:food.fdcId!,name:food.description!,data_type:food.dataType!})),total:result.totalHits!,page,page_size:25,source:'USDA FoodData Central',license:'Datos USDA de dominio público'};
}
export async function getFdcFood(fdcId:number,id:string){return mapFdcFood(await fdc(`food/${fdcId}`) as FdcFood,id);}
