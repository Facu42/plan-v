import { describe,expect,it } from 'vitest';
import { mealSlotLabel,planMealLabelsSchema,mealPlanDraftSchema,toPublishedPatientPlan } from './plans';
describe('Momentos personalizados compatibles con versiones',()=>{
  it('mantiene el slot estable y sólo cambia su nombre para lectura',()=>{
    expect(mealSlotLabel('Desayuno',{'Desayuno':'08:00'},{Desayuno:'Primera comida'})).toBe('Primera comida · 08:00');
    expect(mealSlotLabel('Desayuno')).toBe('Desayuno');
  });
  it('rechaza momentos desconocidos y etiquetas duplicadas, incluso contra nombres anteriores',()=>{
    expect(planMealLabelsSchema.safeParse({Desayuno:'Primera comida'}).success).toBe(true);
    expect(planMealLabelsSchema.safeParse({Desayuno:'Almuerzo'}).success).toBe(false);
    expect(planMealLabelsSchema.safeParse({Séptima:'Colación nocturna'}).success).toBe(false);
  });
  it('acepta etiquetas al guardar y conserva la copia publicada',()=>{
    const input={id:'a0000000-0000-4000-8000-000000000001',period_start:'2026-10-12',period_end:'2026-10-12',meal_labels:{Desayuno:'Primera comida'},items:[{for_date:'2026-10-12',slot:'Desayuno',free_text:'Indicación real'}]};
    expect(mealPlanDraftSchema.parse(input).meal_labels).toEqual(input.meal_labels);
    expect(toPublishedPatientPlan({id:input.id,timezone:'America/Argentina/Buenos_Aires',published:{meal_labels:input.meal_labels,version:1,period_start:input.period_start,period_end:input.period_end,published_at:'2026-10-12T00:00:00Z',items:[]}} as never)?.meal_labels).toEqual(input.meal_labels);
  });
});
