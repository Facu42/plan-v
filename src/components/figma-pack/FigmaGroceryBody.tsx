import { useEffect, useMemo, useState } from 'react';
import { buildShoppingExport, buildShoppingList, shoppingChecklistKey, type ShoppingCategory, type ShoppingItem } from '../patient/shopping-list';
import { useCare } from '../nutrigo/useCare';
import { usePublishedPlan, weekPlanForPatient } from '../nutrigo/usePublishedPlan';
import { useFigmaPatient } from './FigmaPatientIdentity';

type Filter = 'all' | 'pending' | 'checked';
const categories: ShoppingCategory[] = ['Verdulería', 'Proteínas', 'Lácteos', 'Panadería y cereales', 'Almacén', 'Otros'];
const normalized = (text: string) => text.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function readSaved<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}
function readChecked(key: string): string[] {
  const value = readSaved<unknown>(key, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
function readQuantities(key: string): Record<string, number> {
  const value = readSaved<unknown>(key, {});
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] =>
    Number.isInteger(entry[1]) && Number(entry[1]) >= 0 && Number(entry[1]) <= 999));
}
function readCustom(key: string): ShoppingItem[] {
  const value = readSaved<unknown>(key, []);
  return Array.isArray(value) ? value.filter((item): item is ShoppingItem =>
    Boolean(item) && typeof item === 'object' && typeof item.id === 'string' && typeof item.label === 'string'
    && item.category === 'Otros' && item.label.length <= 80) : [];
}
function save(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Mantener el estado de esta visita. */ }
}

