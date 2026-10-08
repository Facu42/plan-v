import { useEffect, useRef, useState } from 'react';
import { foodApi } from '../../api/foods';
import { foodInputSchema, NUTRIENTS, scaleFoodNutrients, type Food, type FoodInput, type NutrientKey } from '../../types/foods';
import { NvBadge, NvButton, NvState } from './primitives';
import { Icon } from '../shared/Icon';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { selectCatalogFoods, type CatalogFilters, type CatalogOrder } from './food-catalog-model';
import { canLeaveWorkspace, useUnsavedChanges } from './unsaved-changes';
import './food-catalog.css';

const fmt = (value: number | null, unit = '') => value === null ? 'Sin dato' : `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ''}`;
const decimal = (value: string) => value.trim() === '' ? null : Number(value.trim().replace(',', '.'));
type Draft = { id: string; revision: number; name: string; brand: string; category: string; kind: 'food' | 'supplement'; source: string; reference: string; nutrients: Record<NutrientKey, string>; portions: { name: string; grams: string }[] };
function draftFor(food?: Food, kind: Food['kind'] = 'food'): Draft {
  return { id: food?.id ?? crypto.randomUUID(), revision: food?.revision ?? 0, name: food?.name ?? '', brand: food?.brand ?? '', category: food?.category ?? '', kind: food?.kind ?? kind, source: food?.source ?? '', reference: food?.reference ?? '', nutrients: Object.fromEntries(NUTRIENTS.map(([key]) => [key, food?.nutrients[key]?.toString() ?? ''])) as Draft['nutrients'], portions: food?.portions.map(p => ({ name: p.name, grams: p.grams.toString() })) ?? [] };
}
function FoodEditor({ food, kind, onCancel, onSaved }: { food?: Food; kind: Food['kind']; onCancel: () => void; onSaved: (food: Food) => void }) {
  const [draft, setDraft] = useState(() => draftFor(food, kind));
  const initial = useRef(JSON.stringify(draft));
  const nameRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useUnsavedChanges(JSON.stringify(draft) !== initial.current, busy);
  useEffect(() => {
    const frame = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);
  const field = (key: 'name' | 'brand' | 'category' | 'source' | 'reference', label: string, max: number, required = false) => <label>{label}<input ref={key === 'name' ? nameRef : undefined} value={draft[key]} maxLength={max} required={required} autoFocus={key === 'name'} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>;
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    const parsed = foodInputSchema.safeParse({ id: draft.id, expected_revision: draft.revision, name: draft.name, brand: draft.brand, category: draft.category, kind: draft.kind, source: draft.source, reference: draft.reference,
      nutrients: Object.fromEntries(NUTRIENTS.map(([key]) => [key, decimal(draft.nutrients[key])])), portions: draft.portions.map(p => ({ name: p.name, grams: decimal(p.grams) })) });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue.path[0] === 'name' || issue.path[0] === 'source' || issue.code === 'custom') setError(issue.message);
      else if (issue.path[0] === 'nutrients') {
        const nutrient = NUTRIENTS.find(([key]) => key === issue.path[1]);
        setError(nutrient ? `${nutrient[1]}: ingresá un número entre 0 y ${nutrient[3]} ${nutrient[2]}, o dejá el campo vacío.` : 'Revisá los nutrientes cargados.');
      } else setError('Cada medida necesita un nombre y una cantidad de gramos mayor que cero y hasta 100.000.');
      return;
    }
    setBusy(true); setError('');
    try { const { food: saved } = await foodApi.save(parsed.data as FoodInput); initial.current = JSON.stringify(draft); onSaved(saved); }
    catch (e) { setError(e instanceof Error ? e.message : 'No pudimos guardar. Tus cambios siguen acá.'); }
    finally { setBusy(false); }
  }
  return <form className="fc-editor" onSubmit={save} aria-label={food ? 'Editar alimento' : 'Nuevo alimento'}>
    <p className="fc-hint">Registrá la composición de una fuente conocida y las medidas que usás en consulta.</p>
    <fieldset disabled={busy}><legend>Identificación y fuente</legend><div className="fc-fields">{field('name', 'Nombre', 160, true)}{field('brand', 'Marca · opcional', 120)}{field('category', 'Categoría · opcional', 80)}<label>Tipo<select value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as Draft['kind'] })}><option value="food">Alimento</option><option value="supplement">Suplemento</option></select></label>{field('source', 'Fuente de los valores', 240, true)}{field('reference', 'Referencia o versión · opcional', 500)}</div></fieldset>
    <fieldset disabled={busy}><legend>Valores por 100 g</legend><p className="fc-hint">Copiá los valores de una fuente conocida. Dejá vacío lo que no figure; cero significa que la fuente declara cero.</p><div className="fc-fields">{NUTRIENTS.slice(0, 5).map(([key, label, unit, max]) => <label key={key}>{label} ({unit})<input inputMode="decimal" placeholder="Sin dato" aria-description={`Por 100 gramos. Máximo ${max} ${unit}.`} value={draft.nutrients[key]} onChange={e => setDraft({ ...draft, nutrients: { ...draft.nutrients, [key]: e.target.value } })} /></label>)}</div>
      <details><summary>Micronutrientes · opcionales</summary><div className="fc-fields">{NUTRIENTS.slice(5).map(([key, label, unit]) => <label key={key}>{label} ({unit})<input inputMode="decimal" placeholder="Sin dato" value={draft.nutrients[key]} onChange={e => setDraft({ ...draft, nutrients: { ...draft.nutrients, [key]: e.target.value } })} /></label>)}</div></details></fieldset>
    <fieldset disabled={busy}><legend>Medidas caseras</legend><p className="fc-hint">La equivalencia en gramos corresponde a este alimento. No se convierte una taza o cucharada de forma universal.</p>
      {draft.portions.map((p, index) => <div className="fc-portion-row" key={index}><label>Nombre de la medida<input maxLength={80} required value={p.name} onChange={e => setDraft({ ...draft, portions: draft.portions.map((old, i) => i === index ? { ...old, name: e.target.value } : old) })} /></label><label>Gramos<input inputMode="decimal" required value={p.grams} onChange={e => setDraft({ ...draft, portions: draft.portions.map((old, i) => i === index ? { ...old, grams: e.target.value } : old) })} /></label><button type="button" className="fc-text-button" aria-label={`Quitar medida ${p.name || index + 1}`} onClick={() => setDraft({ ...draft, portions: draft.portions.filter((_, i) => i !== index) })}>Quitar</button></div>)}
      <NvButton disabled={draft.portions.length >= 30} onClick={() => setDraft({ ...draft, portions: [...draft.portions, { name: '', grams: '' }] })}>+ Agregar medida</NvButton></fieldset>
    {error && <p role="alert" className="fc-error">{error}</p>}<footer><NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar alimento'}</NvButton><button type="button" className="fc-text-button" disabled={busy} onClick={() => { if (canLeaveWorkspace()) onCancel(); }}>Cancelar</button></footer>
  </form>;
}
function FoodDetail({ food, onEdit }: { food: Food; onEdit: () => void }) {
  const [portion, setPortion] = useState('grams');
  const [quantity, setQuantity] = useState('100');
  const factor = portion === 'grams' ? 1 : food.portions[Number(portion)]?.grams;
  const number = decimal(quantity);
  const grams = number !== null && factor !== undefined ? number * factor : NaN;
  const valid = Number.isFinite(grams) && grams >= 0 && grams <= 100000;
  const nutrients = valid ? scaleFoodNutrients(food.nutrients, grams) : null;
  return <section className="fc-detail" aria-label={`Detalle de ${food.name}`}><header><NvBadge>{food.owner_id ? 'Propio' : 'Plataforma'}</NvBadge><p>{[food.brand, food.category].filter(Boolean).join(' · ') || (food.kind === 'supplement' ? 'Suplemento' : 'Alimento')}</p></header>
    <div className="fc-source"><span className="fc-eyebrow">FUENTE DECLARADA</span><p>{food.source}</p>{food.reference && <small>{food.reference}</small>}</div>
    <h3>Calculá una porción</h3><div className="fc-fields"><label>Medida<select value={portion} onChange={e => { setPortion(e.target.value); setQuantity(e.target.value === 'grams' ? '100' : '1'); }}><option value="grams">Gramos</option>{food.portions.map((p, i) => <option key={i} value={i}>{p.name} ({fmt(p.grams, 'g')})</option>)}</select></label><label>Cantidad<input inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)} /></label></div>
    <p aria-live="polite" className="fc-hint">{valid ? `Equivale a ${fmt(grams, 'g')}.` : 'Ingresá una cantidad entre 0 y 100.000 gramos.'}</p><dl className="fc-nutrients">{NUTRIENTS.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{nutrients ? fmt(nutrients[key], unit) : '—'}</dd></div>)}</dl>
    <p className="fc-hint">Los valores sin cargar se muestran como «Sin dato». La fuente y sus unidades se conservan al calcular una porción.</p>{food.owner_id && <NvButton onClick={onEdit}>Editar alimento</NvButton>}
  </section>;
}
/** Menús de herramientas con cierre fuera del panel y retorno de foco al usar Escape. */
function CatalogMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (ref.current?.open && event.target instanceof Node && !ref.current.contains(event.target)) ref.current.open = false;
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return <details ref={ref} className="fc-menu" onKeyDown={event => {
    if (event.key === 'Escape' && ref.current?.open) {
      event.stopPropagation(); ref.current.open = false; ref.current.querySelector('summary')?.focus();
    }
  }}><summary>{label}<Icon name="chevron" size={14} /></summary><div className="fc-menu-panel">{children}</div></details>;
}

