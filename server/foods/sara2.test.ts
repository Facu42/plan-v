import { describe, expect, it } from 'vitest';
import { sara2Foods, sara2Detail, SARA2_SOURCE } from './sara2.js';
import { componentGrams, componentNutrients, componentNativeQuantity } from '../../src/types/plan-components.js';
import { calculateRecipeCatalog } from '../../src/types/recipe-catalog-nutrition.js';
import { foodInputSchema } from '../../src/types/foods.js';
import { analyzePlanDay, analyzePlanWeek } from '../../src/types/plan-day-analysis.js';

describe('SARA 2 institucional y unidades nativas', () => {
  it('conserva 930 registros sin el texto fuera de CropBox como filas adicionales', () => {
    const foods=sara2Foods();
    expect(foods).toHaveLength(930); expect(new Set(foods.map(f=>f.id)).size).toBe(930);
    expect(foods.filter(f=>f.kind==='food')).toHaveLength(906);
    expect(foods.filter(f=>f.composition?.basis.unit==='ml')).toHaveLength(9);
    expect(foods.every(f=>f.source===SARA2_SOURCE && f.owner_id===null && f.revision===1)).toBe(true);
  });
  it('separa disponibles de totales y conserva ausentes, colores y unidad B12 impresa', () => {
    const apio=sara2Foods().find(f=>f.name==='Apio, hervido')!;
    const detail=sara2Detail(apio.id,0,39)!;
    expect(detail.components).toHaveLength(39);
    expect(apio.nutrients.carbs).toBe(detail.components.find(c=>c.key==='carbohydrates_available')!.value);
    expect(apio.nutrients.carbs).not.toBe(detail.components.find(c=>c.key==='carbohydrates_total')!.value);
    expect(detail.components.find(c=>c.key==='dietary_fiber')).toMatchObject({value:1.6, flags:['assumed_zero_nonzero']});
    const salmon=sara2Foods().find(f=>f.name==='Salmón blanco, crudo')!;
    expect(salmon.nutrients.calcium).toBeNull();
    expect(sara2Detail(salmon.id,20,19)!.components.every(c=>c.value===null)).toBe(true);
    const conflict=sara2Foods().flatMap(f=>sara2Detail(f.id,36,1)!.components).find(c=>c.flags.includes('unit_conflict'))!;
    expect(conflict).toMatchObject({unit_printed:'mg',unit_definition:'µg',calculation_value:null});
  });
  it('calcula ml sin convertir a gramos en plan y receta, y mantiene la copia histórica', () => {
    const food=sara2Foods().find(f=>f.name==='Ensure Plus (mililitro)')!;
    const part={id:'00000000-0000-4000-a000-000000000001',kind:'food' as const,food_id:food.id,food_revision:1,quantity:50,measure:null,public_note:'',food_snapshot:food};
    expect(componentNativeQuantity(part)).toBe(50); expect(componentGrams(part)).toBeNull();
    expect(componentNutrients(part)?.kcal).toBe(food.nutrients.kcal!/2);
    const draft={yield_portions:2,items:[{name:food.name,quantity:50,unit:'ml',catalog_ref:{id:food.id,revision:1,measure:null}}]};
    const recipe=calculateRecipeCatalog(draft,[food]);
    expect(recipe.per_portion.kcal).toBe(food.nutrients.kcal!/4);
    expect(recipe.ingredient_weight_g).toBeNull(); expect(recipe.lines[0].grams).toBeNull();
    expect(calculateRecipeCatalog(draft,[{...food,nutrients:{...food.nutrients,kcal:1}}],recipe).totals.kcal).toBe(recipe.totals.kcal);
    expect(()=>calculateRecipeCatalog({...draft,items:[{...draft.items[0],unit:'g'}]},[food])).toThrow(/unidad/i);
  });
  it('no acepta que un cliente atribuya su alimento a la tabla institucional', () => {
    const food=sara2Foods()[0]; const {owner_id:_,revision:__,updated_at:___,...input}=food;
    expect(foodInputSchema.safeParse({...input,expected_revision:0}).success).toBe(false);
  });
  it('no suma carbohidratos disponibles con definiciones heredadas sin confirmación',()=>{
    const food=sara2Foods()[0];const legacy={...food,id:'f0000000-0000-4000-a000-000000000002',composition:undefined,source:'USDA · totales',owner_id:'otra'};
    const recipe=calculateRecipeCatalog({yield_portions:1,items:[{name:'SARA',quantity:100,unit:'g',catalog_ref:{id:food.id,revision:1,measure:null}},{name:'Legado',quantity:100,unit:'g',catalog_ref:{id:legacy.id,revision:1,measure:null}}]},[food,legacy]);
    expect(recipe.totals.carbs).toBeNull();expect(recipe.totals.kcal).not.toBeNull();
    const component=(f:typeof food)=>({id:f.id,kind:'food' as const,food_id:f.id,food_revision:1,quantity:100,measure:null,public_note:'',food_snapshot:f});
    expect(analyzePlanDay([{portions:'',component:component(food)},{portions:'',component:component(legacy)}]).nutrients.find(n=>n.key==='carbs')!.total).toBeNull();
  });
  it('no promedia definiciones distintas entre fechas y conserva el promedio homogéneo y días vacíos',()=>{
    const food=sara2Foods()[0],legacy={...food,composition:undefined};
    const line=(f:typeof food)=>({portions:'',component:{id:f.id,kind:'food' as const,food_id:f.id,food_revision:1,quantity:100,measure:null,public_note:'',food_snapshot:f}});
    const dates=(second:typeof food)=>[{date:'2026-10-14',lines:[line(food)]},{date:'2026-10-15',lines:[line(second)]}];
    const mixed=analyzePlanWeek(dates(legacy));
    expect(mixed.nutrients.find(n=>n.key==='carbs')).toMatchObject({total:null,subtotal:null,label:'Carbohidratos · definiciones distintas'});
    expect(mixed.nutrients.find(n=>n.key==='kcal')!.total).toBe(food.nutrients.kcal);
    expect(analyzePlanWeek(dates(food)).nutrients.find(n=>n.key==='carbs')).toMatchObject({total:food.nutrients.carbs,label:'Carbohidratos disponibles'});
    expect(analyzePlanWeek([{date:'2026-10-14',lines:[line(food)]},{date:'2026-10-15',lines:[]}]).nutrients.find(n=>n.key==='carbs')).toMatchObject({total:null,subtotal:food.nutrients.carbs,known:1,missing:1});
  });
});
