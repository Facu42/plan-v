import { useState, type ReactNode, type RefObject } from 'react';
import type { ProfessionalRecipe, RecipeVersionView } from '../../types/recipes';
import { recipeNutritionLabel } from '../../types/ai-nutrition';
import { RecipeDishWell, RecipeMacroGrid } from './RecipePlate';

export function RecipeProfessionalDetail({ recipe, onBack, headingRef, renderComposition, favorite, actions }: {
  recipe: ProfessionalRecipe; onBack: () => void; headingRef: RefObject<HTMLHeadingElement | null>;
  renderComposition: (version: RecipeVersionView) => ReactNode; favorite: ReactNode; actions: ReactNode;
}) {
  const [showPublished, setShowPublished] = useState(false);
  const version = showPublished && recipe.published ? recipe.published : recipe.current;
  const estimate = version.catalog_recipe?.estimate_origin || recipeNutritionLabel(version.nutrition, version.nutrient_source) === 'Nutrientes estimados por IA';
  return <section className="recipe-professional-detail" aria-label="Detalle profesional de receta">
    <button type="button" className="recipe-back" onClick={onBack}>← Volver al catálogo</button>
    <header><div><p>Consultorio · Versión {version.version} · {version.published_at ? 'Publicada' : 'Borrador privado'}</p><h2 ref={headingRef} tabIndex={-1}>{version.title ?? recipe.title}</h2></div>{favorite}</header>
    {recipe.published && recipe.published.id !== recipe.current.id && <label>Versión que estás consultando<select value={showPublished ? 'published' : 'current'} onChange={event => setShowPublished(event.target.value === 'published')}><option value="current">Borrador actual · versión {recipe.current.version}</option><option value="published">Publicada · versión {recipe.published.version}</option></select></label>}
    {estimate && <p className="recipe-ai-warnings">Propuesta de IA · los nutrientes requieren revisión. La composición del catálogo conserva la procedencia de la receta.</p>}
    <div className="recipe-detail-meta"><div><span>Preparación</span><strong>{version.card?.prep_minutes == null ? 'Sin dato' : `${version.card.prep_minutes} min`}</strong></div><div><span>Cocción</span><strong>{version.cooking_minutes == null ? 'Sin dato' : `${version.cooking_minutes} min`}</strong></div><div><span>Rinde</span><strong>{version.yield_portions} porciones</strong></div><div><span>Peso final</span><strong>{version.final_weight_g == null ? 'Sin dato' : `${version.final_weight_g} g`}</strong></div></div>
    <div className="recipe-detail-columns"><div>
      <RecipeDishWell title={version.title ?? recipe.title} status={version.card?.cover_status ?? 'none'} url={version.card?.cover_url} alt={version.card?.cover_alt} />
      <section><h3>Ingredientes</h3><ul className="recipe-detail-ingredients">{version.ingredients.map(item => <li key={item.id}><span>{item.name}</span><strong>{item.quantity.toLocaleString('es-AR', { maximumFractionDigits: 4 })} {item.unit}</strong></li>)}</ul></section>
      <section><h3>Preparación paso a paso</h3><ol className="recipe-detail-steps">{version.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></section>
    </div><div>
      {version.catalog_recipe ? renderComposition(version) : <section className="recipe-composition"><h3>Nutrientes por porción</h3>{version.card?.macros ? <RecipeMacroGrid macros={version.card.macros} /> : <p>Sin datos nutricionales declarados.</p>}<p>{version.nutrient_source ? `Fuente: ${version.nutrient_source}` : 'Sin fuente declarada.'}</p></section>}
      {version.catalog_recipe && <section className="recipe-detail-sources"><h3>Fuentes de esta versión</h3><ul>{version.catalog_recipe.lines.map((line, i) => <li key={i}><strong>{line.name}</strong>: {line.food ? `${line.food.source} · versión ${line.food.revision}` : 'Sin composición vinculada'}{line.food?.reference && <span> · {line.food.reference}</span>}</li>)}</ul></section>}
    </div></div>
    {!showPublished && <div className="recipe-actions">{actions}</div>}
    {showPublished && <p>Esta es la copia publicada. Volvé al borrador actual para editar o asignar desde las acciones de la receta.</p>}
  </section>;
}
