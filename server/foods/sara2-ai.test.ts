import { expect,it } from 'vitest';
import { linkSara2Recipe } from './sara2-ai.js';
import { sara2Foods } from './sara2.js';
it('vincula sólo nombre exacto y unidad nativa, conserva procedencia IA y calcula sin números del proveedor',()=>{
  const food=sara2Foods().find(f=>f.name==='Apio, hervido')!;
  const linked=linkSara2Recipe({yield_portions:2,items:[{name:food.name,quantity:100,unit:'g'}]});
  expect(linked.items[0].catalog_ref).toEqual({id:food.id,revision:1,measure:null});
  expect(linked.nutrition).toMatchObject({origin:'ai_estimate',source:'estimacion_ia.v2',per_portion:{kcal:food.nutrients.kcal!/2}});
  expect(linkSara2Recipe({yield_portions:1,items:[{name:'Apio',quantity:100,unit:'g'}]})).toMatchObject({nutrition:null});
  expect(linkSara2Recipe({yield_portions:1,items:[{name:'Salmón blanco',quantity:100,unit:'g'}]}).items[0].catalog_ref).toBeUndefined();
  expect(linkSara2Recipe({yield_portions:1,items:[{name:'Ensure Plus (mililitro)',quantity:100,unit:'g'}]}).items[0].catalog_ref).toBeUndefined();
});
