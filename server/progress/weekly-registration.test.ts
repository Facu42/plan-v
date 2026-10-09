import { describe, expect, it } from 'vitest';
import { deriveWeeklyRegistration } from './weekly-registration.js';

describe('registro semanal sin calificar cumplimiento',()=>{
  it('cuenta días argentinos únicos y separa revisiones de las cargas',()=>{
    const result=deriveWeeklyRegistration({meals:[{id:'a',logged_at:'2026-10-09T01:00:00Z',status:'pending_review'},{id:'b',logged_at:'2026-10-08T20:00:00Z',status:'confirmed'}],habits:[{date:'2026-10-07',hydration:0,sleep_minutes:420},{date:'2026-10-08',hydration:4,hydration_declared:true}],pendingCare:2},new Date('2026-10-09T01:30:00Z'));
    expect(result).toMatchObject({start:'2026-10-02',end:'2026-10-08',recorded_days:2,meals_logged:2,meals_pending:1,water_days:1,water_average:4,pending_review:3});
  });
  it('un cero declarado cuenta; un cero histórico por defecto no es agua declarada',()=>{
    const empty=deriveWeeklyRegistration({meals:[],habits:[],pendingCare:0},new Date('2026-10-09T12:00:00Z'));
    expect(empty.water_average).toBeNull();expect(empty.recorded_days).toBe(0);
    const result=deriveWeeklyRegistration({meals:[],habits:[{date:'2026-10-09',hydration:0,hydration_declared:true}],pendingCare:0},new Date('2026-10-09T12:00:00Z'));
    expect(result).toMatchObject({water_average:0,water_days:1,recorded_days:1});
  });
  it('excluye registros fuera de la ventana y no limita comidas a veinte',()=>{
    const meals=Array.from({length:35},(_,i)=>({id:String(i),logged_at:'2026-10-09T12:00:00Z',status:'confirmed'}));
    const result=deriveWeeklyRegistration({meals:[...meals,{id:'old',logged_at:'2025-01-01T00:00:00Z',status:'confirmed'}],habits:[],pendingCare:0},new Date('2026-10-09T12:00:00Z'));
    expect(result.meals_logged).toBe(35);expect(result.recorded_days).toBe(1);
  });
});
