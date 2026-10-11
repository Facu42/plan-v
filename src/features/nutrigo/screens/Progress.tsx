import { useEffect, useState, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { progressApi } from '../../../api/progress';
import { careApi } from '../../../api/care';
import { nutritionTargetApi } from '../../../api/nutrition-target';
import { latestMeasurementSeries } from '../../../lib/measurement-display';
import type { CareRecord } from '../../../types/care';
import { PROGRESS_PERIODS, type ProgressPeriodDays, type ProgressPoint, type ProgressSeries } from '../../../types/progress';
import { dateLabel, descendants, EmptyState, errorText, formatNumber, leaf, objects, source, Stateful, useRemote, type ScreenProps } from './shared';
import { attachmentHref } from './message-format';
import { dayOfIso, cleanAmount, litresLabel, percentLabel, safePercent } from './home-values';

/** Un vaso son 250 ml. Plan V no guarda una meta de agua: los porcentajes usan la referencia general de 8 vasos (2 L), igual que en Inicio. */
const WATER_GOAL_GLASSES = 8;
/** El gráfico de descanso va de 0 a 10 horas (las cinco marcas del archivo). */
const SLEEP_SCALE_MINUTES = 600;
const SLEEP_STAGE_PX = 161;
const WEIGHT_SLOTS = 6;

const is = (node: SourceNode, ...samples: string[]) => leaf(node) && samples.includes(sourceText(node));
/** Hijos del nodo con otro enlazador (para no perder clases ni íconos del archivo). */
const inner = (node: SourceNode, resolve: SourceResolver): ReactNode[] => node.children.map((child, index) => typeof child === 'object' ? source(child, resolve, index) : child);
const utc = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00Z`);
const weekday = (date: string) => { const value = utc(date); return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '').replace(/^./, letter => letter.toUpperCase()); };
const dayMonth = (date: string) => { const value = utc(date); return Number.isNaN(value.getTime()) ? '' : `${value.getUTCDate()}/${value.getUTCMonth() + 1}`; };
const duration = (minutes: number | null) => {
  if (minutes == null) return 'Sin registro';
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)} h${total % 60 ? ` ${total % 60} min` : ''}`;
};
const litres = (glasses: number) => `${litresLabel(glasses)} L`;
const isNamed = (node: SourceNode, name: string) => nodeName(node) === name;
const has = (node: SourceNode, name: string) => descendants(node).some(child => nodeName(child) === name);

