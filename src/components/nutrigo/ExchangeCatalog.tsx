import { useEffect, useMemo, useRef, useState } from 'react';
import { exchangeApi } from '../../api/exchanges';
import { foodApi } from '../../api/foods';
import { exchangeInputSchema, type ExchangeEntry, type ExchangeInput, type ExchangeKind } from '../../types/exchanges';
import { normalizeFoodSearch, type Food, type FoodNutrients } from '../../types/foods';
import { NvBadge, NvButton, NvState } from './primitives';
import { Icon } from '../shared/Icon';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { groupContribution, itemNutrition, selectExchanges, type ExchangeFilters } from './exchange-model';
import { canLeaveWorkspace, useUnsavedChanges } from './unsaved-changes';
import './food-catalog.css';
import './exchange-catalog.css';

const number = (value: number | null, unit = '') => value === null ? 'Sin dato' : `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value)}${unit ? ` ${unit}` : ''}`;
const decimal = (value: string) => value.trim() === '' ? null : Number(value.trim().replace(',', '.'));
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const SHOWN: Array<[keyof FoodNutrients, string, string]> = [['kcal', 'Energía', 'kcal'], ['protein', 'Proteínas', 'g'], ['carbs', 'Carbohidratos', 'g'], ['fat', 'Grasas', 'g']];

type DraftItem = { food_id: string | null; name: string; measure: string; grams: string };
export type ExchangeDraft = {
  id: string; revision: number; kind: ExchangeKind; name: string; description: string; justification: string;
  base: DraftItem; items: DraftItem[]; hasPortion: boolean; portion: { measure: string; grams: string };
  foods: { food_id: string | null; name: string }[];
};
const emptyItem = (): DraftItem => ({ food_id: null, name: '', measure: '', grams: '' });

export function draftFor(kind: ExchangeKind, entry?: ExchangeEntry, copy = false): ExchangeDraft {
  const draft: ExchangeDraft = {
    id: copy || !entry ? crypto.randomUUID() : entry.id, revision: copy || !entry ? 0 : entry.revision, kind,
    name: entry ? (copy ? `${entry.name} (copia)`.slice(0, 160) : entry.name) : '', description: entry?.description ?? '', justification: '',
    base: emptyItem(), items: [emptyItem()], hasPortion: false, portion: { measure: '', grams: '' }, foods: [{ food_id: null, name: '' }],
  };
  if (entry?.kind === 'list') {
    draft.justification = entry.justification;
    draft.base = { ...entry.base, grams: String(entry.base.grams) };
    draft.items = entry.items.map(item => ({ ...item, grams: String(item.grams) }));
  }
  if (entry?.kind === 'group') {
    draft.hasPortion = entry.portion !== null;
    draft.portion = entry.portion ? { measure: entry.portion.measure, grams: String(entry.portion.grams) } : { measure: '', grams: '' };
    draft.foods = entry.foods.map(food => ({ ...food }));
  }
  return draft;
}

/** Convierte el borrador del formulario en la entrada validada, con un mensaje claro si falla. */
export function exchangeInputFromDraft(draft: ExchangeDraft): { success: true; data: ExchangeInput } | { success: false; message: string } {
  const item = (i: DraftItem) => ({ food_id: i.food_id, name: i.name, measure: i.measure, grams: decimal(i.grams) });
  const common = { id: draft.id, expected_revision: draft.revision, name: draft.name, description: draft.description };
  const raw = draft.kind === 'list'
    ? { ...common, kind: 'list', justification: draft.justification, base: item(draft.base), items: draft.items.map(item) }
    : { ...common, kind: 'group', portion: draft.hasPortion ? { measure: draft.portion.measure, grams: decimal(draft.portion.grams) } : null, foods: draft.foods };
  const parsed = exchangeInputSchema.safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  const path = issue.path.map(String);
  let message = 'Revisá los datos de la equivalencia.';
  if (path[0] === 'name') message = 'Ingresá el nombre.';
  else if ((path[0] === 'items' || path[0] === 'foods') && path.length === 1) message = draft.kind === 'list' ? 'Sumá al menos un alimento equivalente.' : 'Sumá al menos un alimento al grupo.';
  else if (path.includes('grams')) message = 'Cada cantidad necesita gramos mayores que cero.';
  else if (path.includes('measure')) message = 'Cada alimento necesita una medida, por ejemplo 1 taza.';
  else if (path.includes('name')) message = 'Cada fila necesita el nombre del alimento.';
  return { success: false, message };
}

