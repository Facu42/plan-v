import type { ReactNode } from 'react';
import type { RecipeCard, RecipeMacros } from '../../types/recipes';
import './recipe-plate.css';

const LABELS = [
  ['kcal', 'KCAL', 'kcal'],
  ['protein_g', 'PROT', 'prot'],
  ['carbs_g', 'CARBS', 'carbs'],
  ['fat_g', 'GRASAS', 'fat'],
] as const;

export function RecipeDishWell({ title, status }: { title: string; status: RecipeCard['cover_status'] }) {
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
    <figcaption>{failed ? 'La foto del plato no se generó' : status === 'ready' ? title : 'Ilustración de revisión · sin foto generada'}</figcaption>
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
    <RecipeDishWell title={title} status={card.cover_status} />
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