export function FigmaGroceryBody({ variant = 'desktop' }: { variant?: 'desktop' | 'tablet' | 'mobile' }) {
  const patient = useFigmaPatient();
  const { published, loaded, error } = usePublishedPlan(patient.id);
  const care = useCare(patient.id);
  const key = shoppingChecklistKey(patient.id, 'current');
  const [checked, setChecked] = useState<string[]>(() => readChecked(key));
  const [quantities, setQuantities] = useState<Record<string, number>>(() => readQuantities(`${key}:qty`));
  const [custom, setCustom] = useState<ShoppingItem[]>(() => readCustom(`${key}:extra`));
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState<ShoppingCategory | 'Todas'>('Todas');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setChecked(readChecked(key));
    setQuantities(readQuantities(`${key}:qty`));
    setCustom(readCustom(`${key}:extra`));
    setPage(1);
  }, [key]);

  const plan = useMemo(() => weekPlanForPatient(patient, published), [patient, published]);
  const groups = useMemo(() => {
    const meals = plan.flatMap((day) => day.meals.map((meal) => ({ title: meal.title })));
    const replacements = care.data?.replacements ?? [];
    const extras = replacements.filter((entry) => entry.published_at).map((entry) => ({
      title: entry.recipe.title,
      detail: entry.recipe.ingredients.join(' '),
    }));
    const generated = buildShoppingList([...meals, ...extras]);
    for (const item of custom) {
      const group = generated.find((entry) => entry.category === item.category);
      if (group) group.items.push(item);
      else generated.push({ category: item.category, items: [item] });
    }
    return generated.sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category));
  }, [plan, care.data, custom]);
  const items = groups.flatMap((group) => group.items);
  const checkedSet = new Set(checked);
  const checkedCount = items.filter((item) => checkedSet.has(item.id)).length;
  const shown = items.filter((item) =>
    (category === 'Todas' || item.category === category)
    && (filter === 'all' || (filter === 'checked' ? checkedSet.has(item.id) : !checkedSet.has(item.id)))
    && normalized(item.label).includes(normalized(query)));
  const pageCount = Math.max(1, Math.ceil(shown.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visible = shown.slice((currentPage - 1) * 10, currentPage * 10);
  const maxCategory = Math.max(1, ...groups.map((group) => group.items.length));

  const toggle = (id: string) => setChecked((previous) => {
    const next = previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id];
    save(key, next);
    return next;
  });
  const quantity = (id: string, delta: number) => setQuantities((previous) => {
    const next = { ...previous, [id]: Math.max(0, Math.min(999, (previous[id] ?? 0) + delta)) };
    save(`${key}:qty`, next);
    return next;
  });
  const addCustom = () => {
    const label = newItem.trim();
    if (!label) return;
    const item: ShoppingItem = { id: `extra-${crypto.randomUUID()}`, label, category: 'Otros', occurrences: 1 };
    setCustom((previous) => { const next = [...previous, item]; save(`${key}:extra`, next); return next; });
    setNewItem(''); setAdding(false); setCategory('Todas'); setFilter('all'); setPage(1);
  };
  const exportList = () => {
    const text = buildShoppingExport({ label: 'Plan semanal vigente', range: 'Comidas publicadas', groups, checkedIds: checkedSet });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'lista-de-compras-plan-v.txt'; anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('Lista descargada.');
  };

  const ids = {
    desktop: { body: '105:2476', data: '127:4366', metrics: '116:3039', expense: '127:3687', breakdown: '119:3057', categories: '124:3417', list: '127:3985' },
    tablet: { header: '473:10407', data: '489:11905', metrics: '485:10732', expense: '485:11110', breakdown: '485:10864', categories: '485:11418', list: '489:11906', footer: '473:10435' },
    mobile: { data: '492:11931', metrics: '492:11637', expense: '492:11672', breakdown: '492:12080', categories: '492:12253', list: '492:12688', footer: '492:11353' },
  }[variant];

  return <div className={`figma-grocery-functional figma-grocery-${variant}`} data-name="Body" data-node-id={'body' in ids ? ids.body : undefined}>
    {variant === 'tablet' && <div className="figma-grocery-tablet-header" data-node-id="473:10407" data-name="Header"><h1 className="figma-grocery-title">Lista de compras</h1></div>}
    <div className="figma-grocery-data" data-node-id={ids.data} data-name={variant === 'desktop' ? 'Data' : variant === 'tablet' ? 'Section Data Statistics' : 'Section Data Chart'}>
    <section className="figma-grocery-metrics" data-node-id={ids.metrics} data-name="Section Statistics" aria-label="Resumen de compras">
      <article><span className="figma-grocery-metric-icon">$</span><div><small>Costo estimado</small><strong>Sin dato</strong></div></article>
      <article><span className="figma-grocery-metric-icon">▣</span><div><small>Artículos totales</small><strong>{items.length}</strong></div></article>
      <article><span className="figma-grocery-metric-icon">◉</span><div><small>Calorías estimadas</small><strong>Sin dato</strong></div></article>
    </section>

    <section className="figma-grocery-overview" aria-label="Estado de la lista">
      <article data-node-id={ids.expense} data-name="Widget Expense Overview"><header><h2>Resumen de compras</h2><small>Plan vigente</small></header><div className="figma-grocery-empty-chart"><strong>Sin precios registrados</strong><span>La lista no estima gastos sin precios aportados.</span></div></article>
      <article data-node-id={ids.breakdown} data-name="Widget Expense Breakdown"><header><h2>Distribución por categoría</h2><small>{groups.length} categorías</small></header><div className="figma-grocery-bars">{groups.map((group) => <div key={group.category}><span>{group.category}</span><i style={{ width: `${group.items.length / maxCategory * 100}%` }} /><strong>{group.items.length}</strong></div>)}</div></article>
      <article data-node-id={ids.categories} data-name="Widget Grocery Category"><header><h2>Categorías</h2><small>{items.length} artículos</small></header><div className="figma-grocery-category-stack">{groups.map((group) => <i key={group.category} style={{ flex: group.items.length }} />)}</div><ul>{groups.map((group) => <li key={group.category}><span>{group.category}</span><strong>{group.items.length}</strong></li>)}</ul></article>
    </section>
    </div>

    <section className="figma-grocery-list" data-node-id={ids.list} data-name="Widget Grocery list" aria-label="Lista de compras">
      <header className="figma-grocery-list-head"><div><h2>Lista de compras</h2><p>{checkedCount} de {items.length} comprados</p></div><div className="figma-grocery-actions"><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar artículo" aria-label="Buscar artículo" /><select aria-label="Estado" value={filter} onChange={(event) => { setFilter(event.target.value as Filter); setPage(1); }}><option value="all">Todos</option><option value="pending">Pendientes</option><option value="checked">Comprados</option></select><button type="button" onClick={() => setAdding(true)}>+ Agregar artículo</button></div></header>
      {adding && <form className="figma-grocery-add" onSubmit={(event) => { event.preventDefault(); addCustom(); }}><label>Nuevo artículo<input autoFocus value={newItem} onChange={(event) => setNewItem(event.target.value)} maxLength={80} /></label><button type="submit">Agregar</button><button type="button" onClick={() => setAdding(false)}>Cancelar</button></form>}
      <div className="figma-grocery-tabs" aria-label="Categorías"><button type="button" aria-pressed={category === 'Todas'} onClick={() => { setCategory('Todas'); setPage(1); }}>Todas las categorías</button>{categories.filter((name) => groups.some((group) => group.category === name)).map((name) => <button type="button" aria-pressed={category === name} key={name} onClick={() => { setCategory(name); setPage(1); }}>{name}</button>)}</div>
      {error && <p role="alert">{error}</p>}
      {!loaded && <p role="status">Cargando plan publicado…</p>}
      {items.length ? <div className="figma-grocery-table-scroll"><table><thead><tr><th>Artículo</th><th>Categoría</th><th>Cantidad</th><th>Calorías</th><th>Costo</th><th>Real</th><th>Estado</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><button type="button" className="figma-grocery-item" aria-pressed={checkedSet.has(item.id)} onClick={() => toggle(item.id)}><span>{checkedSet.has(item.id) ? '✓' : ''}</span>{item.label}</button></td><td><span className="figma-grocery-badge">{item.category}</span></td><td><div className="figma-grocery-qty"><output aria-label={`Cantidad de ${item.label}`}>{quantities[item.id] ?? 0}</output><button type="button" aria-label={`Quitar una unidad de ${item.label}`} onClick={() => quantity(item.id, -1)}>−</button><button type="button" aria-label={`Agregar una unidad de ${item.label}`} onClick={() => quantity(item.id, 1)}>+</button></div></td><td>—</td><td>—</td><td>—</td><td><span className={checkedSet.has(item.id) ? 'is-checked' : ''}>{checkedSet.has(item.id) ? 'Comprado' : 'Pendiente'}</span></td></tr>)}</tbody></table></div> : <p className="figma-grocery-empty">Cuando tu nutricionista publique el plan, aparecerán acá los artículos derivados de sus comidas.</p>}
      {items.length > 0 && shown.length === 0 && <p className="figma-grocery-empty">No hay artículos con este filtro.</p>}
      {items.length > 0 && <footer><span>Mostrando {visible.length} de {shown.length} artículos</span><div><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>{currentPage} / {pageCount}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div><button type="button" onClick={exportList}>Exportar lista</button></footer>}
      {feedback && <p role="status">{feedback}</p>}
    </section>
    {variant !== 'desktop' && <footer className="figma-grocery-page-footer" data-node-id={ids.footer} data-name="Section Footer"><div><strong>© 2026 Plan V</strong><span>Política de privacidad</span><span>Términos y condiciones</span><span>Contacto</span></div><div aria-label="Redes sociales"><span>f</span><span>𝕏</span><span>◎</span><span>▶</span><span>in</span></div></footer>}
  </div>;
}