function Origin({ entry }: { entry: ExchangeEntry }) {
  return <NvBadge tone={entry.owner_id === null ? 'gold' : 'green'}>{entry.owner_id === null ? 'Sistema' : 'Propia'}</NvBadge>;
}

export function ExchangeCard({ entry, onOpen }: { entry: ExchangeEntry; onOpen: (button: HTMLButtonElement) => void }) {
  const isList = entry.kind === 'list';
  const reference = entry.kind === 'list' ? `${entry.base.measure} · ${number(entry.base.grams, 'g')}` : entry.portion ? `${entry.portion.measure} · ${number(entry.portion.grams, 'g')}` : 'Sin porción de referencia';
  const count = entry.kind === 'list' ? plural(entry.items.length, 'equivalente', 'equivalentes') : plural(entry.foods.length, 'alimento', 'alimentos');
  return <li><button type="button" className="ec-card" aria-label={`Abrir ${entry.name}`} onClick={event => onOpen(event.currentTarget)}>
    <span className="ec-card-head"><span className="ec-card-icon" aria-hidden="true"><Icon name={isList ? 'list' : 'grid'} size={18} /></span><span className="ec-card-title"><strong>{entry.name}</strong><Origin entry={entry} /></span></span>
    <span className="ec-card-base"><small>{isList ? 'Alimento base' : 'Porción de referencia'}</small><span>{isList && <b>{entry.name === entry.base.name ? '' : `${entry.base.name}: `}</b>}{reference}</span></span>
    <span className="ec-card-foot"><span>{count}</span><Icon name="chevron" size={16} /></span>
  </button></li>;
}

function NutrientCells({ values }: { values: FoodNutrients | null }) {
  return <>{SHOWN.map(([key]) => <td key={key}>{values ? number(values[key]) : 'Sin dato'}</td>)}</>;
}

export function ExchangeDetail({ entry, foods, onEdit, onDuplicate, onArchive }: { entry: ExchangeEntry; foods: Map<string, Food>; onEdit: () => void; onDuplicate: () => void; onArchive: () => void }) {
  const own = entry.owner_id !== null;
  const contribution = entry.kind === 'group' ? groupContribution(entry, foods) : null;
  return <section className="fc-detail ec-detail" aria-label={`Detalle de ${entry.name}`}>
    <header><Origin entry={entry} /><p>{entry.description || (entry.kind === 'list' ? 'Lista de equivalentes' : 'Grupo de alimentos')}</p></header>
    {entry.kind === 'list' ? <>
      {entry.justification && <div className="fc-source"><span className="fc-eyebrow">POR QUÉ SON EQUIVALENTES</span><p>{entry.justification}</p></div>}
      <div className="fc-table-wrap" tabIndex={0} aria-label="Equivalentes, desplazable si no entra completa">
        <table className="fc-table ec-table"><caption className="fc-sr-only">Cantidades equivalentes al alimento base. Aporte calculado con el catálogo de Alimentos cuando el alimento está vinculado.</caption>
          <thead><tr><th scope="col">Alimento</th><th scope="col">Medida</th><th scope="col">Gramos</th>{SHOWN.map(([key, label, unit]) => <th key={key} scope="col">{label}<small>{unit}</small></th>)}</tr></thead>
          <tbody>
            <tr className="ec-base-row"><th scope="row">{entry.base.name}<small>Alimento base</small></th><td>{entry.base.measure}</td><td>{number(entry.base.grams)}</td><NutrientCells values={itemNutrition(entry.base, foods)} /></tr>
            {entry.items.map((item, index) => <tr key={index}><th scope="row">{item.name}</th><td>{item.measure}</td><td>{number(item.grams)}</td><NutrientCells values={itemNutrition(item, foods)} /></tr>)}
          </tbody>
        </table>
      </div>
      <p className="fc-hint">El aporte se calcula con la composición cargada en Alimentos. Si un alimento no está vinculado o no tiene ese dato, se muestra «Sin dato»; nunca cero.</p>
    </> : <>
      <h3>Porción de referencia</h3>
      <p>{entry.portion ? `${entry.portion.measure} · ${number(entry.portion.grams, 'g')}` : 'Este grupo no tiene porción de referencia.'}</p>
      {contribution && <><dl className="fc-nutrients">{SHOWN.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{number(contribution.nutrients[key], unit)}</dd></div>)}</dl>
        <p className="fc-hint">{`Promedio de una porción, calculado con ${contribution.counted} de ${contribution.total} alimentos vinculados al catálogo.`}</p></>}
      <h3>Alimentos del grupo</h3>
      <ul className="ec-foods">{entry.foods.map((food, index) => <li key={index}>{food.name}{food.food_id && foods.has(food.food_id) && <small>vinculado a Alimentos</small>}</li>)}</ul>
    </>}
    <footer className="ec-actions">
      {own ? <><NvButton onClick={onEdit}>Editar</NvButton><NvButton className="ec-secondary" onClick={onDuplicate}>Duplicar</NvButton><NvButton className="ec-secondary" onClick={onArchive}>Archivar</NvButton></>
        : <><NvButton onClick={onDuplicate}>Duplicar para editar</NvButton><p className="fc-hint">Las listas de Sistema son compartidas y no se pueden modificar. Duplicalas para adaptarlas a tu consultorio.</p></>}
    </footer>
  </section>;
}