/** Elige hasta seis registros repartidos en el período (siempre el primero y el último). */
function weightSlots(points: ProgressPoint[]) {
  const sorted = points.slice().sort((a, b) => a.captured_on.localeCompare(b.captured_on) || a.created_at.localeCompare(b.created_at));
  if (sorted.length <= WEIGHT_SLOTS) return sorted;
  return Array.from({ length: WEIGHT_SLOTS }, (_, index) => sorted[Math.round((index * (sorted.length - 1)) / (WEIGHT_SLOTS - 1))]);
}
/** Curva suave como la del archivo: tramos planos hasta los bordes y curvas entre registros. */
function weightPath(points: { x: number; y: number }[], width: number) {
  if (!points.length) return '';
  const first = points[0]; const last = points[points.length - 1];
  let path = `M0 ${first.y} L${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]; const to = points[index]; const half = (to.x - from.x) / 2;
    path += ` C${from.x + half} ${from.y} ${to.x - half} ${to.y} ${to.x} ${to.y}`;
  }
  return `${path} L${width} ${last.y}`;
}
/** Descarta registros cuyo valor no es un número finito: no se pueden dibujar ni mostrar. */
function finiteSeries(series: ProgressSeries | undefined): ProgressSeries | undefined {
  if (!series) return series;
  const current = series.current.filter(point => Number.isFinite(point.value));
  const last = series.current_last && Number.isFinite(series.current_last.value) ? series.current_last : current[current.length - 1] ?? null;
  return { ...series, current, current_last: last };
}
const LINE_VIEWBOX = '0 0 600 181';
const svgLayer = 'absolute inset-0 block size-full overflow-visible';
/** Área bajo la curva (nodo «Line Area» del archivo): mismo degradé #FFCB65 de 0,24 a 0 que el SVG original. */
function WeightArea({ points }: { points: { x: number; y: number }[] }) {
  const line = weightPath(points, 600);
  if (!line) return null;
  return <svg aria-hidden="true" viewBox={LINE_VIEWBOX} preserveAspectRatio="none" className={svgLayer}>
    <defs><linearGradient id="planv-weight-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffcb65" stopOpacity="0.24" /><stop offset="1" stopColor="#ffcb65" stopOpacity="0" /></linearGradient></defs>
    <path d={`${line} L600 150 L0 150 Z`} fill="url(#planv-weight-area)" />
  </svg>;
}
/** Trazo de la curva (nodo «Line» del archivo): mismo color, grosor 2 y extremo redondo que el SVG original. */
function WeightStroke({ points }: { points: { x: number; y: number }[] }) {
  const line = weightPath(points, 600);
  if (!line) return null;
  return <svg aria-hidden="true" viewBox={LINE_VIEWBOX} preserveAspectRatio="none" className={svgLayer}>
    <path d={line} fill="none" stroke="#ffcb65" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
  </svg>;
}
const centered = "flex size-full items-center justify-center font-['Poppins:Regular'] text-[12px] leading-[1.3] text-[#8a8c90]";

type Props = ScreenProps & { onRecord?: () => void; onHydration?: () => void; onRest?: () => void };
export function NutrigoProgress({ patient, onNavigate, onSignOut, onRecord, onHydration, onRest }: Props) {
  const [days, setDays] = useState<ProgressPeriodDays>(30);
  const remote = useRemote(`${patient.id}:${days}`, async signal => {
    const [progress, care, target] = await Promise.all([progressApi.get(patient.id, days, signal), careApi.snapshot(patient.id, false, signal), nutritionTargetApi.get(patient.id, false, signal).then(result => result.target, () => null)]);
    return { progress: progress.progress, care, target };
  });
  useEffect(() => { const update = () => remote.reload(); window.addEventListener('plan-v:care-changed', update); return () => window.removeEventListener('plan-v:care-changed', update); }, [remote.reload]);
  const [error, setError] = useState(''); const [opening, setOpening] = useState<string | null>(null);
  const [photoLinks, setPhotoLinks] = useState<Record<string, string>>({});
  const loading = !remote.data && !remote.error;
  const record = onRecord ?? (() => onNavigate('ficha'));
  const nextPeriod = PROGRESS_PERIODS[(PROGRESS_PERIODS.indexOf(days) + 1) % PROGRESS_PERIODS.length];
  const period: SourceBinding = { onClick: () => setDays(nextPeriod), label: `Período de las medidas: últimos ${days} días. Cambiar a ${nextPeriod} días` };
  const periodText = `Últimos ${days} días`;

  // Medidas compartidas: peso, cintura y cadera (Plan V no registra pecho, brazo ni muslo).
  const allSeries = remote.data?.progress.series ?? [];
  const series = (kind: 'weight' | 'waist' | 'hip') => finiteSeries(latestMeasurementSeries(allSeries, kind));
  const weight = series('weight'); const waist = series('waist'); const hip = series('hip');
  const weightUnit = weight?.unit ?? 'kg'; const lengthUnit = waist?.unit ?? hip?.unit ?? 'cm';
  const slots = weightSlots(weight?.current ?? []);
  const offset = WEIGHT_SLOTS - slots.length;
  const values = slots.map(point => point.value); const low = Math.min(...values); const high = Math.max(...values);
  const pointY = (value: number) => high === low ? 71 : 118 - ((value - low) / (high - low)) * 94;
  const coords = slots.map((point, index) => ({ x: (offset + index + 0.5) * 100, y: pointY(point.value) }));
  const firstWeight = slots[0] ?? null;
  const allWeights = allSeries.filter(row => row.kind === 'weight').flatMap(row => [...row.current, ...row.previous]).filter(point => Number.isFinite(point.value));
  const measuredDates = [...new Set([...(waist?.current ?? []), ...(hip?.current ?? [])].map(point => point.captured_on))].sort();
  const valueOn = (points: ProgressPoint[] | undefined, date: string) => points?.filter(point => point.captured_on === date).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.value;

  // Fotos privadas: se abren con un permiso temporal, nunca se muestran sin pedirlo.
  const photos = (remote.data?.care.records ?? []).filter(item => item.data.kind === 'body_photo').sort((a, b) => b.recorded_on.localeCompare(a.recorded_on));
  const openPhoto = async (item: CareRecord) => { if (opening) return; setOpening(item.id); setError(''); try { const grant = await careApi.openPhoto(patient.id, item.id); setPhotoLinks(links => ({ ...links, [item.id]: grant.url })); } catch (caught) { setError(errorText(caught)); } finally { setOpening(null); } };
  const photoUrl = (id: string) => attachmentHref(photoLinks[id]);

  // Hábitos de los últimos siete días que ya registró la paciente.
  const week = patient.journey?.days ?? [];
  const kcalOn = (date: string) => patient.logs.filter(log => dayOfIso(log.logged_at) === date && log.macros).reduce((sum, log) => sum + (cleanAmount(log.macros?.kcal) ?? 0), 0);
  const burnedOn = (date: string) => (remote.data?.care.records ?? []).reduce((sum, row) => sum + (row.recorded_on === date && row.data.kind === 'activity' ? cleanAmount(row.data.kcal) ?? 0 : 0), 0);
  const calorieDays = week.slice(-4).map(day => ({ date: day.date, eaten: kcalOn(day.date), burned: burnedOn(day.date) }));
  const target = cleanAmount(remote.data?.target?.result?.kcal) || null;
  const today = calorieDays[calorieDays.length - 1];
  const scale = Math.max(2000, Math.ceil(Math.max(target ?? 0, ...calorieDays.flatMap(day => [day.eaten, day.burned])) / 500) * 500);
  const sleepDays = week.slice(-5).map(day => ({ ...day, sleepMinutes: cleanAmount(day.sleepMinutes) }));
  const waterDays = week.slice(-7).map(day => ({ ...day, hydration: cleanAmount(day.hydration) ?? 0 }));
  const waterTotal = waterDays.reduce((sum, day) => sum + day.hydration, 0);
  const waterAverage = waterDays.length ? waterTotal / waterDays.length : 0;

  const pickerText = (node: SourceNode, text: string, action?: () => void, label?: string): SourceBinding => ({ ...(action ? { onClick: action, label: label ?? text } : {}), children: inner(node, child => leaf(child) ? { text } : undefined) });

  const bodyFigure: SourceResolver = node => {
    if (isNamed(node, 'Button Picker')) return { ...period, children: inner(node, child => leaf(child) ? { text: periodText } : undefined) };
    if (isNamed(node, 'Info Progress')) {
      const label = descendants(node).map(sourceText).find(text => ['Chest', 'Waist', 'Hips', 'Arm', 'Thigh'].includes(text));
      const data = label === 'Waist' ? waist : label === 'Hips' ? hip : undefined;
      const last = data?.current_last;
      return { children: inner(node, child => {
        if (!leaf(child) || child === node) return undefined;
        if (/^\d/.test(sourceText(child))) return { text: last ? formatNumber(last.value) : loading ? '…' : 'Sin dato' };
        if (is(child, 'cm')) return { text: last ? data!.unit : '' };
        return undefined;
      }) };
    }
    return undefined;
  };

  const weightWidget: SourceResolver = node => {
    if (isNamed(node, 'Button More')) return { onClick: record, label: 'Registrar peso y medidas' };
    if (isNamed(node, 'Item Info Weight')) {
      const label = descendants(node).map(sourceText).find(text => ['Start Weight', 'Current Weight', 'Weight Goal'].includes(text));
      const point = label === 'Start Weight' ? firstWeight : label === 'Current Weight' ? weight?.current_last ?? null : null;
      return { children: inner(node, child => {
        if (leaf(child) && /^\d+$/.test(sourceText(child))) return { text: point ? formatNumber(point.value) : label === 'Weight Goal' ? 'Sin meta' : loading ? '…' : '0' };
        if (is(child, 'Kg', 'kg')) return { text: point || label !== 'Weight Goal' ? weightUnit : '' };
        return undefined;
      }) };
    }
    if (isNamed(node, 'Chart') && has(node, 'Columns')) {
      const months = descendants(node).filter(child => is(child, 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'));
      const columns = descendants(node).filter(child => isNamed(child, 'Column'));
      return { children: inner(node, child => {
        if (months.includes(child)) { const slot = months.indexOf(child) - offset; return { text: slots[slot] ? dayMonth(slots[slot].captured_on) : '' }; }
        // El área y el trazo son los nodos «Line Area» y «Line» del archivo: se quedan, con la curva de los datos reales (vacíos si no hay registros).
        if (isNamed(child, 'Line Area')) return { props: { style: { inset: 0 } }, children: <WeightArea points={coords} /> };
        if (isNamed(child, 'Line')) return { props: { style: { inset: 0 } }, children: <WeightStroke points={coords} /> };
        if (isNamed(child, 'Columns') && !slots.length) return { children: <EmptyState text={loading ? 'Cargando…' : 'Sin registros de peso en este período.'} /> };
        if (columns.includes(child)) {
          const point = slots[columns.indexOf(child) - offset];
          if (!point) return { children: null };
          return { props: { style: { paddingBottom: `${Math.round(188 - pointY(point.value))}px` } }, children: inner(child, grand => leaf(grand) ? { text: `${formatNumber(point.value)} ${weightUnit}` } : undefined) };
        }
        return undefined;
      }) };
    }
    return undefined;
  };

  const photoCard = (prototype: SourceNode, photo: CareRecord | null, key: string) => source(prototype, node => {
    if (isNamed(node, 'Place Image Here')) {
      if (!photo) return { onClick: record, label: 'Agregar una foto de progreso', children: <span className={centered}>{loading ? 'Cargando…' : 'Agregar foto'}</span> };
      const url = photoUrl(photo.id);
      if (url) return { children: <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block" aria-label={`Abrir la foto del ${dateLabel(photo.recorded_on)} en otra pestaña`}><img src={url} alt={`Foto de progreso del ${dateLabel(photo.recorded_on)}`} className="block size-full object-cover" /></a> };
      return { onClick: () => void openPhoto(photo), label: `Ver la foto privada del ${dateLabel(photo.recorded_on)}`, children: <span className={centered}>{opening === photo.id ? 'Preparando…' : 'Ver foto'}</span> };
    }
    const sameDay = photo ? allWeights.filter(point => point.captured_on === photo.recorded_on).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] : undefined;
    if (leaf(node) && /\d{4}$/.test(sourceText(node))) return { text: photo ? dateLabel(photo.recorded_on) : 'Sin fotos' };
    if (is(node, '82')) return { text: sameDay ? formatNumber(sameDay.value) : '' };
    if (is(node, 'Kg')) return { text: sameDay ? weightUnit : '' };
    return undefined;
  }, key);
  const photosWidget: SourceResolver = node => {
    if (isNamed(node, 'Button Picker')) return pickerText(node, 'Agregar', record, 'Agregar una foto de progreso');
    if (isNamed(node, 'Carousel')) {
      const cards = objects(node).filter(child => isNamed(child, 'Item List Photo Carousel'));
      const shade = objects(node).filter(child => !isNamed(child, 'Item List Photo Carousel'));
      if (!cards.length) return undefined;
      return { children: <>{photos.length ? photos.map((photo, index) => photoCard(cards[index % cards.length], photo, photo.id)) : photoCard(cards[0], null, 'empty')}{shade.map((child, index) => source(child, () => undefined, `shade-${index}`))}</> };
    }
    return undefined;
  };

  const table = (node: SourceNode): SourceBinding => {
    const [header, ...rows] = objects(node);
    if (!header || !rows.length) return {};
    const titles: Record<string, string> = { 'Chest (cm)': `Pecho (${lengthUnit})`, 'Arm (cm)': `Brazo (${lengthUnit})`, 'Waist (cm)': `Cintura (${lengthUnit})`, 'Hips (cm)': `Cadera (${lengthUnit})`, 'Thigh (cm)': `Muslo (${lengthUnit})` };
    const head = source(header, child => {
      if (isNamed(child, 'Cell-Week')) return { ...period, children: inner(child, grand => leaf(grand) ? { text: periodText } : undefined) };
      if (leaf(child) && sourceText(child) in titles) return { text: titles[sourceText(child)] };
      return undefined;
    }, 'header');
    const body = measuredDates.map((date, index) => {
      const row = rows[index % rows.length];
      const cells = [dateLabel(date), '—', '—', valueOn(waist?.current, date) ?? '—', valueOn(hip?.current, date) ?? '—', '—'];
      return source(row, child => {
        if (child === row) return { children: objects(row).map((cell, column) => source(cell, grand => leaf(grand) ? { text: typeof cells[column] === 'number' ? formatNumber(cells[column] as number) : cells[column] || ' ' } : undefined, column)) };
        return undefined;
      }, date);
    });
    return { children: <>{head}{body.length ? body : <EmptyState text={loading ? 'Cargando…' : 'Sin medidas de cintura o cadera en este período.'} />}</> };
  };

  const caloriesWidget = (node: SourceNode): SourceBinding => {
    const columns = descendants(node).filter(child => isNamed(child, 'Chart Column') && has(child, 'Div Bar'));
    const labels = descendants(node).filter(child => is(child, '2000', '1500', '1000', '500', '0'));
    const resolve: SourceResolver = child => {
      if (isNamed(child, 'Button Picker')) return pickerText(child, 'Ver diario', () => onNavigate('diario'), 'Ver el diario de comidas');
      if (columns.includes(child)) {
        const day = calorieDays[columns.indexOf(child)];
        return { children: inner(child, grand => {
          if (isNamed(grand, 'Bar 1') && /bg-\[#/.test(String(grand.props.className))) {
            const value = /ffa257/.test(String(grand.props.className)) ? day?.burned ?? 0 : day?.eaten ?? 0;
            const pct = safePercent(value, scale) ?? 0;
            return { props: { style: { flex: `0 0 ${pct}%`, minHeight: 0 } } };
          }
          if (is(grand, 'Mon', 'Tue', 'Wed', 'Thu')) return { text: day ? weekday(day.date) : '' };
          return undefined;
        }) };
      }
      if (labels.includes(child)) return { text: formatNumber((scale * (4 - labels.indexOf(child))) / 4) };
      if (is(child, '450')) return { text: formatNumber(target != null && today ? Math.max(0, target - today.eaten) : today?.eaten ?? 0) };
      if (is(child, 'kcal left')) return { text: target != null ? 'kcal restantes hoy' : 'kcal revisadas hoy' };
      if (is(child, 'Calorie Goal: 2,000 kcal')) return { text: target != null ? `Meta diaria: ${formatNumber(target)} kcal` : 'Sin meta diaria indicada' };
      if (is(child, '1,755')) return { text: formatNumber(calorieDays[1]?.eaten ?? 0) };
      return undefined;
    };
    return { children: inner(node, resolve) };
  };

  const sleepWidget = (node: SourceNode): SourceBinding => {
    const columns = descendants(node).filter(child => isNamed(child, 'Chart Column') && has(child, 'Bars Stage'));
    const axis: Record<string, string> = { '9:00 PM': '10 h', '11:00 PM': '7,5 h', '1:00 AM': '5 h', '3:00 AM': '2,5 h', '5:00 AM': '0 h' };
    const legend: Record<string, string> = { 'Deep Sleep': 'Dormido', 'Light Sleep': 'Ligero', 'REM Phase': 'REM', Awake: 'Sin registro' };
    const resolve: SourceResolver = child => {
      if (isNamed(child, 'Button Picker')) return pickerText(child, onRest ? 'Registrar' : 'Últimos 5 días', onRest, 'Registrar descanso');
      if (leaf(child) && sourceText(child) in axis) return { text: axis[sourceText(child)] };
      if (leaf(child) && sourceText(child) in legend) return { text: legend[sourceText(child)] };
      if (columns.includes(child)) {
        const day = sleepDays[columns.indexOf(child) - (columns.length - sleepDays.length)];
        const minutes = day?.sleepMinutes ?? null;
        return { children: inner(child, grand => {
          if (isNamed(grand, 'Bars Stage')) {
            // Plan V guarda las horas dormidas, no las fases: el total va en la primera barra «Deep»; las demás barras del archivo
            // quedan en su lugar con alto 0 (y sin separación), nunca se quitan.
            const parts = objects(grand);
            const slept = parts.find(part => isNamed(part, 'Deep'));
            const height = minutes ? Math.max(4, Math.min(SLEEP_STAGE_PX, (minutes / SLEEP_SCALE_MINUTES) * SLEEP_STAGE_PX)) : 0;
            const sized = (part: SourceNode, index: number) => source(part, () => part === slept ? { props: { style: { height: `${height}px` } } } : /flex-\[1_0_0\]/.test(String(part.props.className)) ? undefined : { props: { style: { height: 0, minHeight: 0 } } }, index);
            const awake = parts.filter(part => /flex-\[1_0_0\]/.test(String(part.props.className)));
            const rest = parts.filter(part => !awake.includes(part));
            const accessible = day ? { 'aria-label': `${weekday(day.date)}: ${duration(minutes)}`, role: 'img' } : {};
            return { props: { ...accessible, style: { gap: 0 } }, children: <>{awake.map(part => sized(part, parts.indexOf(part)))}{rest.map(part => sized(part, parts.indexOf(part)))}</> };
          }
          if (leaf(grand) && /^\d+h \d+m$/.test(sourceText(grand))) return { text: day ? duration(minutes) : '' };
          if (is(grand, 'Sun', 'Mon', 'Tue', 'Wed', 'Thu')) return { text: day ? weekday(day.date) : '' };
          return undefined;
        }) };
      }
      return undefined;
    };
    return { children: inner(node, resolve) };
  };

  const hydrationWidget = (node: SourceNode): SourceBinding => {
    const columns = descendants(node).filter(child => isNamed(child, 'Chart Column') && has(child, 'Div Bar'));
    const resolve: SourceResolver = child => {
      if (isNamed(child, 'Button Picker')) return pickerText(child, onHydration ? 'Registrar' : 'Últimos 7 días', onHydration, 'Registrar agua');
      if (isNamed(child, 'Info Detail')) {
        const average = descendants(child).some(grand => is(grand, 'Hydration Level'));
        return { children: inner(child, grand => {
          if (is(grand, 'Hydration Level')) return { text: 'Promedio diario' };
          if (is(grand, 'Intake')) return { text: 'Total de la semana' };
          if (is(grand, 'Normal', '2.0 L')) return { text: average ? litres(waterAverage) : litres(waterTotal) };
          return undefined;
        }) };
      }
      if (columns.includes(child)) {
        const day = waterDays[columns.indexOf(child) - (columns.length - waterDays.length)];
        const glasses = day?.hydration ?? 0;
        const pct = safePercent(glasses, WATER_GOAL_GLASSES) ?? 0;
        return { children: inner(child, grand => {
          if (isNamed(grand, 'Amount')) return { props: { style: { flex: `${100 - pct} 1 0%`, paddingTop: 0 } }, children: inner(grand, part => leaf(part) ? { text: percentLabel(glasses, WATER_GOAL_GLASSES) } : undefined) };
          if (isNamed(grand, 'Bar 1')) return { props: { style: { flex: `${pct} 1 0%` } } };
          if (leaf(grand) && /^\d+\.\d L$/.test(sourceText(grand))) return { text: day ? litres(glasses) : '' };
          if (is(grand, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')) return { text: day ? weekday(day.date) : '' };
          return undefined;
        }) };
      }
      return undefined;
    };
    return { children: inner(node, resolve) };
  };

  const resolver: SourceResolver = node => {
    const name = nodeName(node);
    if (name === 'Image Area' && has(node, 'Info Progress')) return { children: inner(node, bodyFigure) };
    if (name === 'Widget Weight Tracking') return { children: inner(node, weightWidget) };
    if (name === 'Widget Progress Photos') return { children: inner(node, photosWidget) };
    if (name === 'Section Table Body Measurement') return table(node);
    if (name === 'Widget Calories Activities') return caloriesWidget(node);
    if (name === 'Widget Sleep Statistics') return sleepWidget(node);
    if (name === 'Widget Hydration') return hydrationWidget(node);
    return undefined;
  };
  return <FramePair nodes={['105:2790', '498:18237']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {remote.error && <Stateful error={remote.error} onRetry={remote.reload} />}{error && <Stateful error={error} />}
  </FramePair>;
}
