import { Fragment, useEffect, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { bodyDataApi, nutritionTargetApi } from '../../../api/nutrition-target';
import { recipesApi } from '../../../api/recipes';
import { plansApi } from '../../../api/plans';
import { exerciseApi } from '../../../api/exercise';
import { careApi } from '../../../api/care';
import { patientMenuRecipes, planRecipe } from '../plan-recipe';
import { plateImage } from '../plate-photo';
import { ARGENTINA_ZONE } from './ar-time';
import { latestWeight } from '../../../lib/measurement-display';
import { recipeNutritionLabel, type NutrientAmounts } from '../../../types/ai-nutrition';
import { planSlotKey, PLAN_SLOT_KEYS } from '../../../types/plans';
import { EXERCISE_CATEGORY_LABELS } from '../../../types/exercise';
import { rulerFor, weightGauge } from './weight-gauge';
import { CalorieArc, WeightArc } from './arcs';
import '../home-motion.css';
import { barFill, descendants, EmptyState, fields, formatNumber, leaf, listChildren, objects, source, Stateful, timeLabel, useRemote, dateId, type ScreenProps } from './shared';
import { dayOfIso, cleanAmount, daysBefore, litresLabel, monthYearLabel, percentLabel, portionsLabel, safePercent, weekDays, weightChangeLabel } from './home-values';

async function homeData(id: string, signal: AbortSignal) {
  const [body,target,recipes,plan,exercise,care] = await Promise.allSettled([
    bodyDataApi.get(id,false,signal), nutritionTargetApi.get(id,false,signal), recipesApi.assigned(id,signal), plansApi.published(id,signal), exerciseApi.get(id,false,signal), careApi.snapshot(id,false,signal),
  ]);
  return { body:body.status==='fulfilled'?body.value.data:null, target:target.status==='fulfilled'?target.value.target:null, recipes:recipes.status==='fulfilled'?recipes.value.recipes:[], plan:plan.status==='fulfilled'?plan.value.plan:null, exercise:exercise.status==='fulfilled'?exercise.value.exercise:null, care:care.status==='fulfilled'?care.value:null,
    failed:[body,target,recipes,plan,exercise,care].some(row=>row.status==='rejected'&&!(row.reason instanceof DOMException&&row.reason.name==='AbortError')) };
}

/**
 * Un vaso son 250 ml. Plan V no guarda metas de agua ni de pasos: las barras usan una referencia
 * general (2 L y 8.000 pasos) y la pantalla la nombra como «referencia», nunca como meta indicada.
 */
const DEFAULT_WATER_GLASSES = 8;
const litres = litresLabel;
const DEFAULT_STEPS_GOAL = 8000;
const text = (node: SourceNode, ...samples: string[]) => leaf(node) && samples.includes(sourceText(node));
const sample = (node: SourceNode, pattern: RegExp) => leaf(node) && pattern.test(sourceText(node));

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
  // El arco ocupa el lugar de la primera capa que reemplaza, para respetar el orden de capas del archivo.
  const firstDrawn = objects(node).findIndex(child => drawn.includes(nodeName(child)));
  return { children: <>{objects(node).map((child, index) => index === firstDrawn ? <Fragment key={index}>{ring}</Fragment> : drawn.includes(nodeName(child)) ? null : source(child, resolve, index))}</> };
}

const mealTitle=(meal:{recipe_title?:string|null;free_text?:string|null})=>(meal.recipe_title||meal.free_text||'').trim()||'Comida sin nombre';
type Activity = { at: string; color: number; bold: string; rest: string };

