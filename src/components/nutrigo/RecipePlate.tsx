import { useState, type ReactNode } from 'react';
import { ArrowLeft, Bread, ChartBar, Clock, CookingPot, Drop, Fire, Fish, Heartbeat, Knife, ListNumbers, Minus, Plus } from '@phosphor-icons/react';
import type { RecipeCard, RecipeItem, RecipeMacros } from '../../types/recipes';
import './recipe-plate.css';
import './menu-fig.css';
import { FigmaAsset, useFigmaDetail } from './FigmaPatientFront';

const LABELS = [
  ['kcal', 'KCAL', 'kcal'],
  ['protein_g', 'PROT', 'prot'],
  ['carbs_g', 'CARBS', 'carbs'],
  ['fat_g', 'GRASAS', 'fat'],
] as const;

export function RecipeDishWell({ title, status, url, alt }: { title: string; status: RecipeCard['cover_status']; url?: string | null; alt?: string }) {
  if (status === 'ready' && url) {
    return <figure className="recipe-dish" data-cover={status}>
      <img src={url} alt={alt || title} loading="lazy" />
    </figure>;
  }
  const failed = status === 'failed';
  return <figure className="recipe-dish" data-cover={status}>
    <span className="recipe-placeholder" role="img" aria-label={failed ? `Foto no generada de ${title}` : `Sin foto de ${title}`} />
    <figcaption>{failed ? 'La foto del plato no se generó' : 'Sin foto generada'}</figcaption>
  </figure>;
}

export function RecipeMacroGrid({ macros }: { macros: RecipeMacros }) {
  return <dl className="recipe-macros">
    {LABELS.map(([key, label, tone]) => {
      const value = macros[key];
      return <div key={key} data-macro={tone}>
        <dt>{label}</dt>
        <dd>{value == null ? '—' : value}</dd>
      </div>;
    })}
  </dl>;
}

export function RecipePlateCard({
  title,
  portions,
  card,
  actions,
  ingredients,
  nutritionBasis,
  culinaryCategories,
}: {
  title: string;
  portions: number;
  card: RecipeCard;
  actions?: ReactNode;
  ingredients?: Array<{ id: string; name: string; quantity: number; unit: string }>;
  nutritionBasis?: string;
  culinaryCategories?: readonly string[];
}) {
  const meta = card.prep_minutes ? `${portions} porciones · ${card.prep_minutes} min` : `${portions} porciones`;
  return <article className="recipe-plate">
    <RecipeDishWell title={title} status={card.cover_status} url={card.cover_url} alt={card.cover_alt} />
    <div className="recipe-plate-body">
      <span className="recipe-plate-badge">{card.category}</span>
      <h3>{title}</h3>
      {culinaryCategories?.length ? <p className="recipe-culinary-label" aria-label="Categorías culinarias">{culinaryCategories.join(' · ')}</p> : null}
      <p className="recipe-plate-meta">{meta}</p>
      {nutritionBasis && <p className="recipe-nutrition-basis">{nutritionBasis}</p>}
      {card.macro_status === 'declared' && card.macros
        ? <RecipeMacroGrid macros={card.macros} />
        : <p className="recipe-macro-missing" role="status">{card.macro_status === 'failed' ? 'La IA no devolvió macros.' : 'Sin macros declarados.'}</p>}
      {ingredients && <ul className="recipe-plate-ingredients">{ingredients.map((item) => <li key={item.id}>{item.quantity} {item.unit} {item.name}</li>)}</ul>}
      {actions && <div className="recipe-actions">{actions}</div>}
    </div>
  </article>;
}

/* ── Detalle de receta (nodo 84:3145 / mobile 457:13264) ─────────────────── */

export type RecipeDetailData = {
  id: string;
  title: string;
  version: number;
  yieldPortions: number;
  steps: string[];
  nutrientSource: string;
  ingredients: RecipeItem[];
  card: RecipeCard;
  /** Sólo el nutricionista ve el estado de la revisión. */
  statusLabel?: string;
};

/** Cantidades según las porciones elegidas; redondeo a un decimal, sin inventar nada que no esté en la receta. */
export function scaleQuantity(quantity: number, yieldPortions: number, servings: number) {
  if (!yieldPortions || yieldPortions <= 0) return quantity;
  return Math.round(quantity * servings / yieldPortions * 10) / 10;
}

const MACRO_TILES = [
  ['kcal', 'Calorías', 'kcal', Fire],
  ['carbs_g', 'Hidratos', 'g', Bread],
  ['protein_g', 'Proteínas', 'g', Fish],
  ['fat_g', 'Grasas', 'g', Drop],
] as const;

/** Las cuatro fichas del archivo, con — cuando no se declararon sus valores. */
export function RecipeMacroTiles({ macros, variant }: { macros: RecipeMacros | null; variant: 'column' | 'row' }) {
  return <dl className={`mf-macros mf-macros-${variant}`}>
    {MACRO_TILES.map(([key, label, unit], index) => <div key={key} data-macro={key}>
      <span className="mf-macro-icon"><FigmaAsset name={['fire','bread','fish','drop'][index]} size={16} /></span>
      <dt>{label}</dt>
      <dd>{macros?.[key] == null ? <strong>—</strong> : <><strong>{macros[key]}</strong> <small>{unit}</small></>}</dd>
    </div>)}
  </dl>;
}