export function FoodCatalog() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [filters, setFilters] = useState<CatalogFilters>({ kind: 'food', query: '', scope: 'all', source: '', category: '', order: 'name-asc' });
  const [columns, setColumns] = useState<NutrientKey[]>(NUTRIENTS.slice(0, 5).map(([key]) => key));
  const [visibleCount, setVisibleCount] = useState(50);
  const [selected, setSelected] = useState<Food | null>(null);
  const [editor, setEditor] = useState<{ food?: Food } | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    foodApi.list(controller.signal)
      .then(result => { if (!controller.signal.aborted) setFoods(result.foods); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No pudimos cargar el catálogo.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => { setVisibleCount(50); }, [filters]);
  const shown = selectCatalogFoods(foods, filters);
  const tabFoods = foods.filter(food => food.kind === filters.kind);
  const sources = [...new Set(tabFoods.map(food => food.source))].sort((a, b) => a.localeCompare(b, 'es'));
  const categories = [...new Set(tabFoods.map(food => food.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const nutrients = NUTRIENTS.filter(([key]) => columns.includes(key));
  const activeFilters = Number(filters.scope !== 'all') + Number(Boolean(filters.category));
  const hasFilters = Boolean(filters.query || filters.source || activeFilters);
  const number = (value: number) => loading || error ? '—' : value;
  function clearFilters() { setFilters(current => ({ ...current, query: '', source: '', scope: 'all', category: '' })); }
  function openEditor(food?: Food) {
    if (!canLeaveWorkspace()) return;
    setNotice(''); setEditor({ food });
    if (!food) { setSelected(null); openerRef.current = addRef.current; }
  }
  function closeDialog() {
    if (!canLeaveWorkspace()) return;
    setEditor(null); setSelected(null);
    requestAnimationFrame(() => { (openerRef.current?.isConnected ? openerRef.current : addRef.current)?.focus(); });
  }
  function changeTab(kind: Food['kind']) {
    setFilters(current => ({ ...current, kind, source: '', category: '' }));
  }
  return <section className="fc-catalog" aria-label="Catálogo de alimentos">
    <header className="fc-heading"><div><span className="fc-eyebrow">PLAN DE ALIMENTACIÓN</span><h1>Alimentos</h1><p>Alimentos y suplementos, con valores por 100 g.</p></div>
      <button ref={addRef} type="button" className="nv-button" disabled={loading || Boolean(error)} onClick={() => openEditor()}><Icon name="plus" size={16} />Agregar alimento</button>
    </header>
    <div className="fc-stats" aria-label="Resumen del catálogo" aria-busy={loading}>
      <div><span className="fc-stat-icon"><Icon name="leaf" size={17} /></span><strong>{number(foods.length)}</strong><span>Total de alimentos</span></div>
      <div><span className="fc-stat-icon"><Icon name="edit" size={17} /></span><strong>{number(foods.filter(food => food.owner_id !== null).length)}</strong><span>Mis alimentos</span></div>
      <div><span className="fc-stat-icon"><Icon name="grid" size={17} /></span><strong>{number(foods.filter(food => food.owner_id === null).length)}</strong><span>De la plataforma</span></div>
      <div><span className="fc-stat-icon"><Icon name="heart" size={17} /></span><strong>{number(foods.filter(food => food.kind === 'supplement').length)}</strong><span>Suplementos</span></div>
    </div>
    {notice && <p role="status" className="fc-success">{notice}</p>}
    <div className="fc-tabs" role="tablist" aria-label="Tipo de alimento">{(['food', 'supplement'] as const).map(kind => <button key={kind} type="button" id={`fc-tab-${kind}`} role="tab" aria-selected={filters.kind === kind} aria-controls="fc-results" tabIndex={filters.kind === kind ? 0 : -1} onClick={() => changeTab(kind)} onKeyDown={event => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); const next = event.key === 'Home' ? 'food' : event.key === 'End' ? 'supplement' : kind === 'food' ? 'supplement' : 'food';
        changeTab(next); document.getElementById(`fc-tab-${next}`)?.focus();
      }
    }}>{kind === 'food' ? 'Alimentos' : 'Suplementos'}<span>{number(foods.filter(food => food.kind === kind).length)}</span></button>)}</div>
    <div className="fc-toolbar">
      <label><span className="fc-sr-only">Fuente de los alimentos</span><select value={filters.source} onChange={event => setFilters({ ...filters, source: event.target.value })}><option value="">Todas las fuentes</option>{sources.map(source => <option key={source} value={source}>{source}</option>)}</select></label>
      <label className="fc-search"><span className="fc-sr-only">Buscar alimentos</span><input type="search" placeholder="Buscar por nombre, marca o categoría…" value={filters.query} onChange={event => setFilters({ ...filters, query: event.target.value })} /></label>
      <label><span className="fc-sr-only">Ordenar alimentos</span><select value={filters.order} onChange={event => setFilters({ ...filters, order: event.target.value as CatalogOrder })}><option value="name-asc">Nombre (A–Z)</option><option value="name-desc">Nombre (Z–A)</option><option value="kcal-asc">Menor energía</option><option value="kcal-desc">Mayor energía</option></select></label>
      <CatalogMenu label={`Filtros${activeFilters ? ` (${activeFilters})` : ''}`}>
        <label>Origen<select value={filters.scope} onChange={event => setFilters({ ...filters, scope: event.target.value as CatalogFilters['scope'] })}><option value="all">Todos</option><option value="own">Mis alimentos</option><option value="platform">De la plataforma</option></select></label>
        <label>Categoría<select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">Todas</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
        <button type="button" className="fc-text-button" onClick={clearFilters}>Limpiar filtros</button>
      </CatalogMenu>
      <CatalogMenu label="Columnas"><p className="fc-hint">Elegí los nutrientes que querés comparar.</p>{NUTRIENTS.map(([key, label, unit]) => <label className="fc-checkbox" key={key}><input type="checkbox" checked={columns.includes(key)} onChange={event => setColumns(current => event.target.checked ? [...current, key] : current.filter(column => column !== key))} />{label} ({unit})</label>)}</CatalogMenu>
    </div>
    <div className="fc-results-meta"><p aria-live="polite" className="fc-hint">{loading ? 'Cargando catálogo…' : error ? 'Catálogo no disponible' : `${shown.length} ${shown.length === 1 ? 'resultado' : 'resultados'} · valores por 100 g`}</p>{hasFilters && <button type="button" className="fc-text-button" onClick={clearFilters}>Limpiar filtros</button>}</div>
    <div id="fc-results" role="tabpanel" aria-labelledby={`fc-tab-${filters.kind}`}>
      {loading ? <NvState kind="loading" title="Cargando alimentos…" description="Estamos buscando tu catálogo." /> : error ? <NvState kind="error" title="No pudimos cargar los alimentos" description={error} action={<NvButton onClick={() => setRefresh(value => value + 1)}>Reintentar</NvButton>} /> : shown.length ? <>
        <div className="fc-table-wrap" tabIndex={0} aria-label="Tabla de alimentos, desplazable si mostrás más columnas">
          <table className="fc-table"><caption className="fc-sr-only">{filters.kind === 'food' ? 'Alimentos' : 'Suplementos'} del consultorio. Todos los valores corresponden a 100 gramos.</caption>
            <thead><tr><th scope="col">Alimento</th>{nutrients.map(([key, label, unit]) => <th key={key} scope="col">{label}<small>{unit}</small></th>)}</tr></thead>
            <tbody>{shown.slice(0, visibleCount).map(food => <tr key={food.id}>
              <th scope="row"><button type="button" className="fc-row-open" aria-label={`Ver ${food.name}`} onClick={event => { openerRef.current = event.currentTarget; setSelected(food); }}><span className="fc-row-name">{food.name}</span><span className="fc-row-source" title={food.source}>{food.source}</span><span className="fc-row-origin">{food.owner_id === null ? 'Plataforma' : 'Propio'}</span><span className="fc-row-secondary">{[food.brand, food.category].filter(Boolean).join(' · ')}</span></button></th>
              {nutrients.map(([key]) => <td key={key}>{fmt(food.nutrients[key])}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
        {shown.length > visibleCount && <div className="fc-load-more"><NvButton onClick={() => setVisibleCount(value => value + 50)}>Mostrar más · {shown.length - visibleCount} restantes</NvButton></div>}
      </> : <NvState title={tabFoods.length ? 'No hay coincidencias' : filters.kind === 'supplement' ? 'Todavía no cargaste suplementos' : 'Tu catálogo empieza acá'} description={tabFoods.length ? 'Probá otro nombre o cambiá los filtros.' : 'Agregá un alimento o suplemento y su fuente para consultar nutrientes y medidas caseras.'} action={<NvButton onClick={tabFoods.length ? clearFilters : () => openEditor()}>{tabFoods.length ? 'Limpiar filtros' : filters.kind === 'supplement' ? 'Agregar suplemento' : 'Agregar mi primer alimento'}</NvButton>} />}
    </div>
    <p className="fc-hint">Abrí un alimento para consultar su fuente, las medidas caseras y los valores de una porción.</p>
    {(editor || selected) && <FigmaRecordDialog title={editor ? editor.food ? 'Editar alimento' : filters.kind === 'supplement' ? 'Nuevo suplemento' : 'Nuevo alimento' : selected!.name} className={`fc-dialog${editor ? ' fc-dialog-editor' : ''}`} closeLabel={editor ? 'Cerrar formulario de alimento' : 'Cerrar detalle del alimento'} onClose={closeDialog}>
      {editor ? <FoodEditor key={editor.food?.id ?? 'new'} food={editor.food} kind={filters.kind} onCancel={closeDialog} onSaved={food => {
        setFoods(current => [...current.filter(item => item.id !== food.id), food]); setSelected(food); setEditor(null);
        setFilters(current => ({ ...current, kind: food.kind }));
        setNotice('Alimento guardado. La fuente y las medidas quedaron registradas.');
        requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.fc-dialog > header > button')?.focus());
      }} /> : <FoodDetail key={`${selected!.id}:${selected!.revision}`} food={selected!} onEdit={() => openEditor(selected!)} />}
    </FigmaRecordDialog>}
  </section>;
}
