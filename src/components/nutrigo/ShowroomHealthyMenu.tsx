/* Menú saludable (nodo 84:2716, mobile 445:10499) y Detalle de receta (84:3145, 457:13264).
 *
 * Un solo layout para los dos roles, como el archivo: acciones en la cabecera,
 * «Menú destacado», «Todo el menú» con filtros y lista, y la columna derecha.
 * - Paciente: los títulos del plan publicado son el menú; sus recetas asignadas
 *   van a la columna derecha y abren el detalle.
 * - Nutricionista: las recetas del catálogo son el menú (crear, IA, editar,
 *   publicar y asignar al día viven en la cabecera y en cada ítem); la columna
 *   derecha muestra el plan y las recetas del paciente seleccionado.
 * Sólo datos reales: sin calificaciones, dificultad ni health score.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Bread, CalendarBlank, Check, CookingPot, Drop, Fire, Fish, ForkKnife, GridFour, Knife,
  List as ListIcon, ListNumbers, PencilSimple, Plus, Repeat, ShoppingCart, Sparkle, Clock, Funnel, CaretDown,
} from '@phosphor-icons/react';
import type { PatientRecipe, ProfessionalRecipe, RecipeMacros } from '../../types/recipes';
import { PLAN_SLOTS } from '../../types/plans';
import { unavailableCard } from '../../types/recipe-plate';
import { MealThumbnail } from './PatientOverview';
import { mealSlotTone, NvState } from './primitives';
import { RecipeAiForm, RecipeAssignDialog, RecipeChoice, RecipeEditorForm, useAssignedRecipes, useRecipeCatalog, type RecipeCatalogState } from './RecipeCatalog';
import { RecipeDetails, RecipeDishWell, RecipeMacroTiles, type RecipeDetailData } from './RecipePlate';
import type { ShowroomPage } from './ShowroomPanels';
import type { ShowroomPatient } from './showroom-model';
import './menu-fig.css';

type HealthyMenuItem = {
  title: string;
  slots: string[];
  days: string[];
  occurrences: number;
  order: number;
};

const WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
/** Las cuatro solapas que dibuja el archivo; Colación/Extra se suman sólo si aparecen. */
const BASE_SLOTS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
const times = (count: number) => `${count} ${count === 1 ? 'vez' : 'veces'}`;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

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

export type MenuSort = 'frecuencia' | 'dia' | 'nombre';
const dayIndex = (day: string) => { const index = WEEK.indexOf(day); return index < 0 ? WEEK.length : index; };

/** Solapa de momento, filtro de día, búsqueda global y orden sobre los títulos del plan. */
export function filterHealthyMenu(items: HealthyMenuItem[], { slot = 'Todas', day = 'Todos', query = '', sort = 'frecuencia' }: {
  slot?: string; day?: string; query?: string; sort?: MenuSort;
}) {
  const term = normalize(query);
  const visible = items.filter((item) =>
    (slot === 'Todas' || item.slots.includes(slot))
    && (day === 'Todos' || item.days.includes(day))
    && (!term || normalize(`${item.title} ${item.slots.join(' ')} ${item.days.join(' ')}`).includes(term)));
  if (sort === 'nombre') return [...visible].sort((a, b) => a.title.localeCompare(b.title, 'es-AR'));
  if (sort === 'dia') return [...visible].sort((a, b) => Math.min(...a.days.map(dayIndex)) - Math.min(...b.days.map(dayIndex)) || a.order - b.order);
  return visible;
}

export type CatalogSort = 'recientes' | 'nombre' | 'calorias';
export type CatalogStatus = 'todas' | 'publicadas' | 'borradores';