function ItemRow({ label, item, withQuantity, listId, lookup, onChange, onRemove }: {
  label: string; item: DraftItem; withQuantity: boolean; listId: string; lookup: (name: string) => string | null;
  onChange: (next: DraftItem) => void; onRemove?: () => void;
}) {
  return <div className={`ec-item-row${withQuantity ? '' : ' ec-item-row-plain'}`}>
    <label>{label}<input list={listId} maxLength={160} required value={item.name} onChange={e => onChange({ ...item, name: e.target.value, food_id: lookup(e.target.value) })} /></label>
    {withQuantity && <><label>Medida casera<input maxLength={80} required placeholder="1 taza" value={item.measure} onChange={e => onChange({ ...item, measure: e.target.value })} /></label>
      <label>Gramos<input inputMode="decimal" required value={item.grams} onChange={e => onChange({ ...item, grams: e.target.value })} /></label></>}
    <span className="ec-link" title={item.food_id ? 'Vinculado al catálogo de Alimentos' : 'Sin vínculo con Alimentos'}>{item.food_id ? 'Vinculado' : 'Sin vínculo'}</span>
    {onRemove && <button type="button" className="fc-text-button" aria-label={`Quitar ${item.name || label}`} onClick={onRemove}>Quitar</button>}
  </div>;
}

