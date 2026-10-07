import { useEffect, useState, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceResolver, type SourceNode } from '../SourceView';
import { recipesApi } from '../../../api/recipes';
import { resourcesApi } from '../../../api/resources';
import { plansApi } from '../../../api/plans';
import { patientMenuRecipes, recipePresentationKey } from '../plan-recipe';
import type { PatientRecipe } from '../../../types/recipes';
import { recipeNutritionLabel } from '../../../types/ai-nutrition';
import { descendants, fields, formatNumber, leaf, listChildren, objects, errorText, searchBinding, Stateful, useRemote, type ScreenProps } from './shared';

export type DisplayRecipe = Pick<PatientRecipe,'id'|'title'|'version'|'yield_portions'|'steps'|'nutrient_source'|'card'|'nutrition'> & {ingredients:Array<{id:string;name:string;quantity:number;unit:string}>};
type MacroKey = 'kcal'|'carbs_g'|'protein_g'|'fat_g';
function nutrients(recipe:DisplayRecipe) {return recipe.nutrition?.per_portion??recipe.card?.macros??null;}
const macroValue=(recipe:DisplayRecipe|null|undefined,key:MacroKey,portions=1)=>{const value=recipe?nutrients(recipe)?.[key]:null;return value==null?null:value*portions;};
/** Dato que Plan V no tiene: se muestra vacío dentro del bloque, nunca un número inventado. */
const NO_DATA='Sin dato';
const amount=(value:number|null)=>value==null?NO_DATA:formatNumber(value);