/** Mismo criterio para el catálogo: momento (categoría de la ficha), estado, búsqueda y orden. */
export function filterCatalog(recipes: ProfessionalRecipe[], { slot = 'Todas', status = 'todas', query = '', sort = 'recientes' }: {
  slot?: string; status?: CatalogStatus; query?: string; sort?: CatalogSort;
}) {
  const term = normalize(query);
  const visible = recipes.filter((recipe) => {
    const category = recipe.current.card?.category ?? '';
    const published = Boolean(recipe.current.published_at);
    return (slot === 'Todas' || category === slot)
      && (status === 'todas' || (status === 'publicadas' ? published : !published))
      && (!term || normalize(`${recipe.title} ${category} ${recipe.current.ingredients.map((item) => item.name).join(' ')}`).includes(term));
  });
  if (sort === 'nombre') return [...visible].sort((a, b) => a.title.localeCompare(b.title, 'es-AR'));
  if (sort === 'calorias') {
    const kcal = (recipe: ProfessionalRecipe) => recipe.current.card?.macro_status === 'declared' ? recipe.current.card.macros?.kcal ?? null : null;
    return [...visible].sort((a, b) => {
      const ka = kcal(a); const kb = kcal(b);
      if (ka == null && kb == null) return 0;
      if (ka == null) return 1;
      if (kb == null) return -1;
      return ka - kb;
    });
  }
  return [...visible].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function menuSlots(present: string[]) {
  return PLAN_SLOTS.filter((slot) => BASE_SLOTS.includes(slot) || present.includes(slot));
}

function fromPatientRecipe(recipe: PatientRecipe): RecipeDetailData {
  return {
    id: recipe.id, title: recipe.title, version: recipe.version, yieldPortions: recipe.yield_portions,
    steps: recipe.steps, nutrientSource: recipe.nutrient_source, ingredients: recipe.ingredients,
    card: recipe.card ?? unavailableCard(recipe.title),
  };
}

function fromProfessionalRecipe(recipe: ProfessionalRecipe): RecipeDetailData {
  return {
    id: recipe.id, title: recipe.title, version: recipe.current.version, yieldPortions: recipe.current.yield_portions,
    steps: recipe.current.steps, nutrientSource: recipe.current.nutrient_source, ingredients: recipe.current.ingredients,
    card: recipe.current.card ?? unavailableCard(recipe.title),
    statusLabel: recipe.current.published_at ? 'Publicada' : 'Borrador',
  };
}

const declaredMacros = (card?: { macro_status: string; macros: RecipeMacros | null }) => card?.macro_status === 'declared' ? card.macros : null;

/* ── Piezas del archivo ─────────────────────────────────────────────────── */

/** Las acciones van en la cabecera del archivo (junto al buscador de la página). */
function HeaderActions({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<Element | null>(null);
  useLayoutEffect(() => { setHost(document.querySelector('.nv-app .nv-page-head')); }, []);
  const content = <div className={`mf-head-actions${host ? '' : ' mf-head-inline'}`}>{children}</div>;
  return host ? createPortal(content, host) : content;
}

function SectionHead({ title, children, level = 2 }: { title: string; children?: ReactNode; level?: 2 | 3 }) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return <header className="mf-section-head"><Heading>{title}</Heading>{children && <div>{children}</div>}</header>;
}

function SlotBadge({ slot, light = false }: { slot: string; light?: boolean }) {
  return <span className={`mf-badge${light ? ' mf-badge-light' : ''}`} data-tone={mealSlotTone(slot)}>{slot}</span>;
}

function DetailInfo({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="mf-info"><span className="mf-info-icon">{icon}</span><span><small>{label}</small><strong>{value}</strong></span></div>;
}

function NutritionChips({ macros }: { macros: RecipeMacros | null }) {
  if (!macros) return <div className="mf-chips mf-chips-empty">Sin macros declarados</div>;
  const rows = [
    [Fire, macros.kcal, ' kcal', ' kcal'], [Bread, macros.carbs_g, 'g hidratos', 'g H'],
    [Fish, macros.protein_g, 'g prot.', 'g P'], [Drop, macros.fat_g, 'g grasas', 'g G'],
  ] as const;
  return <div className="mf-chips">{rows.map(([Glyph, value, long, short]) => <span key={long}>
    <Glyph size={12} aria-hidden />{value == null ? '—' : <>{value}<span className="mf-long">{long}</span><span className="mf-short" aria-hidden>{short}</span></>}
  </span>)}</div>;
}

function WeekBars({ days }: { days: string[] }) {
  return <span className="mf-week" role="img" aria-label={`${days.length} de 7 días: ${days.join(', ')}`}>
    {WEEK.map((day) => <i key={day} data-on={days.includes(day) || undefined} />)}
  </span>;
}

function SortPicker<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (value: T) => void }) {
  return <label className="mf-picker">
    <span className="mf-sr">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
    <CaretDown size={14} aria-hidden />
  </label>;
}