function ExchangeEditor({ entry, kind, copy, foods, onCancel, onSaved }: { entry?: ExchangeEntry; kind: ExchangeKind; copy?: boolean; foods: Food[]; onCancel: () => void; onSaved: (entry: ExchangeEntry) => void }) {
  const [draft, setDraft] = useState(() => draftFor(entry?.kind ?? kind, entry, copy));
  const initial = useRef(JSON.stringify(draft));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  useUnsavedChanges(JSON.stringify(draft) !== initial.current, busy);
  useEffect(() => { const frame = requestAnimationFrame(() => nameRef.current?.focus()); return () => cancelAnimationFrame(frame); }, []);
  // Vínculo automático sólo cuando el nombre coincide con un único alimento visible.
  const byName = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const food of foods) { const key = normalizeFoodSearch(food.name); map.set(key, map.has(key) ? null : food.id); }
    return map;
  }, [foods]);
  const lookup = (name: string) => byName.get(normalizeFoodSearch(name)) ?? null;
  const options = foods.slice(0, 1000);
  const setItem = (index: number, next: DraftItem) => setDraft(d => ({ ...d, items: d.items.map((old, i) => i === index ? next : old) }));
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    const parsed = exchangeInputFromDraft(draft);
    if (!parsed.success) { setError(parsed.message); return; }
    setBusy(true); setError('');
    try { const { entry: saved } = await exchangeApi.save(parsed.data); initial.current = JSON.stringify(draft); onSaved(saved); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos guardar. Tus cambios siguen acá.'); }
    finally { setBusy(false); }
  }
  const isList = draft.kind === 'list';
  return <form className="fc-editor ec-editor" onSubmit={save} aria-label={entry && !copy ? 'Editar equivalencia' : 'Nueva equivalencia'}>
    <datalist id="ec-food-options">{options.map(food => <option key={food.id} value={food.name} />)}</datalist>
    <p className="fc-hint">{isList ? 'Una lista indica qué cantidades de otros alimentos equivalen a una cantidad del alimento base.' : 'Un grupo reúne alimentos de una misma familia, con una porción de referencia opcional.'}</p>
    <fieldset disabled={busy}><legend>Identificación</legend><div className="fc-fields">
      <label>Nombre<input ref={nameRef} required maxLength={160} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
      <label>Descripción · opcional<input maxLength={400} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
    </div>{isList && <label className="ec-wide">Por qué son equivalentes · opcional<textarea maxLength={500} rows={3} value={draft.justification} onChange={e => setDraft({ ...draft, justification: e.target.value })} /></label>}</fieldset>
    {isList ? <>
      <fieldset disabled={busy}><legend>Alimento base</legend>
        <ItemRow label="Alimento" item={draft.base} withQuantity listId="ec-food-options" lookup={lookup} onChange={base => setDraft({ ...draft, base })} /></fieldset>
      <fieldset disabled={busy}><legend>Equivalentes</legend>
        {draft.items.map((item, index) => <ItemRow key={index} label="Alimento equivalente" item={item} withQuantity listId="ec-food-options" lookup={lookup} onChange={next => setItem(index, next)} onRemove={draft.items.length > 1 ? () => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) }) : undefined} />)}
        <NvButton disabled={draft.items.length >= 50} onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}>+ Agregar equivalente</NvButton></fieldset>
    </> : <>
      <fieldset disabled={busy}><legend>Porción de referencia</legend>
        <label className="fc-checkbox"><input type="checkbox" checked={draft.hasPortion} onChange={e => setDraft({ ...draft, hasPortion: e.target.checked })} />Definir una porción de referencia</label>
        {draft.hasPortion && <div className="fc-fields"><label>Medida casera<input maxLength={80} required placeholder="1 porción" value={draft.portion.measure} onChange={e => setDraft({ ...draft, portion: { ...draft.portion, measure: e.target.value } })} /></label>
          <label>Gramos<input inputMode="decimal" required value={draft.portion.grams} onChange={e => setDraft({ ...draft, portion: { ...draft.portion, grams: e.target.value } })} /></label></div>}</fieldset>
      <fieldset disabled={busy}><legend>Alimentos del grupo</legend>
        {draft.foods.map((food, index) => <ItemRow key={index} label="Alimento" item={{ ...food, measure: '', grams: '' }} withQuantity={false} listId="ec-food-options" lookup={lookup}
          onChange={next => setDraft(d => ({ ...d, foods: d.foods.map((old, i) => i === index ? { food_id: next.food_id, name: next.name } : old) }))}
          onRemove={draft.foods.length > 1 ? () => setDraft({ ...draft, foods: draft.foods.filter((_, i) => i !== index) }) : undefined} />)}
        <NvButton disabled={draft.foods.length >= 100} onClick={() => setDraft({ ...draft, foods: [...draft.foods, { food_id: null, name: '' }] })}>+ Agregar alimento</NvButton></fieldset>
    </>}
    {error && <p role="alert" className="fc-error">{error}</p>}
    <footer><NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</NvButton><button type="button" className="fc-text-button" disabled={busy} onClick={() => { if (canLeaveWorkspace()) onCancel(); }}>Cancelar</button></footer>
  </form>;
}

const TABS: Array<{ kind: ExchangeKind; label: string }> = [{ kind: 'list', label: 'Listas de equivalentes' }, { kind: 'group', label: 'Grupos de alimentos' }];

