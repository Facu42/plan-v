import { expect,it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlanPublishedItem } from './MealPlanVersions';
import { Editor } from './ModelCatalog';
import { sara2Foods } from '../../../server/foods/sara2';
import type { PlanItemView } from '../../types/plans';
import type { ModelPlanItem,ProfessionalModel } from '../../types/models';

const ml=sara2Foods().find(food=>food.name==='Ensure Plus (mililitro)')!;
function renderFood(food:typeof ml,quantity:number,measure:string|null=null){
  const item={slot:'Almuerzo',for_date:'2026-10-16',public_note:'',components:[{id:food.id,kind:'food',food_id:food.id,food_revision:food.revision,quantity,measure,public_note:'',food_snapshot:food}]} as PlanItemView;
  return renderToStaticMarkup(<PlanPublishedItem item={item}/>);
}
it('la copia profesional publicada conserva mililitros y no inventa gramos',()=>{
  const html=renderFood(ml,50);
  expect(html).toContain('50 ml');
  expect(html).not.toContain('50 g');
});
it('la copia profesional conserva gramos históricos y medidas declaradas',()=>{
  const legacy={...ml,composition:undefined};
  expect(renderFood(legacy,50)).toContain('50 g');
  expect(renderFood(legacy,2,'vaso')).toContain('2 vaso');
  expect(renderFood(sara2Foods().find(food=>food.name==='Ensure polvo (gramo)')!,10)).toContain('10 g');
});
it('el editor real del modelo rotula su campo de cantidad con la unidad congelada',()=>{
  const item:ModelPlanItem={day:1,slot:'Almuerzo',recipe_id:null,recipe_version:null,recipe_title:null,recipe:null,free_text:null,portions:null,public_note:'',components:[{id:ml.id,kind:'food',food_id:ml.id,food_revision:1,quantity:50,measure:null,public_note:'',food_snapshot:ml}]};
  const model:ProfessionalModel={id:'10000000-0000-4000-a000-000000000091',revision:'20000000-0000-4000-a000-000000000091',kind:'plan',current:{version:1,title:'Modelo revisable',description:'',published_at:null,lines:[],plan:{days:1,items:[item]}},published:null,archived_at:null,updated_at:'2026-10-16T00:00:00Z'};
  const html=renderToStaticMarkup(<Editor model={model} kind="plan" patients={[]} onClose={()=>{}} onSaved={()=>{}}/>);
  expect(html).toContain('Cantidad de Ensure Plus (mililitro)');
  expect(html).toContain('<small>ml</small>');
  expect(html).not.toContain('<small>g</small>');
});