function FilterPicker<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (value: T) => void }) {
  return <label className="mf-picker mf-filter">
    <Funnel size={14} aria-hidden />
    <span className="mf-sr">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
    <CaretDown size={14} aria-hidden />
  </label>;
}

type ListControls = {
  slots: string[]; slot: string; setSlot: (slot: string) => void;
  view: 'list' | 'grid'; setView: (view: 'list' | 'grid') => void;
  filter: ReactNode; sort: ReactNode; count: number;
};

function AllMenuHead({ slots, slot, setSlot, view, setView, filter, sort, count }: ListControls) {
  return <>
    <SectionHead title="Todo el menú">
      {filter}
      <div className="mf-segmented mf-view" role="group" aria-label="Vista">
        <button type="button" aria-pressed={view === 'grid'} aria-label="Ver en grilla" onClick={() => setView('grid')}><GridFour size={18} aria-hidden /></button>
        <button type="button" aria-pressed={view === 'list'} aria-label="Ver en lista" onClick={() => setView('list')}><ListIcon size={18} aria-hidden /></button>
      </div>
    </SectionHead>
    <div className="mf-controls">
      <div className="mf-segmented mf-tabs" role="group" aria-label="Filtrar por momento">
        {['Todas', ...slots].map((value) => <button type="button" key={value} aria-pressed={slot === value} onClick={() => setSlot(value)}>{value}</button>)}
      </div>
      <div className="mf-sort"><span>Ordenar por:</span>{sort}</div>
    </div>
    <p className="mf-sr" role="status">{count} {count === 1 ? 'resultado' : 'resultados'}</p>
  </>;
}

function MenuLayout({ main, aside, notices }: { main: ReactNode; aside: ReactNode; notices?: ReactNode }) {
  return <section className="mf-menu" aria-label="Menú saludable">
    <div className="mf-layout">
      <div className="mf-main">{notices}{main}</div>
      <aside className="mf-aside" aria-label="Más del menú">{aside}</aside>
    </div>
  </section>;
}

/** Card Popular Menu: los títulos más presentes del plan de la semana. */
function PopularWidget({ title, items, onPick }: { title: string; items: HealthyMenuItem[]; onPick?: (item: HealthyMenuItem) => void }) {
  return <section className="mf-widget" aria-label={title}>
    <SectionHead title={title} level={3} />
    {items.length ? <div className="mf-popular">{items.map((item) => {
      const body = <>
        <span className="mf-thumb mf-thumb-68"><MealThumbnail slot={item.slots[0]} /></span>
        <span className="mf-popular-info">
          <strong>{item.title}</strong>
          <span className="mf-popular-foot">
            <span className="mf-rate"><Repeat size={14} aria-hidden />{item.occurrences}<small>/sem</small></span>
            <SlotBadge slot={item.slots[0]} light />
          </span>
        </span>
      </>;
      return onPick
        ? <button type="button" key={item.title} className="mf-popular-card" aria-label={`${item.title}: ${times(item.occurrences)} esta semana. Destacar`} onClick={() => onPick(item)}>{body}</button>
        : <article key={item.title} className="mf-popular-card">{body}</article>;
    })}</div> : <p className="mf-empty-note">Sin plan publicado esta semana.</p>}
  </section>;
}

