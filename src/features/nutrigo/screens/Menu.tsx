import { useState } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceResolver, type SourceNode } from '../SourceView';
import { recipesApi } from '../../../api/recipes';
import { resourcesApi } from '../../../api/resources';
import type { PatientRecipe } from '../../../types/recipes';
import { recipeNutritionLabel } from '../../../types/ai-nutrition';
import { descendants, fields, formatNumber, leaf, objects, idEnds, errorText, searchBinding, Stateful, useRemote, type ScreenProps } from './shared';

export type DisplayRecipe = Pick<PatientRecipe,'id'|'title'|'version'|'yield_portions'|'steps'|'nutrient_source'|'card'|'nutrition'> & {ingredients:Array<{id:string;name:string;quantity:number;unit:string}>};
function nutrients(recipe:DisplayRecipe) {return recipe.nutrition?.per_portion??recipe.card?.macros??null;}
function imageBinding(node:SourceNode,recipe:DisplayRecipe) {
  return ['Image','Image Area','Place Image Here'].includes(nodeName(node))&&recipe.card?.cover_status==='ready'&&recipe.card.cover_url ? {children:<img src={recipe.card.cover_url} alt={recipe.card.cover_alt||recipe.title} className="absolute inset-0 block size-full object-cover"/>}:undefined;
}
export function NutrigoRecipeDetail({recipe,onBack,patientName,onNavigate,onSignOut,onFavorite,saved=false,busy=false,error='',initialPortions,backLabel='Volver al menú'}:{recipe:DisplayRecipe;onBack:()=>void;patientName:string;onNavigate:ScreenProps['onNavigate'];onSignOut?:()=>void;onFavorite?:()=>void;saved?:boolean;busy?:boolean;error?:string;initialPortions?:number;backLabel?:string}) {
  const [portions,setPortions]=useState(initialPortions??recipe.yield_portions);
  const macro=nutrients(recipe);
  const origin=recipeNutritionLabel(recipe.nutrition,recipe.nutrient_source,macro);
  const resolver:SourceResolver=node=>{
    const name=nodeName(node),text=sourceText(node);
    if(name==='Back Button')return {onClick:onBack,text:backLabel,label:backLabel};
    if(name==='Button Nav'&&descendants(node).some(child=>nodeName(child)==='Icon/ArrowLeft'))return {onClick:onBack,label:backLabel};
    if(leaf(node)&&text==='Grilled Turkey Breast with Steamed Asparagus and Brown Rice')return {text:recipe.title};
    const image=imageBinding(node,recipe);if(image)return image;
    if(name==='Section Reviews')return {children:<p className="text-[12px]">Sin valoraciones registradas.</p>};
    if(name==='Section Tools')return {children:<p className="text-[12px]">La receta no declara utensilios.</p>};
    if(name==='Section Notes')return {children:<p className="text-[12px]">{origin}{recipe.nutrient_source?` · ${recipe.nutrient_source}`:''}</p>};
    if(name==='Section About')return {children:fields(node,{},child=>leaf(child)?{text:sourceText(child)==='Lunch'?recipe.card?.category??'Receta':origin}:undefined)};
    if(name==='Section Directions')return {children:fields(node,{},child=>nodeName(child)==='List Nutrition Facts'?{children:recipe.steps.map((step,index)=>{
      const prototype=objects(child)[0];return prototype?fields(prototype,{'256:7344':index+1,'256:7347':`Paso ${index+1}`,'256:7348':step},n=>leaf(n)&&/^Prepare|Cook|Steam|Grill|Serve/.test(sourceText(n))?{text:`Paso ${index+1}`}:leaf(n)&&sourceText(n).length>60?{text:step}:undefined,index):null;
    })}:undefined)};
    if(name==='Section Ingredients')return {children:fields(node,{},child=>nodeName(child)==='List Nutrition Facts'?{children:recipe.ingredients.map((ingredient,index)=>{
      const prototype=objects(child)[0];return prototype?fields(prototype,{'370:9868':index+1,'256:7874':`${formatNumber(ingredient.quantity*portions/recipe.yield_portions)} ${ingredient.unit} ${ingredient.name}`},n=>leaf(n)&&/^\d+$/.test(sourceText(n))?{text:index+1}:leaf(n)&&sourceText(n).length>8?{text:`${formatNumber(ingredient.quantity*portions/recipe.yield_portions)} ${ingredient.unit} ${ingredient.name}`}:undefined,ingredient.id):null;
    })}:undefined)};
    if(name==='Total Servings'&&text.startsWith('Total Servings')) {
      const buttons=descendants(node).filter(n=>nodeName(n)==='Button Icon');
      return {children:fields(node,{},child=>leaf(child)&&sourceText(child)==='2'?{text:formatNumber(portions)}:buttons[0]===child?{onClick:()=>setPortions(n=>Math.max(.5,n-.5)),label:'Reducir porciones',props:{disabled:portions<=.5}}:buttons[1]===child?{onClick:()=>setPortions(n=>Math.min(50,n+.5)),label:'Aumentar porciones',props:{disabled:portions>=50}}:undefined)};
    }
    if(/Item Detail Meal Value/.test(name)) {
      const key=text.startsWith('Calories')?'kcal':text.startsWith('Carbs')?'carbs_g':text.startsWith('Protein')?'protein_g':'fat_g';
      return {children:fields(node,{},child=>leaf(child)&&/^\d/.test(sourceText(child))?{text:formatNumber(macro?.[key]!=null?macro[key]!*portions:null)}:undefined)};
    }
    if(name==='Widget Nutrition Facts')return {children:fields(node,{},child=>nodeName(child)==='List Nutrition Facts'?{children:<dl className="flex flex-col gap-[16px] text-[14px]">{[['kcal','Calorías','kcal'],['carbs_g','Carbohidratos','g'],['protein_g','Proteínas','g'],['fat_g','Grasas','g']].map(([key,label,unit])=><div className="flex justify-between" key={key}><dt>{label}</dt><dd>{formatNumber(macro?.[key as keyof typeof macro]!=null?macro[key as keyof typeof macro]!*portions:null)} {unit}</dd></div>)}<p className="text-[12px]">{origin} · {formatNumber(portions)} porciones</p></dl>}:undefined)};
    if(name==='Item Detail Info')return {children:fields(node,{},child=>leaf(child)&&['10 minutes','5 steps','4 steps'].includes(sourceText(child))?{text:sourceText(child).includes('steps')?`${recipe.steps.length} pasos`:recipe.card?.prep_minutes?`${recipe.card.prep_minutes} min`:'—'}:undefined)};
    if(leaf(node)&&text==='Recipe Details')return {text:'Detalle de receta'};
    return undefined;
  };
  return <FramePair nodes={['84:3145','457:13264']} resolve={resolver} patientName={patientName} onNavigate={onNavigate} onSignOut={onSignOut}>
    <div className="mcp-screen-state"><button className="mcp-action" onClick={onBack}>{backLabel}</button>{onFavorite&&<button className="mcp-action" disabled={busy} aria-pressed={saved} onClick={onFavorite}>{saved?'Guardada':'Guardar en favoritos'}</button>}<p>{origin}</p>{error&&<p role="alert">{error}</p>}</div>
  </FramePair>;
}
export function NutrigoMenu({patient,onNavigate,onSignOut,query=''}:ScreenProps) {
  const remote=useRemote(`${patient.id}:menu`,async signal=>{
    const [recipes,library]=await Promise.all([recipesApi.assigned(patient.id,signal),resourcesApi.library(patient.id,'',false,signal)]);
    return {recipes:recipes.recipes,favorites:library.library.favorites.filter(f=>f.item_kind==='recipe').map(f=>f.item_id)};
  });
  const [opened,setOpened]=useState<string|null>(null),[search,setSearch]=useState(query),[onlySaved,setOnlySaved]=useState(false),[alphabetic,setAlphabetic]=useState(false),[byCalories,setByCalories]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const recipes=(remote.data?.recipes??[]).filter(r=>r.title.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))&&(!onlySaved||remote.data?.favorites.includes(r.id))).slice().sort((a,b)=>byCalories?((nutrients(a)?.kcal??Infinity)-(nutrients(b)?.kcal??Infinity)||a.title.localeCompare(b.title,'es')):alphabetic?a.title.localeCompare(b.title,'es'):0);
  const toggle=async(id:string)=>{if(busy)return;setBusy(true);setError('');try{const response=await resourcesApi.favorite(patient.id,'recipe',id);if(remote.data)remote.setData({...remote.data,favorites:response.library.favorites.filter(f=>f.item_kind==='recipe').map(f=>f.item_id)});}catch(e){setError(errorText(e));}finally{setBusy(false);}};
  const chosen=remote.data?.recipes.find(r=>r.id===opened);
  if(chosen)return <NutrigoRecipeDetail key={`${chosen.id}:${chosen.version}`} recipe={chosen} onBack={()=>setOpened(null)} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} saved={remote.data?.favorites.includes(chosen.id)} onFavorite={()=>void toggle(chosen.id)} busy={busy} error={error}/>;
  const card=(prototype:SourceNode,recipe:PatientRecipe)=>{
    const macro=nutrients(recipe);
    return fields(prototype,{'236:9386':recipe.title,'453:11817':recipe.title,'228:6622':recipe.title,'228:7500':recipe.title,'236:9444':recipe.card?.category??'Receta','453:11793':recipe.card?.category??'Receta','228:6649':recipe.card?.category??'Receta','228:7503':recipe.card?.category??'Receta','236:9421':`${formatNumber(macro?.kcal)} kcal`,'453:11823':`${formatNumber(macro?.kcal)} kcal`,'228:7541':`${formatNumber(macro?.kcal)} kcal`,'243:6430':`${formatNumber(macro?.carbs_g)} g`,'453:11829':`${formatNumber(macro?.carbs_g)} g`,'228:7519':`${formatNumber(macro?.carbs_g)} g`,'243:6449':`${formatNumber(macro?.protein_g)} g`,'453:11835':`${formatNumber(macro?.protein_g)} g`,'228:7524':`${formatNumber(macro?.protein_g)} g`,'243:6453':`${formatNumber(macro?.fat_g)} g`,'453:11841':`${formatNumber(macro?.fat_g)} g`,'228:7529':`${formatNumber(macro?.fat_g)} g`},child=>{
      const image=imageBinding(child,recipe);if(image)return image;
      if(/^Button/.test(nodeName(child)))return {onClick:()=>setOpened(recipe.id),label:`Ver ${recipe.title}`,children:<span>Ver receta</span>};
        if(leaf(child)&&sourceText(child)==='Health Score:')return {text:recipeNutritionLabel(recipe.nutrition,recipe.nutrient_source,macro)};
      return undefined;
    },recipe.id);
  };
  const resolver:SourceResolver=node=>{
    const name=nodeName(node),text=sourceText(node);
    const input=searchBinding(node,search,setSearch,'Buscar receta');if(input)return input;
    if(name==='List Menu') {
      const prototype=objects(node)[0];if(!prototype)return {children:null};
      return {children:!remote.data?<Stateful loading={!remote.error} error={remote.error} onRetry={remote.reload}/>:recipes.length?recipes.map(recipe=>card(prototype,recipe)):<Stateful empty="Todavía no hay recetas asignadas que coincidan."/>};
    }
    if(name==='Widget Featured Menu') {
      const recipe=recipes[0];if(!recipe)return {children:<Stateful empty="Sin receta destacada."/>};
      return {children:fields(node,{},child=>{
        if(leaf(child)&&sourceText(child)==='Grilled Turkey Breast with Steamed Asparagus and Brown Rice')return {text:recipe.title};
        const image=imageBinding(child,recipe);if(image)return image;
        if(/^Button/.test(nodeName(child)))return {onClick:()=>setOpened(recipe.id),text:'Ver receta'};
        if(/Item Detail Meal Value/.test(nodeName(child))) {const m=nutrients(recipe),t=sourceText(child),k=t.startsWith('Calories')?'kcal':t.startsWith('Carbs')?'carbs_g':t.startsWith('Protein')?'protein_g':'fat_g';return {children:fields(child,{},n=>leaf(n)&&/^\d/.test(sourceText(n))?{text:formatNumber(m?.[k])}:undefined)};}
        return undefined;
      })};
    }
    if(/^Button/.test(name)&&text==='Add Menu')return {onClick:()=>onNavigate('mensajes'),text:'Pedir una receta'};
    if(/^Button/.test(name)&&text==='Filter')return {onClick:()=>setOnlySaved(v=>!v),label:'Mostrar favoritas',props:{'aria-pressed':onlySaved},text:onlySaved?'Favoritas':'Todas'};
    if(/^Button/.test(name)&&/Sort by/.test(text))return {onClick:()=>{setAlphabetic(v=>!v);setByCalories(false);},text:alphabetic?'Por nombre':'Orden original'};
    if(name==='Button Picker'&&text==='Calories')return {onClick:()=>{setByCalories(v=>!v);setAlphabetic(false);},text:byCalories?'Por calorías':'Calorías',label:'Ordenar por calorías',props:{'aria-pressed':byCalories}};
    if(/Segmented/.test(name))return {children:<button className="mcp-action" aria-pressed={onlySaved} onClick={()=>setOnlySaved(v=>!v)}>{onlySaved?'Favoritas':'Todas las recetas'}</button>};
    return undefined;
  };
  return <FramePair nodes={['84:2716','445:10499']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} query={search} onSearch={setSearch}>
    {error&&<Stateful error={error}/>}<div className="mcp-screen-state"><button className="mcp-action" aria-pressed={onlySaved} onClick={()=>setOnlySaved(v=>!v)}>{onlySaved?'Ver todas':'Ver favoritas'}</button><button className="mcp-action" onClick={()=>onNavigate('plan')}>Ver plan por fecha</button>{recipes[0]&&<p>{recipes[0].title} · {recipeNutritionLabel(recipes[0].nutrition,recipes[0].nutrient_source,recipes[0].card?.macros)}</p>}</div>
  </FramePair>;
}
