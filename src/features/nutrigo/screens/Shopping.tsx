import { useRef, useState, type FormEvent } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { shoppingApi } from '../../../api/shopping';
import { RECIPE_UNITS, type RecipeUnit } from '../../../types/recipes';
import type { ShoppingLine } from '../../../types/shopping';
import { createPendingWrite } from './pending-write';
import { errorText, formatNumber, leaf, objects, searchBinding, source, RecordDialog, Stateful, useRemote, type ScreenProps } from './shared';

export function NutrigoShopping({ patient, query = '', onNavigate, onSignOut }: ScreenProps) {
  const list = useRemote(patient.id, signal => shoppingApi.get(patient.id, signal).then(result => result.list));
  const [search, setSearch] = useState(query); const [filter, setFilter] = useState<'all' | 'pending'>('all'); const [sort, setSort] = useState(false);
  const [adding, setAdding] = useState(false); const [error, setError] = useState(''); const [status, setStatus] = useState('');
  const [name, setName] = useState(''); const [quantity, setQuantity] = useState('1'); const [unit, setUnit] = useState<RecipeUnit>('u');
  const [busy, setBusy] = useState(false); const lock = useRef(false); const [pending, setPending] = useState(false);
  const [addition] = useState(() => createPendingWrite((input: Parameters<typeof shoppingApi.add>[1]) => shoppingApi.add(patient.id, input)));
  const all = list.data?.items ?? [];
  const rows = all.filter(item => (filter === 'all' || !item.checked) && item.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).sort((a, b) => sort ? a.name.localeCompare(b.name, 'es') : 0);
  const mutate = async (action: () => ReturnType<typeof shoppingApi.get>) => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setStatus(''); try { const saved = await action(); list.setData(saved.list); setStatus('Lista guardada.'); } catch (caught) { setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const add = async (event: FormEvent) => { event.preventDefault(); if (lock.current) return; const parsed = Number(quantity); if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) { setError('Ingresá el nombre y una cantidad válida.'); return; } lock.current = true; setBusy(true); setError(''); setStatus(''); try { const saved = await addition.run({ name: name.trim(), quantity: parsed, unit, client_id: crypto.randomUUID() }); list.setData(saved.list); setName(''); setQuantity('1'); setAdding(false); setStatus('Producto agregado.'); } catch (caught) { setError(errorText(caught)); setStatus(addition.pending ? 'Conservamos este producto. Volvé a guardar para confirmar el resultado sin duplicarlo.' : 'El producto no se guardó. Podés corregirlo y reintentar.'); } finally { setPending(addition.pending); lock.current = false; setBusy(false); } };
  const row = (prototype: SourceNode, item: ShoppingLine) => source(prototype, child => {
    const name = nodeName(child);
    if (name === 'Cell-Item Name') return { children: <><span>{item.name}</span>{item.kind === 'manual' && <button type="button" disabled={busy} className="ml-[8px] underline text-[12px]" aria-label={`Eliminar ${item.name}`} onClick={() => void mutate(() => shoppingApi.remove(patient.id, item.id))}>Eliminar</button>}</> };
    if (name === 'Cell-Category') return { text: item.kind === 'manual' ? 'Agregado' : item.kind === 'derived' ? 'Ingredientes del plan' : 'Indicación del plan' };
    if (name === 'Cell-Qty') return { text: item.quantity === null ? 'Sin cantidad indicada' : `${formatNumber(item.quantity)} ${item.unit ?? ''}` };
    if (['Cell-Calories', 'Cell-Cost', 'Cell-Actual'].includes(name)) return { text: '—' };
    if (name === 'Cell-Status') return { children: <button type="button" disabled={busy} aria-pressed={item.checked} aria-label={`${item.checked ? 'Desmarcar' : 'Marcar como comprado'}: ${item.name}`} onClick={() => void mutate(() => shoppingApi.check(patient.id, { source_key: item.source_key, checked: !item.checked }))} className="rounded-[4px] bg-[#f3f2eb] px-[8px] py-[4px] text-[#272932]">{item.checked ? 'Comprado' : 'Pendiente'}</button> };
    if (/Image|Place Image|Checkbox|Button/.test(name)) return { hidden: true };
    return undefined;
  }, item.source_key);
  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    const input = searchBinding(node, search, setSearch, 'Buscar producto'); if (input) return input;
    if (name === 'Table') { const parts = objects(node); const prototype = parts.find(child => nodeName(child) === 'Table-Row-Grocery List'); const header = parts[0]; return { children: <>{header && source(header, () => undefined)}{list.error ? <Stateful error={list.error} onRetry={list.reload} /> : !list.data ? <Stateful loading /> : !rows.length ? <Stateful empty="No hay productos. Agregá uno o consultá tu plan." /> : prototype && rows.map(item => row(prototype, item))}</> }; }
    if (/Button/.test(name) && text === 'Add Item') return { onClick: () => setAdding(true), label: 'Agregar producto' };
    if (/Button/.test(name) && text === 'Filter') return { onClick: () => setFilter(value => value === 'all' ? 'pending' : 'all'), props: { 'aria-pressed': filter === 'pending' }, label: 'Ver pendientes' };
    if (/Button/.test(name) && text === 'Newest') return { onClick: () => setSort(value => !value), text: sort ? 'Nombre' : 'Orden original' };
    if (name === 'Categories' || name === 'Categories List') return { children: <button type="button" onClick={() => setFilter(value => value === 'all' ? 'pending' : 'all')} className="rounded-[8px] bg-[#f3f2eb] px-[16px] py-[8px]">{filter === 'all' ? 'Todos los productos' : 'Pendientes'}</button> };
    if (/Widget Expense/.test(name)) { const header = objects(node).find(child => nodeName(child) === 'Header-Section'); return { children: <>{header && source(header, child => /Button/.test(nodeName(child)) ? { hidden: true } : undefined)}<Stateful empty="Los precios no están cargados. La lista conserva las cantidades indicadas en el plan." /></> }; }
    if (name === 'Widget Grocery Category') { const header = objects(node).find(child => nodeName(child) === 'Header-Section'); return { children: <>{header && source(header, () => undefined)}<p className="p-[24px] text-[14px]">{all.filter(item => item.kind === 'derived').length} ingredientes del plan · {all.filter(item => item.kind === 'manual').length} agregados · {all.filter(item => item.checked).length} comprados</p></> }; }
    if (name === 'Card Statistic - Grocery List') return { children: objects(node).map(child => source(child, child => nodeName(child) === 'Main Info' ? { text: text.startsWith('Total Items') ? `${all.length} productos` : text.startsWith('Estimated Cost') ? 'Costo sin datos' : 'Calorías sin datos' } : /Info Percentage|Section Percentage|Percentage|Percent/.test(nodeName(child)) ? { hidden: true } : leaf(child) && /[%]|\$|21,615|^40$/.test(sourceText(child)) ? { text: '' } : undefined)) };
    if (name === 'Footer' && /^Showing/.test(text)) return { text: `${rows.length} de ${all.length} productos` };
    return undefined;
  };
  return <FramePair nodes={['105:2472', '492:11324']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {error && <Stateful error={error} />}{status && <p role="status" className="mx-[24px] p-[16px] text-[#272932]">{status}</p>}
    {adding && <RecordDialog title="Agregar producto" onClose={() => setAdding(false)} busy={busy}><form onSubmit={event => void add(event)} className="flex w-full max-w-[420px] flex-col gap-[16px] rounded-[16px] bg-white p-[24px]"><h2 className="text-[22px] font-medium">Agregar producto</h2><label>Producto<input disabled={busy || pending} required maxLength={80} value={name} onChange={event => setName(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Cantidad<input disabled={busy || pending} required type="number" min="0.01" max="100000" step="0.01" value={quantity} onChange={event => setQuantity(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Unidad<select disabled={busy || pending} value={unit} onChange={event => setUnit(event.target.value as RecipeUnit)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]">{RECIPE_UNITS.map(value => <option key={value} value={value}>{value}</option>)}</select></label>{error && <Stateful error={error} />}<div className="flex gap-[8px]"><button type="submit" disabled={busy} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{busy ? 'Guardando…' : pending ? 'Reintentar guardado' : 'Guardar'}</button><button type="button" disabled={busy} onClick={() => setAdding(false)} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">{pending ? 'Cerrar' : 'Cancelar'}</button></div></form></RecordDialog>}
  </FramePair>;
}
