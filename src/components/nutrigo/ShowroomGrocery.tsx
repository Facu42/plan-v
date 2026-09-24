import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  CaretDown, CaretLeft, CaretRight, CaretUpDown, Check, CheckCircle, Clock, Cube, DotsThree, Funnel, MagnifyingGlass, Plus, SlidersHorizontal,
} from '@phosphor-icons/react';
import { buildShoppingExport, buildShoppingList, formatShoppingQty, shoppingCategoryFor, shoppingChecklistKey, type ShoppingCategory, type ShoppingGroup, type ShoppingMeal } from '../patient/shopping-list';
import type { ShowroomPatient } from './showroom-model';
import type { CareReplacement } from '../../types/care';
import { useCare } from './useCare';
import { NvState } from './primitives';
import { shoppingApi } from '../../api/shopping';
import { isAbortError } from '../../api/client';
import { careErrorMessage } from '../../api/care';
import { RECIPE_UNITS, type RecipeUnit } from '../../types/recipes';
import type { ShoppingKind, ShoppingLine, ShoppingListView } from '../../types/shopping';
import { parseAppPath } from './app-location';
import './plan-fig.css';

/* Grocery List del .fig (105:2472 escritorio, 492:11324 móvil). Sin precios, calorías ni gasto:
 * Plan V no los tiene. Las tarjetas y gráficos cuentan elementos reales de la lista. */

type GroceryFilter = 'all' | 'pending' | 'checked';
type GrocerySort = 'category' | 'name' | 'pending' | 'meals';
type GroceryKind = ShoppingKind | 'title';

export type GroceryRow = {
  id: string;
  name: string;
  label: string;
  category: ShoppingCategory;
  quantity: number | null;
  unit: string | null;
  occurrences: number;
  kind: GroceryKind;
  lineId?: string;
};

const CATEGORY_ORDER: ShoppingCategory[] = ['Verdulería', 'Proteínas', 'Lácteos', 'Panadería y cereales', 'Almacén', 'Otros'];
// Colores literales de las pastillas del archivo (Veggies, Protein, Dairy, Grains, Fruits, Others).
export const GROCERY_TONES: Record<ShoppingCategory, string> = {
  Verdulería: 'green',
  Proteínas: 'orange',
  Lácteos: 'peach-soft',
  'Panadería y cereales': 'saffron',
  Almacén: 'peach',
  Otros: 'gray',
};
const KIND_LABELS: Record<GroceryKind, string> = {
  derived: 'Receta del plan',
  text: 'Texto del plan',
  manual: 'Agregado',
  title: 'Título del plan',
};
const PAGE_SIZES = [10, 20, 50] as const;

function readChecked(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  } catch { return new Set(); }
}

function saveChecked(key: string, value: ReadonlySet<string>) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify([...value])); } catch { /* El checklist sigue activo durante esta visita. */ }
}

function isProfessionalSurface(): boolean {
  if (typeof window === 'undefined') return false;
  return parseAppPath(window.location.pathname)?.surface === 'crm';
}

const fold = (value: string) => value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[̀-ͯ]/g, '');

export function publishedRecipeMeals(replacements: readonly Pick<CareReplacement, 'published_at' | 'recipe'>[]): ShoppingMeal[] {
  return replacements
    .filter((entry) => entry.published_at)
    .map((entry) => ({ title: entry.recipe.title, detail: entry.recipe.ingredients.join(' ') }));
}

export function buildGroceryView(
  patient: Pick<ShowroomPatient, 'weekPlan'>,
  extras: readonly ShoppingMeal[] = [],
): { groups: ShoppingGroup[]; totalMeals: number; fallbackItems: number } {
  const meals = [...patient.weekPlan.flatMap((day) => day.meals.map(({ title }) => ({ title }))), ...extras];
  const groups = buildShoppingList(meals);
  return { groups, totalMeals: meals.length, fallbackItems: groups.find((group) => group.category === 'Otros')?.items.length ?? 0 };
}

