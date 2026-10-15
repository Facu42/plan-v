import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { recipesApi } from '../../api/recipes';
import { careErrorMessage } from '../../api/care';
import type { RecipeView } from '../../types/recipes';
import { buildHealthyMenu } from '../nutrigo/ShowroomHealthyMenu';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { usePublishedPlan, weekPlanForPatient } from '../nutrigo/usePublishedPlan';
import { FigmaRecipeDetailLayout } from './FigmaRecipeDetailLayout';

const demoRecipe: RecipeView = {
  id: '741f932d-cb5b-4515-a1e3-75e429935118',
  title: 'Pechuga de pavo grillada con espárragos al vapor y arroz integral',
  ingredients: ['200 g de pechuga de pavo', '1 taza de espárragos al vapor', '1/2 taza de arroz integral cocido', '1 cucharada de aceite de oliva', 'Sal y pimienta a gusto', 'Limón para decorar'],
  steps: ['Condimentá la pechuga con aceite de oliva, sal y pimienta. Reservá.', 'Cociná el arroz integral en agua hasta que quede tierno.', 'Cociná la pechuga en una sartén grill hasta que esté completamente cocida.', 'Cociná los espárragos al vapor durante unos minutos.', 'Serví el pavo con el arroz y los espárragos. Decorá con limón.'],
  explanation: 'Una comida equilibrada para el almuerzo. Combina proteínas magras, fibra y grasas saludables. La pechuga de pavo aporta proteínas y el arroz integral y los espárragos completan el plato.',
  servings: 2,
  nutrient_source: 'Ejemplo visual del diseño de Figma',
  created_at: '2026-09-27T12:00:00.000Z', updated_at: '2026-09-27T12:00:00.000Z', published_at: '2026-09-27T12:00:00.000Z',
};

export type FigmaMenuEntry = {
  key: string;
  title: string;
  slots: string[];
  days: string[];
  occurrences: number;
  recipe: RecipeView | null;
};

type MenuContextValue = {
  entries: FigmaMenuEntry[];
  visible: FigmaMenuEntry[];
  featured: FigmaMenuEntry | null;
  selected: FigmaMenuEntry | null;
  search: string;
  setSearch: (value: string) => void;
  slot: string;
  setSlot: (value: string) => void;
  slots: string[];
  sort: 'plan' | 'nombre';
  setSort: (value: 'plan' | 'nombre') => void;
  view: 'list' | 'grid';
  setView: (value: 'list' | 'grid') => void;
  loading: boolean;
  error: string;
  retry: () => void;
  open: (key: string) => void;
  back: () => void;
  navigate: (page: ShowroomPage) => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);
const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');

