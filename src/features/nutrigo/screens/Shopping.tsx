import { useRef, useState, type FormEvent, type ReactNode, type UIEvent } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { shoppingApi } from '../../../api/shopping';
import { RECIPE_UNITS, type RecipeUnit } from '../../../types/recipes';
import type { ShoppingKind, ShoppingLine } from '../../../types/shopping';
import { createPendingWrite } from './pending-write';
import { canLeaveWorkspace,useUnsavedChanges } from '../../../components/nutrigo/unsaved-changes';
import { cloneList, descendants, EmptyState, errorText, fields, leaf, objects, percent, Ring, searchBinding, source, RecordDialog, Stateful, useRemote, type ScreenProps } from './shared';
import { argentinaMonth } from './ar-time';
import { boughtLabel, monthName, productCount, quantityLabel, recentMonths } from './shopping-format';
import { leftAlignedSearch } from './search-align';
import { GREEN_BG, swapBackground } from '../source-tone';

/** Solapas del archivo (All Categories, Grains…) con los filtros reales de la lista de Plan V. */
const TABS=[{id:'all',label:'Todos'},{id:'pending',label:'Pendientes'},{id:'checked',label:'Comprados'},{id:'plan',label:'Del plan'},{id:'manual',label:'Agregados'}] as const;
type TabId=(typeof TABS)[number]['id'];
const SORTS=[{id:'original',label:'Original'},{id:'name',label:'Nombre'}] as const;
const PAGE_SIZES=[10,20,50];
/** Origen de cada producto, con los colores del archivo (Green, Saffron, Orange). */
const ORIGINS:Array<{kind:ShoppingKind;label:string;badge:string;color:string}>=[
  {kind:'derived',label:'Del plan',badge:'Del plan',color:'#c2e66e'},
  {kind:'text',label:'Indicaciones',badge:'Indicación',color:'#ffcb65'},
  {kind:'manual',label:'Agregados',badge:'Agregado',color:'#ffa257'},
];
const originOf=(kind:ShoppingKind)=>ORIGINS.find(origin=>origin.kind===kind)??ORIGINS[0];
const HEADER_LABELS:Record<string,string>={'Item Name':'Producto','Category':'Origen','Qty':'Cantidad','Calories':'Calorías','Cost':'Costo','Actual':'Pagado','Status':'Estado'};
const MONTH_SAMPLE=/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;