/** Card Recommended Menu: recetas publicadas y asignadas al paciente. */
function RecommendedWidget({ title, recipes, emptyText, savedIds, onToggleFavorite, onOpen }: {
  title: string; recipes: PatientRecipe[]; emptyText: string; savedIds?: string[];
  onToggleFavorite?: (id: string) => void; onOpen: (recipe: PatientRecipe) => void;
}) {
  return <section className="mf-widget" aria-label={title}>
    <SectionHead title={title} level={3} />
    {recipes.length ? <div className="mf-recommended">{recipes.map((recipe) => {
      const card = recipe.card ?? unavailableCard(recipe.title);
      const macros = declaredMacros(card);
      const saved = savedIds?.includes(recipe.id) ?? false;
      return <article key={`${recipe.id}:${recipe.version}`} className="mf-recommended-card">
        <div className="mf-recommended-main">
          <span className="mf-thumb mf-thumb-64"><RecipeDishWell title={recipe.title} status={card.cover_status} url={card.cover_url} alt={card.cover_alt} /></span>
          <div>
            <button type="button" className="mf-link-title" onClick={() => onOpen(recipe)}>{recipe.title}</button>
            <div className="mf-recommended-foot">
              <SlotBadge slot={card.category} light />
              {onToggleFavorite && <button type="button" className="mf-plus" aria-pressed={saved} aria-label={saved ? `Quitar ${recipe.title} de favoritos` : `Guardar ${recipe.title} en favoritos`} onClick={() => onToggleFavorite(recipe.id)}>{saved ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}</button>}
            </div>
          </div>
        </div>
        <hr />
        {macros ? <dl className="mf-nutrients">
          <div><dt><Fire size={12} aria-hidden />C</dt><dd>{macros.kcal ?? '—'} kcal</dd></div>
          <div><dt><Bread size={12} aria-hidden />H</dt><dd>{macros.carbs_g ?? '—'}g</dd></div>
          <div><dt><Fish size={12} aria-hidden />P</dt><dd>{macros.protein_g ?? '—'}g</dd></div>
          <div><dt><Drop size={12} aria-hidden />G</dt><dd>{macros.fat_g ?? '—'}g</dd></div>
        </dl> : <p className="mf-empty-note">{card.macro_status === 'failed' ? 'La IA no devolvió macros.' : 'Sin macros declarados.'}</p>}
      </article>;
    })}</div> : <p className="mf-empty-note">{emptyText}</p>}
  </section>;
}

/* ── Rol paciente ───────────────────────────────────────────────────────── */