/** Colores del archivo por momento: Breakfast Green, Lunch Saffron, Dinner Orange (y sus tintes suaves). */
const TONES={green:{strong:'#c2e66e',soft:'#dff9a2'},saffron:{strong:'#ffcb65',soft:'#ffe6b5'},orange:{strong:'#ffa257',soft:'#ffbe8a'}};
const toneOf=(category:string|undefined)=>['Desayuno','Colación'].includes(category??'')?TONES.green:['Cena','Extra'].includes(category??'')?TONES.orange:TONES.saffron;
const categoryOf=(recipe:DisplayRecipe)=>recipe.card?.category??'Receta';
const SAMPLE_CATEGORIES=['Breakfast','Lunch','Snack','Dinner'];
/** Filtros del archivo (All, Breakfast, Lunch, Snack, Dinner) con los momentos de Plan V. */
const CATEGORY_FILTERS:Record<string,string|null>={All:null,Breakfast:'Desayuno',Lunch:'Almuerzo',Snack:'Merienda',Dinner:'Cena'};
const SORTS=[{id:'original',label:'Original'},{id:'kcal',label:'Calorías'},{id:'name',label:'Nombre'}] as const;
type SortId=(typeof SORTS)[number]['id'];
const hasBackground=(node:SourceNode)=>/bg-\[#/.test(String(node.props.className??''));

/** Cambia sólo las hojas de texto de un subárbol del archivo y conserva íconos, fondos y medidas. */
function relabel(node:SourceNode,text:(sample:string,child:SourceNode)=>ReactNode|undefined,extra?:SourceResolver,key?:string|number) {
  return fields(node,{},child=>{
    if(child===node)return undefined;
    const custom=extra?.(child);if(custom)return custom;
    if(!leaf(child))return undefined;
    const value=text(sourceText(child),child);
    return value===undefined?undefined:{text:value};
  },key);
}
function imageBinding(node:SourceNode,recipe:DisplayRecipe):SourceBinding|undefined {
  return ['Image','Image Area','Place Image Here'].includes(nodeName(node))&&recipe.card?.cover_status==='ready'&&recipe.card.cover_url ? {children:<img src={recipe.card.cover_url} alt={recipe.card.cover_alt||recipe.title} className="absolute inset-0 block size-full object-cover"/>}:undefined;
}
/** Badge de momento con el color del archivo según la categoría real de la receta. */
function categoryBinding(node:SourceNode,category:string|undefined):SourceBinding|undefined {
  const name=nodeName(node);
  if(name==='Badge Meal Category'&&hasBackground(node))return {props:{style:{background:toneOf(category).strong}}};
  if(name==='Info Meal Category')return {props:{style:{background:toneOf(category).soft}}};
  if(leaf(node)&&SAMPLE_CATEGORIES.includes(sourceText(node)))return {text:category??'Receta'};
  return undefined;
}
/** Calificaciones y reseñas: Plan V no las guarda, así que el bloque queda sin reseñas. */
function ratingText(sample:string) {
  if(/^\d\.\d\/5/.test(sample)||/^\d\.\d$/.test(sample))return 'Sin reseñas';
  if(sample==='/5')return '';
  return undefined;
}
/** Valores de nutrientes de las fichas de la lista (kcal, carbohidratos, proteínas y grasas). */
const NUTRIENT_NODES:Record<string,MacroKey>={'Info Cal':'kcal','Info Calories':'kcal','Info Carbs':'carbs_g','Info Protein':'protein_g','Info Fats':'fat_g'};
const NUTRIENT_WORDS:Record<string,string>={carbs:'carbohidratos',protein:'proteínas',fats:'grasas'};
function nutrientBinding(node:SourceNode,recipe:DisplayRecipe|null):SourceBinding|undefined {
  const key=NUTRIENT_NODES[nodeName(node)];if(!key)return undefined;
  const value=macroValue(recipe,key);
  // Algunas fichas del archivo separan la cifra de la unidad («400» + «kcal»): la unidad se conserva aparte.
  const separateUnit=descendants(node).some(child=>leaf(child)&&/^(kcal|g|gr)$/.test(sourceText(child)));
  return {children:relabel(node,sample=>{
    if(/^\d+\s?(kcal|g|gr)?$/.test(sample))return value==null?NO_DATA:separateUnit?formatNumber(value):`${formatNumber(value)}${key==='kcal'?' kcal':' g'}`;
    if(sample==='gr')return 'g';
    return NUTRIENT_WORDS[sample];
  })};
}

/** Ficha de receta del archivo (lista principal, favoritas o asignadas) enlazada con una receta real. */
function recipeCardBinding(node:SourceNode,recipe:DisplayRecipe,open:()=>void):SourceBinding|undefined {
  const name=nodeName(node),category=categoryOf(recipe);
  const image=imageBinding(node,recipe);if(image)return image;
  const badge=categoryBinding(node,category);if(badge)return badge;
  const macros=nutrientBinding(node,recipe);if(macros)return macros;
  if(name==='Info Level')return {children:relabel(node,()=>recipe.card?.prep_minutes!=null?`${recipe.card.prep_minutes} min`:'Sin nivel')};
  if(name==='Chart Health Score')return {children:relabel(node,sample=>sample==='Health Score:'?'Sin puntaje':'',child=>nodeName(child)==='Bar'?{props:{style:{background:'#ffffff'}}}:undefined)};
  if(name==='Button Picker'&&/Add to Meal Plan/.test(sourceText(node)))return {onClick:open,label:`Ver ${recipe.title}`,children:relabel(node,()=> 'Ver receta')};
  if(['Button More','Button Picker'].includes(name)&&!sourceText(node))return {onClick:open,label:`Ver ${recipe.title}`};
  if(leaf(node)){
    const sample=sourceText(node),rating=ratingText(sample);
    if(rating!==undefined)return {text:rating};
    if(/SemiBold/.test(String(node.props.className))&&sample.length>12&&/[a-z] [A-Za-z]/.test(sample))return {text:recipe.title};
  }
  return undefined;
}

// Filas de información del archivo: sólo se completa lo que declara la receta publicada.
// Dificultad, puntaje y tiempo de cocción no existen en Plan V y quedan "Sin indicar".
const INFO_LABELS:Record<string,string>={'Eat Time':'Momento','Prep Time':'Preparación','Cook Time':'Cocción','Cook Duration':'Preparación','Difficulty':'Dificultad','Total Steps':'Pasos','Health Score':'Procedencia'};
function recipeInfoBinding(node:SourceNode,recipe:DisplayRecipe):SourceBinding|undefined {
  if(nodeName(node)!=='Item Detail Info')return undefined;
  const label=Object.keys(INFO_LABELS).find(sample=>descendants(node).some(child=>leaf(child)&&sourceText(child)===sample));
  if(!label)return undefined;
  const prep=recipe.card?.prep_minutes!=null?`${recipe.card.prep_minutes} min`:'Sin indicar';
  const value=label==='Total Steps'?`${recipe.steps.length} ${recipe.steps.length===1?'paso':'pasos'}`
    :label==='Prep Time'||label==='Cook Duration'?prep
    :label==='Eat Time'?categoryOf(recipe)
    :label==='Health Score'?recipeNutritionLabel(recipe.nutrition,recipe.nutrient_source,nutrients(recipe)).replace(/^Nutrientes /,'').replace(/^./,c=>c.toUpperCase())
    :'Sin indicar';
  return {children:relabel(node,sample=>sample===label?INFO_LABELS[label]:value)};
}
/** Las cuatro fichas de color del archivo (Calorías, Carbohidratos, Proteínas, Grasas). */
function mealValueBinding(node:SourceNode,recipe:DisplayRecipe|null,portions=1):SourceBinding|undefined {
  if(!/Item Detail Meal Value/.test(nodeName(node)))return undefined;
  const text=sourceText(node),key:MacroKey=text.startsWith('Calories')?'kcal':text.startsWith('Carbs')?'carbs_g':text.startsWith('Protein')?'protein_g':'fat_g';
  const value=macroValue(recipe,key,portions);
  return {children:relabel(node,sample=>/^\d/.test(sample)?(recipe?amount(value):'0'):sample==='gr'?'g':undefined)};
}

function HeartIcon({filled}:{filled:boolean}) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill={filled?'#ffa257':'none'} stroke={filled?'#ffa257':'#52545b'} strokeWidth="1.6" strokeLinejoin="round"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"/></svg>;
}

