import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvState } from './primitives';
import type { ShowroomPage } from './ShowroomPanels';
import type { ShowroomPatient } from './showroom-model';
import { recipesApi } from '../../api/recipes';
import { careErrorMessage } from '../../api/care';
import type { RecipeView } from '../../types/recipes';
import { usePublishedPlan, weekPlanForPatient } from './usePublishedPlan';
import './showroom-healthy-menu.css';

type HealthyMenuItem = {
  title: string;
  slots: string[];
  days: string[];
  occurrences: number;
  order: number;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
const MenuPlaceholder = () => <span className="np-food-photo nvm-placeholder" aria-hidden="true" />;

export function buildHealthyMenu(patient: Pick<ShowroomPatient, 'weekPlan'>) {
  const indexed = new Map<string, HealthyMenuItem>();
  const slots: string[] = [];
  let totalAssignments = 0;
  let order = 0;

  patient.weekPlan.forEach((day) => day.meals.forEach((meal) => {
    const title = meal.title.trim().replace(/\s+/g, ' ');
    if (!title) return;
    totalAssignments += 1;
    if (!slots.includes(meal.slot)) slots.push(meal.slot);
    const key = normalize(title);
    const current = indexed.get(key);
    if (current) {
      current.occurrences += 1;
      if (!current.days.includes(day.day)) current.days.push(day.day);
      if (!current.slots.includes(meal.slot)) current.slots.push(meal.slot);
      return;
    }
    indexed.set(key, { title, slots: [meal.slot], days: [day.day], occurrences: 1, order: order++ });
  }));

  const items = [...indexed.values()].sort((a, b) => b.occurrences - a.occurrences || a.order - b.order);
  return { items, slots, totalAssignments };
}

export function ShowroomHealthyMenu({ patient, query, onNavigate }: {
  patient: ShowroomPatient;
  query: string;
  onNavigate: (page: ShowroomPage) => void;
}) {
  const { published } = usePublishedPlan(patient.id);
  const menu = useMemo(() => buildHealthyMenu({ weekPlan: weekPlanForPatient(patient, published) }), [patient, published]);
  const [slot, setSlot] = useState('Todas');
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedMenuTitle, setSelectedMenuTitle] = useState<string | null>(null);
  const [recipeError, setRecipeError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    recipesApi.published(patient.id, controller.signal)
      .then(result => { setRecipes(result.recipes); setRecipeError(''); })
      .catch(err => { if (err instanceof DOMException && err.name === 'AbortError') return; setRecipeError(careErrorMessage(err)); });
    return () => controller.abort();
  }, [patient.id]);
  const term = normalize(query);
  const items = menu.items.filter((item) =>
    (slot === 'Todas' || item.slots.includes(slot))
    && (!term || normalize(`${item.title} ${item.slots.join(' ')} ${item.days.join(' ')}`).includes(term)));
  const featured = items[0];
  const visibleRecipes = recipes.filter((recipe) => !term || normalize(`${recipe.title} ${recipe.ingredients.join(' ')} ${recipe.explanation}`).includes(term));
  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId);
  const selectedMenuItem = menu.items.find((item) => normalize(item.title) === selectedMenuTitle);

  if (!menu.items.length && !recipes.length) return <section className="nvm-menu" aria-label="Menú saludable">
    <NvState title="Tu menú está en preparación" description="Cuando tu nutricionista publique el plan semanal o una receta, vas a encontrarla acá." />
  </section>;

  if (selectedRecipe || selectedMenuItem) {
    const title = selectedRecipe?.title ?? selectedMenuItem!.title;
    const ingredients = selectedRecipe?.ingredients ?? [];
    const steps = selectedRecipe?.steps ?? [];
    return <section className="nvm-menu nvm-detail" aria-label={`Detalle de ${title}`}>
    <button type="button" className="nvm-back" onClick={() => { setSelectedRecipeId(null); setSelectedMenuTitle(null); }}><Icon name="arrow" size={15} /> Volver al menú saludable</button>
    <header className="nvm-detail-heading"><div><span>DETALLE DE PREPARACIÓN</span><h2>{title}</h2><p>{selectedRecipe?.explanation ?? 'Preparación incluida en el plan publicado por tu nutricionista.'}</p></div>{selectedRecipe && <NvBadge>{selectedRecipe.servings} {selectedRecipe.servings === 1 ? 'porción' : 'porciones'}</NvBadge>}</header>
    <div className="nvm-recipe-detail">
      <aside className="nvm-recipe-summary"><MenuPlaceholder /><p>Imagen pendiente de publicación</p><dl><div><dt>Porciones</dt><dd>{selectedRecipe?.servings ?? '—'}</dd></div><div><dt>Ingredientes</dt><dd>{ingredients.length || '—'}</dd></div><div><dt>Pasos</dt><dd>{steps.length || '—'}</dd></div></dl><small>{selectedRecipe ? `Información publicada por tu nutricionista: ${selectedRecipe.nutrient_source}` : 'Detalle de la preparación pendiente de publicación.'}</small></aside>
      <section className="nvm-recipe-steps"><header><span>PREPARACIÓN</span><h3>Instrucciones</h3></header>{steps.length ? <ol>{steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p className="nvm-detail-empty">Tu nutricionista todavía no publicó los pasos de esta preparación.</p>}</section>
      <aside className="nvm-recipe-ingredients"><header><span>PARA ESTA PREPARACIÓN</span><h3>Ingredientes</h3></header>{ingredients.length ? <ul>{ingredients.map((ingredient, index) => <li key={`${index}-${ingredient}`}><span>{index + 1}</span>{ingredient}</li>)}</ul> : <p className="nvm-detail-empty">Ingredientes y cantidades no publicados.</p>}<section><h3>Información nutricional</h3><p>No hay valores nutricionales publicados para esta preparación.</p></section></aside>
    </div>
  </section>;
  }

  return <section className="nvm-menu" aria-label="Menú saludable">
    <div className="nvm-layout">
      <div className="nvm-main">
        <header className="nvm-hero"><h2>Menú destacado</h2><span aria-hidden="true">···</span></header>

        {featured ? <>
          <article className="nvm-featured">
            <div className="nvm-featured-main">
              <div className="nvm-featured-image"><MenuPlaceholder /></div>
              <div className="nvm-featured-copy">
                <h3>{featured.title}</h3>
                <div className="nvm-slot-list">{featured.slots.map((value) => <NvBadge key={value} tone={value === 'Cena' ? 'gold' : 'green'}>{value}</NvBadge>)}</div>
                <p>{featured.occurrences} {featured.occurrences === 1 ? 'vez' : 'veces'} esta semana · {featured.days.join(', ')}</p>
                <p>Preparación incluida en el plan publicado por tu nutricionista.</p>
                <NvButton onClick={() => setSelectedMenuTitle(normalize(featured.title))}>Ver preparación <Icon name="arrow" size={15} /></NvButton>
              </div>
            </div>
            <div className="nvm-featured-nutrients" aria-label="Valores nutricionales"><div><span>Calorías</span><strong>—</strong><small>Sin dato publicado</small></div><div><span>Carbohidratos</span><strong>—</strong><small>Sin dato publicado</small></div><div><span>Proteínas</span><strong>—</strong><small>Sin dato publicado</small></div><div><span>Grasas</span><strong>—</strong><small>Sin dato publicado</small></div></div>
          </article>

          <section className="nvm-all" aria-label="Preparaciones disponibles">
            <header><div><h3>Todas las preparaciones</h3></div><small>{items.length} {items.length === 1 ? 'resultado' : 'resultados'}</small></header>
            <div className="nvm-filters" aria-label="Filtrar por momento">
              {['Todas', ...menu.slots].map((value) => <button type="button" key={value} aria-pressed={slot === value} onClick={() => setSlot(value)}>{value}</button>)}
            </div>
            <div className="nvm-list">{items.map((item) => <article key={normalize(item.title)}>
              <MenuPlaceholder />
              <div><strong>{item.title}</strong><small>{item.days.join(' · ')}</small><span>{item.occurrences} {item.occurrences === 1 ? 'vez' : 'veces'} esta semana</span><button type="button" className="nvm-open-item" onClick={() => setSelectedMenuTitle(normalize(item.title))}>Ver preparación</button></div>
              <div className="nvm-card-slots">{item.slots.map((value) => <NvBadge key={value} tone={value === 'Cena' ? 'gold' : 'green'}>{value}</NvBadge>)}</div>
            </article>)}</div>
          </section>
        </> : menu.items.length ? <NvState title="Sin coincidencias" description="Probá con otro título, día o momento de comida." /> : null}

        {recipeError && <p className="nvm-note" role="alert">{recipeError}</p>}
        {visibleRecipes.length > 0 && <section className="nvm-all" aria-label="Recetas publicadas">
          <header><div><span>CATÁLOGO</span><h3>Recetas publicadas</h3></div><small>{visibleRecipes.length} {visibleRecipes.length === 1 ? 'receta' : 'recetas'}</small></header>
          <div className="nvm-list">{visibleRecipes.map((recipe) => <article key={recipe.id}>
            <MenuPlaceholder />
            <div>
              <strong>{recipe.title}</strong>
              <small>{recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'} · {recipe.nutrient_source}</small>
              <span>{recipe.explanation}</span>
              <button type="button" className="nv-button" onClick={() => setSelectedRecipeId(recipe.id)}>Ver receta completa</button>
            </div>
          </article>)}</div>
        </section>}
      </div>

      <aside className="nvm-aside" aria-label="Otras preparaciones">
        {items.length > 1 && <section><h3>Más del menú</h3><div className="nvm-side-list">{items.slice(1, 4).map((item) => <button key={normalize(item.title)} type="button" onClick={() => setSelectedMenuTitle(normalize(item.title))}><MenuPlaceholder /><span><strong>{item.title}</strong><small>{item.slots.join(' · ')}</small></span><b aria-hidden="true">+</b></button>)}</div></section>}
        {items.length > 4 && <section><h3>Para explorar</h3><div className="nvm-side-list">{items.slice(4, 7).map((item) => <button key={normalize(item.title)} type="button" onClick={() => setSelectedMenuTitle(normalize(item.title))}><MenuPlaceholder /><span><strong>{item.title}</strong><small>{item.slots.join(' · ')}</small></span><b aria-hidden="true">+</b></button>)}</div></section>}
        <NvButton className="nvm-shopping" onClick={() => onNavigate('compras')}><Icon name="check" size={16} /> Abrir lista de compras</NvButton>
      </aside>
    </div>
    <p className="nvm-note"><Icon name="list" size={16} /> Los títulos del plan no son recetas. Las recetas publicadas muestran ingredientes, pasos, porciones y fuente.</p>
  </section>;
}