export function RecipeDetails({ recipe, onBack, actions }: {
  recipe: RecipeDetailData;
  onBack: () => void;
  actions?: ReactNode;
}) {
  const [servings, setServings] = useState(recipe.yieldPortions);
  useFigmaDetail('Detalle de receta', ['84:3145','457:13264']);
  const macros = recipe.card.macro_status === 'declared' ? recipe.card.macros : null;
  const info: Array<[string, string, string]> = [
    ['Preparación', recipe.card.prep_minutes ? `${recipe.card.prep_minutes} min` : '—', 'recipe-clock'],
    ['Cocción', '—', 'recipe-cooking'],
    ['Dificultad', '—', 'recipe-difficulty'],
    ['Total de pasos', `${recipe.steps.length} ${recipe.steps.length === 1 ? 'paso' : 'pasos'}`, 'recipe-steps'],
    ['Puntuación de salud', '—', 'recipe-health'],
    ...(recipe.statusLabel ? [['Estado', recipe.statusLabel, 'recipe-health'] as [string, string, string]] : []),
  ];
  const step = recipe.yieldPortions % 1 ? 0.5 : 1;
  return <section className="mf-detail" data-figma-node="84:3145" data-figma-mobile="457:13264" aria-label={`Detalle de receta: ${recipe.title}`}>
    <div className="mf-detail-top">
      <button type="button" className="mf-back" onClick={onBack}><FigmaAsset name="recipe-back" size={16} /> Volver al menú</button>
      {actions && <div className="mf-detail-actions">{actions}</div>}
    </div>
    <div className="mf-detail-grid">
      <aside className="mf-detail-left">
        <div className="mf-detail-image"><RecipeDishWell title={recipe.title} status={recipe.card.cover_status} url={recipe.card.cover_url} alt={recipe.card.cover_alt} /></div>
        <dl className="mf-detail-info">
          {info.map(([label, value, asset]) => <div key={label}>
            <dt><span><FigmaAsset name={asset} size={12} /></span>{label}</dt>
            <dd>{value}</dd>
          </div>)}
        </dl>
        <section className="fp-recipe-reviews" aria-label="Reseñas"><header><h3>Reseñas</h3><span className="fp-rating-empty"><span aria-hidden="true">{[0,1,2,3,4].map((index) => <FigmaAsset key={index} name="star" size={14} />)}</span>— / 5</span></header><div className="fp-review-empty"><p>No hay reseñas disponibles para esta receta.</p><span className="fp-review-avatar" aria-hidden="true" /></div></section>
      </aside>

      <article className="mf-detail-content">
        <h2>{recipe.title}</h2>
        <div className="mf-detail-about">
          <span className="mf-badge" data-slot={recipe.card.category}>{recipe.card.category}</span>
          <p>{recipe.nutrientSource ? `Fuente nutricional declarada: ${recipe.nutrientSource}.` : 'Sin fuente nutricional declarada.'}</p>
        </div>
        <section className="fp-recipe-tools" aria-label="Utensilios"><h3>Utensilios y equipo</h3><div><p className="mf-muted">Sin utensilios declarados.</p></div></section>
        <section className="mf-detail-steps" aria-label="Pasos">
          <h3>Pasos</h3>
          {recipe.steps.length ? <ol>{recipe.steps.map((text, index) => <li key={`${index}-${text}`}>
            <span className="mf-step-number">{index + 1}</span>
            <p>{text}</p>
          </li>)}</ol> : <p className="mf-muted">Sin pasos cargados.</p>}
        </section>
        <section className="fp-recipe-notes" aria-label="Notas de preparación"><h3>Notas</h3><p className="mf-muted">Sin notas de preparación declaradas.</p></section>
      </article>

      <aside className="mf-detail-right">
        <section className="mf-servings" aria-label="Porciones e ingredientes">
          <div className="mf-servings-head">
            <h3>Porciones</h3>
            <div className="mf-stepper">
              <button type="button" aria-label="Menos porciones" disabled={servings <= step} onClick={() => setServings((value) => Math.max(step, value - step))}><FigmaAsset name="recipe-minus" size={16} /></button>
              <output aria-live="polite" aria-label="Porciones">{servings}</output>
              <button type="button" aria-label="Más porciones" disabled={servings >= 50} onClick={() => setServings((value) => Math.min(50, value + step))}><FigmaAsset name="recipe-plus" size={16} /></button>
            </div>
          </div>
          <h3>Ingredientes</h3>
          {recipe.ingredients.length ? <ol className="mf-ingredients">{recipe.ingredients.map((item, index) => <li key={item.id}>
            <span>{index + 1}</span>{scaleQuantity(item.quantity, recipe.yieldPortions, servings)} {item.unit} {item.name}
          </li>)}</ol> : <p className="mf-muted">Sin ingredientes cargados.</p>}
        </section>
        <>
          <RecipeMacroTiles macros={macros} variant="row" />
          <section className="mf-facts" aria-label="Información nutricional">
            <h3>Información nutricional</h3>
            <dl>
              <div className="mf-facts-main"><dt>Calorías</dt><dd><small>Por porción</small>{macros?.kcal == null ? '—' : `${macros.kcal} kcal`}</dd></div>
              <div><dt>Carbohidratos</dt><dd>{macros?.carbs_g == null ? '—' : `${macros.carbs_g} g`}</dd></div>
              <div><dt>Proteínas</dt><dd>{macros?.protein_g == null ? '—' : `${macros.protein_g} g`}</dd></div>
              <div><dt>Grasas</dt><dd>{macros?.fat_g == null ? '—' : `${macros.fat_g} g`}</dd></div>
              <div><dt>Fibra</dt><dd>—</dd></div><div><dt>Sodio</dt><dd>—</dd></div>
              <div><dt>Colesterol</dt><dd>—</dd></div><div><dt>Azúcares</dt><dd>—</dd></div><div><dt>Vitamina C</dt><dd>—</dd></div>
            </dl>
          </section>
        </>
        {!macros && <p className="mf-facts-missing" role="status">{recipe.card.macro_status === 'failed' ? 'La IA no devolvió macros.' : 'Sin macros declarados.'}</p>}
      </aside>
    </div>
  </section>;
}
