import { describe, expect, it } from 'vitest';
import { defaultNutritionSettings, nutritionSettingsSchema, exchangeSaveSchema, exchangeComponent, type ExchangeGroup } from './nutrition-capabilities';
import { foodInputSchema } from './foods';
const a='a0000000-0000-4000-8000-000000000001', b='a0000000-0000-4000-8000-000000000002';
describe('Capacidades nutricionales revisadas',()=>{
  it('no habilita fórmulas ni referencias por defecto',()=>{expect(defaultNutritionSettings().approvals).toEqual([]);expect(defaultNutritionSettings().micronutrients).toEqual([]);});
  it('exige referencia y elimina logos externos que podrían rastrear documentos',()=>{
    const settings=defaultNutritionSettings();
    expect(nutritionSettingsSchema.safeParse({...settings,approvals:[{formula:'harris',citation:'',url:'https://pubmed.ncbi.nlm.nih.gov/6741850/'}]}).success).toBe(false);
    expect(nutritionSettingsSchema.safeParse({...settings,brand:{...settings.brand,logo:'https://example.com/logo.png'}}).success).toBe(false);
  });
  it('grupos requieren revisión profesional y alternativas diferentes',()=>{
    const value={id:a,expected_revision:0,name:'Fruta',reference:'Referencia del consultorio',reviewed:true,items:[{food_id:a,food_revision:1,grams:100},{food_id:b,food_revision:1,grams:150}]};
    expect(exchangeSaveSchema.safeParse(value).success).toBe(true);expect(exchangeSaveSchema.safeParse({...value,reviewed:false}).success).toBe(false);expect(exchangeSaveSchema.safeParse({...value,items:[value.items[0],value.items[0]]}).success).toBe(false);
  });
  it('planes por grupos producen componentes alimentarios con cantidades y fuentes congeladas',()=>{
    const input=foodInputSchema.parse({id:a,expected_revision:0,name:'Manzana',kind:'food',source:'Etiqueta revisada',nutrients:{kcal:50},portions:[]});
    const group={id:b,name:'Fruta',reference:'Referencia',revision:1,owner_id:a,updated_at:'',items:[{grams:120,food:{...input,revision:1,owner_id:a,updated_at:''}}]} as ExchangeGroup;
    expect(exchangeComponent(group,a,2,b)).toMatchObject({kind:'food',quantity:240,food_revision:1,food_snapshot:{source:'Etiqueta revisada'},public_note:'Grupo Fruta · 2 intercambios. Revisado por tu nutricionista.'});
    expect(()=>exchangeComponent(group,b,2,b)).toThrow();expect(()=>exchangeComponent(group,a,0,b)).toThrow();
  });
});
