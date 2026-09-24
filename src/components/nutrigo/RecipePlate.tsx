import { useState, type ReactNode } from 'react';
import { ArrowLeft, Bread, ChartBar, Clock, CookingPot, Drop, Fire, Fish, Heartbeat, Knife, ListNumbers, Minus, Plus } from '@phosphor-icons/react';
import type { RecipeCard, RecipeItem, RecipeMacros } from '../../types/recipes';
import './recipe-plate.css';
import './menu-fig.css';

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
    <svg viewBox="0 0 320 200" role="img" aria-label={failed ? `Foto no generada de ${title}` : `Ilustración de revisión de ${title}`}>
      <rect width="320" height="200" fill="#f3efe6" />
      <ellipse cx="160" cy="118" rx="108" ry="36" fill="#e7e1d6" />
      <ellipse cx="160" cy="112" rx="78" ry="28" fill="#f7f4ee" stroke="#d9d1c3" />
      <circle cx="132" cy="104" r="16" fill="#d98a4a" />
      <circle cx="168" cy="98" r="18" fill="#6f9a62" />
      <circle cx="186" cy="116" r="12" fill="#c4a15a" />
    </svg>
    <figcaption>{failed ? 'La foto del plato no se generó' : 'Ilustración de revisión · sin foto generada'}</figcaption>
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
}: {
  title: string;
  portions: number;
  card: RecipeCard;
  actions?: ReactNode;
  ingredients?: Array<{ id: string; name: string; quantity: number; unit: string }>;
}) {
  const meta = card.prep_minutes ? `${portions} porciones · ${card.prep_minutes} min` : `${portions} porciones`;
  return <article className="recipe-plate">
    <RecipeDishWell title={title} status={card.cover_status} url={card.cover_url} alt={card.cover_alt} />
    <div className="recipe-plate-body">
      <span className="recipe-plate-badge">{card.category}</span>
      <h3>{title}</h3>
      <p className="recipe-plate-meta">{meta}</p>
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

/** Las cuatro fichas del archivo (Green, Saffron, Orange, Gray-Line). Vacías → no se dibujan. */
export function RecipeMacroTiles({ macros, variant }: { macros: RecipeMacros; variant: 'column' | 'row' }) {
  return <dl className={`mf-macros mf-macros-${variant}`}>
    {MACRO_TILES.map(([key, label, unit, Glyph]) => <div key={key} data-macro={key}>
      <span className="mf-macro-icon"><Glyph size={16} aria-hidden /></span>
      <dt>{label}</dt>
      <dd>{macros[key] == null ? '—' : <><strong>{macros[key]}</strong> <small>{unit}</small></>}</dd>
    </div>)}
  </dl>;
}

export function RecipeDetails({ recipe, onBack, actions }: {
  recipe: RecipeDetailData;
  onBack: () => void;
  actions?: ReactNode;
}) {
  const [servings, setServings] = useState(recipe.yieldPortions);
  const macros = recipe.card.macro_status === 'declared' ? recipe.card.macros : null;
  const info: Array<[string, string, typeof Clock]> = [
    ...(recipe.card.prep_minutes ? [['Preparación', `${recipe.card.prep_minutes} min`, Clock] as [string, string, typeof Clock]] : []),
    ['Rinde', `${recipe.yieldPortions} ${recipe.yieldPortions === 1 ? 'porción' : 'porciones'}`, Knife],
    ['Ingredientes', String(recipe.ingredients.length), CookingPot],
    ['Total de pasos', `${recipe.steps.length} ${recipe.steps.length === 1 ? 'paso' : 'pasos'}`, ListNumbers],
    ['Revisión', String(recipe.version), ChartBar],
    ...(recipe.statusLabel ? [['Estado', recipe.statusLabel, Heartbeat] as [string, string, typeof Clock]] : []),
  ];
  const step = recipe.yieldPortions % 1 ? 0.5 : 1;
  return <section className="mf-detail" aria-label={`Detalle de receta: ${recipe.title}`}>
    <div className="mf-detail-top">
      <button type="button" className="mf-back" onClick={onBack}><ArrowLeft size={16} aria-hidden /> Volver al menú</button>
      {actions && <div className="mf-detail-actions">{actions}</div>}
    </div>
    <div className="mf-detail-grid">
      <aside className="mf-detail-left">
        <div className="mf-detail-image"><RecipeDishWell title={recipe.title} status={recipe.card.cover_status} url={recipe.card.cover_url} alt={recipe.card.cover_alt} /></div>
        <dl className="mf-detail-info">
          {info.map(([label, value, Glyph]) => <div key={label}>
            <dt><span><Glyph size={12} aria-hidden /></span>{label}</dt>
            <dd>{value}</dd>
          </div>)}
        </dl>
      </aside>

      <article className="mf-detail-content">
        <h2>{recipe.title}</h2>
        <div className="mf-detail-about">
          <span className="mf-badge" data-slot={recipe.card.category}>{recipe.card.category}</span>
          <p>{recipe.nutrientSource ? `Fuente nutricional declarada: ${recipe.nutrientSource}.` : 'Sin fuente nutricional declarada.'}</p>
        </div>
        <section className="mf-detail-steps" aria-label="Pasos">
          <h3>Pasos</h3>
          {recipe.steps.length ? <ol>{recipe.steps.map((text, index) => <li key={`${index}-${text}`}>
            <span className="mf-step-number">{index + 1}</span>
            <p>{text}</p>
          </li>)}</ol> : <p className="mf-muted">Sin pasos cargados.</p>}
        </section>
      </article>

      <aside className="mf-detail-right">
        <section className="mf-servings" aria-label="Porciones e ingredientes">
          <div className="mf-servings-head">
            <h3>Porciones</h3>
            <div className="mf-stepper">
              <button type="button" aria-label="Menos porciones" disabled={servings <= step} onClick={() => setServings((value) => Math.max(step, value - step))}><Minus size={16} aria-hidden /></button>
              <output aria-live="polite" aria-label="Porciones">{servings}</output>
              <button type="button" aria-label="Más porciones" disabled={servings >= 50} onClick={() => setServings((value) => Math.min(50, value + step))}><Plus size={16} aria-hidden /></button>
            </div>
          </div>
          <h3>Ingredientes</h3>
          {recipe.ingredients.length ? <ol className="mf-ingredients">{recipe.ingredients.map((item, index) => <li key={item.id}>
            <span>{index + 1}</span>{scaleQuantity(item.quantity, recipe.yieldPortions, servings)} {item.unit} {item.name}
          </li>)}</ol> : <p className="mf-muted">Sin ingredientes cargados.</p>}
        </section>
        {macros ? <>
          <RecipeMacroTiles macros={macros} variant="row" />
          <section className="mf-facts" aria-label="Información nutricional">
            <h3>Información nutricional</h3>
            <dl>
              <div className="mf-facts-main"><dt>Calorías</dt><dd><small>Por porción</small>{macros.kcal == null ? '—' : `${macros.kcal} kcal`}</dd></div>
              <div><dt>Carbohidratos</dt><dd>{macros.carbs_g == null ? '—' : `${macros.carbs_g} g`}</dd></div>
              <div><dt>Proteínas</dt><dd>{macros.protein_g == null ? '—' : `${macros.protein_g} g`}</dd></div>
              <div><dt>Grasas</dt><dd>{macros.fat_g == null ? '—' : `${macros.fat_g} g`}</dd></div>
            </dl>
          </section>
        </> : <p className="mf-facts-missing" role="status">{recipe.card.macro_status === 'failed' ? 'La IA no devolvió macros.' : 'Sin macros declarados.'}</p>}
      </aside>
    </div>
  </section>;
}