export function FigmaHealthyMenuProvider({ patient, selectedKey, onSelect, onNavigate, demoMode = false, children }: {
  patient: ShowroomPatient;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onNavigate: (page: ShowroomPage) => void;
  demoMode?: boolean;
  children: ReactNode;
}) {
  const plan = usePublishedPlan(patient.id);
  const [recipeState, setRecipeState] = useState<{ patientId: string; loaded: boolean; recipes: RecipeView[]; error: string }>({ patientId: patient.id, loaded: false, recipes: [], error: '' });
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [slot, setSlot] = useState('Todos');
  const [sort, setSort] = useState<'plan' | 'nombre'>('plan');
  const [view, setView] = useState<'list' | 'grid'>('list');
  useEffect(() => {
    const controller = new AbortController();
    setRecipeState({ patientId: patient.id, loaded: false, recipes: [], error: '' });
    recipesApi.published(patient.id, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setRecipeState({ patientId: patient.id, loaded: true, recipes: result.recipes, error: '' }); })
      .catch((error) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        setRecipeState({ patientId: patient.id, loaded: true, recipes: [], error: careErrorMessage(error) });
      });
    return () => controller.abort();
  }, [patient.id, attempt]);
  const currentRecipes = recipeState.patientId === patient.id ? recipeState : { patientId: patient.id, loaded: false, recipes: [], error: '' };
  const planMenu = useMemo(() => buildHealthyMenu({ weekPlan: weekPlanForPatient(patient, plan.published) }), [patient, plan.published]);
  const entries = useMemo(() => {
    const recipesByTitle = new Map(currentRecipes.recipes.map((recipe) => [normalize(recipe.title), recipe]));
    const usedRecipes = new Set<string>();
    const planned = planMenu.items.map((item) => {
      const recipe = recipesByTitle.get(normalize(item.title)) ?? null;
      if (recipe) usedRecipes.add(recipe.id);
      return { key: `plan:${normalize(item.title)}`, title: item.title, slots: item.slots, days: item.days, occurrences: item.occurrences, recipe };
    });
    const sample = demoMode && currentRecipes.loaded && currentRecipes.recipes.length === 0 ? [{ key: 'demo:figma-recipe', title: demoRecipe.title, slots: ['Almuerzo'], days: [], occurrences: 0, recipe: demoRecipe }] : [];
    return [...sample, ...planned, ...currentRecipes.recipes.filter((recipe) => !usedRecipes.has(recipe.id)).map((recipe) => ({
      key: recipe.id, title: recipe.title, slots: [], days: [], occurrences: 0, recipe,
    }))];
  }, [planMenu.items, currentRecipes.recipes, currentRecipes.loaded, demoMode]);
  const slots = useMemo(() => ['Todos', ...planMenu.slots], [planMenu.slots]);
  const visible = useMemo(() => {
    const term = normalize(search);
    const filtered = entries.filter((entry) => (slot === 'Todos' || entry.slots.includes(slot))
      && (!term || normalize(`${entry.title} ${entry.slots.join(' ')} ${entry.days.join(' ')} ${entry.recipe?.ingredients.join(' ') ?? ''}`).includes(term)));
    return sort === 'nombre' ? [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'es-AR')) : filtered;
  }, [entries, search, slot, sort]);
  const selected = entries.find((entry) => entry.key === selectedKey) ?? null;
  return <MenuContext.Provider value={{
    entries, visible, featured: entries[0] ?? null, selected, search, setSearch, slot, setSlot, slots, sort, setSort, view, setView,
    loading: !plan.loaded || !currentRecipes.loaded,
    error: [plan.error, currentRecipes.error].filter(Boolean).join(' · '),
    retry: () => { plan.retry(); setAttempt((value) => value + 1); },
    open: (key) => onSelect(key), back: () => onSelect(null), navigate: onNavigate,
  }}>{children}</MenuContext.Provider>;
}

export function useFigmaHealthyMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error('FigmaHealthyMenuProvider is required');
  return context;
}

function MenuImage({ className = '' }: { className?: string }) {
  return <div className={`figma-menu-image ${className}`} aria-label="Imagen de la receta pendiente de publicación" />;
}

function MenuStatus({ compact = false }: { compact?: boolean }) {
  const menu = useFigmaHealthyMenu();
  if (menu.error) return <div className="figma-menu-status" role="alert"><strong>No se pudo cargar el menú</strong><span>{menu.error}</span><button type="button" onClick={menu.retry}>Reintentar</button></div>;
  if (menu.loading) return <div className="figma-menu-status" role="status">Cargando menú publicado…</div>;
  return <div className="figma-menu-status"><strong>{compact ? 'Sin preparaciones' : 'Tu menú está en preparación'}</strong><span>{menu.entries.length ? 'No hay coincidencias para este filtro.' : 'Tu nutricionista todavía no publicó un plan o recetas.'}</span></div>;
}