function PatientHealthyMenu({ patient, query, onNavigate }: { patient: ShowroomPatient; query: string; onNavigate: (page: ShowroomPage) => void }) {
  const menu = useMemo(() => buildHealthyMenu(patient), [patient]);
  const assigned = useAssignedRecipes(patient.id);
  const [slot, setSlot] = useState('Todas');
  const [day, setDay] = useState('Todos');
  const [sort, setSort] = useState<MenuSort>('frecuencia');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [featuredKey, setFeaturedKey] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const items = filterHealthyMenu(menu.items, { slot, day, query, sort });
  const featured = items.find((item) => normalize(item.title) === featuredKey) ?? items[0];
  const recipeByTitle = new Map(assigned.recipes.map((recipe) => [normalize(recipe.title), recipe]));
  const opened = assigned.recipes.find((recipe) => recipe.id === openId);

  if (opened) {
    const saved = assigned.savedIds.includes(opened.id);
    return <RecipeDetails recipe={fromPatientRecipe(opened)} onBack={() => setOpenId(null)} actions={
      <button type="button" className="mf-btn mf-btn-soft" aria-pressed={saved} onClick={() => void assigned.toggleFavorite(opened.id)}>{saved ? 'Guardada' : 'Guardar en favoritos'}</button>
    } />;
  }

  const header = <HeaderActions>
    <button type="button" className="mf-btn mf-btn-cta" onClick={() => onNavigate('compras')}><ShoppingCart size={18} aria-hidden /> Lista de compras</button>
  </HeaderActions>;

  const aside = <>
    <PopularWidget title="Más presentes en tu semana" items={menu.items.slice(0, 3)} onPick={(item) => { setSlot('Todas'); setDay('Todos'); setFeaturedKey(normalize(item.title)); }} />
    <RecommendedWidget title="Recetas de tu nutricionista" recipes={assigned.recipes} emptyText="Todavía no hay recetas publicadas para vos." savedIds={assigned.savedIds} onToggleFavorite={(id) => void assigned.toggleFavorite(id)} onOpen={(recipe) => setOpenId(recipe.id)} />
    {assigned.error && <p className="recipe-error" role="alert">{assigned.error}</p>}
  </>;

  if (!menu.items.length) return <>{header}<MenuLayout main={<NvState title="Tu menú está en preparación" description="Cuando tu nutricionista publique el plan semanal, vas a encontrar acá sus títulos organizados." />} aside={aside} /></>;

  const featuredRecipe = featured ? recipeByTitle.get(normalize(featured.title)) : undefined;
  const featuredMacros = declaredMacros(featuredRecipe?.card);
  const dayOptions: Array<[string, string]> = [['Todos', 'Todos los días'], ...WEEK.filter((value) => menu.items.some((item) => item.days.includes(value))).map((value) => [value, value] as [string, string])];

  const main = <>
    {featured && <section className="mf-featured" aria-label="Menú destacado">
      <SectionHead title="Menú destacado" />
      <div className={`mf-featured-body${featuredMacros ? '' : ' mf-no-macros'}`}>
        <div className="mf-featured-main">
          <span className="mf-thumb mf-featured-image"><MealThumbnail slot={featured.slots[0]} /><small>Imagen ilustrativa</small></span>
          <div className="mf-featured-content">
            <h3>{featured.title}</h3>
            <div className="mf-featured-row">
              {featured.slots.map((value) => <SlotBadge key={value} slot={value} />)}
              <span className="mf-featured-meta"><Repeat size={14} aria-hidden />{times(featured.occurrences)} esta semana</span>
            </div>
            <div className="mf-details">
              <DetailInfo icon={<ForkKnife size={16} aria-hidden />} label="Momento" value={featured.slots.join(' · ')} />
              <DetailInfo icon={<Repeat size={16} aria-hidden />} label="Esta semana" value={times(featured.occurrences)} />
              <DetailInfo icon={<CalendarBlank size={16} aria-hidden />} label="Días" value={featured.days.join(', ')} />
              {featuredRecipe && <DetailInfo icon={<ListNumbers size={16} aria-hidden />} label="Pasos" value={`${featuredRecipe.steps.length}`} />}
            </div>
            {featuredRecipe
              ? <button type="button" className="mf-btn mf-btn-cta mf-btn-block" onClick={() => setOpenId(featuredRecipe.id)}>Ver receta</button>
              : <button type="button" className="mf-btn mf-btn-cta mf-btn-block" onClick={() => onNavigate('plan')}>Ver en plan semanal</button>}
          </div>
        </div>
        {featuredMacros && <RecipeMacroTiles macros={featuredMacros} variant="column" />}
      </div>
    </section>}

    <section className="mf-all" aria-label="Todo el menú">
      <AllMenuHead slots={menuSlots(menu.slots)} slot={slot} setSlot={setSlot} view={view} setView={setView} count={items.length}
        filter={<FilterPicker label="Filtrar por día" value={day} options={dayOptions} onChange={setDay} />}
        sort={<SortPicker label="Ordenar por" value={sort} options={[['frecuencia', 'Frecuencia'], ['dia', 'Día'], ['nombre', 'Nombre']]} onChange={setSort} />} />
      {items.length ? <div className="mf-list" data-view={view}>{items.map((item) => {
        const recipe = recipeByTitle.get(normalize(item.title));
        return <article key={normalize(item.title)} className="mf-card" data-featured={item === featured || undefined}>
          <span className="mf-thumb mf-card-image"><MealThumbnail slot={item.slots[0]} /></span>
          <div className="mf-card-head">
            <span className="mf-card-badges">{item.slots.map((value) => <SlotBadge key={value} slot={value} />)}{recipe && <span className="mf-level"><CookingPot size={12} aria-hidden />Receta</span>}</span>
            <span className="mf-score"><span>Esta semana:</span><strong>{item.days.length}</strong><small>/7</small><WeekBars days={item.days} /></span>
          </div>
          <h3><button type="button" onClick={() => setFeaturedKey(normalize(item.title))}>{item.title}</button></h3>
          <div className="mf-chips"><span><CalendarBlank size={12} aria-hidden />{item.days.join(' · ')}</span><span><Repeat size={12} aria-hidden />{times(item.occurrences)}</span></div>
          <div className="mf-card-action">
            {recipe
              ? <button type="button" className="mf-btn mf-btn-small" onClick={() => setOpenId(recipe.id)}>Ver receta</button>
              : <button type="button" className="mf-btn mf-btn-small" onClick={() => onNavigate('plan')}>Ver en plan</button>}
          </div>
        </article>;
      })}</div> : <NvState title="Sin coincidencias" description="Probá con otro título, día o momento de comida." />}
    </section>
  </>;

  return <>{header}<MenuLayout main={main} aside={aside} /></>;
}

