import { DayAssignedMeals } from '../../../components/nutrigo/DayMeals';
import { useState, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { api } from '../../../api/client';
import { useAppStore } from '../../../store/useAppStore';
import { FigmaRecordDialog } from '../../../components/nutrigo/FigmaPatientFront';
import { dateId, dateLabel, descendants, EmptyState, errorText, formatNumber, idEnds, leaf, objects, source, Stateful, timeLabel, type ScreenProps } from './shared';

type Props = ScreenProps & { onLogMeal?: (slot?: string) => void; onHydration?: () => void; onRest?: () => void };
type Log = ScreenProps['patient']['logs'][number];
type Nutrient = 'kcal' | 'carbs_g' | 'protein_g' | 'fat_g';

/** Tamaños de página que ofrece el selector "Showing 12" del archivo. */
const PAGE_SIZES = [12, 24, 48];
const PERIODS = [7, 30, 0];
const periodLabel = (days: number) => days ? `Últimos ${days} días` : 'Todos los registros';
const nutrientLabel: Record<Nutrient, string> = { kcal: 'Calorías registradas', carbs_g: 'Carbohidratos registrados', protein_g: 'Proteínas registradas', fat_g: 'Grasas registradas' };
const reviewLabel = (log: Log) => log.status === 'pending_review' ? 'Pendiente' : log.nutrition_origin === 'ai_estimate' ? 'Revisada · IA' : log.nutrition_origin === 'declared' ? 'Revisada · declarada' : 'Revisada';
const reviewDetail = (log: Log) => log.status === 'pending_review' ? 'Pendiente de revisión: tu nutricionista todavía no la revisó.' : log.nutrition_origin === 'ai_estimate' ? 'Revisada · estimación de IA' : log.nutrition_origin === 'declared' ? 'Revisada · nutrientes declarados' : 'Revisada · origen sin registrar';
/** Fila del archivo cuyo color de momento corresponde (verde desayuno, Saffron almuerzo, naranja merienda, gris cena). */
const slotRow = (slot: string) => /desayuno/i.test(slot) ? 0 : /almuerzo/i.test(slot) ? 1 : /merienda|colaci|snack/i.test(slot) ? 2 : /cena/i.test(slot) ? 3 : 1;
/** La vista de la paciente sólo trae los nombres de los alimentos: se cuenta cuántos tiene el registro. */
const amount = (log: Log): [string, string] => {
  if (log.foods.length) return [String(log.foods.length), log.foods.length === 1 ? 'alimento' : 'alimentos'];
  return ['Sin', 'detalle'];
};
/** Páginas a mostrar con la forma del archivo: 1 2 3 … 7. */
function pageList(pages: number, current: number): (number | null)[] {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
  const middle = [current - 1, current, current + 1].filter(page => page > 1 && page < pages);
  const list: (number | null)[] = [1];
  if (middle[0] > 2) list.push(null);
  list.push(...middle);
  if (middle[middle.length - 1] < pages - 1) list.push(null);
  list.push(pages);
  return list;
}

export function NutrigoDiary({ patient, onNavigate, onSignOut, query = '', now = new Date(), onLogMeal, onHydration, onRest }: Props) {
  const [search, setSearch] = useState(query);
  const [days, setDays] = useState(7);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<'add' | 'filter' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useAppStore(state => state.refreshPatient);
  const matches = (log: Log) => (!pendingOnly || log.status === 'pending_review') && `${log.description} ${log.slot}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'));
  const inWindow = (log: Log, from: number, to: number) => { const at = new Date(log.logged_at).getTime(); return at >= from && at < to; };
  const end = now.getTime() + 86400000; const start = now.getTime() - days * 86400000;
  const rows = patient.logs.filter(log => (!days || inWindow(log, start, end)) && matches(log)).slice().sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  const previous = days ? patient.logs.filter(log => inWindow(log, start - days * 86400000, start) && matches(log)) : [];
  const reviewedOf = (list: Log[]) => list.filter(row => row.status !== 'pending_review' && row.macros);
  const reviewed = reviewedOf(rows);
  const sum = (list: Log[], key: Nutrient) => reviewedOf(list).reduce((total, row) => total + (row.macros?.[key] ?? 0), 0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)); const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * pageSize, current * pageSize);
  const goTo = (value: number) => setPage(Math.max(1, Math.min(pages, value)));
  const setPeriod = (value: number) => { setDays(value); setPage(1); };
  const addWater = async () => { if (busy) return; setBusy(true); setError(''); try { await api.updateHabits(patient.id, { hydration: patient.hydration + 1 }); await refresh(patient.id); } catch (caught) { setError(errorText(caught)); } finally { setBusy(false); } };
  const logMeal = onLogMeal ? () => { setDialog(null); onLogMeal(); } : undefined;

  /** Tarjeta de estadística: total revisado del período y su variación real contra el período anterior. */
  const statistic = (node: SourceNode, nutrient: Nutrient): SourceBinding => {
    const total = sum(rows, nutrient); const before = sum(previous, nutrient);
    const change = days && before > 0 ? ((total - before) / before) * 100 : null;
    return { children: objects(node).map((child, index) => source(child, part => {
      if (leaf(part) && /^Total /.test(sourceText(part))) return { text: nutrientLabel[nutrient] };
      if (leaf(part) && /^[\d,]+$/.test(sourceText(part))) return { text: formatNumber(Math.round(total)) };
      if (leaf(part) && ['kcal', 'gr'].includes(sourceText(part))) return { text: nutrient === 'kcal' ? 'kcal' : 'g' };
      if (nodeName(part) === 'Icon/TrendUp') return { props: { style: { transform: change != null && change < 0 ? 'scaleY(-1)' : undefined, opacity: change == null ? 0.4 : 1 } } };
      if (leaf(part) && /^[+-][\d.]+%$/.test(sourceText(part))) return { text: change == null ? `${reviewed.length}` : `${change > 0 ? '+' : ''}${formatNumber(change)} %` };
      if (leaf(part) && sourceText(part) === 'vs last week') return { text: change == null ? (reviewed.length === 1 ? 'comida revisada' : 'comidas revisadas') : 'respecto del período anterior' };
      return undefined;
    }, index)) };
  };

  /** Fila de la tabla: la fila del archivo del mismo momento del día, con los datos del registro. */
  const tableRow = (prototype: SourceNode, log: Log): ReactNode => {
    const pending = log.status === 'pending_review';
    const value = (key: Nutrient) => pending || !log.macros ? '—' : formatNumber(log.macros[key]);
    const unit = (text: string) => pending || !log.macros ? '' : text;
    const cells: Record<string, ReactNode[]> = {
      'Cell-Date': [dateLabel(log.logged_at), timeLabel(log.logged_at)],
      'Cell-Category': [log.slot],
      'Cell-Menu': [log.description || log.foods.map(food => food.name).join(', ') || 'Comida registrada'],
      'Cell-Amount': amount(log),
      'Cell-Calories': [value('kcal'), unit('kcal')],
      'Data-Carbs': [value('carbs_g'), unit('g')], 'Data-Protein': [value('protein_g'), unit('g')], 'Data-Fats': [value('fat_g'), unit('g')],
      // Plan V no registra azúcar: la celda queda vacía en lugar de inventar un cero.
      'Cell-Sugar': ['—', ''],
      'Cell-Thoughts': [reviewLabel(log)],
    };
    const fill = (cell: SourceNode, values: ReactNode[]): SourceBinding => {
      const leaves = descendants(cell).filter(child => leaf(child) && child.tag === 'p');
      return { props: { title: nodeName(cell) === 'Cell-Thoughts' ? reviewDetail(log) : nodeName(cell) === 'Cell-Sugar' ? 'Plan V no registra azúcar' : undefined }, children: objects(cell).map((child, index) => source(child, part => { const position = leaves.indexOf(part); return position >= 0 ? { text: values[position] ?? '' } : undefined; }, index)) };
    };
    return source(prototype, child => {
      const values = cells[nodeName(child)];
      if (values) return fill(child, values);
      return undefined;
    }, log.id);
  };

  const pagination = (node: SourceNode): SourceBinding => {
    const parts = objects(node);
    const [previousButton, active, idle] = [parts[0], parts[1], parts[2]]; const gap = parts.find(child => sourceText(child) === '...'); const nextButton = parts[parts.length - 1];
    const number = (value: number) => source(value === current ? active : idle, child => child === (value === current ? active : idle) ? { onClick: () => goTo(value), label: `Página ${value}`, props: { 'aria-current': value === current ? 'page' : undefined } } : leaf(child) ? { text: value } : undefined, value);
    return { props: { role: 'navigation', 'aria-label': 'Páginas del diario' }, children: <>
      {source(previousButton, child => child === previousButton ? { onClick: () => goTo(current - 1), label: 'Página anterior', props: { disabled: current <= 1, style: { opacity: current <= 1 ? 0.5 : 1 } } } : undefined, 'previous')}
      {pageList(pages, current).map((value, index) => value == null ? (gap ? source(gap, () => undefined, `gap-${index}`) : null) : number(value))}
      {source(nextButton, child => child === nextButton ? { onClick: () => goTo(current + 1), label: 'Página siguiente', props: { disabled: current >= pages, style: { opacity: current >= pages ? 0.5 : 1 } } } : undefined, 'next')}
    </> };
  };

  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    if (name === 'Card Statistic - Food Diary') return statistic(node, text.startsWith('Total Calories') ? 'kcal' : text.startsWith('Total Carb') ? 'carbs_g' : text.startsWith('Total Proteins') ? 'protein_g' : 'fat_g');
    if (name === 'Table-Body') {
      const prototypes = objects(node).filter(child => nodeName(child) !== 'Section Slider' && !/bg-\[#f9f4f2\]/.test(String(child.props.className)));
      const byMoment = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(label => prototypes.find(row => descendants(row).some(child => leaf(child) && sourceText(child) === label)) ?? prototypes[0]);
      const slider = objects(node).find(child => nodeName(child) === 'Section Slider');
      return { children: <>{shown.length ? shown.map(log => tableRow(byMoment[slotRow(log.slot)], log)) : <EmptyState text={search || pendingOnly ? 'No hay comidas que coincidan con la búsqueda.' : 'Todavía no hay comidas en este período.'} />}{slider && source(slider, () => undefined, 'slider')}</> };
    }
    // "Carbohidratos" no entra en la columna de 56 del archivo.
    if (leaf(node) && text === 'Carbs' && node.tag === 'p') return { text: 'Hidratos', props: { title: 'Carbohidratos' } };
    if (name === 'Section Result') return { children: objects(node).map((child, index) => source(child, part => {
      if (leaf(part) && sourceText(part) === 'Showing') return { text: 'Mostrando' };
      if (nodeName(part) === 'Button') return { onClick: () => { setPageSize(size => PAGE_SIZES[(PAGE_SIZES.indexOf(size) + 1) % PAGE_SIZES.length]); setPage(1); }, label: `Registros por página: ${pageSize}` };
      if (leaf(part) && /^\d+$/.test(sourceText(part))) return { text: pageSize };
      if (leaf(part) && /^out of/.test(sourceText(part))) return { text: `de ${rows.length} ${rows.length === 1 ? 'registro' : 'registros'}` };
      return undefined;
    }, index)) };
    if (name === 'Pagination') return pagination(node);
    // En el celular el archivo corta la tabla al costado: se puede desplazar para ver todas las columnas.
    if (name === 'Table' && idEnds(node, '492:15791')) return { props: { style: { overflowX: 'auto' }, tabIndex: 0, role: 'region', 'aria-label': 'Tabla del diario (desplazá hacia el costado)' } };
    if (name === 'Input-search' && text === 'Search menu') {
      const box = objects(node); const original = descendants(node).find(child => leaf(child) && sourceText(child) === 'Search menu');
      return { props: { style: { minWidth: 0 } }, children: <>{box[0] && source(box[0], () => undefined, 'icon')}<input type="search" aria-label="Buscar comida" placeholder="Buscar comida" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className={String(original?.props.className ?? '').replace('text-center', 'text-left').replace('whitespace-nowrap', '')} style={{ flex: '1 1 0%', minWidth: 0, background: 'transparent', border: 0, outlineOffset: 3 }} /></> };
    }
    if (name === 'Button Picker' && text === 'Filter') return { onClick: () => { setPendingOnly(value => !value); setPage(1); }, props: { 'aria-pressed': pendingOnly, style: pendingOnly ? { background: '#c2e66e' } : undefined }, label: 'Mostrar sólo comidas pendientes de revisión', children: objects(node).map((child, index) => source(child, part => leaf(part) && sourceText(part) === 'Filter' ? { text: pendingOnly ? 'Pendientes' : 'Filtrar' } : undefined, index)) };
    // En el celular el archivo tiene un único botón de ícono: abre período y filtro.
    if (name === 'Button Picker' && idEnds(node, '498:16354')) return { onClick: () => setDialog('filter'), label: 'Filtrar el diario' };
    if (name === 'Button Picker' && text === 'This Week') return { onClick: () => setPeriod(PERIODS[(PERIODS.indexOf(days) + 1) % PERIODS.length]), label: `Período: ${periodLabel(days)}. Cambiar período`, children: objects(node).map((child, index) => source(child, part => leaf(part) && sourceText(part) === 'This Week' ? { text: periodLabel(days) } : undefined, index)) };
    if (name === 'Button CTA' && text === 'Add') return { onClick: () => { setError(''); setDialog('add'); }, label: 'Registrar comida, agua o descanso', children: objects(node).map((child, index) => source(child, part => leaf(part) && sourceText(part) === 'Add' ? { text: 'Registrar' } : undefined, index)) };
    return undefined;
  };
  return <FramePair nodes={['105:2649', '492:14886']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {error && !dialog && <Stateful error={error} />}
    {dialog === 'add' && <FigmaRecordDialog title="Registrar en mi diario" onClose={() => setDialog(null)}>
      <section aria-label="Hábitos de hoy" className="mb-[16px] flex flex-col gap-[8px] text-[#272932]">
        <p className="text-[14px]">Hoy, {dateLabel(dateId(now))} · Agua: {patient.hydration} {patient.hydration === 1 ? 'vaso' : 'vasos'} · Descanso: {patient.sleep}</p>
        <div className="flex flex-wrap gap-[8px]">
          <button type="button" disabled={!logMeal} onClick={logMeal} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">Registrar comida</button>
          <button type="button" disabled={busy} onClick={onHydration ? () => { setDialog(null); onHydration(); } : () => void addWater()} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">{busy ? 'Guardando…' : onHydration ? 'Registrar agua' : 'Registrar un vaso de agua'}</button>
          <button type="button" onClick={() => { setDialog(null); if (onRest) onRest(); else onNavigate('progreso'); }} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Registrar descanso</button>
        </div>
        {error && <Stateful error={error} />}
      </section>
      <DayAssignedMeals patientId={patient.id} date={dateId(now)} />
    </FigmaRecordDialog>}
    {dialog === 'filter' && <FigmaRecordDialog title="Filtrar el diario" onClose={() => setDialog(null)}>
      <fieldset className="flex flex-col gap-[8px] text-[14px] text-[#272932]"><legend className="mb-[8px]">Período</legend>
        {PERIODS.map(value => <label key={value} className="flex items-center gap-[8px]"><input type="radio" name="diary-period" checked={days === value} onChange={() => setPeriod(value)} />{periodLabel(value)}</label>)}
      </fieldset>
      <label className="mt-[16px] flex items-center gap-[8px] text-[14px] text-[#272932]"><input type="checkbox" checked={pendingOnly} onChange={event => { setPendingOnly(event.target.checked); setPage(1); }} />Sólo comidas pendientes de revisión</label>
    </FigmaRecordDialog>}
  </FramePair>;
}
