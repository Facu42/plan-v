import {describe,it,expect} from 'vitest';
import {parseBioimpedance,bioimpedanceReviewSchema} from './bioimpedance.js';
describe('bioimpedancia ficticia y revisión obligatoria',()=>{
 it('lee las cinco medidas sin inventar otras ni confundir porcentaje con kg',()=>{
  expect(parseBioimpedance('Peso: 68,5 kg\nGrasa corporal: 25,2 %\nMasa muscular: 44 kg\nAgua corporal: 52 %\nGrasa visceral: 7')).toEqual({weight_kg:68.5,body_fat_pct:25.2,muscle_kg:44,water_pct:52,visceral_fat:7});
 });
 it('no completa ausencias, unidades incorrectas ni datos contradictorios',()=>{
  expect(parseBioimpedance('Peso: 68 kg\nPeso: 70 kg\nAgua: 40 L\nGrasa corporal: 150 %')).toEqual({weight_kg:null,body_fat_pct:null,muscle_kg:null,water_pct:null,visceral_fat:null});
 });
 it('no permite guardar el borrador sin revisión ni valores fuera de rango',()=>{
  const input={id:crypto.randomUUID(),recorded_on:'2026-10-01',values:parseBioimpedance('Peso: 68 kg'),reviewed:true};
  expect(bioimpedanceReviewSchema.safeParse(input).success).toBe(true);
  expect(bioimpedanceReviewSchema.safeParse({...input,reviewed:false}).success).toBe(false);
  expect(bioimpedanceReviewSchema.safeParse({...input,values:{...input.values,water_pct:101}}).success).toBe(false);
 });
});