/* ── Rol nutricionista ──────────────────────────────────────────────────── */

function RecipeActions({ catalog, recipe, small = false }: { catalog: RecipeCatalogState; recipe: ProfessionalRecipe; small?: boolean }) {
  const size = small ? ' mf-btn-small' : '';
  return <>
    {small
      ? <button type="button" className="mf-btn mf-btn-soft mf-btn-small" disabled={catalog.busy} aria-label={`Editar ${recipe.title}`} title="Editar" onClick={() => catalog.startEdit(recipe)}><PencilSimple size={14} aria-hidden /></button>
      : <button type="button" className="mf-btn mf-btn-soft" disabled={catalog.busy} onClick={() => catalog.startEdit(recipe)}><PencilSimple size={14} aria-hidden /> Editar</button>}
    {!recipe.current.published_at && <button type="button" className={`mf-btn${size}`} disabled={catalog.busy} onClick={() => catalog.publish(recipe)}>Publicar</button>}
    {recipe.published && <button type="button" className={`mf-btn${size}`} disabled={catalog.busy} onClick={() => catalog.startAssign(recipe)}>Agregar al plan</button>}
  </>;
}

function statusText(recipe: ProfessionalRecipe) {
  return recipe.current.published_at ? `Publicada · revisión ${recipe.current.version}` : `Borrador · revisión ${recipe.current.version}`;
}

