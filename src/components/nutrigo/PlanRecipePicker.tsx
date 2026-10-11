import { useState } from 'react';
import type { ProfessionalRecipe } from '../../types/recipes';
import type { PlanRecipeDetail } from '../../types/plans';
import { NUTRIENTS } from '../../types/foods';
import { filterPlanRecipes, publishedRecipeDetail, recipePortionNutrients } from '../../types/plan-recipe-selection';
import { recipeNutritionLabel } from '../../types/ai-nutrition';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { NvButton } from './primitives';

export function PlanRecipePreview({ recipe, portions }: { recipe: PlanRecipeDetail; portions: number }) {
  const nutrients = recipePortionNutrients(recipe, portions);
  const valid = nutrients !== null;
  return <section className="plan-recipe-preview" aria-label="Vista previa de la receta seleccionada">
    <h3>{recipe.title} · v{recipe.version}</h3>
    <p>{recipe.card?.culinary_categories?.join(' · ') || 'Sin clasificar'} · Rinde {recipe.yield_portions} porciones</p>
    <p>{recipeNutritionLabel(recipe.nutrition, recipe.nutrient_source, recipe.card?.macros)}{recipe.catalog_recipe?.estimate_origin ? ' · Procedencia de IA conservada' : ''}</p>
    <p>Fuente: {recipe.nutrient_source || 'Sin fuente declarada'}</p>
    {valid ? <><h4>Nutrientes para {portions.toLocaleString('es-AR')} porciones</h4><dl className="plan-recipe-nutrients">{NUTRIENTS.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{nutrients[key] == null ? 'Sin dato' : `${nutrients[key]!.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${unit}`}</dd></div>)}</dl></> : <p role="status">Indicá entre 0,0001 y 50 porciones para ver el cálculo.</p>}
    <details><summary>Ingredientes para las porciones elegidas</summary><ul>{recipe.ingredients.map(item => <li key={item.id}>{item.name}: {valid && recipe.yield_portions > 0 ? `${(item.quantity * portions / recipe.yield_portions).toLocaleString('es-AR', { maximumFractionDigits: 4 })} ${item.unit}` : 'Sin cantidad válida'}</li>)}</ul></details>
    <details><summary>Preparación</summary><ol>{recipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></details>
    {recipe.catalog_recipe && <details><summary>Fuentes de los ingredientes</summary><ul>{recipe.catalog_recipe.lines.map((line, index) => <li key={index}>{line.name}: {line.food ? `${line.food.source} · revisión ${line.food.revision}` : 'Sin composición vinculada'}</li>)}</ul></details>}
  </section>;
}

export function PlanRecipePicker({ recipes, loading, error, onRetry, initialPortions, onChoose, onClose, onFood }: {
  recipes: ProfessionalRecipe[]; loading: boolean; error: string; onRetry: () => void; initialPortions: string;
  onChoose: (recipe: ProfessionalRecipe, portions: number) => void; onClose: () => void; onFood?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [portions, setPortions] = useState(initialPortions);
  const [selected, setSelected] = useState<ProfessionalRecipe | null>(null);
  const visible = filterPlanRecipes(recipes, query, category);
  const detail = selected ? publishedRecipeDetail(selected) : null;
  const amount = portions.trim() ? Number(portions) : NaN;
  const valid = detail && recipePortionNutrients(detail, amount) !== null;
  return <FigmaRecordDialog title="Agregar receta al plan" className="plan-recipe-picker" closeLabel="Cerrar selección de receta" onClose={onClose}>
    {onFood && <div className="plan-analysis-switch"><button type="button" onClick={onFood}>Alimentos</button><button type="button" aria-pressed="true">Recetas</button></div>}
    <p>Elegí una versión publicada. Se agrega al borrador; el plan del paciente se conserva hasta que publiques.</p>
    <div className="plan-recipe-picker-filters"><label>Buscar receta<input type="search" value={query} placeholder="Título o ingrediente" onChange={event => setQuery(event.target.value)} /></label><label>Categoría culinaria<select value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas las categorías</option>{Array.from(new Set(recipes.flatMap(recipe => recipe.published?.card?.culinary_categories ?? []))).sort((a,b) => a.localeCompare(b, 'es')).map(value => <option key={value}>{value}</option>)}</select></label></div>
    {loading && <p role="status">Cargando recetas publicadas…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={onRetry}>Reintentar catálogo</button></p>}
    {!loading && !error && <p role="status">{visible.length} recetas publicadas{!visible.length ? '. Probá otra búsqueda o publicá una receta desde Biblioteca.' : ''}</p>}
    <div className="plan-recipe-picker-columns"><div className="plan-recipe-picker-results" aria-label="Recetas publicadas">{!loading && !error && visible.map(recipe => <button key={recipe.id} type="button" aria-pressed={selected?.id === recipe.id} onClick={() => setSelected(recipe)}><strong>{recipe.published?.title ?? recipe.title}</strong><span>Versión publicada {recipe.published?.version}</span><small>{recipe.published?.card?.culinary_categories?.join(' · ') || 'Sin clasificar'}</small></button>)}</div><div>{detail ? <><label>Porciones a agregar<input type="number" min="0.0001" max="50" step="0.0001" value={portions} onChange={event => setPortions(event.target.value)} /></label><PlanRecipePreview recipe={detail} portions={amount} /></> : <p>Seleccioná una receta para revisar ingredientes, preparación y nutrientes.</p>}</div></div>
    <footer className="plan-recipe-picker-actions"><NvButton disabled={!valid || loading || Boolean(error)} onClick={() => { if (selected && valid) onChoose(selected, amount); }}>Agregar al borrador</NvButton><NvButton className="nv-ghost" onClick={onClose}>Cancelar</NvButton></footer>
  </FigmaRecordDialog>;
}
