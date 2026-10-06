import { useEffect,useState } from 'react';
import { FramePair } from '../FramePair';
import { nodeId, nodeName, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { plansApi } from '../../../api/plans';
import { PLAN_SLOTS, buildPublishedPlanDays, type PlanItemView } from '../../../types/plans';
import { unavailableCard } from '../../../types/recipe-plate';
import { NutrigoRecipeDetail, type DisplayRecipe } from './Menu';
import { AiPlanNutritionSummary } from '../../../components/nutrigo/AiPlanNutritionSummary';
import { dateLabel, fields, leaf, objects, searchBinding, Stateful, useRemote, type ScreenProps } from './shared';

export function planRecipe(item:PlanItemView):DisplayRecipe|null {
  const recipe=item.recipe??item.recipe_proposal;
  if(!recipe)return null;
  return {id:item.id,title:recipe.title,version:item.recipe_version??1,yield_portions:recipe.yield_portions,ingredients:recipe.ingredients.map((ingredient,index)=>({...ingredient,id:'id'in ingredient?ingredient.id:`${item.id}:${index}`})),steps:recipe.steps,nutrient_source:'nutrient_source'in recipe?recipe.nutrient_source:recipe.nutrition?.source??'',nutrition:recipe.nutrition??undefined,card:unavailableCard(recipe.title,item.slot)};
}
export function NutrigoPlan({patient,onNavigate,onSignOut,query=''}:ScreenProps) {
  const remote=useRemote(`${patient.id}:plan`,signal=>plansApi.published(patient.id,signal));
  const [search,setSearch]=useState(query),[page,setPage]=useState(0),[chosen,setChosen]=useState<PlanItemView|null>(null),[hideEmpty,setHideEmpty]=useState(false);
  const plan=remote.data?.plan;
  useEffect(()=>{setPage(0);setChosen(null);},[plan?.id,plan?.version]);
  const days=plan?buildPublishedPlanDays(plan):[];
  const shown=days.slice(page*7,page*7+7);
  const slots=PLAN_SLOTS.filter(slot=>['Desayuno','Almuerzo','Merienda','Cena'].includes(slot)||plan?.items.some(item=>item.slot===slot));
  const matchesItem=(item:PlanItemView)=>(item.recipe_title??item.free_text??'').toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'));
  const detail=chosen?planRecipe(chosen):null;
  if(detail)return <NutrigoRecipeDetail key={detail.id} recipe={detail} initialPortions={chosen?.portions??undefined} onBack={()=>setChosen(null)} backLabel="Volver al plan" patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}/>;
  const resolve:SourceResolver=node=>{
    const name=nodeName(node),text=sourceText(node);
    if(['89:3846','470:15679'].includes(nodeId(node)))return {onClick:()=>setPage(v=>Math.max(0,v-1)),label:'Semana anterior',props:{disabled:page===0}};
    if(['89:3878','470:15680'].includes(nodeId(node)))return {onClick:()=>setPage(v=>v+1),label:'Semana siguiente',props:{disabled:(page+1)*7>=days.length}};
    const input=searchBinding(node,search,setSearch,'Buscar en el plan');if(input)return input;
    if(name==='Table') {
      const children=objects(node),head=children[0],prototype=children.find(child=>nodeName(child)==='Table-row-meal plan'&&!sourceText(child).startsWith('Week'));
      if(!plan||!prototype)return {children:<Stateful loading={!remote.data&&!remote.error} error={remote.error} empty="Todavía no tenés un plan publicado." onRetry={remote.reload}/>};
      const header=head?fields(head,{},child=>nodeName(child)==='Button Picker'&&sourceText(child)==='Week 2'?{onClick:()=>setPage(p=>p+1<Math.ceil(days.length/7)?p+1:0),text:`Semana ${page+1}`,label:'Cambiar semana',props:{disabled:days.length<=7}}:leaf(child)&&sourceText(child)==='Week 2'?{text:`Semana ${page+1}`}:undefined):null;
      return {children:<>{header}{shown.filter(day=>!hideEmpty||day.items.length).map(day=>{
        const cells=objects(prototype);
        const first=cells[0];
        return fields(prototype,{},child=>{
          if(child===first)return {children:fields(first,{},p=>leaf(p)?{text:/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/.test(sourceText(p))?day.weekday:dateLabel(day.isoDate)}:undefined)};
          const index=cells.indexOf(child)-1;
          if(index>=0){const slot=['Desayuno','Almuerzo','Merienda','Cena'][index];const item=day.items.find(entry=>entry.slot===slot);const title=item?.recipe_title??item?.free_text??'';const show=item?matchesItem(item):!search;return {children:fields(child,{},p=>leaf(p)?{text:show?(title||'Sin indicación'):'—'}:undefined),...(show&&item&&planRecipe(item)?{onClick:()=>setChosen(item),label:`Ver ${slot}: ${title}`}:{})};}
          return undefined;
        },day.isoDate);
      })}{slots.some(s=>s==='Colación'||s==='Extra')&&<section className="p-[16px]"><h3>Otras indicaciones</h3>{shown.flatMap(day=>day.items.filter(item=>(item.slot==='Colación'||item.slot==='Extra')&&matchesItem(item)).map(item=><p key={item.id}>{dateLabel(item.for_date)} · {item.slot} · {item.recipe_title??item.free_text} {planRecipe(item)&&<button className="mcp-action" onClick={()=>setChosen(item)}>Ver receta</button>}</p>))}</section>}</>};
    }
    if(leaf(node)&&['September 2028','September'].includes(text))return {text:plan?`${dateLabel(plan.period_start)} – ${dateLabel(plan.period_end)}`:'Sin plan publicado'};
    if(/^Button/.test(name)&&text==='Add Menu')return {onClick:()=>onNavigate('mensajes'),text:'Pedir un cambio'};
    if(/^Button/.test(name)&&text==='Filter')return {onClick:()=>setHideEmpty(v=>!v),text:hideEmpty?'Ver todos los días':'Sólo días con plan',props:{'aria-pressed':hideEmpty}};
    if(/^Button/.test(name)&&text==='Week 2')return {onClick:()=>setPage(p=>p+1<Math.ceil(days.length/7)?p+1:0),text:`Semana ${page+1}`};
    return undefined;
  };
  return <FramePair nodes={['84:2994','470:15300']} resolve={resolve} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} query={search} onSearch={setSearch}>
    <div className="mcp-screen-state"><button className="mcp-action" onClick={()=>onNavigate('compras')}>Lista de compras</button></div>
    {shown.some(day=>day.items.some(item=>item.public_note&&matchesItem(item)))&&<section className="mcp-screen-state" aria-label="Indicaciones de tu nutricionista"><h3>Indicaciones de tu nutricionista</h3>{shown.flatMap(day=>day.items.filter(item=>item.public_note&&matchesItem(item)).map(item=><p key={item.id}>{dateLabel(day.isoDate)} · {item.slot}: {item.public_note}</p>))}</section>}
    {plan?.nutrition&&<AiPlanNutritionSummary nutrition={plan.nutrition}/>} {chosen&&!detail&&<p>La indicación no contiene una receta.</p>}
  </FramePair>;
}
