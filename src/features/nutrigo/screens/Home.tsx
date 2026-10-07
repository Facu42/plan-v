import { useEffect, useState, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { bodyDataApi, nutritionTargetApi } from '../../../api/nutrition-target';
import { recipesApi } from '../../../api/recipes';
import { plansApi } from '../../../api/plans';
import { exerciseApi } from '../../../api/exercise';
import { careApi } from '../../../api/care';
import { patientMenuRecipes, planRecipe } from '../plan-recipe';
import { latestWeight } from '../../../lib/measurement-display';
import { recipeNutritionLabel, type NutrientAmounts } from '../../../types/ai-nutrition';
import { planSlotKey, PLAN_SLOT_KEYS } from '../../../types/plans';
import { EXERCISE_CATEGORY_LABELS } from '../../../types/exercise';
import { barFill, descendants, fields, formatNumber, leaf, listChildren, objects, percent, Ring, source, Stateful, timeLabel, useRemote, dateId, type ScreenProps } from './shared';

async function homeData(id: string, signal: AbortSignal) {
  const [body,target,recipes,plan,exercise,care] = await Promise.allSettled([
    bodyDataApi.get(id,false,signal), nutritionTargetApi.get(id,false,signal), recipesApi.assigned(id,signal), plansApi.published(id,signal), exerciseApi.get(id,false,signal), careApi.snapshot(id,false,signal),
  ]);
  return { body:body.status==='fulfilled'?body.value.data:null, target:target.status==='fulfilled'?target.value.target:null, recipes:recipes.status==='fulfilled'?recipes.value.recipes:[], plan:plan.status==='fulfilled'?plan.value.plan:null, exercise:exercise.status==='fulfilled'?exercise.value.exercise:null, care:care.status==='fulfilled'?care.value:null,
    failed:[body,target,recipes,plan,exercise,care].some(row=>row.status==='rejected'&&!(row.reason instanceof DOMException&&row.reason.name==='AbortError')) };
}

/** Un vaso son 250 ml; la meta por defecto es de ocho vasos (2 L) mientras la nutricionista no indique otra. */
const GLASS_LITRES = 0.25;
const DEFAULT_WATER_GLASSES = 8;
const litres = (glasses: number) => formatNumber(glasses * GLASS_LITRES);
const text = (node: SourceNode, ...samples: string[]) => leaf(node) && samples.includes(sourceText(node));
const sample = (node: SourceNode, pattern: RegExp) => leaf(node) && pattern.test(sourceText(node));
const hide: SourceBinding = { props: { style: { visibility: 'hidden' }, 'aria-hidden': true } };

function nutrientBinding(node:SourceNode,amounts:Partial<Record<keyof NutrientAmounts,number|null>>|null|undefined,portions:number|null=1) {
  const key:Record<string,'kcal'|'carbs_g'|'protein_g'|'fat_g'>={'Info Cal':'kcal','Info Carbs':'carbs_g','Info Protein':'protein_g','Info Fats':'fat_g'};
  const nutrient=key[nodeName(node)];
  if(!nutrient)return undefined;
  const value=amounts?.[nutrient];
  const amount=value!=null&&portions!=null?value*portions:null;
  return {children:fields(node,{},child=>leaf(child)&&/^\d/.test(sourceText(child))?{text:amount==null?'—':`${formatNumber(amount)}${nutrient==='kcal'?' kcal':' g'}`}:undefined)};
}

/** El dibujo de la dona del archivo se reemplaza por el mismo arco con el valor real (nunca se oculta el bloque). */
function donut(node: SourceNode, ring: ReactNode, drawn: string[], resolve: SourceResolver): SourceBinding {
  return { children: <>{ring}{objects(node).map((child, index) => drawn.includes(nodeName(child)) ? null : source(child, resolve, index))}</> };
}

type Activity = { at: string; color: number; bold: string; rest: string };

export function NutrigoHome({ patient,onNavigate,onSignOut,now=new Date(),onRecord,onHydration,onRest,onLogMeal }: ScreenProps & {onRecord:()=>void;onHydration:()=>void;onRest:()=>void;onLogMeal:(slot?:string)=>void}) {
  const [refresh,setRefresh]=useState(0);
  const data=useRemote(`${patient.id}:home:${refresh}`, signal=>homeData(patient.id,signal));
  useEffect(()=>{const reload=()=>setRefresh(v=>v+1);window.addEventListener('plan-v:care-changed',reload);return()=>window.removeEventListener('plan-v:care-changed',reload);},[]);
  const current=data.data;
  useEffect(()=>{if(!current?.plan?.items.some(item=>['queued','leased'].includes(item.dish_card?.cover_generation??'')))return;const timer=setInterval(()=>setRefresh(v=>v+1),4000);return()=>clearInterval(timer);},[current]);
  const today=dateId(now);

  // Peso: último registro, el primero de la serie y la meta si la nutricionista la cargó.
  const measurements=current?.care?.measurements??[];
  const weightDisplay=latestWeight(measurements,current?.body?.weight_kg??null);
  const weight=weightDisplay.value;
  const weights=measurements.filter(row=>row.kind==='weight').sort((a,b)=>a.captured_on.localeCompare(b.captured_on));
  const startWeight=weights[0]?.value_numeric??weight;
  // Plan V todavía no guarda una meta de peso: los extremos muestran el inicio y «Meta».
  const goalWeight:number|null=null;
  const weightPct=goalWeight!=null&&startWeight!=null&&weight!=null&&startWeight!==goalWeight?percent(startWeight-weight,startWeight-goalWeight):null;
  const ruler=weight==null?[]:[10,5,0,-5,-10].map(step=>Math.round(weight/5)*5+step);

  // Calorías y macros revisados del día contra la meta indicada.
  const target=current?.target?.result;
  const known=patient.nutritionLogCount>0;
  const kcal=known?patient.kcal:null;
  const burned=(current?.care?.records??[]).filter(row=>row.data.kind==='activity'&&row.recorded_on===today).reduce((sum,row)=>sum+(row.data.kind==='activity'?row.data.kcal??0:0),0);
  const macroPct={carbs:percent(known?patient.macros.carbs_g:null,target?.carbs_g),protein:percent(known?patient.macros.protein_g:null,target?.protein_g),fat:percent(known?patient.macros.fat_g:null,target?.fat_g)};

  // Hábitos de la semana (descanso y agua) ya registrados por la paciente.
  const days=patient.journey?.days??[];
  const sleepWeek=[...Array(Math.max(0,8-days.length)).fill(null),...days.map(day=>day.sleepMinutes)].slice(-8);
  const glasses=patient.hydration??0;
  const waterPct=percent(glasses,DEFAULT_WATER_GLASSES)??0;

  // Rutina asignada: series registradas en los últimos siete días sobre las indicadas.
  const assignments=current?.exercise?.assignments.filter(a=>a.status==='active')??[];
  const routines=assignments.flatMap(a=>a.items.map(item=>({item,assignment:a})));
  const weekAgo=Date.parse(today)-6*86400000;
  const logs=current?.exercise?.activities??[];
  const routineProgress=routines.map(({item,assignment})=>{
    const done=logs.filter(log=>log.assignment_id===assignment.id&&log.activity===item.name&&Date.parse(log.logged_at)>=weekAgo).reduce((sum,log)=>sum+(log.sets??0),0);
    return {item,done:Math.min(done,item.sets),total:item.sets};
  });

  const meals=(current?.plan?.items.filter(item=>item.for_date===today)??[]).slice().sort((a,b)=>PLAN_SLOT_KEYS.indexOf(planSlotKey(a.slot)!)-PLAN_SLOT_KEYS.indexOf(planSlotKey(b.slot)!));
  const recipes=patientMenuRecipes(current?.plan??null,current?.recipes??[]);
  const loggedSlots=new Set(patient.logs.filter(log=>dateId(new Date(log.logged_at))===today).map(log=>log.slot));

  // Semana del calendario (lunes a sábado, como el archivo) con hoy marcado.
  const monday=new Date(`${today}T12:00:00`);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
  const week=Array.from({length:6},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return {id:dateId(d),day:d.getDate()};});

  const activity:Activity[]=[
    ...(patient.logs??[]).map(log=>({at:log.logged_at,color:0,bold:log.slot,rest:` ${log.status==='pending_review'?'registrada, pendiente de revisión':'revisada'}: ${log.description}`})),
    ...(patient.activities??[]).map(row=>({at:row.logged_at,color:1,bold:row.activity,rest:` registrada: ${row.duration_minutes} min, intensidad ${row.intensity}.`})),
    ...(patient.messages??[]).map(message=>({at:message.sent_at,color:2,bold:message.from==='patient'?'Mensaje enviado:':'Mensaje de tu nutricionista:',rest:` "${message.text.length>80?`${message.text.slice(0,80)}…`:message.text}"`})),
  ].filter(row=>!Number.isNaN(Date.parse(row.at))).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,4);

  const resolve:SourceResolver=node=>{
    const name=nodeName(node),content=sourceText(node);
    if(name==='Card Statistic - Dashboard') {
      if(content.startsWith('Weight'))return {onClick:onRecord,label:'Registrar peso y medidas',children:fields(node,{},child=>{
        if(nodeName(child)==='Slider')return {props:{style:{paddingLeft:weight==null||!ruler.length?'0%':`${Math.max(0,Math.min(92,((ruler[0]-weight)/20)*100))}%`}}};
        if(text(child,'78'))return {text:formatNumber(weight)};
        if(text(child,'kg','Kg'))return {text:weightDisplay.unit};
        if(sample(child,/^\d+$/)){const index=['85','80','75','70','65'].indexOf(sourceText(child));return {text:index>=0&&ruler.length?String(ruler[index]):''};}
        return undefined;
      })};
      if(content.startsWith('Steps')){
        // Plan V todavía no recibe pasos (no importa datos de dispositivos): la barra queda en cero.
        return {onClick:()=>onNavigate('ejercicio'),label:'Ver actividad',children:fields(node,{},child=>{
          if(nodeName(child)==='Progress Bar')return barFill(0,'filled');
          if(nodeName(child)==='Empty Bar')return barFill(0,'empty');
          if(text(child,'8050'))return {text:'0'};
          if(text(child,'76%'))return {text:'0%'};
          if(sample(child,/steps left/))return {text:'Sin pasos registrados'};
          return undefined;
        })};
      }
      if(content.startsWith('Sleep'))return {onClick:onRest,label:'Registrar descanso',children:fields(node,{},child=>{
        if(text(child,'6.5'))return {text:patient.sleepMinutes==null?'0':formatNumber(patient.sleepMinutes/60)};
        if(nodeName(child)==='Column Ruler'){
          const columns=descendants(node).filter(n=>nodeName(n)==='Column Ruler');
          const minutes=sleepWeek[columns.indexOf(child)]??null;
          const [top,bar,...rest]=objects(child);
          const empty=40*(1-Math.min(1,(minutes??0)/600));
          return {children:<>{top&&source(top,()=>({props:{style:{height:`${empty}px`}}}),0)}{bar&&source(bar,()=>minutes?undefined:{props:{style:{display:'none'}}},1)}{rest.map((n,i)=>source(n,()=>undefined,i+2))}</>};
        }
        return undefined;
      })};
      return {onClick:onHydration,label:'Registrar hidratación',children:fields(node,{},child=>{
        if(nodeName(child)==='Chart'&&objects(child).some(n=>nodeName(n)==='Progress Bar'))return {props:{style:{justifyContent:'flex-end'}},children:objects(child).map((n,i)=>source(n,m=>nodeName(m)==='Progress Bar'?{props:{style:{flex:`0 0 ${Math.max(waterPct,24)}%`}},children:fields(m,{},leafNode=>text(leafNode,'1.3/2')?{text:`${litres(glasses)}/${litres(DEFAULT_WATER_GLASSES)}`}:text(leafNode,'litre')?{text:'L'}:undefined)}:undefined,i))};
        if(text(child,'0.7'))return {text:litres(Math.max(0,DEFAULT_WATER_GLASSES-glasses))};
        if(text(child,'litre left'))return {text:'L restantes'};
        return undefined;
      })};
    }
    if(name==='Widget Weight Data'){const weightLeaf:SourceResolver=child=>{
      if(nodeName(child)==='Chart'&&descendants(child).some(n=>nodeName(n)==='Donut Progress'))return donut(child,<span className="absolute left-0 top-0 block size-[204px]"><Ring pct={weightPct??(weight!=null?100:0)} color="#ffa257" track="#ffe6b5" thickness={30} half/></span>,['Donut Base','Mask group','Donut Progress'],weightLeaf);
      if(text(child,'78'))return {text:formatNumber(weight)};
      if(text(child,'kg','Kg'))return {text:weightDisplay.unit};
      if(text(child,'Current Weight'))return {text:'Peso actual'};
      if(sample(child,/kg left/))return {text:goalWeight!=null&&weight!=null?`${formatNumber(Math.abs(weight-goalWeight))} ${weightDisplay.unit} para la meta`:startWeight!=null&&weight!=null&&weights.length>1?`${weight<=startWeight?'−':'+'}${formatNumber(Math.abs(weight-startWeight))} ${weightDisplay.unit} desde el inicio`:'Primer registro'};
      if(text(child,'85'))return {text:formatNumber(startWeight)};
      if(text(child,'65'))return {text:goalWeight!=null?formatNumber(goalWeight):'Meta'};
      if(/Button/.test(nodeName(child)))return {onClick:onRecord,label:'Registrar peso'};
      return undefined;
    };return {children:fields(node,{},weightLeaf)};}
    if(name==='Widget Calories Intake'){const calorieLeaf:SourceResolver=child=>{
      if(nodeName(child)==='Button More')return {onClick:()=>onLogMeal(),label:'Registrar comida'};
      if(nodeName(child)==='Chart'&&objects(child).some(n=>nodeName(n)==='Donut Progress'))return donut(child,<span className="absolute block" style={{inset:'4.63% 4.17% 4.63% 5.09%'}}><Ring pct={percent(kcal,target?.kcal)} color="#ffcb65" track="#fefcfb" thickness={14}/></span>,['Donut Progress'],calorieLeaf);
      if(nodeName(child)==='Item List Macronutrients'){
        const label=descendants(child).map(sourceText).find(t=>['Carbohydrates','Proteins','Fats'].includes(t));
        const pct=label==='Carbohydrates'?macroPct.carbs:label==='Proteins'?macroPct.protein:macroPct.fat;
        return {children:objects(child).map((n,i)=>source(n,m=>nodeName(m)==='Chart'?{props:{style:{paddingRight:`${100-(pct??0)}%`}},children:pct?undefined:null}:calorieLeaf(m),i))};
      }
      if(!leaf(child))return undefined;
      const value=sourceText(child);
      const substitutions:Record<string,string>={'1240':target&&kcal!==null?formatNumber(Math.max(0,target.kcal-kcal)):'0','1750':kcal==null?'0':formatNumber(kcal),'510':formatNumber(burned),'120':known?formatNumber(patient.macros.carbs_g):'0','70':known?formatNumber(patient.macros.protein_g):'0','20':known?formatNumber(patient.macros.fat_g):'0','/325gr':target?`/${formatNumber(target.carbs_g)} g`:'/— g','/75gr':target?`/${formatNumber(target.protein_g)} g`:'/— g','/44gr':target?`/${formatNumber(target.fat_g)} g`:'/— g','37%':`${Math.round(macroPct.carbs??0)}%`,'93%':`${Math.round(macroPct.protein??0)}%`,'45%':`${Math.round(macroPct.fat??0)}%`};
      return value in substitutions?{text:substitutions[value]}:undefined;
    };return {children:fields(node,{},calorieLeaf)};}
    if(name==='Widget Workout Progress')return {children:fields(node,{},child=>{
      if(nodeName(child)==='Body')return listChildren(child,routineProgress.slice(0,3),(n,row)=>{
        const pct=percent(row.done,row.total);
        if(n===child)return undefined;
        if(nodeName(n)==='Item List Macronutrients')return {onClick:()=>onNavigate('ejercicio'),label:`Ver ${row.item.name}`};
        if(nodeName(n)==='Progress Bar')return barFill(pct,'filled');
        if(nodeName(n)==='Empty Bar')return barFill(pct,'empty');
        if(sample(n,/^\d+%$/))return {text:`${Math.round(pct??0)}%`};
        if(sample(n,/^\(\d+\/\d+\)$/))return {text:`(${row.done}/${row.total})`};
        if(text(n,'Cardio','Strength','Flexibility'))return {text:EXERCISE_CATEGORY_LABELS[row.item.category]};
        if(leaf(n)&&sourceText(n).length>8)return {text:row.item.name};
        return undefined;
      },'Tu nutricionista todavía no te asignó una rutina.',{key:row=>row.item.id});
      if(/Button/.test(nodeName(child)))return {onClick:()=>onNavigate('ejercicio'),label:'Ver ejercicio'};
      if(text(child,'This Week'))return {text:'Esta semana'};
      return undefined;
    })};
    if(name==='Widget Recommended Menu')return {children:fields(node,{},child=>{
      if(nodeName(child)==='List Exercise'){
        const slots=objects(child).filter(n=>nodeName(n)==='Card Recommended Menu').length||2;
        return listChildren(child,recipes.slice(0,slots),(n,recipe)=>{
          if(nodeName(n)==='Card Recommended Menu')return {onClick:()=>onNavigate('recetas'),label:`Ver ${recipe.title}`};
          const nutrients=nutrientBinding(n,recipe.nutrition?.per_portion??recipe.card?.macros);if(nutrients)return nutrients;
          if(text(n,'Breakfast','Lunch','Snack','Dinner'))return {text:recipe.card?.category??'Receta'};
          if(nodeName(n)==='Place Image Here')return recipe.card?.cover_url?{children:<img src={recipe.card.cover_url} alt={recipe.title} className="absolute inset-0 block size-full object-cover"/>}:undefined;
          if(leaf(n)&&/^(Oatmeal|Grilled Chicken Wrap)/.test(sourceText(n)))return {text:recipe.title};
          if(leaf(n)&&/^(High in fiber|Rich in protein)/.test(sourceText(n)))return {text:`${recipeNutritionLabel(recipe.nutrition,recipe.nutrient_source,recipe.card?.macros)} · por porción`};
          return undefined;
        },'Todavía no tenés recetas asignadas.',{key:recipe=>recipe.id,only:n=>nodeName(n)==='Card Recommended Menu'});
      }
      if(nodeName(child)==='Button More')return {onClick:()=>onNavigate('recetas'),label:'Ver menú'};
      return undefined;
    })};
    if(name==='Widget Recommended Exercises')return {children:fields(node,{},child=>{
      if(nodeName(child)==='List Exercise')return listChildren(child,routines.slice(0,3),(n,{item})=>{
        if(nodeName(n)==='Card Recommended Exercise')return {onClick:()=>onNavigate('ejercicio'),label:`Ver ${item.name}`};
        if(sample(n,/kcal$/))return {text:`${item.sets} series`};
        if(sample(n,/min$/))return {text:`${item.reps} rep.`};
        if(text(n,'Beginner','Intermediate','Hard'))return {text:EXERCISE_CATEGORY_LABELS[item.category]};
        if(leaf(n)&&/^(Brisk Walking|Bodyweight Squats|Dumbbell Squat)$/.test(sourceText(n)))return {text:item.name};
        return undefined;
      },'Sin ejercicios asignados.',{key:row=>row.item.id,only:n=>nodeName(n)==='Card Recommended Exercise'});
      if(nodeName(child)==='Button More')return {onClick:()=>onNavigate('ejercicio'),label:'Ver ejercicio'};
      return undefined;
    })};
    if(name==='List Meal Plan')return listChildren(node,meals,(child,meal)=>{
      const recipe=meal.recipe??meal.recipe_proposal;
      const photo=planRecipe(meal)?.card;
      if(['Image','Image Area','Place Image Here'].includes(nodeName(child))&&photo?.cover_status==='ready'&&photo.cover_url)return {children:<img src={photo.cover_url} alt={photo.cover_alt} className="absolute inset-0 block size-full object-cover"/>};
      const nutrients=nutrientBinding(child,recipe?.nutrition?.per_portion,meal.portions);if(nutrients)return nutrients;
      if(text(child,'Breakfast','Lunch','Snack','Dinner'))return {text:meal.slot};
      if(leaf(child)&&sourceText(child).length>30)return {children:<>{meal.recipe_title??meal.free_text??'Comida del plan'}<span className="block text-[11px] text-[#8a8c90]">{meal.portions!=null?`${meal.portions.toLocaleString('es-AR',{maximumFractionDigits:4})} porciones · `:''}{recipeNutritionLabel(recipe?.nutrition)}{meal.public_note?` · ${meal.public_note}`:''}</span></>};
      if(/Checkbox/.test(nodeName(child)))return {onClick:()=>onLogMeal(meal.slot),label:`Registrar ${meal.slot}`,props:loggedSlots.has(meal.slot)?{}:{style:{background:'#fefcfb'}},children:loggedSlots.has(meal.slot)?undefined:null};
      if(nodeName(child)==='Button More')return {onClick:()=>onNavigate('mensajes'),label:`Consultar sobre ${meal.slot}`};
      return undefined;
    },'Sin comidas publicadas para hoy.',{key:meal=>meal.id});
    if(name==='List Recent Activity')return listChildren(node,activity,(child,row,index)=>{
      if(nodeName(child)==='Icon'&&/bg-\[#/.test(String(child.props.className)))return {props:{style:{background:['#c2e66e','#ffcb65','#ffa257'][row.color]}}};
      if(nodeName(child)==='Line'&&index===activity.length-1)return hide;
      if(sample(child,/^\d{1,2}:\d{2} (AM|PM)$/))return {text:dateId(new Date(row.at))===today?timeLabel(row.at):`${new Date(row.at).toLocaleDateString('es-AR',{day:'numeric',month:'short'})} · ${timeLabel(row.at)}`};
      if(child.tag==='span'&&/SemiBold/.test(String(child.props.className)))return {text:row.bold};
      if(child.tag==='span')return {text:row.rest};
      return undefined;
    },'Todavía no hay actividad registrada esta semana.',{only:n=>n===objects(node)[0]});
    if(name==='Calendar')return {onClick:()=>onNavigate('agenda'),label:'Ver agenda',children:fields(node,{},child=>{
      if(text(child,'September'))return {text:now.toLocaleDateString('es-AR',{month:'long'}).replace(/^./,c=>c.toUpperCase())};
      if(text(child,'2028'))return {text:String(now.getFullYear())};
      if(nodeName(child)==='Row Calendar'){
        const cells=objects(child);const active=cells.find(cell=>/bg-\[#c2e66e\]/.test(String(cell.props.className)))??cells[1];const idle=cells.find(cell=>cell!==active)??cells[0];
        return {children:week.map((day,index)=>source(day.id===today?active:idle,n=>leaf(n)&&/^\d+$/.test(sourceText(n))?{text:String(day.day)}:leaf(n)&&/^(Mon|Tue|Wed|Thu|Fri|Sat)$/.test(sourceText(n))?{text:['Lun','Mar','Mié','Jue','Vie','Sáb'][index]}:undefined,day.id))};
      }
      return undefined;
    })};
    return undefined;
  };
  return <FramePair nodes={['12:792','427:14405']} resolve={resolve} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {patient.nutritionEstimated && <p className="mcp-screen-state">Los nutrientes registrados de hoy incluyen estimaciones de IA revisadas por tu nutricionista.</p>}
    {(!current||current.failed||data.error)&&<Stateful loading={!current&&!data.error} error={data.error|| (current?.failed?'Algunos datos no se pudieron cargar.':undefined)} onRetry={data.reload}/>}
  </FramePair>;
}