export function NutrigoHome({ patient,onNavigate,onSignOut,now=new Date(),onRecord,onHydration,onRest,onSteps=onHydration,onLogMeal }: ScreenProps & {onRecord:()=>void;onHydration:()=>void;onRest:()=>void;onSteps?:()=>void;onLogMeal:(slot?:string)=>void}) {
  // Se recarga con `reload` (misma clave): los datos anteriores siguen a la vista hasta que llegan los nuevos, sin parpadeo en blanco.
  const data=useRemote(`${patient.id}:home`, signal=>homeData(patient.id,signal));
  const {reload}=data;
  useEffect(()=>{window.addEventListener('plan-v:care-changed',reload);return()=>window.removeEventListener('plan-v:care-changed',reload);},[reload]);
  const current=data.data;
  useEffect(()=>{if(!current?.plan?.items.some(item=>['queued','leased'].includes(item.dish_card?.cover_generation??'')))return;const timer=setInterval(reload,4000);return()=>clearInterval(timer);},[current,reload]);
  const today=dateId(now);

  // Peso: último registro, el primero de la serie y la meta si la nutricionista la cargó.
  const measurements=current?.care?.measurements??[];
  const weightDisplay=latestWeight(measurements,current?.body?.weight_kg??null);
  const weightRaw=weightDisplay.value;
  const weight=weightRaw!=null&&Number.isFinite(weightRaw)&&weightRaw>0?weightRaw:null;
  const weights=measurements.filter(row=>row.kind==='weight').sort((a,b)=>a.captured_on.localeCompare(b.captured_on));
  const startWeightRaw=weights[0]?.value_numeric;
  const startWeight=startWeightRaw!=null&&Number.isFinite(startWeightRaw)&&startWeightRaw>0?startWeightRaw:weight;
  // Plan V todavía no guarda una meta de peso: los extremos muestran el inicio y «Meta».
  const goalWeight:number|null=null;
  const gauge=weightGauge(weight,goalWeight,startWeight);
  const ruler=rulerFor(weight);

  // Calorías y macros revisados del día contra la meta indicada.
  const target=current?.target?.result;
  const known=patient.nutritionLogCount>0;
  const kcal=known?cleanAmount(patient.kcal):null;
  const burned=(current?.care?.records??[]).filter(row=>row.data.kind==='activity'&&row.recorded_on===today).reduce((sum,row)=>sum+(row.data.kind==='activity'?cleanAmount(row.data.kcal)??0:0),0);
  const eaten={carbs:known?cleanAmount(patient.macros.carbs_g):null,protein:known?cleanAmount(patient.macros.protein_g):null,fat:known?cleanAmount(patient.macros.fat_g):null};
  const macroPct={carbs:safePercent(eaten.carbs,target?.carbs_g),protein:safePercent(eaten.protein,target?.protein_g),fat:safePercent(eaten.fat,target?.fat_g)};
  const macroLabel={carbs:percentLabel(eaten.carbs,target?.carbs_g),protein:percentLabel(eaten.protein,target?.protein_g),fat:percentLabel(eaten.fat,target?.fat_g)};

  // Hábitos de la semana (descanso y agua) ya registrados por la paciente.
  const days=patient.journey?.days??[];
  const sleepWeek=[...Array(Math.max(0,8-days.length)).fill(null),...days.map(day=>cleanAmount(day.sleepMinutes))].slice(-8);
  const glasses=cleanAmount(patient.hydration)??0;
  const waterPct=safePercent(glasses,DEFAULT_WATER_GLASSES)??0;

  // Rutina asignada: series registradas en los últimos siete días sobre las indicadas.
  const assignments=current?.exercise?.assignments.filter(a=>a.status==='active')??[];
  const routines=assignments.flatMap(a=>a.items.map(item=>({item,assignment:a})));
  const weekStart=daysBefore(today,6);
  const logs=current?.exercise?.activities??[];
  const routineProgress=routines.map(({item,assignment})=>{
    const done=logs.filter(log=>log.assignment_id===assignment.id&&log.activity===item.name&&(dayOfIso(log.logged_at)??'')>=weekStart).reduce((sum,log)=>sum+(log.sets??0),0);
    return {item,done:Math.min(done,item.sets),total:item.sets};
  });

  // Sin rutina asignada, la paciente ve sus propias actividades de la semana (las que registró) en el mismo bloque.
  const workoutRows=routineProgress.length?routineProgress.map(({item,done,total})=>({id:item.id,name:item.name,pct:safePercent(done,total),count:`(${done}/${total})`,tag:EXERCISE_CATEGORY_LABELS[item.category]})):
    (patient.activities??[]).filter(row=>(dayOfIso(row.logged_at)??'')>=weekStart).slice().sort((a,b)=>Date.parse(b.logged_at)-Date.parse(a.logged_at)).map(row=>({id:row.id,name:row.activity,pct:100 as number|null,count:`(${row.duration_minutes} min)`,tag:`${row.intensity.charAt(0).toUpperCase()}${row.intensity.slice(1)}`}));

  const meals=(current?.plan?.items.filter(item=>item.for_date===today)??[]).slice().sort((a,b)=>PLAN_SLOT_KEYS.indexOf(planSlotKey(a.slot)!)-PLAN_SLOT_KEYS.indexOf(planSlotKey(b.slot)!));
  const recipes=patientMenuRecipes(current?.plan??null,current?.recipes??[]);
  const pendingToday=patient.logs.some(log=>log.status==='pending_review'&&dayOfIso(log.logged_at)===today);
  const loggedSlots=new Set(patient.logs.filter(log=>dayOfIso(log.logged_at)===today).map(log=>log.slot));

  // Semana del calendario con hoy marcado: el escritorio dibuja lunes a sábado; el celular, domingo a sábado.
  const week=(columns:number)=>weekDays(today,columns);

  const activity:Activity[]=[
    ...(patient.logs??[]).map(log=>({at:log.logged_at,color:0,bold:log.slot,rest:` ${log.status==='pending_review'?'registrada, pendiente de revisión':'revisada'}${log.description?.trim()?`: ${log.description.trim()}`:''}`})),
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
        // Pasos declarados por la paciente (Plan V no importa datos de dispositivos).
        const steps=cleanAmount(patient.steps);
        const stepsPct=safePercent(steps??0,DEFAULT_STEPS_GOAL);
        return {onClick:onSteps,label:'Registrar pasos',children:fields(node,{},child=>{
          if(nodeName(child)==='Progress Bar')return barFill(stepsPct,'filled');
          if(nodeName(child)==='Empty Bar')return barFill(stepsPct,'empty');
          if(text(child,'8050'))return {text:formatNumber(steps??0)};
          if(text(child,'76%'))return {text:`${Math.round(stepsPct??0)}%`};
          if(sample(child,/steps left/))return {text:steps==null?'Registrá tus pasos':`Referencia: ${formatNumber(DEFAULT_STEPS_GOAL)}`};
          return undefined;
        })};
      }
      if(content.startsWith('Sleep'))return {onClick:onRest,label:'Registrar descanso',children:fields(node,{},child=>{
        if(text(child,'6.5')){const minutes=cleanAmount(patient.sleepMinutes);return {text:minutes==null?'0':formatNumber(minutes/60)};}
        if(nodeName(child)==='Column Ruler'){
          const columns=descendants(node).filter(n=>nodeName(n)==='Column Ruler');
          const minutes=sleepWeek[columns.indexOf(child)]??null;
          const [top,bar,...rest]=objects(child);
          const empty=40*(1-Math.min(1,(minutes??0)/600));
          return {children:<>{top&&source(top,()=>({props:{style:{height:`${empty}px`}}}),0)}{bar&&source(bar,()=>minutes?undefined:{props:{style:{height:0,minHeight:0}}},1)}{rest.map((n,i)=>source(n,()=>undefined,i+2))}</>};
        }
        return undefined;
      })};
      return {onClick:onHydration,label:'Registrar hidratación',children:fields(node,{},child=>{
        if(nodeName(child)==='Chart'&&objects(child).some(n=>nodeName(n)==='Progress Bar'))return {props:{style:{justifyContent:'flex-end'}},children:objects(child).map((n,i)=>source(n,m=>nodeName(m)==='Progress Bar'?{props:{style:{flex:`0 0 ${Math.max(waterPct,24)}%`}},children:fields(m,{},leafNode=>text(leafNode,'1.3/2')?{text:`${litres(glasses)}/${litres(DEFAULT_WATER_GLASSES)}`}:text(leafNode,'litre')?{text:'L (ref.)'}:undefined)}:undefined,i))};
        if(text(child,'0.7'))return {text:litres(glasses)};
        if(text(child,'litre left'))return {text:`L · ${formatNumber(glasses)} vasos`};
        return undefined;
      })};
    }
    if(name==='Widget Weight Data'){const weightLeaf:SourceResolver=child=>{
      if(nodeName(child)==='Chart'&&descendants(child).some(n=>nodeName(n)==='Donut Progress'))return donut(child,<WeightArc pct={gauge.pct}/>,['Donut Base','Mask group','Donut Progress'],weightLeaf);
      if(text(child,'78'))return {text:formatNumber(weight)};
      if(text(child,'kg','Kg'))return {text:weightDisplay.unit};
      if(text(child,'Current Weight'))return {text:'Peso actual'};
      if(sample(child,/kg left/))return {text:goalWeight!=null&&weight!=null?`${formatNumber(Math.abs(weight-goalWeight))} ${weightDisplay.unit} para la meta`:startWeight!=null&&weight!=null&&weights.length>1?weightChangeLabel(weight,startWeight,weightDisplay.unit):'Primer registro'};
      // Extremos del arco: escala de la regla (o inicio y meta si la nutricionista cargó una).
      if(text(child,'85'))return {text:gauge.from==null?'':String(gauge.from)};
      if(text(child,'65'))return {text:gauge.to==null?'':String(gauge.to)};
      if(/Button/.test(nodeName(child)))return {onClick:onRecord,label:'Registrar peso'};
      if(text(child,'🎉'))return {text:''};
      return undefined;
    };return {children:fields(node,{},weightLeaf)};}
    if(name==='Widget Calories Intake'){const calorieLeaf:SourceResolver=child=>{
      if(nodeName(child)==='Button More')return {onClick:()=>onLogMeal(),label:'Registrar comida'};
      // Los rótulos en español son más largos que los del archivo: pueden achicarse y partirse en vez de salirse de la tarjeta.
      if(['Detail Calories','Info Eaten Calories','Info Burned Calories','Info'].includes(nodeName(child)))return {props:{style:{minWidth:0,flexShrink:1,...(nodeName(child)==='Info'?{whiteSpace:'normal'}:{})}}};
      if(nodeName(child)==='Chart'&&objects(child).some(n=>nodeName(n)==='Donut Progress'))return donut(child,<CalorieArc pct={safePercent(kcal,target?.kcal)}/>,['Donut Progress'],calorieLeaf);
      if(nodeName(child)==='Item List Macronutrients'){
        const label=descendants(child).map(sourceText).find(t=>['Carbohydrates','Proteins','Fats'].includes(t));
        const pct=label==='Carbohydrates'?macroPct.carbs:label==='Proteins'?macroPct.protein:macroPct.fat;
        // La barra original (Progress Bar) se queda dentro de su Chart: el relleno derecho deja libre solo lo que falta.
        return {children:objects(child).map((n,i)=>source(n,m=>nodeName(m)==='Chart'?{props:{style:{paddingRight:`${100-(pct??0)}%`}}}:calorieLeaf(m),i))};
      }
      if(!leaf(child))return undefined;
      const value=sourceText(child);
      // Lo que la paciente cargó hoy y su nutricionista todavía no revisó se nombra, en vez de dejar el guion sin explicación.
      if(value==='Eaten calories'&&!known&&pendingToday)return {text:'Calorías en revisión'};
      // Sin comidas revisadas o sin meta, el valor es desconocido (no cero).
      const substitutions:Record<string,string>={'1240':target&&kcal!==null?formatNumber(Math.max(0,target.kcal-kcal)):'—','1750':formatNumber(kcal),'510':formatNumber(burned),'120':known?formatNumber(eaten.carbs):'—','70':known?formatNumber(eaten.protein):'—','20':known?formatNumber(eaten.fat):'—','/325gr':target?`/${formatNumber(target.carbs_g)} g`:'/— g','/75gr':target?`/${formatNumber(target.protein_g)} g`:'/— g','/44gr':target?`/${formatNumber(target.fat_g)} g`:'/— g','37%':macroLabel.carbs,'93%':macroLabel.protein,'45%':macroLabel.fat};
      return value in substitutions?{text:substitutions[value]}:undefined;
    };return {children:fields(node,{},calorieLeaf)};}
    if(name==='Widget Workout Progress')return {children:fields(node,{},child=>{
      if(nodeName(child)==='Body')return listChildren(child,workoutRows.slice(0,3),(n,row)=>{
        const pct=row.pct;
        if(n===child)return undefined;
        if(nodeName(n)==='Item List Macronutrients')return {onClick:()=>onNavigate('ejercicio'),label:`Ver ${row.name}`};
        if(nodeName(n)==='Progress Bar')return barFill(pct,'filled');
        if(nodeName(n)==='Empty Bar')return barFill(pct,'empty');
        if(sample(n,/^\d+%$/))return {text:`${Math.round(pct??0)}%`};
        if(sample(n,/^\(\d+\/\d+\)$/))return {text:row.count};
        if(text(n,'Cardio','Strength','Flexibility'))return {text:row.tag};
        if(leaf(n)&&sourceText(n).length>8)return {text:row.name,props:{style:{whiteSpace:'normal'}}};
        return undefined;
      },'Todavía no registraste actividad esta semana. Tu nutricionista puede asignarte una rutina.',{key:row=>row.id});
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
          if(nodeName(n)==='Place Image Here')return plateImage(recipe.card,recipe.title);
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
      if(['Image','Image Area','Place Image Here'].includes(nodeName(child))){const image=plateImage(photo,meal.recipe_title||meal.free_text||'Comida del plan');if(image)return image;}
      if(nodeName(child)==='Detail Nutrients')return {props:{style:{flexWrap:'wrap',rowGap:'4px'}}};
      const nutrients=nutrientBinding(child,recipe?.nutrition?.per_portion,meal.portions);if(nutrients)return nutrients;
      if(text(child,'Breakfast','Lunch','Snack','Dinner'))return {text:meal.slot};
      if(leaf(child)&&sourceText(child).length>30)return {children:<>{mealTitle(meal)}<span className="block text-[11px] text-[#8a8c90]">{meal.portions!=null?`${portionsLabel(meal.portions)} · `:''}{recipeNutritionLabel(recipe?.nutrition)}{meal.public_note?` · ${meal.public_note}`:''}</span></>};
      if(/Checkbox/.test(nodeName(child)))return {onClick:()=>onLogMeal(meal.slot),label:`Registrar ${meal.slot}`,props:loggedSlots.has(meal.slot)?{}:{style:{background:'#fefcfb'}},...(loggedSlots.has(meal.slot)?{}:{children:null})};
      if(nodeName(child)==='Button More')return {onClick:()=>onNavigate('mensajes'),label:`Consultar sobre ${meal.slot}`};
      return undefined;
    },'Sin comidas publicadas para hoy.',{key:meal=>meal.id});
    if(name==='List Recent Activity'){
      // El archivo dibuja el último ítem sin la línea que baja al siguiente: se usa ese ítem original para el último y el primero para los demás.
      const items=objects(node),first=items[0],last=items[items.length-1];
      const bindRow=(row:Activity)=>(child:SourceNode):SourceBinding|undefined=>{
        if(nodeName(child)==='Icon'&&/bg-\[#/.test(String(child.props.className)))return {props:{style:{background:['#c2e66e','#ffcb65','#ffa257'][row.color]}}};
        if(sample(child,/^\d{1,2}:\d{2} (AM|PM)$/))return {text:dateId(new Date(row.at))===today?timeLabel(row.at):`${new Date(row.at).toLocaleDateString('es-AR',{timeZone:ARGENTINA_ZONE,day:'numeric',month:'short'})} · ${timeLabel(row.at)}`};
        const spans=objects(child);
        if(child.tag==='p'&&spans.length===2&&spans.every(n=>n.tag==='span'))return {children:<><span className={String(spans[0].props.className??'')} style={{fontFamily:"'Poppins:SemiBold', Poppins, sans-serif",fontWeight:600}}>{row.bold}</span><span className={String(spans[1].props.className??'')}>{row.rest}</span></>};
        return undefined;
      };
      if(!first||!last)return undefined;
      return {children:activity.length?activity.map((row,index)=>source(index===activity.length-1?last:first,bindRow(row),index)):<EmptyState text="Todavía no hay actividad registrada esta semana."/>};
    }
    if(name==='Calendar')return {onClick:()=>onNavigate('agenda'),label:'Ver agenda',children:fields(node,{},child=>{
      if(text(child,'September'))return {text:monthYearLabel(today).month};
      if(text(child,'2028'))return {text:monthYearLabel(today).year};
      if(nodeName(child)==='Row Calendar'){
        const cells=objects(child);const active=cells.find(cell=>/bg-\[#c2e66e\]/.test(String(cell.props.className)))??cells[1];const idle=cells.find(cell=>cell!==active)??cells[0];
        return {children:week(cells.length).map(day=>source(day.id===today?active:idle,n=>leaf(n)&&/^\d+$/.test(sourceText(n))?{text:String(day.day)}:leaf(n)&&/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/.test(sourceText(n))?{text:day.label}:undefined,day.id))};
      }
      return undefined;
    })};
    return undefined;
  };
  return <FramePair nodes={['12:792','427:14405']} resolve={resolve} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {(!current||current.failed||data.error)&&<Stateful loading={!current&&!data.error} error={data.error|| (current?.failed?'Algunos datos no se pudieron cargar.':undefined)} onRetry={data.reload}/>}
  </FramePair>;
}