const NUTRITION_FACTS:Record<string,{label:string;key?:MacroKey;unit?:string}>={'Calories':{label:'Calorías',key:'kcal',unit:'kcal'},'Carbohydrates':{label:'Carbohidratos',key:'carbs_g',unit:'g'},'Protein':{label:'Proteínas',key:'protein_g',unit:'g'},'Total Fat':{label:'Grasas',key:'fat_g',unit:'g'},'Fiber':{label:'Fibra'},'Sodium':{label:'Sodio'},'Cholesterol':{label:'Colesterol'},'Sugars':{label:'Azúcares'},'Vitamin C':{label:'Vitamina C'}};

export function NutrigoRecipeDetail({recipe,onBack,patientName,onNavigate,onSignOut,onFavorite,saved=false,busy=false,error='',initialPortions,backLabel='Volver al menú'}:{recipe:DisplayRecipe;onBack:()=>void;patientName:string;onNavigate:ScreenProps['onNavigate'];onSignOut?:()=>void;onFavorite?:()=>void;saved?:boolean;busy?:boolean;error?:string;initialPortions?:number;backLabel?:string}) {
  const [portions,setPortions]=useState(initialPortions??recipe.yield_portions);
  useEffect(()=>{window.scrollTo(0,0);},[recipe.id,recipe.version]);
  const macro=nutrients(recipe);
  const origin=recipeNutritionLabel(recipe.nutrition,recipe.nutrient_source,macro);
  const category=categoryOf(recipe);
  const scaled=(quantity:number)=>formatNumber(quantity*portions/recipe.yield_portions);
  // Las notas del archivo llevan la procedencia de los nutrientes y el estado de la foto del plato.
  const notes=[
    `${origin}${recipe.nutrient_source?` · ${recipe.nutrient_source}`:''}.`,
    recipe.card?.cover_alt?.includes('imagen ilustrativa generada con IA')?'Imagen ilustrativa generada con IA. Las cantidades indicadas en la receta son la referencia.':null,
    ['queued','leased'].includes(recipe.card?.cover_generation??'')?'La foto del plato está pendiente.':null,
    recipe.card?.cover_generation==='failed'?'No se pudo preparar la foto. La receta sigue disponible.':null,
  ].filter((note):note is string=>Boolean(note));
  const listIn=(section:SourceNode,bind:(list:SourceNode)=>SourceBinding)=>({children:fields(section,{},child=>child!==section&&nodeName(child)==='List Nutrition Facts'?bind(child):undefined)});
  const resolver:SourceResolver=node=>{
    const name=nodeName(node),text=sourceText(node);
    if(name==='Back Button')return {onClick:onBack,label:backLabel,children:relabel(node,()=>backLabel)};
    if(name==='Button Nav'&&descendants(node).some(child=>nodeName(child)==='Icon/ArrowLeft'))return {onClick:onBack,label:backLabel};
    if(leaf(node)&&text==='Recipe Details')return {text:'Detalle de receta'};
    if(leaf(node)&&/^Grilled Turkey Breast/.test(text))return {text:recipe.title};
    const image=imageBinding(node,recipe);if(image)return image;
    const info=recipeInfoBinding(node,recipe);if(info)return info;
    const badge=categoryBinding(node,category);if(badge)return badge;
    if(name==='Section About')return {children:relabel(node,sample=>sample.length>40?`${origin}. Rinde ${formatNumber(recipe.yield_portions)} ${recipe.yield_portions===1?'porción':'porciones'}${recipe.steps.length?` en ${recipe.steps.length} ${recipe.steps.length===1?'paso':'pasos'}`:''}.`:undefined,child=>categoryBinding(child,category))};
    if(name==='Section Reviews')return {children:relabel(node,sample=>sample==='Reviews'?'Reseñas':/^by \d+/.test(sample)?'Sin reseñas todavía':/^\d\.\d$/.test(sample)?'0':undefined,child=>{
      if(nodeName(child)==='Star')return {props:{style:{opacity:.3,filter:'grayscale(1)'}}};
      if(nodeName(child)==='List Review')return listChildren(child,[],()=>undefined,'Todavía no hay reseñas de esta receta.');
      if(nodeName(child)==='Total Servings'||nodeName(child)==='Ratings')return undefined;
      return undefined;
    })};
    if(name==='Section Tools')return listIn(node,list=>listChildren(list,[],()=>undefined,'La receta no indica utensilios.'));
    if(name==='Section Directions')return listIn(node,list=>listChildren(list,recipe.steps,(child,step,index)=>{
      if(nodeName(child)==='Line'&&index===recipe.steps.length-1)return {props:{style:{visibility:'hidden'},'aria-hidden':true}};
      if(!leaf(child))return undefined;
      const sample=sourceText(child);
      if(/^\d+$/.test(sample))return {text:index+1};
      if(/SemiBold/.test(String(child.props.className)))return {text:`Paso ${index+1}`};
      return {text:step};
    },'La receta no tiene pasos cargados.',{key:(_step,index)=>index}));
    if(name==='Section Notes')return listIn(node,list=>listChildren(list,notes,(child,note)=>leaf(child)&&sourceText(child).length>8?{text:note}:undefined,'Sin notas.',{key:(_note,index)=>index}));
    if(name==='Section Ingredients')return listIn(node,list=>listChildren(list,recipe.ingredients,(child,ingredient,index)=>{
      if(!leaf(child))return undefined;
      return /^\d+$/.test(sourceText(child))?{text:index+1}:{text:`${scaled(ingredient.quantity)} ${ingredient.unit} ${ingredient.name}`};
    },'La receta no tiene ingredientes cargados.',{key:ingredient=>ingredient.id}));
    if(name==='Total Servings'&&text.startsWith('Total Servings')) {
      const buttons=descendants(node).filter(n=>nodeName(n)==='Button Icon');
      return {children:fields(node,{},child=>leaf(child)&&sourceText(child)==='2'?{text:formatNumber(portions)}:buttons[0]===child?{onClick:()=>setPortions(n=>Math.max(.5,n-.5)),label:'Reducir porciones',props:{disabled:portions<=.5}}:buttons[1]===child?{onClick:()=>setPortions(n=>Math.min(50,n+.5)),label:'Aumentar porciones',props:{disabled:portions>=50}}:undefined)};
    }
    const values=mealValueBinding(node,recipe,portions);if(values)return values;
    // La ficha crece con sus filas: en el archivo el alto lo marca la columna izquierda.
    if(name==='Widget Nutrition Facts')return {props:{style:{flex:'1 0 auto'}},children:fields(node,{},child=>{
      if(child===node)return undefined;
      if(nodeName(child)==='Button More'&&onFavorite)return {onClick:onFavorite,label:saved?'Quitar de favoritas':'Guardar en favoritas',props:{'aria-pressed':saved,disabled:busy},children:<HeartIcon filled={saved}/>};
      if(nodeName(child)==='Info Cal'){
        const label=Object.keys(NUTRITION_FACTS).find(sample=>objects(child).some(n=>leaf(n)&&sourceText(n)===sample));
        const fact=label?NUTRITION_FACTS[label]:undefined;if(!fact)return undefined;
        const value=fact.key?macroValue(recipe,fact.key,portions):null;
        return {children:relabel(child,sample=>sample===label?fact.label:sample==='Per Serving'?`${formatNumber(portions)} ${portions===1?'porción':'porciones'}`:value==null?NO_DATA:`${formatNumber(value)} ${fact.unit}`)};
      }
      return undefined;
    })};
    return undefined;
  };
  return <FramePair nodes={['84:3145','457:13264']} resolve={resolver} patientName={patientName} onNavigate={onNavigate} onSignOut={onSignOut}>
    {error&&<Stateful error={error}/>}
  </FramePair>;
}

