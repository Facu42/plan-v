import { expect,it } from 'vitest';
import { sara2Foods } from './sara2.js';
import { calculateRecipeCatalog } from '../../src/types/recipe-catalog-nutrition.js';
import { summarizeMenuNutrition } from '../ai/menu-nutrition.js';
import { buildMenuJobContext,hashAiContext,providerJobContext } from '../ai/context.js';

const food=sara2Foods().find(f=>f.name==='Apio, hervido')!;
const snapshot=calculateRecipeCatalog({yield_portions:1,items:[{name:food.name,quantity:100,unit:'g',catalog_ref:{id:food.id,revision:1,measure:null}}]},[food]);
const p=snapshot.per_portion;
const nutrition={origin:'declared' as const,source:'catalogo_alimentos.v1',per_portion:{kcal:p.kcal!,protein_g:p.protein!,carbs_g:p.carbs!,fat_g:p.fat!}};
const catalog=[{id:'sara',version:1,nutrition,carbohydrates:'available' as const},{id:'legacy',version:1,nutrition:{...nutrition,source:'Etiqueta ficticia',per_portion:{kcal:100,protein_g:2,carbs_g:10,fat_g:1}}}];
const dated=(id:string)=>({for_date:'2026-10-15',recipe_id:id,recipe_version:1,portions:1});
const component={id:food.id,kind:'food' as const,food_id:food.id,food_revision:1,quantity:100,measure:null,public_note:'',food_snapshot:food};

it('el resumen de recetas sin componentes no suma disponibles y declarados, ni una receta marcada mixta',()=>{
  expect(summarizeMenuNutrition([dated('sara'),dated('legacy')],null,catalog).days[0]).toMatchObject({totals:null,status:'missing_nutrients'});
  expect(summarizeMenuNutrition([dated('sara')],null,[{...catalog[0],carbohydrates:'mixed'}]).days[0]).toMatchObject({totals:null,status:'missing_nutrients'});
  expect(summarizeMenuNutrition([dated('legacy'),dated('legacy')],null,catalog).days[0].totals?.carbs_g).toBe(20);
});
it('receta SARA y alimento SARA comparten definición; receta heredada y alimento SARA no',()=>{
  const item={for_date:'2026-10-15',components:[component]};
  expect(summarizeMenuNutrition([dated('sara'),item],null,catalog).days[0]).toMatchObject({status:'no_target',totals:{kcal:food.nutrients.kcal!*2,carbs_g:food.nutrients.carbs!*2}});
  expect(summarizeMenuNutrition([dated('legacy'),item],null,catalog).days[0]).toMatchObject({totals:null,status:'missing_nutrients'});
});
it('la definición confiable modifica la identidad local del trabajo y no viaja al proveedor',()=>{
  const recipe={...catalog[0],title:food.name,yield_portions:1,steps:['Servir.'],ingredients:[{name:food.name,quantity:100,unit:'g' as const}]};
  const intake={allergies:{state:'none' as const,items:[]},restrictions:{state:'none' as const,items:[]},cooking_time_minutes:null};
  const context=buildMenuJobContext({intake,catalog:[recipe]});
  const external=providerJobContext(context);
  expect(JSON.stringify(external)).not.toContain('carbohydrates');
  expect(hashAiContext(context)).not.toBe(hashAiContext(buildMenuJobContext({intake,catalog:[{...recipe,carbohydrates:'source_declared' as const}]})));
});
