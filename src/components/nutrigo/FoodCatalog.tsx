import { useEffect, useRef, useState } from 'react';
import { foodApi } from '../../api/foods';
import { foodInputSchema, NUTRIENTS, normalizeFoodSearch, scaleFoodNutrients, type Food, type FoodInput, type NutrientKey } from '../../types/foods';
import { NvBadge, NvButton, NvState } from './primitives';
import { canLeaveWorkspace, useUnsavedChanges } from './unsaved-changes';
import './food-catalog.css';

const fmt = (value: number | null, unit = '') => value === null ? 'Sin dato' : `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ''}`;
const decimal = (value: string) => value.trim() === '' ? null : Number(value.trim().replace(',', '.'));
type Draft = { id: string; revision: number; name: string; brand: string; category: string; kind: 'food' | 'supplement'; source: string; reference: string; nutrients: Record<NutrientKey, string>; portions: { name: string; grams: string }[] };
function draftFor(food?: Food): Draft {
  return { id: food?.id ?? crypto.randomUUID(), revision: food?.revision ?? 0, name: food?.name ?? '', brand: food?.brand ?? '', category: food?.category ?? '', kind: food?.kind ?? 'food', source: food?.source ?? '', reference: food?.reference ?? '', nutrients: Object.fromEntries(NUTRIENTS.map(([key]) => [key, food?.nutrients[key]?.toString() ?? ''])) as Draft['nutrients'], portions: food?.portions.map(p => ({ name: p.name, grams: p.grams.toString() })) ?? [] };
}
function FoodEditor({ food, onCancel, onSaved }: { food?: Food; onCancel: () => void; onSaved: (food: Food) => void }) {
  const [draft, setDraft] = useState(() => draftFor(food));
  const initial = useRef(JSON.stringify(draft));
  const nameRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useUnsavedChanges(JSON.stringify(draft) !== initial.current, busy);
  useEffect(() => { nameRef.current?.focus(); }, []);
  const field = (key: 'name' | 'brand' | 'category' | 'source' | 'reference', label: string, max: number, required = false) => <label>{label}<input ref={key === 'name' ? nameRef : undefined} value={draft[key]} maxLength={max} required={required} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>;
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
    <header><div><span className="fc-eyebrow">CATÁLOGO PROPIO</span><h2>{food ? 'Editar alimento' : 'Nuevo alimento'}</h2></div></header>
    <fieldset disabled={busy}><legend>Identificación y fuente</legend><div className="fc-fields">{field('name', 'Nombre', 160, true)}{field('brand', 'Marca · opcional', 120)}{field('category', 'Categoría · opcional', 80)}<label>Tipo<select value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as Draft['kind'] })}><option value="food">Alimento</option><option value="supplement">Suplemento</option></select></label>{field('source', 'Fuente de los valores', 240, true)}{field('reference', 'Referencia o versión · opcional', 500)}</div></fieldset>
    <fieldset disabled={busy}><legend>Valores por 100 g</legend><p className="fc-hint">Copiá los valores de una fuente conocida. Dejá vacío lo que no figure; cero significa que la fuente declara cero.</p><div className="fc-fields">{NUTRIENTS.slice(0, 5).map(([key, label, unit, max]) => <label key={key}>{label} ({unit})<input inputMode="decimal" placeholder="Sin dato" aria-description={`Por 100 gramos. Máximo ${max} ${unit}.`} value={draft.nutrients[key]} onChange={e => setDraft({ ...draft, nutrients: { ...draft.nutrients, [key]: e.target.value } })} /></label>)}</div>
      <details><summary>Micronutrientes · opcionales</summary><div className="fc-fields">{NUTRIENTS.slice(5).map(([key, label, unit]) => <label key={key}>{label} ({unit})<input inputMode="decimal" placeholder="Sin dato" value={draft.nutrients[key]} onChange={e => setDraft({ ...draft, nutrients: { ...draft.nutrients, [key]: e.target.value } })} /></label>)}</div></details></fieldset>
    <fieldset disabled={busy}><legend>Medidas caseras</legend><p className="fc-hint">La equivalencia en gramos corresponde a este alimento. No se convierte una taza o cucharada de forma universal.</p>
      {draft.portions.map((p, index) => <div className="fc-portion-row" key={index}><label>Nombre de la medida<input maxLength={80} required value={p.name} onChange={e => setDraft({ ...draft, portions: draft.portions.map((old, i) => i === index ? { ...old, name: e.target.value } : old) })} /></label><label>Gramos<input inputMode="decimal" required value={p.grams} onChange={e => setDraft({ ...draft, portions: draft.portions.map((old, i) => i === index ? { ...old, grams: e.target.value } : old) })} /></label><button type="button" className="fc-text-button" aria-label={`Quitar medida ${p.name || index + 1}`} onClick={() => setDraft({ ...draft, portions: draft.portions.filter((_, i) => i !== index) })}>Quitar</button></div>)}
      <NvButton disabled={draft.portions.length >= 30} onClick={() => setDraft({ ...draft, portions: [...draft.portions, { name: '', grams: '' }] })}>+ Agregar medida</NvButton></fieldset>
    {error && <p role="alert" className="fc-error">{error}</p>}<footer><NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar alimento'}</NvButton><button type="button" className="fc-text-button" disabled={busy} onClick={() => { if (canLeaveWorkspace()) onCancel(); }}>Cancelar</button></footer>
  </form>;
}
function FoodDetail({ food, onEdit, onClose }: { food: Food; onEdit: () => void; onClose: () => void }) {
  const [portion, setPortion] = useState('grams');
  const [quantity, setQuantity] = useState('100');
  const factor = portion === 'grams' ? 1 : food.portions[Number(portion)]?.grams;
  const number = decimal(quantity);
  const grams = number !== null && factor !== undefined ? number * factor : NaN;
  const valid = Number.isFinite(grams) && grams >= 0 && grams <= 100000;
  const nutrients = valid ? scaleFoodNutrients(food.nutrients, grams) : null;
  return <section className="fc-detail" aria-label={`Detalle de ${food.name}`}><header><div><NvBadge>{food.owner_id ? 'Propio' : 'Plataforma'}</NvBadge><h2>{food.name}</h2><p>{[food.brand, food.category].filter(Boolean).join(' · ') || (food.kind === 'supplement' ? 'Suplemento' : 'Alimento')}</p></div><button type="button" className="fc-text-button" onClick={onClose}>Cerrar</button></header>
    <div className="fc-source"><span className="fc-eyebrow">FUENTE DECLARADA</span><p>{food.source}</p>{food.reference && <small>{food.reference}</small>}</div>
    <h3>Calculá una porción</h3><div className="fc-fields"><label>Medida<select value={portion} onChange={e => { setPortion(e.target.value); setQuantity(e.target.value === 'grams' ? '100' : '1'); }}><option value="grams">Gramos</option>{food.portions.map((p, i) => <option key={i} value={i}>{p.name} ({fmt(p.grams, 'g')})</option>)}</select></label><label>Cantidad<input inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)} /></label></div>
    <p aria-live="polite" className="fc-hint">{valid ? `Equivale a ${fmt(grams, 'g')}.` : 'Ingresá una cantidad entre 0 y 100.000 gramos.'}</p><dl className="fc-nutrients">{NUTRIENTS.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{nutrients ? fmt(nutrients[key], unit) : '—'}</dd></div>)}</dl>
    <p className="fc-hint">Sin dato significa que este valor no fue cargado. Este cálculo aún no asigna alimentos a un plan.</p>{food.owner_id && <NvButton onClick={onEdit}>Editar alimento</NvButton>}
  </section>;
}
export function FoodCatalog() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [scope, setScope] = useState('all');
  const [selected, setSelected] = useState<Food | null>(null);
  const [editor, setEditor] = useState<{ food?: Food } | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    foodApi.list(controller.signal).then(result => { if (!controller.signal.aborted) setFoods(result.foods); }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No pudimos cargar el catálogo.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const search = normalizeFoodSearch(query);
  const shown = foods.filter(f => (kind === 'all' || f.kind === kind) && (scope === 'all' || (scope === 'own' ? f.owner_id !== null : f.owner_id === null)) && normalizeFoodSearch(`${f.name} ${f.brand} ${f.category} ${f.source}`).includes(search));
  function openEditor(food?: Food) { if (canLeaveWorkspace()) { setNotice(''); setEditor({ food }); setSelected(food ?? null); } }
  return <section className="fc-catalog" aria-label="Catálogo de alimentos"><header className="fc-heading"><div><span className="fc-eyebrow">PLAN DE ALIMENTACIÓN</span><h1>Alimentos</h1><p>Tu base para preparar planes, una porción a la vez.</p></div><button ref={addRef} type="button" className="nv-button" disabled={loading || Boolean(error) || Boolean(editor)} onClick={() => openEditor()}>+ Nuevo alimento</button></header>
    <p className="fc-hint">Primera entrega: alimentos propios y fuente declarada. Las bases externas se incorporarán después de verificar sus licencias.</p>
    <div className="fc-stats" aria-label="Resumen del catálogo"><div><strong>{foods.length}</strong><span>En tu catálogo</span></div><div><strong>{foods.filter(f => f.owner_id).length}</strong><span>Propios</span></div><div><strong>{foods.filter(f => f.kind === 'supplement').length}</strong><span>Suplementos</span></div></div>
    {notice && <p role="status" className="fc-success">{notice}</p>}
    {editor ? <FoodEditor key={editor.food?.id ?? 'new'} food={editor.food} onCancel={() => { setEditor(null); setTimeout(() => addRef.current?.focus(), 0); }} onSaved={food => { setFoods(current => [...current.filter(f => f.id !== food.id), food]); setSelected(food); setEditor(null); setNotice('Alimento guardado. La fuente y las medidas quedaron registradas.'); }} /> : <>
      <div className="fc-filters"><label className="fc-search">Buscar<input type="search" placeholder="Nombre, marca, categoría o fuente…" value={query} onChange={e => setQuery(e.target.value)} /></label><label>Tipo<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">Todos</option><option value="food">Alimentos</option><option value="supplement">Suplementos</option></select></label><label>Origen<select value={scope} onChange={e => setScope(e.target.value)}><option value="all">Todos</option><option value="own">Propios</option><option value="platform">Plataforma</option></select></label></div>
      {loading ? <NvState kind="loading" title="Cargando alimentos…" description="Estamos buscando tu catálogo." /> : error ? <NvState kind="error" title="No pudimos cargar los alimentos" description={error} action={<NvButton onClick={() => setRefresh(r => r + 1)}>Reintentar</NvButton>} /> : <div className={`fc-layout${selected ? ' fc-with-detail' : ''}`}><div><p className="fc-hint" aria-live="polite">{shown.length} resultados · valores por 100 g</p>{shown.length ? <ul className="fc-list">{shown.map(food => <li key={food.id}><button className="fc-food" type="button" aria-pressed={selected?.id === food.id} onClick={() => setSelected(food)}><div className="fc-food-title"><strong>{food.name}</strong><span>{food.owner_id ? 'Propio' : 'Plataforma'}{food.kind === 'supplement' ? ' · Suplemento' : ''}</span></div><p>{[food.brand, food.category].filter(Boolean).join(' · ') || food.source}</p><dl>{NUTRIENTS.slice(0, 5).map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{fmt(food.nutrients[key], unit)}</dd></div>)}</dl><small>Fuente: {food.source}</small></button></li>)}</ul> : <NvState title={foods.length ? 'No hay coincidencias' : 'Tu catálogo empieza acá'} description={foods.length ? 'Probá otro nombre o cambiá los filtros.' : 'Cargá un alimento y su fuente para consultar nutrientes y medidas caseras.'} action={<NvButton onClick={() => foods.length ? (setQuery(''), setKind('all'), setScope('all')) : openEditor()}>{foods.length ? 'Limpiar filtros' : 'Crear mi primer alimento'}</NvButton>} />}</div>{selected && <FoodDetail key={`${selected.id}:${selected.revision}`} food={selected} onEdit={() => openEditor(selected)} onClose={() => setSelected(null)} />}</div>}
    </>}
  </section>;
}