export function NutrigoMenu({patient,onNavigate,onSignOut,query=''}:ScreenProps) {
  const remote=useRemote(`${patient.id}:menu`,async signal=>{
    const [recipes,library,plan]=await Promise.all([recipesApi.assigned(patient.id,signal),resourcesApi.library(patient.id,'',false,signal),plansApi.published(patient.id,signal)]);
    return {recipes:patientMenuRecipes(plan.plan,recipes.recipes),favoriteRecipeIds:recipes.recipes.map(recipe=>recipe.id),favorites:library.library.favorites.filter(f=>f.item_kind==='recipe').map(f=>f.item_id)};
  });
  const [opened,setOpened]=useState<string|null>(null),[search,setSearch]=useState(query),[onlySaved,setOnlySaved]=useState(false),[category,setCategory]=useState<string|null>(null),[sort,setSort]=useState<SortId>('original'),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const all=remote.data?.recipes??[];
  const favorites=remote.data?.favorites??[];
  const searched=all.filter(r=>r.title.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  const recipes=searched.filter(r=>(!onlySaved||favorites.includes(r.id))&&(!category||categoryOf(r)===category)).slice().sort((a,b)=>sort==='kcal'?((nutrients(a)?.kcal??Infinity)-(nutrients(b)?.kcal??Infinity)||a.title.localeCompare(b.title,'es')):sort==='name'?a.title.localeCompare(b.title,'es'):0);
  const toggle=async(id:string)=>{if(busy)return;setBusy(true);setError('');try{const response=await resourcesApi.favorite(patient.id,'recipe',id);if(remote.data)remote.setData({...remote.data,favorites:response.library.favorites.filter(f=>f.item_kind==='recipe').map(f=>f.item_id)});}catch(e){setError(errorText(e));}finally{setBusy(false);}};
  const chosen=remote.data?.recipes.find(r=>recipePresentationKey(r)===opened);
  useEffect(()=>{if(!remote.data?.recipes.some(recipe=>['queued','leased'].includes(recipe.card?.cover_generation??'')))return;const timer=setInterval(remote.reload,4000);return()=>clearInterval(timer);},[remote.data,remote.reload]);
  if(chosen)return <NutrigoRecipeDetail key={recipePresentationKey(chosen)} recipe={chosen} onBack={()=>setOpened(null)} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} saved={favorites.includes(chosen.id)} onFavorite={remote.data?.favoriteRecipeIds?.includes(chosen.id)?()=>void toggle(chosen.id):undefined} busy={busy} error={error}/>;
  const open=(recipe:DisplayRecipe)=>()=>setOpened(recipePresentationKey(recipe));
  const loading=!remote.data?<Stateful loading={!remote.error} error={remote.error} onRetry={remote.reload}/>:null;
  const recipeList=(list:SourceNode,items:DisplayRecipe[],empty:string,only?:(node:SourceNode)=>boolean)=>loading?{children:loading}:listChildren(list,items,(child,recipe)=>recipeCardBinding(child,recipe,open(recipe)),empty,{key:recipe=>recipePresentationKey(recipe),only});
  // La receta destacada es la primera del plan o de las asignadas; sin recetas, el bloque queda en cero.
  const featured=searched[0]??null;
  const featuredBinding=(node:SourceNode):SourceBinding=>({children:fields(node,{},child=>{
    if(child===node)return undefined;
    const name=nodeName(child),text=sourceText(child);
    if(leaf(child)&&/^Grilled Turkey Breast/.test(text))return {text:featured?.title??'Todavía no tenés recetas asignadas.'};
    if(featured){const image=imageBinding(child,featured);if(image)return image;const info=recipeInfoBinding(child,featured);if(info)return info;}
    else if(name==='Item Detail Info')return {children:relabel(child,sample=>INFO_LABELS[sample]??'Sin indicar')};
    const badge=categoryBinding(child,featured?categoryOf(featured):'Sin receta');if(badge)return badge;
    const values=mealValueBinding(child,featured);if(values)return values;
    if(leaf(child)){const rating=ratingText(text);if(rating!==undefined)return {text:rating};}
    if(name==='Button CTA')return featured?{onClick:open(featured),label:`Ver ${featured.title}`,children:relabel(child,()=> 'Ver receta')}:{onClick:()=>onNavigate('mensajes'),children:relabel(child,()=> 'Pedir una receta')};
    return undefined;
  })});
  const resolver:SourceResolver=node=>{
    const name=nodeName(node),text=sourceText(node);
    const input=searchBinding(node,search,setSearch,'Buscar receta');if(input)return input;
    if(name==='Widget Featured Menu')return featuredBinding(node);
    if(name==='Widget All Menu')return {children:fields(node,{},child=>{
      if(child===node)return undefined;
      const childName=nodeName(child),childText=sourceText(child);
      if(childName==='List Menu')return recipeList(child,recipes,onlySaved?'Todavía no guardaste recetas en favoritas.':'Todavía no hay recetas asignadas que coincidan.');
      // «Filter» del archivo: muestra sólo las recetas guardadas en favoritas.
      if(childName==='Button Picker'&&childText==='Filter')return {onClick:()=>setOnlySaved(v=>!v),label:onlySaved?'Mostrar todas las recetas':'Mostrar sólo favoritas',props:{'aria-pressed':onlySaved,style:onlySaved?{background:'#c2e66e'}:undefined},children:relabel(child,()=> 'Favoritas')};
      // Vista del archivo: la grilla abre el plan por fecha; la lista es la vista actual.
      if(childName==='Segmented Button'&&!childText)return {children:objects(child).map((button,index)=>fields(button,{},n=>n!==button?undefined:hasBackground(n)&&/c2e66e/.test(String(n.props.className))?{props:{'aria-label':'Vista de lista (actual)',role:'img'}}:{onClick:()=>onNavigate('plan'),label:'Ver plan por fecha'},index))};
      if(childName==='Button Picker'&&childText in CATEGORY_FILTERS){
        const value=CATEGORY_FILTERS[childText],active=category===value;
        return {onClick:()=>setCategory(value),props:{'aria-pressed':active,style:{background:active?'#c2e66e':'#f6f6f7'}},children:relabel(child,()=>value??'Todas')};
      }
      if(childName==='Button Picker'&&childText==='Calories'){
        const index=SORTS.findIndex(entry=>entry.id===sort),next=SORTS[(index+1)%SORTS.length];
        return {onClick:()=>setSort(next.id),label:`Ordenar por ${next.label.toLocaleLowerCase('es')}`,children:relabel(child,()=>SORTS[index].label)};
      }
      if(leaf(child)&&childText==='Sort by:')return {text:'Ordenar por:'};
      return undefined;
    })};
    if(name==='Widget Popular Menu'||name==='Widget Recommended Menu') {
      const savedWidget=text.startsWith('Popular Menu');
      const selected=savedWidget?all.filter(recipe=>favorites.includes(recipe.id)):searched;
      return {children:fields(node,{},child=>{
        if(child===node)return undefined;
        if(leaf(child)&&['Popular Menu','Recommended Menu'].includes(sourceText(child)))return {text:savedWidget?'Tus favoritas':'Recetas asignadas'};
        if(nodeName(child)==='List Menu'){
          const cards=objects(child).filter(n=>/^Card/.test(nodeName(n))).length||3;
          return recipeList(child,selected.slice(0,cards),savedWidget?'Todavía no guardaste recetas.':'Todavía no hay recetas asignadas que coincidan.');
        }
        if(nodeName(child)==='Button More'&&!sourceText(child))return {onClick:()=>{setOnlySaved(savedWidget);setCategory(null);},label:savedWidget?'Ver todas tus favoritas':'Ver todas las recetas asignadas'};
        return undefined;
      })};
    }
    if(/^Button/.test(name)&&text==='Add Menu')return {onClick:()=>onNavigate('mensajes'),label:'Pedir una receta a tu nutricionista',children:relabel(node,()=> 'Pedir una receta')};
    return undefined;
  };
  return <FramePair nodes={['84:2716','445:10499']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} query={search} onSearch={setSearch}>
    {error&&<Stateful error={error}/>}
  </FramePair>;
}
