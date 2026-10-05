import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, renderSource, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoHome } from './Home';
import { NutrigoMenu, NutrigoRecipeDetail, type DisplayRecipe } from './Menu';
import { NutrigoPlan, planRecipe } from './Plan';
import { unavailableCard } from '../../../types/recipe-plate';
import type { PlanItemView } from '../../../types/plans';

const context = vi.hoisted(() => ({ mobile:false, data:null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json',{eager:true,import:'default'});
vi.mock('../FramePair',()=>({FramePair:({nodes,resolve,children}:{nodes:[string,string];resolve:SourceResolver;children?:React.ReactNode})=><><SourceView source={frames[`../source/${nodes[context.mobile?1:0].replace(':','-')}.json`]} resolve={resolve} translate={translateSource}/>{children}</>}));
vi.mock('./shared',async original=>({...await original<typeof import('./shared')>(),useRemote:()=>({data:context.data,error:'',reload:vi.fn(),setData:vi.fn()})}));
const patient={id:'p1',name:'Ana Real',hydration:5,sleepMinutes:450,nutritionLogCount:0,logs:[],macros:{kcal:0,carbs_g:0,protein_g:0,fat_g:0},messages:[],activities:[]} as unknown as ShowroomPatient;
const navigate=()=>undefined;
const recipe:DisplayRecipe={id:'real-r',title:'Preparación real aprobada',version:2,yield_portions:2,ingredients:[{id:'real-i',name:'Lentejas reales',quantity:200,unit:'g'}],steps:['Lavar la preparación real.','Cocinar hasta el punto indicado.'],nutrient_source:'Estimación de IA revisada',nutrition:{origin:'ai_estimate',source:'Estimación de IA revisada',per_portion:{kcal:620,carbs_g:80,protein_g:20,fat_g:15}},card:unavailableCard('Preparación real aprobada','Almuerzo')};
beforeEach(()=>{context.mobile=false;context.data=null;});
describe.each([false,true])('pantallas principales MCP (celular %s)',mobile=>{
  it('inicio muestra registros reales sin duplicar tarjetas ni usar métricas de ejemplo',()=>{
    context.mobile=mobile;context.data={body:{weight_kg:72},target:null,recipes:[],plan:null,exercise:null,care:{measurements:[]},failed:false};
    const html=renderToStaticMarkup(<NutrigoHome patient={{...patient,hydration:5,sleepMinutes:450,nutritionLogCount:0}} onNavigate={navigate} onRecord={navigate} onHydration={navigate} onRest={navigate} onLogMeal={navigate}/>);
    expect(html).toContain('72');expect(html).toContain('7,5');expect(html).not.toContain('8050');expect(html).not.toContain('1240');expect(html).not.toContain('1.3/2');
    expect(html.match(/data-name="Card Statistic - Dashboard"/g)?.length).toBe(4);
    expect(html).toContain('background:transparent');
  });
  it('menú conserva datos y estimación de la receta asignada',()=>{
    context.mobile=mobile;context.data={recipes:[recipe],favorites:[]};
    const html=renderToStaticMarkup(<NutrigoMenu patient={patient} onNavigate={navigate}/>);
    expect(html).toContain(recipe.title);expect(html).toContain('620');expect(html).toContain('Ver '+recipe.title);
    expect(html).toContain('Nutrientes estimados por IA');
    expect(html).not.toContain('Grilled Turkey');expect(html).not.toContain('Avocado Toast');
  });
  it('inicio conecta nutrientes, porciones y procedencia de recomendaciones y comidas publicadas',()=>{
    context.mobile=mobile;
    const knownRecipe={...recipe,nutrition:{...recipe.nutrition!,per_portion:{...recipe.nutrition!.per_portion,kcal:777}}};
    context.data={body:null,target:null,recipes:[knownRecipe],plan:{items:[{id:'real-meal',for_date:'2026-10-03',slot:'Almuerzo',free_text:recipe.title,portions:.5,public_note:'Nota aprobada',recipe_proposal:knownRecipe}]},exercise:{assignments:[]},care:null,failed:false};
    const html=renderToStaticMarkup(<NutrigoHome patient={patient} now={new Date('2026-10-03T12:00:00-03:00')} onNavigate={navigate} onRecord={navigate} onHydration={navigate} onRest={navigate} onLogMeal={navigate}/>);
    expect(html).toContain('777 kcal');expect(html).toContain('388,5 kcal');expect(html).toContain('Nutrientes estimados por IA');expect(html).toContain('Nota aprobada');expect(html).toContain('aria-label="Consultar sobre Almuerzo"');
  });
  it('detalle de la versión aprobada aplica la porción asignada y conserva la estimación',()=>{
    context.mobile=mobile;
    const html=renderToStaticMarkup(<NutrigoRecipeDetail recipe={recipe} initialPortions={.5} onBack={navigate} patientName={patient.name} onNavigate={navigate}/>);
    expect(html).toContain('50 g Lentejas reales');expect(html).toContain('310');expect(html).toContain('Nutrientes estimados por IA');
    expect(html).toContain(recipe.steps[0]);expect(html).toContain(recipe.steps[1]);expect(html).not.toContain('Grilled Turkey');
    expect(html).toContain('aria-label="Volver al menú"');
  });
  it('inicio muestra nutrientes declarados parciales del catálogo manual sin inventar los restantes',()=>{
    context.mobile=mobile;
    const manual={...recipe,nutrition:undefined,nutrient_source:'Tabla declarada',card:{...recipe.card,macro_status:'declared',macros:{kcal:777,carbs_g:null,protein_g:null,fat_g:null}}};
    context.data={body:null,target:null,recipes:[manual],plan:null,exercise:{assignments:[]},care:null,failed:false};
    const html=renderToStaticMarkup(<NutrigoHome patient={patient} onNavigate={navigate} onRecord={navigate} onHydration={navigate} onRest={navigate} onLogMeal={navigate}/>);
    expect(html).toContain('777 kcal');expect(html).toContain('Nutrientes declarados');expect(html).not.toContain('350 kcal');
  });
  it('plan muestra únicamente fechas e indicaciones publicadas',()=>{
    context.mobile=mobile;context.data={plan:{id:'plan-real',version:1,timezone:'America/Argentina/Buenos_Aires',period_start:'2026-10-03',period_end:'2026-10-03',published_at:'2026-10-03T12:00:00Z',items:[{id:'real-item',for_date:'2026-10-03',slot:'Almuerzo',recipe_id:null,recipe_version:null,recipe_title:null,recipe:null,free_text:recipe.title,portions:.5,public_note:'Indicación pública',recipe_proposal:recipe}]}};
    const html=renderToStaticMarkup(<NutrigoPlan patient={patient} onNavigate={navigate}/>);
    expect(html).toContain(recipe.title);expect(html).toContain('Sábado');expect(html).toContain('Indicación pública');expect(html).not.toContain('September 2028');expect(html).not.toContain('Avocado Toast');
    expect(html.match(/<button[^>]*aria-label="Semana anterior"[^>]*>/)?.[0]).toContain('disabled');expect(html.match(/<button[^>]*aria-label="Semana siguiente"[^>]*>/)?.[0]).toContain('disabled');
  });
});
it('el renderer reutiliza un subtree enlazado sin agregar otra copia del marco',()=>{
  const original:SourceNode={tag:'div',props:{className:'p-[24px]','data-node-id':'test:1'},children:[{tag:'p',props:{'data-node-id':'test:2'},children:['ejemplo']}]};
  const clone=renderSource(original,node=>node.props['data-node-id']==='test:2'?{text:'Datos reales'}:undefined,translateSource);
  const html=renderToStaticMarkup(<SourceView source={original} resolve={node=>node===original?{children:clone,onClick:navigate,label:'Acción real'}:undefined} translate={translateSource}/>);
  expect(html.match(/p-\[24px\]/g)?.length).toBe(1);expect(html).toContain('Datos reales');expect(html).toMatch(/^<button/);
});
it('la receta inline conserva procedencia al reconstruir el detalle publicado',()=>{
  const view=planRecipe({id:'item-real',slot:'Almuerzo',recipe_proposal:recipe} as unknown as PlanItemView);
  expect(view?.nutrition?.origin).toBe('ai_estimate');expect(view?.ingredients[0].quantity).toBe(200);
});
