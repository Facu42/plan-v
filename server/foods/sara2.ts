import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { NUTRIENTS, SARA2_SOURCE, type Food, type FoodNutrients } from '../../src/types/foods.js';
export { SARA2_SOURCE };

type Cell=[string|null,number|null,number,string|null,number,number];
type Row=[string,string,string,string|null,number,number,string[],number,string|null,string[],number,number|null,number,number|null,string,string|null,Cell[]];
type Dataset={source:{sha256:string;institutional_pdf:string;conicet_pdf:string;title:string;license:unknown};components:Array<{key:string;unit_definition:string;definition_page:number}>;groups:Record<string,string>;states:string[];cell_flags:string[];palette:Array<{rgb:number[];source:string;label:string;match_method:string}>;rows:Row[];extraction_issues:Array<{page:number;kind:string;heading?:string}>;source_headers:Array<{page:number;table_shape:string;raw_header:string}>};
let loaded:Dataset|undefined;
function dataset():Dataset {
  if(loaded)return loaded;
  const bytes=readFileSync(new URL('./data/sara2-2022.json',import.meta.url));
  if(createHash('sha256').update(bytes).digest('hex')!=='bf0a12654c68cc97827afb5c2e90c58b97b233d9f1b4e9e35296c67cc28f0634')throw new Error('SARA2 dataset checksum mismatch');
  loaded=JSON.parse(bytes.toString('utf8')) as Dataset;
  if(loaded.rows.length!==930||loaded.components.length!==39||new Set(loaded.rows.map(r=>r[0])).size!==930||loaded.rows.some(r=>r[16].length!==39))throw new Error('SARA2 dataset shape mismatch');
  return loaded;
}
const mapping:Record<string,string>={kcal:'energy',protein:'protein',carbs:'carbohydrates_available',fat:'total_lipids',fiber:'dietary_fiber',sodium:'sodium',calcium:'calcium',iron:'iron',potassium:'potassium',magnesium:'magnesium',vitamin_c:'vitamin_c'};
export function sara2Foods():Food[] {
  const d=dataset();
  return d.rows.map(r=>({id:r[0],name:r[1],brand:'',category:d.groups[String(r[4])],kind:r[5]?'supplement':'food',source:SARA2_SOURCE,
    reference:`${d.source.institutional_pdf} · p. ${r[10]} · tabla ${r[14]} · fila ${r[12]} · ID derivado, no oficial`,
    nutrients:Object.fromEntries(NUTRIENTS.map(([key])=>[key,r[16][d.components.findIndex(c=>c.key===mapping[key])][1]])) as FoodNutrients,
    portions:[],owner_id:null,revision:1,updated_at:'2022-07-01T00:00:00.000Z',
    composition:{dataset:'sara2-2022-v1',source_sha256:d.source.sha256,record_id:`SARA2-2022-P${r[10]}-T${r[14]}-R${r[12]}`,basis:{amount:100,unit:r[8]==='mililitro'?'ml':'g'},carbohydrates:'available',source_page:r[10]}}));
}
export type Sara2Component={key:string;raw:string|null;value:number|null;state:string;unit_printed:string|null;unit_definition:string;calculation_value:number|null;flags:string[];provenance:Dataset['palette'][number]|null;page:number|null;table:string|null;row:number|null};
export type Sara2Detail={id:string;source:Dataset['source'];basis:{amount:100;unit:'g'|'ml'};preparation:string[];flags:string[];total:number;offset:number;components:Sara2Component[];original_names:[string,string|null];native_unit_label:string|null;source_headers:Dataset['source_headers'];issues:Dataset['extraction_issues']};
export function sara2Detail(id:string,offset:number,limit:number):Sara2Detail|null {
  const d=dataset(),r=d.rows.find(r=>r[0]===id);if(!r)return null;
  const components=d.components.slice(offset,offset+limit).map((def,i)=>{const index=offset+i,c=r[16][index],flags=d.cell_flags.filter((_,bit)=>Boolean(c[5]&(1<<bit))),missing=d.states[c[2]]==='missing_source_row';
    return{key:def.key,raw:c[0],value:c[1],state:d.states[c[2]],unit_printed:missing?null:c[3]??def.unit_definition,unit_definition:def.unit_definition,calculation_value:flags.includes('unit_conflict')?null:c[1],flags,provenance:c[4]<0?null:d.palette[c[4]],page:missing?null:r[index<20?10:11],table:missing?null:r[index<20?14:15],row:missing?null:r[index<20?12:13]};});
  return{id,source:d.source,basis:{amount:100,unit:r[8]==='mililitro'?'ml':'g'},preparation:r[6],flags:r[9],total:39,offset,components,original_names:[r[2],r[3]],native_unit_label:r[8],source_headers:d.source_headers.filter(h=>h.page===r[10]||h.page===r[11]),issues:d.extraction_issues.filter(issue=>issue.page===r[10]||issue.page===r[11])};
}