/** Cambia sólo las hojas de texto de un subárbol del archivo y conserva íconos y estilos. */
function relabel(node:SourceNode,text:(sample:string,child:SourceNode)=>ReactNode|undefined,extra?:SourceResolver,key?:string|number) {
  return fields(node,{},child=>{
    if(child===node)return undefined;
    const custom=extra?.(child);if(custom)return custom;
    if(!leaf(child))return undefined;
    const value=text(sourceText(child),child);
    return value===undefined?undefined:{text:value};
  },key);
}
/** Textos de ancho fijo del archivo («Purchased» en 60, «Protein» en una columna angosta): con otras palabras no se parten en dos renglones. */
const oneLine={whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'} as const;
const dim:SourceBinding={props:{style:{opacity:.4},'aria-hidden':true}};

export function NutrigoShopping({ patient, query = '', onNavigate, onSignOut, now = new Date() }: ScreenProps) {
  const list = useRemote(patient.id, signal => shoppingApi.get(patient.id, signal).then(result => result.list));
  const [search, setSearch] = useState(query); const [tab, setTab] = useState<TabId>('all'); const [sort, setSort] = useState<'original'|'name'>('original');
  const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState(10); const [scroll, setScroll] = useState({ offset: 0, size: .7 });
  const [adding, setAdding] = useState(false); const [error, setError] = useState(''); const [status, setStatus] = useState('');
  const [name, setName] = useState(''); const [quantity, setQuantity] = useState('1'); const [unit, setUnit] = useState<RecipeUnit>('u');
  const [busy, setBusy] = useState(false); const lock = useRef(false); const [pending, setPending] = useState(false);
  const [addition] = useState(() => createPendingWrite((input: Parameters<typeof shoppingApi.add>[1]) => shoppingApi.add(patient.id, input)));
  const closeAddition=()=>{if(canLeaveWorkspace())setAdding(false);};
  const additionDirty=Boolean(name.trim()||quantity!=='1'||unit!=='u'||pending);
  useUnsavedChanges(pending||adding&&additionDirty,busy);
  const all = list.data?.items ?? [];
  const inTab = (item: ShoppingLine) => tab === 'all' || (tab === 'pending' && !item.checked) || (tab === 'checked' && item.checked) || (tab === 'plan' && item.kind !== 'manual') || (tab === 'manual' && item.kind === 'manual');
  const rows = all.filter(item => inTab(item) && item.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'es') : 0);
  // La tabla del archivo muestra diez filas y paginación: la lista larga no se apila entera.
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize);
  const checked = all.filter(item => item.checked).length;
  const byOrigin = ORIGINS.map(origin => ({ ...origin, count: all.filter(item => item.kind === origin.kind).length }));
  const choose = (value: TabId) => { setTab(value); setPage(0); };
  const mutate = async (action: () => ReturnType<typeof shoppingApi.get>) => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setStatus(''); try { const saved = await action(); list.setData(saved.list); setStatus('Lista guardada.'); } catch (caught) { setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const add = async (event: FormEvent) => { event.preventDefault(); if (lock.current) return; const parsed = Number(quantity); if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) { setError('Ingresá el nombre y una cantidad válida.'); return; } lock.current = true; setBusy(true); setError(''); setStatus(''); try { const saved = await addition.run({ name: name.trim(), quantity: parsed, unit, client_id: crypto.randomUUID() }); list.setData(saved.list); setName(''); setQuantity('1'); setAdding(false); setStatus('Producto agregado.'); } catch (caught) { setError(errorText(caught)); setStatus(addition.pending ? 'Conservamos este producto. Volvé a guardar para confirmar el resultado sin duplicarlo.' : 'El producto no se guardó. Podés corregirlo y reintentar.'); } finally { setPending(addition.pending); lock.current = false; setBusy(false); } };
  const onTableScroll = (event: UIEvent<HTMLElement>) => { const el = event.currentTarget; if (el.scrollWidth > 0) setScroll({ offset: el.scrollLeft / el.scrollWidth, size: Math.min(1, el.clientWidth / el.scrollWidth) }); };

  /** Una fila del archivo con un producto real; el estado sale de la fila de ejemplo con ese estado. */
  const row = (prototype: SourceNode, item: ShoppingLine, last: boolean) => source(prototype, child => {
    const cell = nodeName(child);
    if (child === prototype) return last ? { props: { style: { borderBottomWidth: 0 } } } : undefined;
    if (cell === 'Cell-Item Name') return { children: relabel(child, () => item.name, n => leaf(n) ? { text: item.name, props: { title: item.name, style: { flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } } } : nodeName(n) === 'Image' && item.kind === 'manual'
      ? { onClick: () => void mutate(() => shoppingApi.remove(patient.id, item.id)), label: `Eliminar ${item.name}`, props: { disabled: busy, style: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8c90', fontSize: 18 } }, children: <span aria-hidden="true">×</span> }
      : undefined) };
    if (cell === 'Cell-Category') return { children: relabel(child, () => originOf(item.kind).badge, n => nodeName(n) === 'Badge Category - Grocery List' ? { props: { style: { background: originOf(item.kind).color } } } : undefined) };
    if (cell === 'Cell-Qty') return { children: relabel(child, sample => /^\d/.test(sample) ? quantityLabel(item.quantity) : (item.unit ?? ''), n => nodeName(n) === 'Button Group' ? dim : leaf(n) && /^\d/.test(sourceText(n)) ? { text: quantityLabel(item.quantity), props: { title: quantityLabel(item.quantity), style: oneLine } } : undefined) };
    // Plan V no tiene calorías ni precios por producto: las columnas quedan sin dato, como «Actual» en el archivo.
    if (['Cell-Calories', 'Cell-Cost', 'Cell-Actual'].includes(cell)) return { children: relabel(child, sample => /^\d/.test(sample) ? '-' : '') };
    if (cell === 'Cell-Status') return { children: relabel(child, () => item.checked ? 'Comprado' : 'Pendiente', n => leaf(n) ? { text: item.checked ? 'Comprado' : 'Pendiente', props: { style: { width: 'auto', whiteSpace: 'nowrap' } } } : n !== child && objects(child).includes(n) ? { onClick: () => void mutate(() => shoppingApi.check(patient.id, { source_key: item.source_key, checked: !item.checked })), label: `${item.checked ? 'Desmarcar' : 'Marcar como comprado'}: ${item.name}`, props: { disabled: busy, 'aria-pressed': item.checked } } : undefined) };
    return undefined;
  }, item.source_key);

  const tableBinding = (node: SourceNode): SourceBinding => {
    const parts = objects(node);
    const header = parts[0];
    const prototypes = parts.filter(child => nodeName(child) === 'Table-Row-Grocery List');
    const done = prototypes.find(child => /Purchased/.test(sourceText(child))) ?? prototypes[0];
    const open = prototypes.find(child => /Pending/.test(sourceText(child))) ?? prototypes[0];
    const slider = parts.find(child => nodeName(child) === 'Section Slider');
    const body = list.error ? <Stateful error={list.error} onRetry={list.reload} /> : !list.data ? <Stateful loading /> : !visible.length ? <EmptyState text={all.length ? 'No hay productos con este filtro.' : 'No hay productos. Agregá uno o consultá tu plan.'} /> : visible.map((item, index) => row(item.checked ? done : open, item, index === visible.length - 1));
    const bar = slider ? source(slider, child => child === slider ? { props: { style: { position: 'sticky', left: 0 } } } : nodeName(child) === 'Slider' ? { props: { style: { paddingLeft: `${scroll.offset * 100}%`, paddingRight: `${Math.max(0, (1 - scroll.offset - scroll.size) * 100)}%` } } } : undefined, 'slider') : null;
    return { props: slider ? { onScroll: onTableScroll, style: { overflowX: 'auto' } } : undefined, children: <>{header && relabel(header, sample => HEADER_LABELS[sample], undefined, 'head')}{body}{bar}</> };
  };

  /** Leyenda del archivo con los tres orígenes; en el celular viene en dos columnas y se usa la primera. */
  const legend = (list: SourceNode, bind: (node: SourceNode, origin: (typeof byOrigin)[number]) => SourceBinding | undefined): SourceBinding => {
    const columns = objects(list).filter(child => /^Column/.test(nodeName(child)));
    if (!columns.length) return { children: cloneList(list, byOrigin, bind, { key: origin => origin.kind }) };
    return { children: columns.map((column, index) => source(column, n => n === column ? { children: index === 0 ? cloneList(column, byOrigin, bind, { key: origin => origin.kind }) : null } : undefined, index)) };
  };

  /** Sólo el rótulo del origen (no el importe ni el porcentaje) se recorta con puntos suspensivos y lleva su texto completo en `title`. */
  const legendLabel = (n: SourceNode, label: string) => /^(\$|\d)|items$|%$/.test(sourceText(n)) ? undefined : { title: label, style: oneLine };

  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    const input = leftAlignedSearch(searchBinding(node, search, value => { setSearch(value); setPage(0); }, 'Buscar producto')); if (input) return input;
    if (name === 'Table' && objects(node).some(child => nodeName(child) === 'Table-Row-Grocery List')) return tableBinding(node);
    if (name === 'Tab') {
      const tabs = objects(node);
      return { children: TABS.map((entry, index) => {
        const active = entry.id === tab;
        const previousActive = index > 0 && TABS[index - 1].id === tab;
        const prototype = active ? tabs[0] : previousActive ? tabs[1] ?? tabs[0] : tabs[2] ?? tabs[1] ?? tabs[0];
        return source(prototype, child => child === prototype ? { onClick: () => choose(entry.id), props: { 'aria-pressed': active }, label: `Ver ${entry.label.toLocaleLowerCase('es')}`, children: relabel(prototype, () => entry.label) } : undefined, entry.id);
      }) };
    }
    if (leaf(node) && text === 'Sort by:') return { text: 'Ordenar por:' };
    if (/Button/.test(name) && text === 'Newest') { const next = SORTS.find(entry => entry.id !== sort)!; return { onClick: () => setSort(next.id), label: `Ordenar por ${next.label.toLocaleLowerCase('es')}`, children: relabel(node, () => SORTS.find(entry => entry.id === sort)!.label) }; }
    if (/Button/.test(name) && text === 'Add Item') return { onClick: () => setAdding(true), label: 'Agregar producto', children: relabel(node, () => 'Agregar producto') };
    if (/Button/.test(name) && text === 'Filter') return { onClick: () => choose(tab === 'pending' ? 'all' : 'pending'), props: { 'aria-pressed': tab === 'pending', ...(tab === 'pending' ? swapBackground(node, ['bg-white', 'bg-[#eeeeef]'], GREEN_BG).props : {}) }, label: 'Ver sólo pendientes', children: relabel(node, () => 'Pendientes') };
    if (name === 'Footer' && objects(node).some(child => nodeName(child) === 'Pagination' || nodeName(child) === 'Section Result')) return { children: relabel(node, sample => sample === 'Showing' ? 'Mostrando' : /^out of/.test(sample) ? `de ${productCount(rows.length)}` : undefined, child => {
      if (nodeName(child) === 'Button' && sourceText(child) === '10') { const next = PAGE_SIZES[(PAGE_SIZES.indexOf(pageSize) + 1) % PAGE_SIZES.length]; return { onClick: () => { setPageSize(next); setPage(0); }, label: `Productos por página: ${pageSize}. Cambiar a ${next}`, children: relabel(child, () => String(pageSize)) }; }
      if (nodeName(child) === 'Pagination') {
        const parts = objects(child), arrows = parts.filter(part => nodeName(part) === 'Button Icon'), numbers = parts.filter(part => nodeName(part) === 'Button');
        const activeButton = numbers.find(part => /c2e66e/.test(String(part.props.className))) ?? numbers[0], idleButton = numbers.find(part => part !== activeButton) ?? activeButton;
        const first = Math.max(0, Math.min(current - 2, pages - 4)), shown = Array.from({ length: Math.min(4, pages) }, (_, index) => first + index);
        const arrow = (part: SourceNode | undefined, label: string, target: number, disabled: boolean, key: string) => part ? source(part, n => n === part ? { onClick: () => setPage(target), label, props: { disabled } } : undefined, key) : null;
        return { children: <>{arrow(arrows[0], 'Página anterior', current - 1, current === 0, 'prev')}{shown.map(index => source(index === current ? activeButton : idleButton, n => n === (index === current ? activeButton : idleButton) ? { onClick: () => setPage(index), label: `Página ${index + 1}`, props: { 'aria-current': index === current ? 'page' : undefined }, children: relabel(n, () => String(index + 1)) } : undefined, index))}{arrow(arrows[1], 'Página siguiente', current + 1, current >= pages - 1, 'next')}</> };
      }
      return undefined;
    }) };
    if (name === 'Card Statistic - Grocery List') {
      const kind = text.includes('Estimated Cost') ? 'cost' : text.includes('Total Items') ? 'items' : 'calories';
      return { children: relabel(node, (sample, child) => {
        if (['Estimated Cost', 'Total Items', 'Total Calories'].includes(sample)) return kind === 'cost' ? 'Costo' : kind === 'items' ? 'Productos' : 'Calorías';
        // Sin precios ni calorías por producto, las fichas quedan en cero y la etiqueta lo aclara.
        if (/%$/.test(sample)) return kind === 'items' ? boughtLabel(checked) : kind === 'cost' ? 'Sin precios' : 'Sin calcular';
        if (/SemiBold/.test(String(child.props.className))) return kind === 'items' ? String(all.length) : kind === 'cost' ? '$0' : '0';
        return kind === 'items' ? (all.length === 1 ? 'producto' : 'productos') : kind === 'calories' ? 'kcal' : '';
      }) };
    }
    if (name === 'Widget Expense Overview') {
      const count = descendants(node).filter(child => leaf(child) && MONTH_SAMPLE.test(sourceText(child))).length;
      const months = recentMonths(now, count); const thisMonth = months[months.length - 1] ?? argentinaMonth(now);
      let month = 0;
      return { children: relabel(node, sample => {
        if (/^Last \d+ Months$/.test(sample)) return `Últimos ${count} meses`;
        if (MONTH_SAMPLE.test(sample)) return monthName((months[month++] ?? thisMonth).month);
        if (/^\$\d+$/.test(sample)) return sample === '$0' ? '$0' : '';
        return undefined;
      }, child => nodeName(child) === 'Div Bar' ? { props: { style: { height: 0 } } } : nodeName(child) === 'Tooltip' ? { children: relabel(child, sample => /\d{4}$/.test(sample) ? `${monthName(thisMonth.month)} ${thisMonth.year}` : 'Sin precios') } : undefined) };
    }
    if (name === 'Widget Expense Breakdown') return { children: relabel(node, sample => sample === 'Total Expense' ? 'Sin precios cargados' : sample === 'This Week' ? 'Esta semana' : /^\d+$/.test(sample) ? '0' : undefined, child => {
      if (nodeName(child) === 'Chart') return { children: <><Ring pct={0} color="#c2e66e" track="#eeeeef" thickness={22} />{objects(child).filter(part => !/^Donut/.test(nodeName(part))).map((part, index) => source(part, n => !leaf(n) ? undefined : /^\d+$/.test(sourceText(n)) ? { text: '0' } : sourceText(n) === '$' ? { text: '$' } : sourceText(n) === 'Total Expense' ? { text: 'Sin precios' } : undefined, index))}</> };
      if (nodeName(child) === 'List Expense Breakdown') return legend(child, (n, origin) => leaf(n) ? { text: /^\$/.test(sourceText(n)) ? '$0' : /%$/.test(sourceText(n)) ? '0%' : origin.label, props: legendLabel(n, origin.label) } : undefined);
      return undefined;
    }) };
    if (name === 'Widget Grocery Category') return { children: relabel(node, sample => sample === 'Total' ? 'Total' : /^\d+$/.test(sample) ? String(all.length) : sample === 'Items' ? (all.length === 1 ? 'producto' : 'productos') : undefined, child => {
      if (nodeName(child) === 'Chart Bar') {
        const bars = objects(child);
        if (!all.length) return { children: bars.slice(-1).map((bar, index) => source(bar, () => ({ props: { style: { width: 'auto', flex: '1 1 0%' } } }), index)) };
        return { children: byOrigin.map((origin, index) => bars[index] ? source(bars[index], n => n === bars[index] ? { props: { style: { width: 'auto', minWidth: 0, flex: `${origin.count} 1 0%`, display: origin.count ? undefined : 'none' } } } : undefined, origin.kind) : null) };
      }
      if (nodeName(child) === 'List Expense Breakdown') return legend(child, (n, origin) => leaf(n) ? { text: /items$/.test(sourceText(n)) ? productCount(origin.count) : /%$/.test(sourceText(n)) ? `${Math.round(percent(origin.count, all.length) ?? 0)}%` : origin.label, props: legendLabel(n, origin.label) } : undefined);
      return undefined;
    }) };
    return undefined;
  };
  return <FramePair nodes={['105:2472', '492:11324']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {error && !adding && <Stateful error={error} />}{status && <p role="status" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>{status}</p>}
    {adding && <RecordDialog title="Agregar producto" onClose={closeAddition} busy={busy} dirty={additionDirty}><form onSubmit={event => void add(event)} className="flex w-full max-w-[420px] flex-col gap-[16px] rounded-[16px] bg-white p-[24px]"><h2 className="text-[22px] font-medium">Agregar producto</h2><label>Producto<input disabled={busy || pending} required maxLength={80} value={name} onChange={event => setName(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Cantidad<input disabled={busy || pending} required type="number" min="0.01" max="100000" step="0.01" value={quantity} onChange={event => setQuantity(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Unidad<select disabled={busy || pending} value={unit} onChange={event => setUnit(event.target.value as RecipeUnit)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]">{RECIPE_UNITS.map(value => <option key={value} value={value}>{value}</option>)}</select></label>{error && <Stateful error={error} />}<div className="flex gap-[8px]"><button type="submit" disabled={busy} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{busy ? 'Guardando…' : pending ? 'Reintentar guardado' : 'Guardar'}</button><button type="button" disabled={busy} onClick={closeAddition} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">{pending ? 'Cerrar' : 'Cancelar'}</button></div></form></RecordDialog>}
  </FramePair>;
}
