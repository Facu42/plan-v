import { describe, it, expect } from 'vitest';
import { planRecipe, patientMenuRecipes, recipePresentationKey } from './plan-recipe';
import { planReviewSnapshot, type PlanItemView, type PatientMealPlan, type PlanVersionView } from '../../types/plans';
import { unavailableCard } from '../../types/recipe-plate';
const image={...unavailableCard('Tomate'),cover_status:'ready' as const,cover_url:'https://example.test/real.jpg',cover_alt:'Tomate · imagen ilustrativa generada con IA'};
const recipe={title:'Tomate aprobado',version:2,yield_portions:1,ingredients:[{id:'i',name:'Tomate',quantity:100,unit:'g' as const}],steps:['Cocinar.'],nutrient_source:'',card:image};
const item:PlanItemView={id:'item',for_date:'2026-10-06',slot:'Almuerzo',recipe_id:'r1',recipe_version:2,recipe_title:recipe.title,recipe,portions:1,public_note:'',free_text:null};
describe('misma foto de la versión aprobada en todas las pantallas',()=>{
  it('conserva foto y versión de receta al abrir desde plan',()=>{expect(planRecipe(item)).toMatchObject({version:2,card:image});});
  it('dos versiones del mismo ID tienen claves de apertura y render diferentes',()=>{expect(recipePresentationKey({id:'r1',version:1})).not.toBe(recipePresentationKey({id:'r1',version:2}));});
  it('foto manual disponible tiene estado listo aunque fallara la generación',()=>{expect(planRecipe({...item,dish_card:{...unavailableCard('Tomate'),cover_generation:'failed'}})?.card).toMatchObject({cover_url:image.cover_url,cover_generation:'ready'});});
  it('una propuesta inline muestra su imagen propia sin cambiar ingredientes',()=>{const inline={...item,recipe_id:null,recipe:null,recipe_proposal:{...recipe,nutrition:null},dish_card:image};expect(planRecipe(inline)).toMatchObject({card:image,ingredients:recipe.ingredients});});
  it('agrupa repetidos y prioriza la versión del plan por encima de una asignación anterior',()=>{const plan={id:'p',version:1,items:[item,{...item,id:'repeat',for_date:'2026-10-07'}],published_at:'2026-10-06'} as PatientMealPlan;const previous={...recipe,id:'r1',version:1,card:unavailableCard('Tomate'),assigned_at:'',published_at:''};const menu=patientMenuRecipes(plan,[previous] as never);expect(menu).toHaveLength(1);expect(menu[0]).toMatchObject({version:2,card:image});});
  it('los estados de foto nunca entran en la aprobación del contenido clínico',()=>{const version={id:'v',version:1,status:'draft',published_at:null,period_start:'2026-10-06',period_end:'2026-10-06',items:[{...item,dish_card:image}]} as PlanVersionView;expect(planReviewSnapshot(version).items[0]).not.toHaveProperty('dish_card');expect(planReviewSnapshot(version).items[0]).not.toHaveProperty('recipe');});
});
