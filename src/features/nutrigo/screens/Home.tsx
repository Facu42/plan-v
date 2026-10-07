import { useEffect, useState } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { bodyDataApi, nutritionTargetApi } from '../../../api/nutrition-target';
import { recipesApi } from '../../../api/recipes';
import { plansApi } from '../../../api/plans';
import { exerciseApi } from '../../../api/exercise';
import { EXERCISE_CATEGORY_LABELS } from '../../../types/exercise';
import { careApi } from '../../../api/care';
import { patientMenuRecipes, planRecipe } from '../plan-recipe';
import { latestWeight } from '../../../lib/measurement-display';
import { recipeNutritionLabel, type NutrientAmounts } from '../../../types/ai-nutrition';
import { planSlotKey, PLAN_SLOT_KEYS } from '../../../types/plans';
import { GOAL_LABELS, type TargetGoal } from '../../../lib/nutrition-target';
import { descendants, fields, formatNumber, leaf, Stateful, useRemote, dateId, type ScreenProps } from './shared';

async function homeData(id: string, signal: AbortSignal) {
  const [body,target,recipes,plan,exercise,care] = await Promise.allSettled([
    bodyDataApi.get(id,false,signal), nutritionTargetApi.get(id,false,signal), recipesApi.assigned(id,signal), plansApi.published(id,signal), exerciseApi.get(id,false,signal), careApi.snapshot(id,false,signal),
  ]);
  return { body:body.status==='fulfilled'?body.value.data:null, target:target.status==='fulfilled'?target.value.target:null, recipes:recipes.status==='fulfilled'?recipes.value.recipes:[], plan:plan.status==='fulfilled'?plan.value.plan:null, exercise:exercise.status==='fulfilled'?exercise.value.exercise:null, care:care.status==='fulfilled'?care.value:null,
    failed:[body,target,recipes,plan,exercise,care].some(row=>row.status==='rejected'&&!(row.reason instanceof DOMException&&row.reason.name==='AbortError')) };
}
// The original bars are examples, not measurements. Keep their layout, but do
// not show a sample progress curve as a patient's clinical result.
function neutralGraph(node:SourceNode, values:Record<string,string> = {}) {
  if(nodeName(node)==='Progress Bar')return {props:{style:{background:'transparent'}},children:fields(node,{},child=>child.tag==='img'?{props:{style:{visibility:'hidden'},'aria-hidden':true}}:leaf(child)&&sourceText(child) in values?{text:values[sourceText(child)]}:undefined)};
  return ['Donut Progress','Mask group'].includes(nodeName(node))
    ? {props:{style:{visibility:'hidden'},'aria-hidden':true}} : undefined;
}
function nutrientBinding(node:SourceNode,amounts:Partial<Record<keyof NutrientAmounts,number|null>>|null|undefined,portions:number|null=1) {
  const key:Record<string,'kcal'|'carbs_g'|'protein_g'|'fat_g'>={'Info Cal':'kcal','Info Carbs':'carbs_g','Info Protein':'protein_g','Info Fats':'fat_g'};
  const nutrient=key[nodeName(node)];
  if(!nutrient)return undefined;
  const value=amounts?.[nutrient];
  const amount=value!=null&&portions!=null?value*portions:null;
  return {children:fields(node,{},child=>leaf(child)&&/^\d/.test(sourceText(child))?{text:amount==null?'—':`${formatNumber(amount)}${nutrient==='kcal'?' kcal':' g'}`}:undefined)};
}
export function NutrigoHome({ patient,onNavigate,onSignOut,now=new Date(),onRecord,onHydration,onRest,onLogMeal }: ScreenProps & {onRecord:()=>void;onHydration:()=>void;onRest:()=>void;onLogMeal:(slot?:string)=>void}) {
  const [refresh,setRefresh]=useState(0);
  const data=useRemote(`${patient.id}:home:${refresh}`, signal=>homeData(patient.id,signal));
  useEffect(()=>{const reload=()=>setRefresh(v=>v+1);window.addEventListener('plan-v:care-changed',reload);return()=>window.removeEventListener('plan-v:care-changed',reload);},[]);
  const current=data.data;
  useEffect(()=>{if(!current?.plan?.items.some(item=>['queued','leased'].includes(item.dish_card?.cover_generation??'')))return;const timer=setInterval(()=>setRefresh(v=>v+1),4000);return()=>clearInterval(timer);},[current]);
  const weightDisplay=latestWeight(current?.care?.measurements??[],current?.body?.weight_kg??null);
  const weight=weightDisplay.value;
  const target=current?.target?.result;
  const targetGoal=current?.target?.inputs.goal as TargetGoal|undefined;
  const weightGoal=targetGoal?GOAL_LABELS[targetGoal]:'Meta de peso no registrada';
  const known=patient.nutritionLogCount>0;
  const kcal=known?patient.kcal:null;
  const today=dateId(now);
  const meals=(current?.plan?.items.filter(item=>item.for_date===today)??[]).slice().sort((a,b)=>PLAN_SLOT_KEYS.indexOf(planSlotKey(a.slot)!)-PLAN_SLOT_KEYS.indexOf(planSlotKey(b.slot)!));
  const recipes=patientMenuRecipes(current?.plan??null,current?.recipes??[]);
  const activeAssignments=current?.exercise?.assignments.filter(a=>a.status==='active')??[];
  const routines=activeAssignments.flatMap(a=>a.items);
  const workoutItems=activeAssignments.flatMap(assignment=>assignment.items.map(item=>({ item, assignment })));
  const resolve:SourceResolver=node=>{
    const name=nodeName(node),text=sourceText(node);
    if(name==='Card Statistic - Dashboard') {
      if(text.startsWith('Weight'))return {onClick:onRecord,label:'Registrar peso y medidas',children:fields(node,{'84:1483':formatNumber(weight),'427:14421':formatNumber(weight)},child=>neutralGraph(child,{'78':formatNumber(weight),'Kg':weightDisplay.unit,'kg':weightDisplay.unit})??(leaf(child)&&['Kg','kg'].includes(sourceText(child))?{text:weightDisplay.unit}:leaf(child)&&sourceText(child)==='78'?{text:formatNumber(weight)}:leaf(child)&&/^\d+$/.test(sourceText(child))?{text:''}:undefined))};
      if(text.startsWith('Steps'))return {onClick:()=>onNavigate('ejercicio'),label:'Ver actividad',children:fields(node,{},child=>neutralGraph(child)??(leaf(child)&&/^8050|76%|1950/.test(sourceText(child))?{text:'—'}:undefined))};
      if(text.startsWith('Sleep'))return {onClick:onRest,label:'Registrar descanso',children:fields(node,{},child=>nodeName(child)==='Column Ruler'?{props:{style:{visibility:'hidden'},'aria-hidden':true}}:leaf(child)&&sourceText(child)==='6.5'?{text:patient.sleepMinutes==null?'—':formatNumber(patient.sleepMinutes/60)}:undefined)};
      const hydrationFill=Math.min(100,Math.max(0,patient.hydration/8*100));
      return {onClick:onHydration,label:'Registrar hidratación',children:fields(node,{},child=>{
        if(nodeName(child)==='Progress Bar')return {props:{style:{height:`${hydrationFill}%`,flex:'none',minHeight:patient.hydration?'16px':'0'}}};
        if(leaf(child)&&sourceText(child)==='1.3/2')return {text:formatNumber(patient.hydration)};
        if(leaf(child)&&sourceText(child)==='0.7')return {text:'—'};
        if(leaf(child)&&['litre left','litre'].includes(sourceText(child)))return {text:'vasos'};
        return undefined;
      })};
    }
    if(name==='Widget Weight Data')return {children:fields(node,{},child=>{
      if(nodeName(child)==='Button More')return {onClick:onRecord,label:'Registrar peso y medidas'};
      if(['Donut Base','Mask group','Donut Progress'].includes(nodeName(child)))return {props:{style:{opacity:nodeName(child)==='Donut Progress'?'.7':'.45'}}};
      if(sourceText(child)==='78 kg')return {children:fields(child,{},inner=>leaf(inner)&&sourceText(inner)==='78'?{text:formatNumber(weight)}:leaf(inner)&&['Kg','kg'].includes(sourceText(inner))?{text:weightDisplay.unit}:undefined)};
      if(sourceText(child)==='13 kg left')return {text:weightGoal};
      if(leaf(child)&&['85','65'].includes(sourceText(child)))return {text:''};
      return leaf(child)&&['Kg','kg'].includes(sourceText(child))?{text:weightDisplay.unit}:leaf(child)&&sourceText(child)==='78'?{text:formatNumber(weight)}:/Button/.test(nodeName(child))?{onClick:onRecord,label:'Registrar peso'}:undefined;
    })};
    if(name==='Widget Calories Intake')return {children:fields(node,{},child=>{
      if(nodeName(child)==='Header-Section')return {children:<>{fields(child,{},inner=>nodeName(inner)==='Button More'?{hidden:true}:undefined)}<button type="button" className="mcp-action mcp-load-meal" onClick={()=>onLogMeal()} aria-label="Cargar comida">Cargar comida</button></>};
      if(nodeName(child)==='Button More')return {onClick:()=>onLogMeal(),label:'Registrar comida'};
      const graph=neutralGraph(child);if(graph)return graph;
      if(!leaf(child))return undefined;
      const value=sourceText(child);const substitutions:Record<string,string>={'1240':target&&kcal!==null?formatNumber(target.kcal-kcal):'—','1750':formatNumber(kcal),'510':'—','120':known?formatNumber(patient.macros.carbs_g):'—','70':known?formatNumber(patient.macros.protein_g):'—','20':known?formatNumber(patient.macros.fat_g):'—','/325gr':target?`/${formatNumber(target.carbs_g)} g`:'','/75gr':target?`/${formatNumber(target.protein_g)} g`:'','/44gr':target?`/${formatNumber(target.fat_g)} g`:'','37%':target&&known?`${Math.round(patient.macros.carbs_g/target.carbs_g*100)}%`:'—','93%':target&&known?`${Math.round(patient.macros.protein_g/target.protein_g*100)}%`:'—','45%':target&&known?`${Math.round(patient.macros.fat_g/target.fat_g*100)}%`:'—'};
      return value in substitutions?{text:substitutions[value]}:undefined;
    })};
    if(name==='Widget Workout Progress')return {children:fields(node,{},child=>{
      if(nodeName(child)==='Body') {
        const prototypes=child.children.filter((value): value is SourceNode=>typeof value==='object');
        return {children:prototypes.map((prototype,index)=>{
          const row=workoutItems[index];
          const completed=row?.assignment.feedback?.sets_completed ?? null;
          const expected=row?.item.sets ?? null;
          const progress=expected && completed!=null ? Math.min(100,Math.round(completed/expected*100)) : null;
          return fields(prototype,{
            '71:1391':row?.item.name ?? 'Sin rutina asignada',
            '71:1388':progress==null?'—':`${progress}%`,
            '71:1387':completed==null?'':expected?`(${completed}/${expected})`:`(${completed})`,
            '72:1403':row?.item.category ? EXERCISE_CATEGORY_LABELS[row.item.category] : 'Ejercicio',
          },inner=>{
            if(nodeName(inner)==='Progress Bar')return {props:{style:{width:`${progress ?? 0}%`}}};
            if(nodeName(inner)==='Empty Bar')return {props:{style:{opacity:progress==null?.7:.35}}};
            return undefined;
          },`${patient.id}:workout:${index}`);
        })};
      }
      return /Button/.test(nodeName(child))?{onClick:()=>onNavigate('ejercicio'),label:'Ver ejercicio'}:undefined;
    })};
    if(name==='Widget Recommended Menu')return {children:fields(node,{},child=>nodeName(child)==='List Exercise'?{children:recipes.length?recipes.slice(0,child.children.filter(n=>typeof n==='object'&&nodeName(n)==='Card Recommended Menu').length).map(recipe=>{
      const prototype=descendants(child).find(n=>/Item List/.test(nodeName(n)))??child.children.find(n=>typeof n==='object');
      if(typeof prototype!=='object')return null;
      let replaced=false;
      return fields(prototype,{},n=>{
        if(n===prototype)return {onClick:()=>onNavigate('recetas'),label:`Ver ${recipe.title}`};
        const nutrients=nutrientBinding(n,recipe.nutrition?.per_portion??recipe.card?.macros);if(nutrients)return nutrients;
        if(leaf(n)&&['Breakfast','Lunch','Snack','Dinner'].includes(sourceText(n)))return {text:recipe.card?.category??'Receta'};
        if(nodeName(n)==='Place Image Here')return recipe.card?.cover_url?{children:<img src={recipe.card.cover_url} alt={recipe.title} className="absolute inset-0 block size-full object-cover"/>}:undefined;
        if(leaf(n)&&sourceText(n).length>35&&!replaced){replaced=true;return {text:recipe.title};}
        if(leaf(n)&&sourceText(n).length>35&&replaced)return {text:`${recipeNutritionLabel(recipe.nutrition,recipe.nutrient_source,recipe.card?.macros)} · por porción`};
        if(/Button/.test(nodeName(n)))return {onClick:()=>onNavigate('recetas'),label:`Ver ${recipe.title}`};
        return undefined;
      },recipe.id);
    }):<p>Todavía no tenés recetas asignadas.</p>}:nodeName(child)==='Button More'?{onClick:()=>onNavigate('recetas'),label:'Ver menú'}:undefined)};
    if(name==='Widget Recommended Exercises')return {children:fields(node,{},child=>nodeName(child)==='List Exercise'?{children:routines.length?routines.slice(0,3).map(item=><button className="mcp-action" key={item.id} onClick={()=>onNavigate('ejercicio')}>{item.name} · {item.sets} series</button>):<p>Sin ejercicios asignados.</p>}:nodeName(child)==='Button More'?{onClick:()=>onNavigate('ejercicio'),label:'Ver ejercicio'}:undefined)};
    if(name==='List Meal Plan')return {children:meals.length?meals.map(meal=>{
      const prototype=node.children.find(n=>typeof n==='object');if(typeof prototype!=='object')return null;
      let titleSet=false;
      return fields(prototype,{},child=>{
        const recipe=meal.recipe??meal.recipe_proposal;
        const photo=planRecipe(meal)?.card;
        if(['Image','Image Area','Place Image Here'].includes(nodeName(child))&&photo?.cover_status==='ready'&&photo.cover_url)return {children:<img src={photo.cover_url} alt={photo.cover_alt} className="absolute inset-0 block size-full object-cover"/>};
        const nutrients=nutrientBinding(child,recipe?.nutrition?.per_portion,meal.portions);if(nutrients)return nutrients;
        if(leaf(child)&&['Breakfast','Lunch','Snack','Dinner'].includes(sourceText(child)))return {text:meal.slot};
        if(leaf(child)&&sourceText(child).length>30&&!titleSet){titleSet=true;return {children:<>{meal.recipe_title??meal.free_text??'Comida del plan'}<span className="block text-[11px]">{meal.portions!=null?`${meal.portions.toLocaleString('es-AR',{maximumFractionDigits:4})} porciones · `:''}{recipeNutritionLabel(recipe?.nutrition)}{meal.public_note?` · ${meal.public_note}`:''}</span></>};}
        if(/Checkbox/.test(nodeName(child)))return {onClick:()=>onLogMeal(meal.slot),label:`Registrar ${meal.slot}`};
        if(nodeName(child)==='Button More')return {onClick:()=>onNavigate('mensajes'),label:`Consultar sobre ${meal.slot}`};
        return undefined;
      },meal.id);
    }):<p className="text-[12px]">Sin comidas publicadas para hoy. <button className="mcp-action" onClick={()=>onNavigate('plan')}>Ver plan</button></p>};
    if(name==='List Recent Activity')return {children:patient.logs.length?patient.logs.slice(0,4).map(log=><p className="text-[12px] py-[8px]" key={log.id}>{log.slot} · {log.status==='pending_review'?'Pendiente de revisión':'Revisada'} · {log.description}</p>):<p className="text-[12px]">Todavía no registraste comidas.</p>};
    if(name==='Calendar')return {onClick:()=>onNavigate('agenda'),label:'Ver agenda',children:fields(node,{},child=>leaf(child)&&['September 2028','September'].includes(sourceText(child))?{text:now.toLocaleDateString('es-AR',{month:'long',year:'numeric'})}:leaf(child)&&/^\d+$/.test(sourceText(child))?{text:''}:undefined)};
    return undefined;
  };
  return <FramePair nodes={['12:792','427:14405']} resolve={resolve} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {patient.nutritionEstimated && <p className="mcp-screen-state">Los nutrientes registrados de hoy incluyen estimaciones de IA revisadas por tu nutricionista.</p>}
    {(!current||current.failed||data.error)&&<Stateful loading={!current&&!data.error} error={data.error|| (current?.failed?'Algunos datos no se pudieron cargar.':undefined)} onRetry={data.reload}/>}
  </FramePair>;
}