export function groceryGroupsFromLines(items: readonly ShoppingLine[]): ShoppingGroup[] {
  const groups = new Map<ShoppingGroup['category'], ShoppingGroup>();
  for (const item of items) {
    const category = item.kind === 'manual' ? 'Otros' : shoppingCategoryFor(item.name);
    const qty = formatShoppingQty(item.quantity, item.unit);
    const current = groups.get(category) ?? { category, items: [] };
    current.items.push({
      id: item.source_key,
      label: qty ? `${item.name} · ${qty}` : item.name,
      category,
      occurrences: item.occurrences,
    });
    groups.set(category, current);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    items: group.items.sort((a, b) => a.label.localeCompare(b.label, 'es-AR')),
  }));
}

/** Filas de la tabla: nombre, categoría, cantidad y unidad por separado (sólo si el plan publicado las tiene). */
export function groceryRows(published: ShoppingListView | null, fallback: readonly ShoppingGroup[]): GroceryRow[] {
  if (published) {
    return published.items.map((item) => {
      const qty = formatShoppingQty(item.quantity, item.unit);
      return {
        id: item.source_key,
        name: item.name,
        label: qty ? `${item.name} · ${qty}` : item.name,
        category: item.kind === 'manual' ? 'Otros' : shoppingCategoryFor(item.name),
        quantity: item.quantity,
        unit: item.unit,
        occurrences: item.occurrences,
        kind: item.kind,
        lineId: item.id,
      };
    });
  }
  return fallback.flatMap((group) => group.items.map((item) => ({
    id: item.id, name: item.label, label: item.label, category: group.category, quantity: null, unit: null, occurrences: item.occurrences, kind: 'title' as const,
  })));
}

export function sortGroceryRows(rows: readonly GroceryRow[], sort: GrocerySort, checked: ReadonlySet<string>): GroceryRow[] {
  const byName = (a: GroceryRow, b: GroceryRow) => a.name.localeCompare(b.name, 'es-AR');
  const byCategory = (a: GroceryRow, b: GroceryRow) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  return [...rows].sort((a, b) => {
    if (sort === 'name') return byName(a, b);
    if (sort === 'pending') return Number(checked.has(a.id)) - Number(checked.has(b.id)) || byCategory(a, b) || byName(a, b);
    if (sort === 'meals') return b.occurrences - a.occurrences || byName(a, b);
    return byCategory(a, b) || byName(a, b);
  });
}

export function categoryBreakdown(rows: readonly GroceryRow[], checked: ReadonlySet<string>) {
  return CATEGORY_ORDER.map((category) => {
    const items = rows.filter((row) => row.category === category);
    return { category, total: items.length, done: items.filter((row) => checked.has(row.id)).length };
  }).filter((entry) => entry.total > 0);
}

function percent(part: number, total: number): number {
  return total ? Math.round(part / total * 100) : 0;
}

function StatusDonut({ done, total }: { done: number; total: number }) {
  const radius = 64;
  const length = 2 * Math.PI * radius;
  const share = total ? done / total : 0;
  const gap = share > 0 && share < 1 ? 6 : 0;
  const doneLength = Math.max(0, share * length - gap);
  const pendingLength = Math.max(0, (1 - share) * length - gap);
  return <div className="gf-donut" role="img" aria-label={`${done} de ${total} elementos comprados`}>
    <svg viewBox="0 0 149 149" aria-hidden="true">
      <circle cx="74.5" cy="74.5" r={radius} fill="none" stroke="var(--pf-image)" strokeWidth="18" />
      {pendingLength > 0 && <circle cx="74.5" cy="74.5" r={radius} fill="none" stroke="var(--pf-lunch)" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${pendingLength} ${length}`} strokeDashoffset={-(doneLength + gap)} transform="rotate(-90 74.5 74.5)" />}
      {doneLength > 0 && <circle cx="74.5" cy="74.5" r={radius} fill="none" stroke="var(--pf-breakfast)" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${doneLength} ${length}`} transform="rotate(-90 74.5 74.5)" />}
    </svg>
    <div className="gf-donut-info"><strong><span>{done}</span><small>/{total}</small></strong><span>Comprados</span></div>
  </div>;
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) close.current(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return root;
}

