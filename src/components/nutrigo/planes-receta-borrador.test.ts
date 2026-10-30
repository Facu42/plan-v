import { expect, it } from 'vitest';
import { recetaEnBorrador } from './planes-receta-borrador';
import type { ProfessionalMealPlan } from '../../types/plans';
import type { ProfessionalRecipe } from '../../types/recipes';
const id = '00000000-0000-4000-a000-000000000001';
const receta = { id:'receta', published:{version:2}, current:{version:3} } as ProfessionalRecipe;
const plan = {id,current:{revision:id,period_start:'2026-10-29',period_end:'2026-11-04',meal_times:{Almuerzo:'13:30'},items:[{for_date:'2026-10-29',slot:'Cena',free_text:'Conservar cena',public_note:'Nota'}]}} as unknown as ProfessionalMealPlan;
it('agrega la versión publicada y conserva otras comidas, horarios y revisión',()=>{
 const d=recetaEnBorrador(plan,receta,'2026-10-29','Almuerzo',2,false);
 expect(d.expected_revision).toBe(id);expect(d.items).toHaveLength(2);expect(d.items[0].free_text).toBe('Conservar cena');expect(d.meal_times?.Almuerzo).toBe('13:30');
 expect(d.items[1]).toMatchObject({recipe_id:'receta',recipe_version:2,portions:2});expect(d).not.toHaveProperty('published');
});
it('no reemplaza una comida sin confirmación ni permite recetas sin publicar',()=>{
 expect(()=>recetaEnBorrador(plan,receta,'2026-10-29','Cena',1,false)).toThrow('Reemplazar');
 expect(recetaEnBorrador(plan,receta,'2026-10-29','Cena',1,true).items).toHaveLength(1);
 expect(()=>recetaEnBorrador(null,{...receta,published:null},'2026-10-29','Cena',1,false)).toThrow('publicada');
});