function ProHealthyMenu({ patient, query }: { patient: ShowroomPatient; query: string }) {
  const catalog = useRecipeCatalog(patient.id);
  const assigned = useAssignedRecipes(patient.id, false);
  const plan = useMemo(() => buildHealthyMenu(patient), [patient]);
  const [slot, setSlot] = useState('Todas');
  const [status, setStatus] = useState<CatalogStatus>('todas');
  const [sort, setSort] = useState<CatalogSort>('recientes');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<{ kind: 'catalog' | 'assigned'; id: string } | null>(null);
  const editorOpen = catalog.path === 'choose' || catalog.path === 'ai' || Boolean(catalog.editing);

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editorOpen) dialogRef.current?.focus(); }, [editorOpen]);
  // Al guardar el borrador se cierra el diálogo; el aviso queda arriba de la lista.
  useEffect(() => { if (catalog.status === 'Borrador guardado en el catálogo.') catalog.closeEditor(); }, [catalog.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const recipes = catalog.recipes ?? [];
  const items = filterCatalog(recipes, { slot, status, query, sort });
  const featured = items.find((recipe) => recipe.id === featuredId) ?? items[0];
  const name = firstName(patient.name);

  const dialogs = <>
    {editorOpen && <div className="mf-dialog" role="dialog" aria-modal="true" aria-label="Nueva receta" onKeyDown={(event) => { if (event.key === 'Escape') catalog.closeEditor(); }}>
      <div className="mf-dialog-card" ref={dialogRef} tabIndex={-1}>
        <header><h2>{catalog.editing ? catalog.editing.title || 'Nueva receta' : 'Nueva receta'}</h2><button type="button" className="recipe-cancel" onClick={catalog.closeEditor}>Cerrar</button></header>
        {catalog.error && <p className="recipe-error" role="alert">{catalog.error}</p>}
        {catalog.path === 'choose' && !catalog.editing && <RecipeChoice catalog={catalog} />}
        {catalog.path === 'ai' && <RecipeAiForm catalog={catalog} />}
        <RecipeEditorForm catalog={catalog} />
      </div>
    </div>}
    <RecipeAssignDialog catalog={catalog} />
  </>;

  const openedCatalog = openId?.kind === 'catalog' ? recipes.find((recipe) => recipe.id === openId.id) : undefined;
  const openedAssigned = openId?.kind === 'assigned' ? assigned.recipes.find((recipe) => recipe.id === openId.id) : undefined;
  if (openedCatalog || openedAssigned) {
    return <>
      {openedCatalog
        ? <RecipeDetails recipe={fromProfessionalRecipe(openedCatalog)} onBack={() => setOpenId(null)} actions={<RecipeActions catalog={catalog} recipe={openedCatalog} />} />
        : <RecipeDetails recipe={fromPatientRecipe(openedAssigned!)} onBack={() => setOpenId(null)} />}
      {dialogs}
    </>;
  }

  const header = <HeaderActions>
    <button type="button" className="mf-btn mf-btn-icon" disabled={catalog.busy} aria-label="Generar borrador con IA" title="Generar borrador con IA" onClick={catalog.quickAiDraft}><Sparkle size={22} aria-hidden /></button>
    <button type="button" className="mf-btn mf-btn-cta" disabled={catalog.busy} onClick={catalog.startNew}>Nueva receta</button>
  </HeaderActions>;

  const notices = <>
    {catalog.source === 'memory' && <p className="mf-notice">Vista demo · el catálogo se conserva mientras la API siga encendida.</p>}
    {catalog.error && !editorOpen && <p className="recipe-error" role="alert">{catalog.error}</p>}
    {catalog.status && <p className="recipe-status" role="status">{catalog.status}</p>}
  </>;

  const aside = <>
    <PopularWidget title={`En el plan de ${name}`} items={plan.items.slice(0, 3)} />
    <RecommendedWidget title={`Recetas asignadas a ${name}`} recipes={assigned.recipes} emptyText={`${name} todavía no tiene recetas asignadas.`} onOpen={(recipe) => setOpenId({ kind: 'assigned', id: recipe.id })} />
  </>;

  const featuredCard = featured?.current.card ?? (featured ? unavailableCard(featured.title) : null);
  const featuredMacros = declaredMacros(featuredCard ?? undefined);
  const categories = recipes.map((recipe) => recipe.current.card?.category ?? '').filter(Boolean);

  const main = !catalog.recipes && !catalog.error ? <p role="status" className="mf-notice">Cargando catálogo…</p>
    : !recipes.length ? <NvState title="Todavía no hay recetas en el catálogo" description="Creá un borrador con ingredientes, rinde y pasos. El paciente no lo ve hasta publicarlo y asignarlo." />
    : <>
      {featured && featuredCard && <section className="mf-featured" aria-label="Receta destacada">
        <SectionHead title="Receta destacada">
          <button type="button" className="mf-picker-btn" onClick={() => setOpenId({ kind: 'catalog', id: featured.id })}>Ver receta</button>
          <button type="button" className="mf-picker-btn" disabled={catalog.busy} onClick={() => catalog.startEdit(featured)}>Editar</button>
          {featured.published && !featured.current.published_at && <button type="button" className="mf-picker-btn" disabled={catalog.busy} onClick={() => catalog.startAssign(featured)}>Agregar al plan</button>}
        </SectionHead>
        <div className={`mf-featured-body${featuredMacros ? '' : ' mf-no-macros'}`}>
          <div className="mf-featured-main">
            <span className="mf-thumb mf-featured-image"><RecipeDishWell title={featured.title} status={featuredCard.cover_status} url={featuredCard.cover_url} alt={featuredCard.cover_alt} /></span>
            <div className="mf-featured-content">
              <h3>{featured.title}</h3>
              <div className="mf-featured-row">
                <SlotBadge slot={featuredCard.category} />
                <span className="mf-featured-meta">{featured.current.published_at ? <Check size={14} aria-hidden /> : <PencilSimple size={14} aria-hidden />}{statusText(featured)}</span>
              </div>
              <div className="mf-details">
                <DetailInfo icon={<Knife size={16} aria-hidden />} label="Rinde" value={`${featured.current.yield_portions} ${featured.current.yield_portions === 1 ? 'porción' : 'porciones'}`} />
                <DetailInfo icon={<CookingPot size={16} aria-hidden />} label="Ingredientes" value={String(featured.current.ingredients.length)} />
                {featuredCard.prep_minutes ? <DetailInfo icon={<Clock size={16} aria-hidden />} label="Preparación" value={`${featuredCard.prep_minutes} min`} /> : null}
                <DetailInfo icon={<ListNumbers size={16} aria-hidden />} label="Total de pasos" value={`${featured.current.steps.length} ${featured.current.steps.length === 1 ? 'paso' : 'pasos'}`} />
              </div>
              {featured.current.published_at && featured.published
                ? <button type="button" className="mf-btn mf-btn-cta mf-btn-block" disabled={catalog.busy} onClick={() => catalog.startAssign(featured)}>Agregar al plan de {name}</button>
                : <button type="button" className="mf-btn mf-btn-cta mf-btn-block" disabled={catalog.busy} onClick={() => catalog.publish(featured)}>Publicar</button>}
            </div>
          </div>
          {featuredMacros && <RecipeMacroTiles macros={featuredMacros} variant="column" />}
        </div>
      </section>}

      <section className="mf-all" aria-label="Todo el menú">
        <AllMenuHead slots={menuSlots(categories)} slot={slot} setSlot={setSlot} view={view} setView={setView} count={items.length}
          filter={<FilterPicker label="Filtrar por estado" value={status} options={[['todas', 'Todas'], ['publicadas', 'Publicadas'], ['borradores', 'Borradores']]} onChange={setStatus} />}
          sort={<SortPicker label="Ordenar por" value={sort} options={[['recientes', 'Recientes'], ['nombre', 'Nombre'], ['calorias', 'Calorías']]} onChange={setSort} />} />
        {items.length ? <div className="mf-list" data-view={view}>{items.map((recipe) => {
          const card = recipe.current.card ?? unavailableCard(recipe.title);
          return <article key={recipe.id} className="mf-card" data-featured={recipe === featured || undefined}>
            <span className="mf-thumb mf-card-image"><RecipeDishWell title={recipe.title} status={card.cover_status} url={card.cover_url} alt={card.cover_alt} /></span>
            <div className="mf-card-head">
              <span className="mf-card-badges"><SlotBadge slot={card.category} /><span className="mf-level">{recipe.current.published_at ? <Check size={12} aria-hidden /> : <PencilSimple size={12} aria-hidden />}{recipe.current.published_at ? 'Publicada' : 'Borrador'}</span></span>
              <span className="mf-score"><span>Rinde:</span><strong>{recipe.current.yield_portions}</strong><small>{recipe.current.yield_portions === 1 ? '\u00a0porción' : '\u00a0porciones'}</small></span>
            </div>
            <h3><button type="button" onClick={() => setOpenId({ kind: 'catalog', id: recipe.id })}>{recipe.title}</button></h3>
            <NutritionChips macros={declaredMacros(card)} />
            <div className="mf-card-action"><RecipeActions catalog={catalog} recipe={recipe} small /></div>
          </article>;
        })}</div> : <NvState title="Sin coincidencias" description="Probá con otro nombre, momento o estado." />}
      </section>
    </>;

  return <>{header}<MenuLayout notices={notices} main={main} aside={aside} />{dialogs}</>;
}

export function ShowroomHealthyMenu({ patient, query, onNavigate, role = 'patient' }: {
  patient: ShowroomPatient;
  query: string;
  onNavigate: (page: ShowroomPage) => void;
  /** Nutricionista: el catálogo del consultorio es el menú, con el paciente seleccionado a la derecha. */
  role?: 'patient' | 'pro';
}) {
  return role === 'pro'
    ? <ProHealthyMenu patient={patient} query={query} />
    : <PatientHealthyMenu patient={patient} query={query} onNavigate={onNavigate} />;
}