export function ExchangeCatalog() {
  const [entries, setEntries] = useState<ExchangeEntry[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodsFailed, setFoodsFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [filters, setFilters] = useState<ExchangeFilters>({ tab: 'list', query: '', scope: 'all' });
  const [selected, setSelected] = useState<ExchangeEntry | null>(null);
  const [editor, setEditor] = useState<{ entry?: ExchangeEntry; copy?: boolean; kind: ExchangeKind } | null>(null);
  const [archiving, setArchiving] = useState<{ entry: ExchangeEntry; busy: boolean; error: string } | null>(null);
  const createRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    exchangeApi.list(controller.signal)
      .then(result => { if (!controller.signal.aborted) setEntries(result.entries); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No pudimos cargar las equivalencias.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    // El catálogo de Alimentos enriquece el detalle; si falla, las equivalencias siguen disponibles.
    foodApi.list(controller.signal)
      .then(result => { if (!controller.signal.aborted) { setFoods(result.foods); setFoodsFailed(false); } })
      .catch(() => { if (!controller.signal.aborted) setFoodsFailed(true); });
    return () => controller.abort();
  }, [refresh]);

  const foodMap = useMemo(() => new Map(foods.map(food => [food.id, food])), [foods]);
  const shown = selectExchanges(entries, filters);
  const count = (kind: ExchangeKind) => loading || error ? '—' : String(entries.filter(e => e.kind === kind).length);
  const tabEntries = entries.filter(e => e.kind === filters.tab);
  const hasFilters = Boolean(filters.query || filters.scope !== 'all');

  function openEditor(next: { entry?: ExchangeEntry; copy?: boolean; kind: ExchangeKind }) {
    if (!canLeaveWorkspace()) return;
    setNotice(''); setSelected(null); setEditor(next);
  }
  function closeDialog() {
    if (!canLeaveWorkspace()) return;
    setEditor(null); setSelected(null); setArchiving(null);
    requestAnimationFrame(() => { (openerRef.current?.isConnected ? openerRef.current : createRef.current)?.focus(); });
  }
  async function confirmArchive() {
    if (!archiving || archiving.busy) return;
    const { entry } = archiving;
    setArchiving({ entry, busy: true, error: '' });
    try {
      await exchangeApi.archive(entry.id, entry.revision);
      setEntries(current => current.filter(e => e.id !== entry.id));
      setArchiving(null); setSelected(null); setNotice(`«${entry.name}» se archivó. Ya no aparece en tu catálogo.`);
    } catch (reason) {
      setArchiving({ entry, busy: false, error: reason instanceof Error ? reason.message : 'No pudimos archivarla. Reintentá.' });
    }
  }
  const dialogTitle = editor ? (editor.entry && !editor.copy ? 'Editar equivalencia' : editor.kind === 'list' ? 'Nueva lista de equivalentes' : 'Nuevo grupo de alimentos') : archiving ? 'Archivar equivalencia' : selected?.name ?? '';

  return <section className="fc-catalog ec-catalog" aria-label="Equivalencias">
    <header className="fc-heading"><div><span className="fc-eyebrow">PLAN DE ALIMENTACIÓN</span><h1>Equivalencias</h1><p>Listas de alimentos intercambiables y grupos para armar tus planes.</p></div>
      <button ref={createRef} type="button" className="nv-button" disabled={loading || Boolean(error)} onClick={() => { openerRef.current = createRef.current; openEditor({ kind: filters.tab }); }}><Icon name="plus" size={16} />Crear</button>
    </header>
    {notice && <p role="status" className="fc-success">{notice}</p>}
    <div className="fc-tabs" role="tablist" aria-label="Tipo de equivalencia">{TABS.map(({ kind, label }) => <button key={kind} type="button" id={`ec-tab-${kind}`} role="tab" aria-selected={filters.tab === kind} aria-controls="ec-results" tabIndex={filters.tab === kind ? 0 : -1}
      onClick={() => setFilters(f => ({ ...f, tab: kind }))}
      onKeyDown={event => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next: ExchangeKind = event.key === 'Home' ? 'list' : event.key === 'End' ? 'group' : kind === 'list' ? 'group' : 'list';
          setFilters(f => ({ ...f, tab: next })); document.getElementById(`ec-tab-${next}`)?.focus();
        }
      }}>{label}<span>{count(kind)}</span></button>)}</div>
    <div className="ec-toolbar">
      <label className="fc-search"><span className="fc-sr-only">Buscar equivalencias</span><input type="search" placeholder="Buscar" value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })} /></label>
      <label><span className="fc-sr-only">Origen</span><select value={filters.scope} onChange={e => setFilters({ ...filters, scope: e.target.value as ExchangeFilters['scope'] })}><option value="all">Todas</option><option value="system">Sistema</option><option value="own">Propias</option></select></label>
      {hasFilters && <button type="button" className="fc-text-button" onClick={() => setFilters(f => ({ ...f, query: '', scope: 'all' }))}>Limpiar filtros</button>}
    </div>
    <p aria-live="polite" className="fc-hint">{loading ? 'Cargando equivalencias…' : error ? 'Equivalencias no disponibles' : plural(shown.length, 'resultado', 'resultados')}</p>
    <div id="ec-results" role="tabpanel" aria-labelledby={`ec-tab-${filters.tab}`}>
      {loading ? <NvState kind="loading" title="Cargando equivalencias…" description="Estamos buscando tus listas y grupos." />
        : error ? <NvState kind="error" title="No pudimos cargar las equivalencias" description={error} action={<NvButton onClick={() => setRefresh(v => v + 1)}>Reintentar</NvButton>} />
        : shown.length ? <ul className="ec-grid">{shown.map(entry => <ExchangeCard key={entry.id} entry={entry} onOpen={button => { openerRef.current = button; setNotice(''); setSelected(entry); }} />)}</ul>
        : <NvState title={tabEntries.length ? 'No hay coincidencias' : filters.tab === 'list' ? 'Todavía no hay listas de equivalentes' : 'Todavía no hay grupos de alimentos'}
          description={tabEntries.length ? 'Probá otro nombre o cambiá el origen.' : 'Creá una para indicar qué alimentos y cantidades se pueden intercambiar al armar un plan.'}
          action={<NvButton onClick={() => { if (tabEntries.length) setFilters(f => ({ ...f, query: '', scope: 'all' })); else { openerRef.current = createRef.current; openEditor({ kind: filters.tab }); } }}>{tabEntries.length ? 'Limpiar filtros' : filters.tab === 'list' ? 'Crear mi primera lista' : 'Crear mi primer grupo'}</NvButton>} />}
    </div>
    {foodsFailed && !loading && !error && <p className="fc-hint">No pudimos consultar el catálogo de Alimentos: el aporte nutricional se mostrará como «Sin dato» y no se vinculan alimentos nuevos.</p>}
    {(editor || selected || archiving) && <FigmaRecordDialog title={dialogTitle} className={`fc-dialog${editor ? ' fc-dialog-editor' : ''}`} closeLabel="Cerrar" onClose={closeDialog}>
      {editor ? <ExchangeEditor key={editor.entry?.id ?? 'new'} entry={editor.entry} kind={editor.kind} copy={editor.copy} foods={foods} onCancel={closeDialog}
        onSaved={saved => {
          setEntries(current => [...current.filter(e => e.id !== saved.id), saved]);
          setFilters(f => ({ ...f, tab: saved.kind, query: '', scope: 'all' }));
          setEditor(null); setSelected(saved); setNotice('Guardado. Las cantidades quedaron registradas.');
          requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.fc-dialog > header > button')?.focus());
        }} />
        : archiving ? <div className="ec-archive"><p>{`¿Archivar «${archiving.entry.name}»? Deja de aparecer en tu catálogo. Los planes ya publicados no cambian.`}</p>
          {archiving.error && <p role="alert" className="fc-error">{archiving.error}</p>}
          <footer className="ec-actions"><NvButton disabled={archiving.busy} onClick={confirmArchive}>{archiving.busy ? 'Archivando…' : 'Archivar'}</NvButton><button type="button" className="fc-text-button" disabled={archiving.busy} onClick={() => setArchiving(null)}>Volver</button></footer></div>
        : <ExchangeDetail key={`${selected!.id}:${selected!.revision}`} entry={selected!} foods={foodMap}
          onEdit={() => openEditor({ entry: selected!, kind: selected!.kind })} onDuplicate={() => openEditor({ entry: selected!, copy: true, kind: selected!.kind })} onArchive={() => setArchiving({ entry: selected!, busy: false, error: '' })} />}
    </FigmaRecordDialog>}
  </section>;
}