export function ShowroomGrocery({ patient, list, readOnly = isProfessionalSurface() }: { patient: ShowroomPatient; list?: ShoppingListView; readOnly?: boolean }) {
  const care = useCare(patient.id);
  const extras = useMemo(() => publishedRecipeMeals(care.data?.replacements ?? []), [care.data]);
  const storageKey = shoppingChecklistKey(patient.id, 'current');
  const fallback = useMemo(() => buildGroceryView(patient, extras), [patient, extras]);
  const [remote, setRemote] = useState<ShoppingListView | null>(list ?? null);
  const [apiReady, setApiReady] = useState(Boolean(list));
  const [localChecked, setLocalChecked] = useState<Set<string>>(() => readChecked(storageKey));
  const [filter, setFilter] = useState<GroceryFilter>('all');
  const [tab, setTab] = useState<ShoppingCategory | 'all'>('all');
  const [sort, setSort] = useState<GrocerySort>('category');
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<RecipeUnit>('g');
  const filterRoot = useOutsideClose(filterOpen, () => setFilterOpen(false));
  const moreRoot = useOutsideClose(moreOpen, () => setMoreOpen(false));

  useEffect(() => { setLocalChecked(readChecked(storageKey)); setFilter('all'); setTab('all'); setQuery(''); setFeedback(''); setPage(0); setAdding(false); }, [storageKey]);
  useEffect(() => setPage(0), [filter, tab, query, sort, pageSize]);

  useEffect(() => {
    if (list) { setRemote(list); setApiReady(true); return; }
    const controller = new AbortController();
    shoppingApi.get(patient.id, controller.signal).then((result) => {
      setRemote(result.list);
      setApiReady(true);
    }).catch((error) => {
      if (isAbortError(error)) return;
      setRemote(null);
      setApiReady(false);
    });
    return () => controller.abort();
  }, [patient.id, list]);

  const usePublished = Boolean(remote && (remote.items.length > 0 || remote.plan_version != null));
  const groups = usePublished ? groceryGroupsFromLines(remote!.items) : fallback.groups;
  const rows = useMemo(() => groceryRows(usePublished ? remote : null, fallback.groups), [usePublished, remote, fallback.groups]);
  const checked = usePublished
    ? new Set(remote!.items.filter((item) => item.checked).map((item) => item.source_key))
    : localChecked;
  const checkedCount = rows.filter((row) => checked.has(row.id)).length;
  const totalMeals = usePublished ? (remote!.plan_version ? remote!.items.reduce((sum, item) => sum + (item.kind === 'manual' ? 0 : item.occurrences), 0) : 0) : fallback.totalMeals;
  const breakdown = categoryBreakdown(rows, checked);
  const categoryCounts = CATEGORY_ORDER.map((category) => ({ category, total: rows.filter((row) => row.category === category).length })).filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total);

  const run = async (action: () => Promise<{ list: ShoppingListView }>, message: string) => {
    if (busy) return false;
    setBusy(true);
    try {
      const result = await action();
      setRemote(result.list);
      setApiReady(true);
      setFeedback(message);
      return true;
    } catch (error) {
      setFeedback(careErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggle = (itemId: string) => {
    if (readOnly) return;
    if (usePublished) {
      const next = !checked.has(itemId);
      void run(() => shoppingApi.check(patient.id, { source_key: itemId, checked: next }), next ? 'Marcado en tu cuenta.' : 'Desmarcado en tu cuenta.');
      return;
    }
    setLocalChecked((previous) => {
      const next = new Set(previous);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      saveChecked(storageKey, next);
      return next;
    });
  };

  const addManual = (event: FormEvent) => {
    event.preventDefault();
    const qty = Number(quantity);
    if (!name.trim() || !Number.isFinite(qty) || qty <= 0) {
      setFeedback('Revisá el nombre, la cantidad y la unidad.');
      return;
    }
    void run(() => shoppingApi.add(patient.id, {
      name: name.trim(),
      quantity: qty,
      unit,
      client_id: crypto.randomUUID(),
    }), 'Agregado a la lista.').then((ok) => { if (ok) { setName(''); setQuantity('1'); setAdding(false); } });
  };

  const exportList = () => {
    setMoreOpen(false);
    const text = buildShoppingExport({ label: 'Plan semanal vigente', range: usePublished ? 'Derivada del plan publicado, con cantidades y unidades' : 'Derivada de las comidas actualmente publicadas', groups, checkedIds: checked });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'lista-de-compras-plan-v.txt'; anchor.click(); URL.revokeObjectURL(url);
    setFeedback('Lista descargada.');
  };

  const clearChecked = () => {
    setMoreOpen(false);
    if (usePublished) {
      void run(async () => {
        let next = remote!;
        for (const item of remote!.items.filter((entry) => entry.checked)) {
          next = (await shoppingApi.check(patient.id, { source_key: item.source_key, checked: false })).list;
        }
        return { list: next };
      }, 'Checklist reiniciado.');
      return;
    }
    const next = new Set<string>();
    setLocalChecked(next);
    saveChecked(storageKey, next);
    setFeedback('Checklist reiniciado.');
  };

  const visible = sortGroceryRows(rows.filter((row) => {
    const matchesQuery = fold(row.label).includes(fold(query.trim()));
    const matchesState = filter === 'all' || (filter === 'checked' ? checked.has(row.id) : !checked.has(row.id));
    return matchesQuery && matchesState && (tab === 'all' || row.category === tab);
  }), sort, checked);
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pages - 1);
  const pageRows = visible.slice(current * pageSize, current * pageSize + pageSize);
  const firstPage = Math.max(0, Math.min(current - 1, pages - 4));
  const pageButtons = Array.from({ length: Math.min(4, pages) }, (_, index) => firstPage + index);
  const tabs = CATEGORY_ORDER.filter((category) => rows.some((row) => row.category === category));
  const source = usePublished
    ? `Del plan publicado. ${readOnly ? 'El paciente marca lo comprado; los checks se sincronizan en su cuenta.' : 'El check se sincroniza en tu cuenta.'}`
    : `Derivada de ${readOnly ? 'su' : 'tu'} plan semanal${extras.length ? ' y de las alternativas compartidas' : ''}. No incluye cantidades ni porciones.${readOnly ? '' : ' El check se guarda en este navegador.'}`;

  if (!rows.length) return <section className="gf" aria-label="Lista de compras">
    <NvState title="Sin lista para generar" description="Cuando tu nutricionista publique comidas para la semana, vas a encontrar acá una lista derivada de esos títulos." />
  </section>;

  const stats = [
    { key: 'done', label: 'Comprados', value: checkedCount, badge: `${percent(checkedCount, rows.length)}%`, tone: 'green', icon: <CheckCircle size={20} /> },
    { key: 'total', label: 'Elementos', value: rows.length, badge: totalMeals ? `${totalMeals} comidas` : '', tone: 'saffron', icon: <Cube size={20} /> },
    { key: 'pending', label: 'Pendientes', value: rows.length - checkedCount, badge: `${percent(rows.length - checkedCount, rows.length)}%`, tone: 'orange', icon: <Clock size={20} /> },
  ];

  return <section className={`gf${readOnly ? ' gf-readonly' : ''}`} aria-label="Lista de compras">
    <div className="gf-data">
      <div className="gf-left">
        <div className="gf-stats" aria-label="Resumen de la lista">
          {stats.map((stat) => <article className="gf-stat" key={stat.key}>
            <span className="gf-stat-icon" data-tone={stat.tone}>{stat.icon}</span>
            <div className="gf-stat-info"><small>{stat.label}</small><strong>{stat.value}</strong></div>
            {stat.badge && <span className="gf-stat-badge" data-tone={stat.key === 'pending' ? 'orange' : undefined}>{stat.badge}</span>}
          </article>)}
        </div>
        <section className="gf-widget gf-status" aria-label="Estado de compras">
          <header className="gf-widget-head"><h3>Estado de compras</h3></header>
          <div className="gf-status-body">
            <StatusDonut done={checkedCount} total={rows.length} />
            <ul className="gf-legend">{breakdown.map((entry) => <li key={entry.category}>
              <i className="gf-swatch-dot" data-tone={GROCERY_TONES[entry.category]} />
              <span className="gf-legend-name">{entry.category}</span>
              <span className="gf-legend-numbers"><span>{entry.done} de {entry.total}</span><i aria-hidden="true" /><strong>{percent(entry.done, entry.total)}%</strong></span>
            </li>)}</ul>
          </div>
        </section>
      </div>
      <section className="gf-widget gf-category" aria-label="Categorías de la lista">
        <header className="gf-widget-head"><h3>Categorías</h3>
          <div className="gf-more" ref={moreRoot}>
            <button type="button" className="gf-more-button" aria-label="Más acciones de la lista" aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}><DotsThree size={24} /></button>
            {moreOpen && <div className="pf-popover gf-menu" role="menu">
              <button type="button" role="menuitem" onClick={exportList}>Exportar .txt</button>
              {!readOnly && checkedCount > 0 && <button type="button" role="menuitem" onClick={clearChecked}>Desmarcar todo</button>}
            </div>}
          </div>
        </header>
        <div className="gf-category-body">
          <div className="gf-category-head">
            <div className="gf-total"><small>Total</small><strong>{rows.length}<span>elementos</span></strong></div>
            <div className="gf-bars" aria-hidden="true">{categoryCounts.map((entry) => <i key={entry.category} data-tone={GROCERY_TONES[entry.category]} style={{ flexGrow: entry.total }} />)}</div>
          </div>
          <ul className="gf-category-list">{categoryCounts.map((entry) => <li key={entry.category}>
            <i className="gf-swatch" data-tone={GROCERY_TONES[entry.category]} />
            <span className="gf-legend-name">{entry.category}</span>
            <span className="gf-legend-numbers"><span>{entry.total} {entry.total === 1 ? 'elemento' : 'elementos'}</span><i aria-hidden="true" /><strong>{percent(entry.total, rows.length)}%</strong></span>
          </li>)}</ul>
        </div>
      </section>
    </div>

    <section className="gf-list" aria-label="Elementos de la lista">
      <header className="gf-list-head">
        <div className="gf-list-title"><h2>Lista de compras{readOnly ? ` de ${patient.name}` : ''}</h2><p>{source}</p></div>
        <div className="gf-list-actions">
          <label className="pf-search gf-search"><MagnifyingGlass size={14} aria-hidden="true" /><input type="search" aria-label="Buscar en la lista" placeholder="Buscar elemento" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="pf-popover-root" ref={filterRoot}>
            <button type="button" className="pf-picker gf-filter" aria-label="Filtrar lista" aria-expanded={filterOpen} onClick={() => setFilterOpen(!filterOpen)}>
              <span className="pf-picker-icon gf-filter-desktop"><Funnel size={14} /></span><span className="pf-picker-icon gf-filter-mobile"><SlidersHorizontal size={18} /></span>
              <span className="pf-picker-text">{filter === 'all' ? 'Filtrar' : filter === 'pending' ? 'Pendientes' : 'Comprados'}</span><span className="pf-picker-caret"><CaretDown size={14} /></span>
            </button>
            {filterOpen && <div className="pf-popover" role="group" aria-label="Estado">
              {([{ id: 'all', label: 'Todos' }, { id: 'pending', label: 'Pendientes' }, { id: 'checked', label: 'Comprados' }] as const).map((option) => <label key={option.id}><input type="radio" name="gf-filter" checked={filter === option.id} onChange={() => { setFilter(option.id); setFilterOpen(false); }} />{option.label}</label>)}
            </div>}
          </div>
          {!readOnly && apiReady && <button type="button" className="gf-cta" aria-expanded={adding} onClick={() => setAdding(!adding)}><Plus size={14} aria-hidden="true" /><span>Agregar</span></button>}
        </div>
      </header>
      {adding && !readOnly && <form className="gf-add" onSubmit={addManual} aria-label="Agregar a la lista">
        <input aria-label="Nombre del agregado" placeholder="Elemento" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        <input aria-label="Cantidad" type="number" min={0.1} step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        <select aria-label="Unidad" value={unit} onChange={(event) => setUnit(event.target.value as RecipeUnit)}>
          {RECIPE_UNITS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <button type="submit" className="gf-cta" disabled={busy}>Guardar</button>
        <button type="button" className="pf-link" onClick={() => setAdding(false)}>Cancelar</button>
      </form>}
      {feedback && <p role="status" className="gf-feedback">{feedback}</p>}

      <div className="gf-table-section">
        <div className="gf-top">
          <div className="gf-tabs" role="tablist" aria-label="Categorías">
            {(['all', ...tabs] as const).map((id) => <button type="button" role="tab" key={id} aria-selected={tab === id} className="gf-tab" onClick={() => setTab(id)}><span>{id === 'all' ? 'Todas las categorías' : id}</span></button>)}
          </div>
          <label className="gf-sort"><span>Ordenar por:</span>
            <span className="gf-sort-picker"><select aria-label="Ordenar lista" value={sort} onChange={(event) => setSort(event.target.value as GrocerySort)}>
              <option value="category">Categoría</option><option value="name">Nombre</option><option value="pending">Pendientes primero</option><option value="meals">Más usados</option>
            </select><CaretDown size={14} aria-hidden="true" /></span>
          </label>
        </div>
        <div className="gf-table-card" data-first-tab={tab === 'all' || undefined}>
          <div className="gf-table" role="table" aria-label="Lista de compras">
            <div className="gf-row gf-row-head" role="row">
              {([['name', 'Elemento'], ['category', 'Categoría'], [null, 'Cantidad'], ['meals', 'Comidas'], [null, 'Origen'], ['pending', 'Estado']] as const).map(([key, label]) => <div role="columnheader" key={label} className="gf-head-cell">
                {key ? <button type="button" onClick={() => setSort(key)} aria-pressed={sort === key}>{label}<CaretUpDown size={14} aria-hidden="true" /></button> : <span>{label}<CaretUpDown size={14} aria-hidden="true" /></span>}
              </div>)}
            </div>
            {pageRows.map((row) => {
              const done = checked.has(row.id);
              return <div className="gf-row" role="row" key={row.id}>
                <div role="cell" className="gf-name"><span className="gf-thumb" aria-hidden="true"><i /></span><span>{row.name}</span></div>
                <div role="cell"><span className="gf-pill" data-tone={GROCERY_TONES[row.category]}>{row.category}</span></div>
                <div role="cell" className="gf-qty"><span className="gf-qty-box">{row.quantity ?? '—'}</span><span className="gf-unit">{row.unit ?? ''}</span></div>
                <div role="cell" className="gf-meals">{row.kind === 'manual' ? <span className="gf-muted">—</span> : <><span>{row.occurrences}</span><span className="gf-muted">{row.occurrences === 1 ? 'comida' : 'comidas'}</span></>}</div>
                <div role="cell" className="gf-origin"><span>{KIND_LABELS[row.kind]}</span>{!readOnly && row.kind === 'manual' && row.lineId && <button type="button" className="pf-link-danger" disabled={busy} onClick={() => void run(() => shoppingApi.remove(patient.id, row.lineId!), 'Agregado quitado.')}>Quitar</button>}</div>
                <div role="cell">
                  <button type="button" className="gf-status-badge" data-done={done || undefined} aria-pressed={done} aria-label={`${row.label}: ${done ? 'comprado' : 'pendiente'}`} disabled={readOnly || busy} onClick={() => toggle(row.id)}>
                    <span className="gf-check">{done && <Check size={11} weight="bold" />}</span><span>{done ? 'Comprado' : 'Pendiente'}</span>
                  </button>
                </div>
              </div>;
            })}
            {!pageRows.length && <div className="gf-empty"><NvState title="Sin coincidencias" description="Probá otro filtro, categoría o búsqueda." /></div>}
          </div>
        </div>
      </div>

      <footer className="gf-footer">
        <div className="gf-result"><span>Mostrando</span>
          <span className="gf-size"><select aria-label="Elementos por página" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select><CaretDown size={14} aria-hidden="true" /></span>
          <span>de {visible.length}</span>
        </div>
        <nav className="gf-pagination" aria-label="Páginas de la lista">
          <button type="button" className="gf-page-arrow" aria-label="Página anterior" disabled={current === 0} onClick={() => setPage(current - 1)}><CaretLeft size={18} /></button>
          {pageButtons.map((index) => <button type="button" className="gf-page" key={index} aria-current={index === current ? 'page' : undefined} onClick={() => setPage(index)}>{index + 1}</button>)}
          <button type="button" className="gf-page-arrow" aria-label="Página siguiente" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}><CaretRight size={18} /></button>
        </nav>
      </footer>
    </section>
  </section>;
}