export function FigmaMenuHeaderSearch({ searchIcon, filterIcon, nodeIds }: { searchIcon: string; filterIcon: string; nodeIds?: { search: string; filter: string; plan: string } }) {
  const menu = useFigmaHealthyMenu();
  return <>
    <label className="figma-menu-header-search" data-node-id={nodeIds?.search}><img src={searchIcon} alt="" /><input type="search" value={menu.search} onChange={(event) => menu.setSearch(event.target.value)} placeholder="Buscar menú" aria-label="Buscar menú" /></label>
    <button className="figma-menu-header-filter" data-node-id={nodeIds?.filter} type="button" onClick={() => document.querySelector<HTMLElement>('#figma-pack-root [data-name="Widget All Menu"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} aria-label="Ir a filtros"><img src={filterIcon} alt="" /></button>
    <button className="figma-menu-header-plan" data-node-id={nodeIds?.plan} type="button" onClick={() => menu.navigate('plan')}>Ver plan</button>
  </>;
}

export function FigmaMenuMobileSearch() {
  const menu = useFigmaHealthyMenu();
  return <label className="figma-menu-mobile-search"><img src="/figma/screens/HealthyMenu/f08ac.svg" alt="" /><input type="search" value={menu.search} onChange={(event) => menu.setSearch(event.target.value)} placeholder="Buscar menú" aria-label="Buscar menú" /></label>;
}

export function FigmaMenuFeatured({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  const menu = useFigmaHealthyMenu();
  const entry = menu.featured;
  if (!entry) return <MenuStatus />;
  return <article className={`figma-menu-featured figma-menu-featured-${variant}`}>
    <div className="figma-menu-featured-main">
      {variant === 'mobile' && <h2>Menú destacado</h2>}
      <MenuImage className="figma-menu-featured-image" />
      <div className="figma-menu-featured-copy">
        <h3>{entry.title}</h3>
        <div className="figma-menu-badges">{entry.slots.map((value) => <span key={value}>{value}</span>)}{entry.key === 'demo:figma-recipe' && <span>Ejemplo demo</span>}{!entry.slots.length && <span>Receta publicada</span>}</div>
        <p>{entry.days.length ? `${entry.occurrences} ${entry.occurrences === 1 ? 'vez' : 'veces'} en el plan · ${entry.days.join(', ')}` : 'Receta publicada por tu nutricionista'}</p>
        <div className="figma-menu-featured-meta"><span>Ingredientes <strong>{entry.recipe?.ingredients.length ?? '—'}</strong></span><span>Pasos <strong>{entry.recipe?.steps.length ?? '—'}</strong></span></div>
        <button type="button" onClick={() => menu.open(entry.key)}>{entry.recipe ? 'Ver receta' : 'Ver preparación'}</button>
      </div>
    </div>
    <div className="figma-menu-featured-facts" aria-label="Información nutricional"><span>Calorías <strong>—</strong></span><span>Carbohidratos <strong>—</strong></span><span>Proteínas <strong>—</strong></span><span>Grasas <strong>—</strong></span><small>Sin valores publicados</small></div>
  </article>;
}

export function FigmaMenuFilters() {
  const menu = useFigmaHealthyMenu();
  return <div className="figma-menu-filters" aria-label="Filtrar por momento de comida">{menu.slots.map((value) => <button key={value} type="button" aria-pressed={menu.slot === value} onClick={() => menu.setSlot(value)}>{value}</button>)}</div>;
}

export function FigmaMenuFilterTrigger({ icon }: { icon: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return <><button type="button" className="figma-menu-filter-trigger" aria-label="Buscar menú y filtrar" aria-expanded={searchOpen} onClick={() => {
    if (document.querySelector('#figma-pack-root.figma-Mobile')) setSearchOpen((value) => !value);
    else document.querySelector<HTMLButtonElement>('#figma-pack-root .figma-menu-filters button')?.focus();
  }}><img src={icon} alt="" /><span>Filtrar</span>⌄</button>{searchOpen && <div className="figma-menu-filter-popover"><FigmaMenuMobileSearch /></div>}</>;
}

export function FigmaMenuViewToggle({ gridIcon, listIcon }: { gridIcon: string; listIcon: string }) {
  const menu = useFigmaHealthyMenu();
  return <div className="figma-menu-view-toggle" aria-label="Vista del menú"><button type="button" aria-label="Ver cuadrícula" aria-pressed={menu.view === 'grid'} onClick={() => menu.setView('grid')}><img src={gridIcon} alt="" /></button><button type="button" aria-label="Ver lista" aria-pressed={menu.view === 'list'} onClick={() => menu.setView('list')}><img src={listIcon} alt="" /></button></div>;
}

export function FigmaMenuSort() {
  const menu = useFigmaHealthyMenu();
  return <label className="figma-menu-sort">Ordenar: <select value={menu.sort} onChange={(event) => menu.setSort(event.target.value as 'plan' | 'nombre')}><option value="plan">Plan</option><option value="nombre">Nombre</option></select></label>;
}

export function FigmaMenuList({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  const menu = useFigmaHealthyMenu();
  if (!menu.visible.length) return <MenuStatus />;
  return <div className={`figma-menu-list-results figma-menu-list-results-${variant === 'mobile' ? 'list' : menu.view}`}>{menu.visible.map((entry) => variant === 'mobile' ? <article className="figma-menu-list-card figma-menu-list-card-mobile" key={entry.key}>
    <div className="figma-menu-mobile-card-top"><MenuImage /><div className="figma-menu-mobile-card-main"><h3>{entry.title}</h3><button type="button" onClick={() => menu.open(entry.key)}>Ver {entry.recipe ? 'receta' : 'preparación'}</button></div></div>
    <div className="figma-menu-mobile-card-content"><div className="figma-menu-badges">{entry.slots.map((value) => <span key={value}>{value}</span>)}{!entry.slots.length && <span>Receta publicada</span>}</div><div className="figma-menu-list-facts" aria-label="Valores nutricionales no publicados"><span>Calorías <strong>—</strong></span><span>Carbos <strong>—</strong></span><span>Proteínas <strong>—</strong></span><span>Grasas <strong>—</strong></span></div></div>
  </article> : <article className={`figma-menu-list-card figma-menu-list-card-${variant}`} key={entry.key}>
    <MenuImage />
    <div className="figma-menu-list-copy"><h3>{entry.title}</h3><p>{entry.days.length ? `En el plan: ${entry.days.join(', ')}` : 'Receta publicada'}</p><div className="figma-menu-badges">{entry.slots.map((value) => <span key={value}>{value}</span>)}</div><small>{entry.recipe ? `${entry.recipe.servings} ${entry.recipe.servings === 1 ? 'porción' : 'porciones'} · ${entry.recipe.ingredients.length} ingredientes` : 'Ingredientes y pasos pendientes de publicación'}</small></div>
    <div className="figma-menu-list-facts" aria-label="Valores nutricionales no publicados"><span>Calorías <strong>—</strong></span><span>Carbos <strong>—</strong></span><span>Proteínas <strong>—</strong></span><span>Grasas <strong>—</strong></span></div>
    <button type="button" onClick={() => menu.open(entry.key)}>Ver {entry.recipe ? 'receta' : 'preparación'}</button>
  </article>)}</div>;
}

export function FigmaMenuAside({ kind, variant }: { kind: 'popular' | 'recommended'; variant: 'desktop' | 'tablet' | 'mobile' }) {
  const menu = useFigmaHealthyMenu();
  const start = kind === 'popular' ? 1 : variant === 'desktop' ? 4 : 5;
  const entries = menu.entries.slice(start, start + (variant === 'desktop' ? 3 : 4));
  if (!entries.length) return <MenuStatus compact />;
  return <>{entries.map((entry) => <button key={entry.key} type="button" className={`figma-menu-aside-card figma-menu-aside-card-${kind}`} onClick={() => menu.open(entry.key)}><MenuImage /><span><strong>{entry.title}</strong><small>{entry.slots.join(' · ') || 'Receta publicada'}</small></span><b aria-hidden="true">+</b></button>)}</>;
}

export function FigmaRecipeDetail({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  const menu = useFigmaHealthyMenu();
  const entry = menu.selected;
  if (!entry) return <div className="figma-recipe-missing"><p>Esta preparación ya no está disponible.</p><button type="button" onClick={menu.back}>Volver al menú</button></div>;
  return <FigmaRecipeDetailLayout variant={variant} entry={entry} demo={entry.key === 'demo:figma-recipe'} />;
}
