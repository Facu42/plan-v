import { useEffect,useState,type ReactNode,type UIEvent } from 'react';
import { FramePair } from '../FramePair';
import { nodeId, nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { plansApi } from '../../../api/plans';
import { buildPublishedPlanDays, type PlanItemView } from '../../../types/plans';
import { planRecipe, planComponentItems } from '../plan-recipe';
import { componentTitle, componentGrams } from '../../../types/plan-components';
import { PlanGuidanceView } from '../../../components/nutrigo/PlanGuidance';
import { plateImage } from '../plate-photo';
export { planRecipe } from '../plan-recipe';
import { NutrigoRecipeDetail } from './Menu';
import { AiPlanNutritionSummary } from '../../../components/nutrigo/AiPlanNutritionSummary';
import { FigmaRecordDialog } from '../../../components/nutrigo/FigmaPatientFront';
import { leftAlignedSearch } from './search-align';
import { EmptyState, fields, leaf, objects, searchBinding, source, Stateful, useRemote, type ScreenProps } from './shared';

const MAIN_SLOTS=['Desayuno','Almuerzo','Merienda','Cena'] as const;
/** Las colaciones van con el desayuno y los extras con la cena: el archivo sólo tiene cuatro columnas. */
const EXTRA_SLOT:Record<string,(typeof MAIN_SLOTS)[number]>={'Colación':'Desayuno','Extra':'Cena'};
const WEEKDAY_SAMPLE=/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/;
const DAY_SAMPLE=/^\d{1,2} Sep$/;

const NAMELESS='Comida sin nombre';
export const itemTitle=(item:PlanItemView)=>item.components?.map(component=>`${componentTitle(component)}${component.kind==='food'?` · ${componentGrams(component)?.toLocaleString('es-AR')??'Sin cantidad'} g`:component.kind==='recipe'?` · ${component.portions.toLocaleString('es-AR')} porciones`:''}`).join(' + ')||item.recipe_title||item.free_text||NAMELESS;
/** Alto fijo del archivo (96 px) pasa a alto mínimo: la fila crece con textos largos en vez de pisar la fila de arriba. */
function growFromFixedHeight(node:SourceNode,fill:'row'|'self'):SourceBinding|undefined {
  const height=/\bh-\[(\d+)px\]/.exec(String(node.props.className??''));
  if(!height)return undefined;
  const style={height:'auto',minHeight:`${height[1]}px`};
  return {props:{style:fill==='row'?{...style,alignItems:'stretch'}:{...style,alignSelf:'stretch'}}};
}
const utcDate=(iso:string)=>new Date(`${iso}T12:00:00Z`);
export const shortDate=(iso:string)=>utcDate(iso).toLocaleDateString('es-AR',{day:'numeric',month:'short',timeZone:'UTC'}).replace('.','');
/** «5–11 oct» o «28 sep – 4 oct», en el lugar de «September» del archivo. */
export function periodLabel(start:string,end:string) {
  const a=utcDate(start),b=utcDate(end);
  if(start===end)return shortDate(start);
  return a.getUTCMonth()===b.getUTCMonth()&&a.getUTCFullYear()===b.getUTCFullYear()?`${a.getUTCDate()}–${shortDate(end)}`:`${shortDate(start)} – ${shortDate(end)}`;
}
const periodYear=(start:string,end:string)=>{const a=start.slice(0,4),b=end.slice(0,4);return a===b?a:`${a}–${b}`;};

/** Cambia sólo las hojas de texto de un subárbol del archivo y conserva íconos y estilos. */
function relabel(node:SourceNode,text:(sample:string)=>ReactNode|undefined) {
  return fields(node,{},child=>{if(child===node||!leaf(child))return undefined;const value=text(sourceText(child));return value===undefined?undefined:{text:value};});
}

export function NutrigoPlan({patient,onNavigate,onSignOut,query=''}:ScreenProps) {
  const remote=useRemote(`${patient.id}:plan`,signal=>plansApi.published(patient.id,signal));
  const [search,setSearch]=useState(query),[page,setPage]=useState(0),[chosen,setChosen]=useState<PlanItemView|null>(null),[hideEmpty,setHideEmpty]=useState(false),[options,setOptions]=useState(false);
  const [scroll,setScroll]=useState({offset:0,size:.47});
  const [meal,setMeal]=useState<PlanItemView|null>(null);
  const plan=remote.data?.plan;
  useEffect(()=>{if(!plan?.items.some(item=>['queued','leased'].includes(item.dish_card?.cover_generation??'')))return;const timer=setInterval(remote.reload,4000);return()=>clearInterval(timer);},[plan,remote.reload]);
  useEffect(()=>{setPage(0);setChosen(null);setMeal(null);},[plan?.id,plan?.version]);
  const days=plan?buildPublishedPlanDays(plan):[];
  const weeks=Math.max(1,Math.ceil(days.length/7));
  const shown=days.slice(page*7,page*7+7);
  const term=search.trim().toLocaleLowerCase('es');
  const matchesItem=(item:PlanItemView)=>!term||[itemTitle(item),item.public_note,...(item.components?.map(c=>c.public_note)??[])].some(value=>(value??'').toLocaleLowerCase('es').includes(term));
  const visibleDays=shown.filter(day=>(!hideEmpty||day.items.length)&&(!term||day.items.some(matchesItem)));
  const detail=chosen?planRecipe(plan?.items.find(item=>item.id===chosen.id)??chosen):null;
  if(detail)return <NutrigoRecipeDetail key={detail.id} recipe={detail} initialPortions={chosen?.portions??undefined} onBack={()=>setChosen(null)} backLabel="Volver al plan" patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}/>;
  const nextWeek=()=>setPage(p=>p+1<weeks?p+1:0);
  const onTableScroll=(event:UIEvent<HTMLElement>)=>{const el=event.currentTarget;if(el.scrollWidth<=0)return;setScroll({offset:el.scrollLeft/el.scrollWidth,size:Math.min(1,el.clientWidth/el.scrollWidth)});};

  /** Una celda de comida del archivo con la indicación publicada de ese día y momento. */
  const mealCell=(cell:SourceNode,slot:(typeof MAIN_SLOTS)[number],items:PlanItemView[]):SourceBinding=>{
    const item=items.find(entry=>entry.slot===slot);
    const extras=items.filter(entry=>EXTRA_SLOT[entry.slot]===slot&&matchesItem(entry));
    const show=item?matchesItem(item):false;
    const title=item?itemTitle(item):'';
    const recipe=item&&show?planRecipe(item):null;
    const target=item&&show&&(item.components||recipe)?item:extras.find(entry=>entry.components||planRecipe(entry));
    const main=item?(show?title:''):(term?'':'Sin indicación');
    const dimmed=item&&!show&&!extras.length?{style:{opacity:.4}}:undefined;
    const content=<>{main}{show&&item?.public_note&&<span className="block text-[11px] leading-[1.4] text-[#52545b]">{item.public_note}</span>}{extras.map(entry=><span key={entry.id} className="block text-[11px] leading-[1.4] text-[#52545b]"><strong className="font-['Poppins:SemiBold']">{entry.slot}:</strong> {itemTitle(entry)}{entry.public_note?` · ${entry.public_note}`:''}</span>)}</>;
    const children=fields(cell,{},child=>{
      if(child===cell)return undefined;
      if(['Image','Image-Meal Plan'].includes(nodeName(child)))return plateImage(recipe?.card,title);
      if(nodeName(child)==='Text')return growFromFixedHeight(child,'self');
      return leaf(child)?{children:content}:undefined;
    });
    return target?{onClick:()=>target.components?setMeal(target):setChosen(target),label:`Ver ${target.slot}: ${itemTitle(target)}`,props:dimmed,children}:{props:dimmed,children};
  };

  const resolve:SourceResolver=node=>{
    const name=nodeName(node),text=sourceText(node),id=nodeId(node);
    if(id==='89:3846')return {onClick:()=>setPage(v=>Math.max(0,v-1)),label:'Semana anterior',props:{disabled:page===0}};
    if(id==='89:3878')return {onClick:()=>setPage(v=>v+1),label:'Semana siguiente',props:{disabled:(page+1)*7>=days.length}};
    // Celular: lupa y filtro del archivo abren las opciones del plan (búsqueda incluida); «+» pide un cambio.
    if(id==='470:15679')return {onClick:()=>setOptions(true),label:'Buscar en el plan'};
    if(id==='470:15680')return {onClick:()=>setOptions(true),label:'Filtrar el plan',props:{'aria-pressed':hideEmpty}};
    if(id==='470:15701')return {onClick:()=>onNavigate('mensajes'),label:'Pedir un cambio a tu nutricionista'};
    const input=leftAlignedSearch(searchBinding(node,search,setSearch,'Buscar en el plan'));if(input)return input;
    if(name==='Table') {
      const children=objects(node),head=children[0],prototype=children.find(child=>nodeName(child)==='Table-row-meal plan'&&!sourceText(child).startsWith('Week'));
      const scrollBar=children.find(child=>nodeName(child)==='Scroll Bar');
      const header=head?fields(head,{},child=>{
        if(nodeName(child)==='Button Picker'&&sourceText(child)==='Week 2')return {onClick:nextWeek,label:weeks>1?`Semana ${page+1} de ${weeks}: cambiar semana`:'Semana del plan',props:{disabled:weeks<=1},children:relabel(child,()=>`Semana ${page+1}`)};
        return undefined;
      },'head'):null;
      const bar=scrollBar?fields(scrollBar,{},child=>child===scrollBar?{props:{style:{position:'sticky',left:0}}}:nodeName(child)==='Slider'?{props:{style:{paddingLeft:`${scroll.offset*100}%`,paddingRight:`${Math.max(0,(1-scroll.offset-scroll.size)*100)}%`}}}:undefined,'scroll'):null;
      const tableProps={props:{onScroll:scrollBar?onTableScroll:undefined,style:scrollBar?{overflowX:'auto'}:undefined}};
      if(!plan||!prototype)return {...tableProps,children:<>{header}{remote.error||!remote.data?<Stateful loading={!remote.data&&!remote.error} error={remote.error} onRetry={remote.reload}/>:<EmptyState text="Todavía no tenés un plan publicado."/>}</>};
      const rows=visibleDays.map(day=>{
        const cells=objects(prototype);
        return fields(prototype,{},child=>{
          if(child===prototype)return growFromFixedHeight(prototype,'row');
          if(child===cells[0])return {...(growFromFixedHeight(prototype,'row')&&{props:{style:{height:'auto',alignSelf:'stretch'}}}),children:fields(child,{},p=>!leaf(p)?undefined:WEEKDAY_SAMPLE.test(sourceText(p))?{text:day.weekday}:DAY_SAMPLE.test(sourceText(p))?{text:shortDate(day.isoDate)}:undefined)};
          const index=cells.indexOf(child)-1;
          if(index<0||index>=MAIN_SLOTS.length)return undefined;
          // En el celular cada celda viene envuelta en un contenedor sin nombre.
          if(/^Cell-Menu/.test(nodeName(child)))return mealCell(child,MAIN_SLOTS[index],day.items);
          return {children:objects(child).map((inner,i)=>source(inner,n=>n===inner?mealCell(inner,MAIN_SLOTS[index],day.items):undefined,i))};
        },day.isoDate);
      });
      return {...tableProps,children:<>{plan.guidance&&(plan.guidance.recommendations.length>0||plan.guidance.avoid.length>0)&&<details className="p-[16px] text-[14px] text-[#272932]"><summary className="cursor-pointer">Recomendaciones y alimentos a evitar</summary><PlanGuidanceView guidance={plan.guidance}/></details>}{header}{rows.length?rows:<EmptyState text={term?'No hay comidas que coincidan con la búsqueda.':'No hay comidas indicadas esta semana.'}/>}{bar}</>};
    }
    if(leaf(node)&&text==='September')return {text:plan?periodLabel(plan.period_start,plan.period_end):'Sin plan publicado'};
    if(leaf(node)&&text==='2028')return {text:plan?periodYear(plan.period_start,plan.period_end):''};
    if(/^Button/.test(name)&&text==='Add Menu')return {onClick:()=>onNavigate('mensajes'),label:'Pedir un cambio a tu nutricionista',children:relabel(node,()=> 'Pedir un cambio')};
    if(/^Button/.test(name)&&text==='Filter')return {onClick:()=>setOptions(true),label:'Filtrar el plan',props:{'aria-pressed':hideEmpty},children:relabel(node,()=> 'Filtrar')};
    return undefined;
  };
  const extras=shown.flatMap(day=>day.items.filter(item=>EXTRA_SLOT[item.slot]&&matchesItem(item)));
  return <FramePair nodes={['84:2994','470:15300']} resolve={resolve} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} query={search} onSearch={setSearch}>
    {meal&&<FigmaRecordDialog title={`${meal.slot} · ${shortDate(meal.for_date)}`} onClose={()=>setMeal(null)}>
      <div className="flex flex-col gap-[16px] text-[14px] text-[#272932]">
        {meal.components?.map((component,index)=>{const entry=planComponentItems(meal)[index];const recipe=planRecipe(entry);return <section key={component.id}><h3>{componentTitle(component)}</h3><p>{component.kind==='food'?`${component.quantity.toLocaleString('es-AR')} ${component.measure??'g'}${component.measure?` · ${componentGrams(component)?.toLocaleString('es-AR')??'Sin cantidad'} g`:''}`:component.kind==='recipe'?`${component.portions.toLocaleString('es-AR')} porciones`:component.recipe_proposal?`${component.portions??''} porciones`:''}</p>{component.public_note&&<p>{component.public_note}</p>}{recipe&&<button type="button" className="underline" onClick={()=>{setMeal(null);setChosen(entry);}}>Ver ingredientes y preparación</button>}</section>;})}
        {meal.public_note&&<p>{meal.public_note}</p>}
      </div>
    </FigmaRecordDialog>}
    {options&&<FigmaRecordDialog title="Opciones del plan" onClose={()=>setOptions(false)}>
      <div className="flex flex-col gap-[16px] text-[14px] text-[#272932]">
        <label className="flex flex-col gap-[4px]">Buscar en el plan<input type="search" value={search} onChange={event=>setSearch(event.target.value)} className="rounded-[8px] border border-[#e1e1e2] p-[10px]"/></label>
        <label className="flex items-center gap-[8px]"><input type="checkbox" checked={hideEmpty} onChange={event=>setHideEmpty(event.target.checked)}/>Mostrar sólo días con comidas indicadas</label>
        {extras.length>0&&<section aria-label="Colaciones y extras"><h3 className="font-['Poppins:SemiBold']">Colaciones y extras</h3>{extras.map(item=><p key={item.id}>{shortDate(item.for_date)} · {item.slot}: {itemTitle(item)}{(item.components||planRecipe(item))&&<button type="button" className="ml-[8px] underline" onClick={()=>{setOptions(false);item.components?setMeal(item):setChosen(item);}}>Ver detalle</button>}</p>)}</section>}
        {plan?.nutrition&&<AiPlanNutritionSummary nutrition={plan.nutrition}/>}
        <button type="button" className="mcp-action" onClick={()=>{setOptions(false);onNavigate('compras');}}>Ver la lista de compras</button>
      </div>
    </FigmaRecordDialog>}
  </FramePair>;
}
