import { useEffect, useState, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { progressApi } from '../../../api/progress';
import { careApi } from '../../../api/care';
import { latestMeasurementSeries } from '../../../lib/measurement-display';
import type { CareRecord } from '../../../types/care';
import type { ProgressPeriodDays } from '../../../types/progress';
import { dateId, dateLabel, descendants, errorText, fields, formatNumber, idEnds, leaf, objects, source, Stateful, useRemote, type ScreenProps } from './shared';

type Props = ScreenProps & { onRecord?: () => void; onHydration?: () => void; onRest?: () => void };
export function NutrigoProgress({ patient, onNavigate, onSignOut, onRecord, onHydration, onRest }: Props) {
  const [days, setDays] = useState<ProgressPeriodDays>(30);
  const remote = useRemote(`${patient.id}:${days}`, async signal => { const [progress, care] = await Promise.all([progressApi.get(patient.id, days, signal), careApi.snapshot(patient.id, false, signal)]); return { progress: progress.progress, care }; });
  useEffect(() => { const update=() => remote.reload(); window.addEventListener('plan-v:care-changed',update); return () => window.removeEventListener('plan-v:care-changed',update); },[remote.reload]);
  const [error, setError] = useState(''); const [opening, setOpening] = useState<string | null>(null);
  const series = (kind: 'weight' | 'waist' | 'hip') => latestMeasurementSeries(remote.data?.progress.series ?? [], kind);
  const weight = series('weight'); const photos = remote.data?.care.records.filter(item => item.data.kind === 'body_photo') ?? [];
  const [photoLinks,setPhotoLinks]=useState<Record<string,string>>({});
  const openPhoto = async (item: CareRecord) => { if (opening) return; setOpening(item.id); setError(''); try { const grant = await careApi.openPhoto(patient.id, item.id); setPhotoLinks(links=>({...links,[item.id]:grant.url})); } catch (caught) { setError(errorText(caught)); } finally { setOpening(null); } };
  const wrapWidget = (node: SourceNode, body: ReactNode) => { const header = objects(node).find(child => nodeName(child) === 'Header-Section'); const originalBody = objects(node).find(child => nodeName(child) === 'Body'); return { children: <>{header && source(header, child => /Button/.test(nodeName(child)) ? { hidden: true } : undefined)}{originalBody ? source(originalBody, child => child === originalBody ? { children: body } : undefined) : body}</> }; };
  const unavailable = () => <Stateful loading={!remote.data && !remote.error} error={remote.error || undefined} empty="Sin registros en este período." onRetry={remote.reload} />;
  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    if (name === 'Widget Weight Tracking') {
      if (!remote.data || remote.error) return wrapWidget(node, unavailable());
      const summary = descendants(node).find(child => nodeName(child) === 'Info Weights'); const chart = descendants(node).find(child => nodeName(child) === 'Chart'); const points = weight?.current ?? [];
      const min = Math.min(...points.map(item => item.value)); const max = Math.max(...points.map(item => item.value)); const width = 400; const height = 180;
      const coords = points.map((item, i) => ({ item, x: 24 + i * (width - 48) / Math.max(1, points.length - 1), y: 20 + (max - item.value) / Math.max(1, max - min) * (height - 40) }));
      return wrapWidget(node, <>{summary && fields(summary, { '159:6475': formatNumber(points[0]?.value), '159:6481': formatNumber(weight?.current_last?.value), '159:6487': '—', '159:6476': weight?.unit ?? '', '159:6482': weight?.unit ?? '', '159:6488': '' })}{!points.length ? <Stateful empty="No hay medidas de peso compartidas en este período." /> : chart && source(chart, child => child === chart ? { children: <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Peso registrado por fecha" className="h-full w-full"><polyline points={coords.map(point => `${point.x},${point.y}`).join(' ')} stroke="#c2e66e" strokeWidth="3" fill="none" />{coords.map(point => <g key={point.item.id}><circle cx={point.x} cy={point.y} r="4" fill="#272932" /><title>{dateLabel(point.item.captured_on)}: {point.item.value} {weight?.unit}</title><text x={point.x} y={height - 3} textAnchor="middle" fill="#8a8c90" fontSize="10">{dateLabel(point.item.captured_on).slice(0, 5)}</text></g>)}</svg> } : undefined)}<p className="text-[12px] text-[#8a8c90]">Las medidas se muestran en {weight?.unit ?? 'la unidad declarada'}; no se infiere una meta de peso.</p></>);
    }
    if (name === 'Current Weight' && ['93.0 cm', '77.5 cm', '98.0 cm', '28.5 cm', '58.5 cm'].includes(text)) {
      const data = text === '77.5 cm' ? series('waist') : text === '98.0 cm' ? series('hip') : undefined;
      return { text: data?.current_last ? `${formatNumber(data.current_last.value)} ${data.unit}` : '—' };
    }
    if (name === 'Widget Progress Photos') return wrapWidget(node, !remote.data || remote.error ? unavailable() : <div className="flex w-full flex-wrap gap-[12px]">{photos.length ? photos.map(item => <div key={item.id} className="flex h-[160px] flex-[1_0_0] flex-col items-center justify-center rounded-[12px] bg-[#f9f4f2] p-[12px] text-[14px] text-[#272932]">{photoLinks[item.id]&&<a href={photoLinks[item.id]} target="_blank" rel="noopener noreferrer" className="underline">Ver foto privada</a>}<button type="button" disabled={!!opening} onClick={() => void openPhoto(item)}>{opening === item.id ? 'Preparando acceso…' : photoLinks[item.id] ? 'Renovar acceso' : 'Abrir foto privada'}</button><span className="mt-[8px] text-[12px] text-[#8a8c90]">{dateLabel(item.recorded_on)}</span></div>) : <Stateful empty="No hay fotos privadas compartidas." />}</div>);
    if (name === 'Section Table') return wrapWidget(node, !remote.data || remote.error ? unavailable() : <div className="w-full overflow-auto"><table className="w-full text-left text-[14px]"><thead><tr><th className="p-[12px]">Fecha</th><th className="p-[12px]">Medida</th><th className="p-[12px]">Valor</th><th className="p-[12px]">Origen</th></tr></thead><tbody>{remote.data.progress.series.flatMap(item => item.current.map(point => <tr key={point.id} className="border-t border-[#e1e1e2]"><td className="p-[12px]">{dateLabel(point.captured_on)}</td><td className="p-[12px]">{item.kind === 'weight' ? 'Peso' : item.kind === 'waist' ? 'Cintura' : 'Cadera'}</td><td className="p-[12px]">{formatNumber(point.value)} {item.unit}</td><td className="p-[12px]">{point.source === 'patient' ? 'Paciente' : 'Profesional'}</td></tr>))}</tbody></table>{!remote.data.progress.series.some(item => item.current.length) && <Stateful empty="Sin medidas compartidas en este período." />}</div>);
    if (['Widget Calories Activities', 'Widget Sleep Statistics', 'Widget Hydration'].includes(name)) {
      const records = patient.journey.days;
      return wrapWidget(node, <div className="flex w-full flex-col gap-[12px]">{records.map(day => {
        const reviewed = patient.logs.filter(log => dateId(new Date(log.logged_at)) === day.date && log.status !== 'pending_review' && log.macros);
        const value = name === 'Widget Hydration' ? day.hydration ? `${day.hydration} vasos registrados` : 'Sin vasos registrados' : name === 'Widget Sleep Statistics' ? day.sleepMinutes === null ? 'Sin registro' : `${Math.floor(day.sleepMinutes / 60)} h ${day.sleepMinutes % 60} min` : reviewed.length ? `${formatNumber(reviewed.reduce((sum, log) => sum + (log.macros?.kcal ?? 0), 0))} kcal revisadas` : 'Sin calorías revisadas';
        return <div key={day.date} className="flex w-full items-center justify-between gap-[8px] border-b border-[#e1e1e2] pb-[8px] text-[13px]"><span className="text-[#8a8c90]">{dateLabel(day.date)}</span><span className="text-[#272932]">{value}</span></div>;
      })}<p className="text-[12px] text-[#8a8c90]">Últimos siete días. Se muestra lo registrado; no se estiman fases de sueño ni calorías de actividad.</p></div>);
    }
    if (leaf(node) && idEnds(node, '189:5403')) return { text: '—' };
    if (/Button/.test(name) && text === 'Today') return { onClick: onRecord ?? (() => onNavigate('ficha')), label: 'Registrar mis medidas' };
    return undefined;
  };
  return <FramePair nodes={['105:2790', '498:18237']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    <section className="mx-[24px] mb-[24px] flex flex-wrap items-center gap-[12px] rounded-[14px] bg-white p-[16px]" aria-label="Registros y período"><label>Período de medidas<select aria-label="Período de medidas" value={days} onChange={event => setDays(Number(event.target.value) as ProgressPeriodDays)} className="ml-[8px] rounded-[8px] border border-[#e1e1e2] px-[12px] py-[8px]"><option value={7}>7 días</option><option value={30}>30 días</option><option value={90}>90 días</option></select></label><button type="button" onClick={onRecord ?? (() => onNavigate('ficha'))} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">Registrar medidas y archivos</button>{onHydration && <button type="button" onClick={onHydration} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Registrar agua</button>}{onRest && <button type="button" onClick={onRest} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Registrar descanso</button>}</section>{error && <Stateful error={error} />}
  </FramePair>;
}
