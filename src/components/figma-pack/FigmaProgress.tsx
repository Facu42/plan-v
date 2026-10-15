import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { careApi, careErrorMessage } from '../../api/care';
import type { CareRecord } from '../../types/care';
import { useCare } from '../nutrigo/useCare';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { CarePanel } from '../nutrigo/CarePanel';
import { StudiesPanel } from '../nutrigo/StudiesPanel';

type ProgressContextValue = {
  patient: ShowroomPatient;
  records: CareRecord[];
  loading: boolean;
  error: string;
  reload: () => void;
  days: number;
  setDays: (days: number) => void;
  setPanel: (panel: 'care' | 'studies' | null) => void;
};
const ProgressContext = createContext<ProgressContextValue | null>(null);
const byDate = (a: CareRecord, b: CareRecord) => a.recorded_on.localeCompare(b.recorded_on) || a.created_at.localeCompare(b.created_at);

export function FigmaProgressProvider({ patient, children }: { patient: ShowroomPatient; children: ReactNode }) {
  const care = useCare(patient.id);
  const [days, setDays] = useState(5);
  const [panel, setPanel] = useState<'care' | 'studies' | null>(null);
  const value = useMemo(() => ({ patient, records: care.data?.records ?? [], loading: !care.data && !care.error, error: care.error, reload: care.reload, days, setDays, setPanel }), [patient, care.data, care.error, care.reload, days]);
  return <ProgressContext.Provider value={value}>{children}{panel && typeof document !== 'undefined' && createPortal(<div className="figma-progress-overlay" role="presentation"><div className="figma-progress-panel" role="dialog" aria-modal="true" aria-label={panel === 'care' ? 'Registrar progreso' : 'Mis estudios'}><button className="figma-progress-panel-close" type="button" onClick={() => setPanel(null)}>Cerrar ×</button>{panel === 'care' ? <CarePanel patientId={patient.id} /> : <StudiesPanel patientId={patient.id} />}</div></div>, document.body)}</ProgressContext.Provider>;
}
function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('FigmaProgressProvider is required');
  return context;
}
function ProgressState({ empty }: { empty: string }) {
  const { loading, error, reload } = useProgress();
  if (error) return <p className="figma-progress-state" role="alert">{error} <button type="button" onClick={reload}>Reintentar</button></p>;
  return <p className="figma-progress-state">{loading ? 'Cargando registros…' : empty}</p>;
}
const measureDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });
const recordLabel = (record: CareRecord) => measureDate.format(new Date(`${record.recorded_on}T12:00:00`));

export function FigmaProgressBodyMap({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  const { records, setPanel } = useProgress();
  const waists = records.filter((record) => record.data.kind === 'waist').sort(byDate);
  const waist = waists[waists.length - 1];
  return <div className={`figma-progress-body-map figma-progress-body-map-${variant}`}>
    <span className="figma-progress-period">Último registro</span>
    <div className="figma-progress-body-silhouette" aria-hidden="true" />
    <div className="figma-progress-body-callouts">
      {(['Pecho', 'Brazo', 'Cintura', 'Cadera', 'Muslo'] as const).map((label) => <div key={label}><small>{label}</small><strong>{label === 'Cintura' && waist?.data.kind === 'waist' ? `${waist.data.value.toLocaleString('es-AR')} ${waist.data.unit}` : '—'}</strong></div>)}
    </div>
    <button className="figma-progress-body-note" type="button" onClick={() => setPanel('studies')}>Ver estudios</button>
  </div>;
}

export function FigmaProgressWeight() {
  const { records, setPanel } = useProgress();
  const weights = records.filter((record) => record.data.kind === 'weight').sort(byDate);
  const latestWeight = weights[weights.length - 1];
  const latestUnit = latestWeight?.data.kind === 'weight' ? latestWeight.data.unit : null;
  const series = weights.filter((record) => record.data.kind === 'weight' && record.data.unit === latestUnit).slice(-7);
  const values = series.map((record) => record.data.kind === 'weight' ? record.data.value : 0);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const points = values.map((value, index) => `${values.length === 1 ? 120 : 12 + index * 216 / (values.length - 1)},${154 - (max === min ? 70 : (value - min) / (max - min) * 110)}`).join(' ');
  return <div className="figma-progress-widget figma-progress-weight">
    <header><h2>Seguimiento de peso</h2><button type="button" onClick={() => setPanel('care')} aria-label="Registrar peso">+</button></header>
    <div className="figma-progress-weight-values"><span>Peso inicial <strong>{series[0]?.data.kind === 'weight' ? `${series[0].data.value.toLocaleString('es-AR')} ${latestUnit}` : '—'}</strong></span><span>Peso actual <strong>{latestWeight?.data.kind === 'weight' ? `${latestWeight.data.value.toLocaleString('es-AR')} ${latestUnit}` : '—'}</strong></span><span>Meta de peso <strong>—</strong></span></div>
    {series.length ? <div className="figma-progress-line" role="img" aria-label={`Historial de peso: ${series.map((record) => record.data.kind === 'weight' ? `${record.data.value} ${record.data.unit}, ${recordLabel(record)}` : '').join('; ')}`}><svg viewBox="0 0 240 181" aria-hidden="true"><path d="M12 35H228M12 95H228M12 155H228" stroke="#e1e1e2" strokeWidth="1" />{series.length > 1 && <polyline points={points} fill="none" stroke="#ffa257" strokeWidth="2" />}{points.split(' ').map((point, index) => { const [cx, cy] = point.split(','); return <circle key={series[index].id} cx={cx} cy={cy} r="4" fill="#ffa257" />; })}</svg><div>{series.map((record) => <small key={record.id}>{recordLabel(record)}</small>)}</div></div> : <ProgressState empty="Sin registros de peso" />}
  </div>;
}

export function FigmaProgressPhotos() {
  const { patient, records, loading, error, setPanel } = useProgress();
  const photos = records.filter((record) => record.data.kind === 'body_photo').sort(byDate).reverse();
  const [image, setImage] = useState<string | null>(null);
  const [failure, setFailure] = useState('');
  useEffect(() => {
    if (!image) return;
    const timeout = window.setTimeout(() => setImage(null), 60_000);
    return () => window.clearTimeout(timeout);
  }, [image]);
  const open = async (record: CareRecord) => {
    setFailure('');
    try { const result = await careApi.openPhoto(patient.id, record.id); setImage(result.url); }
    catch (cause) { setFailure(careErrorMessage(cause)); }
  };
  return <div className="figma-progress-photos"><header><h2>Fotos de progreso</h2><button type="button" onClick={() => setPanel('care')}>{photos.length ? `${photos.length} privadas · Agregar` : 'Agregar foto'}</button></header>{photos.length ? <div className="figma-progress-photo-list">{photos.slice(0, 2).map((record) => <button type="button" key={record.id} onClick={() => void open(record)}><span aria-hidden="true">▧</span><small>{recordLabel(record)}</small><strong>Ver foto privada</strong></button>)}</div> : <div className="figma-progress-photo-list"><span className="figma-progress-photo-empty">{loading ? 'Cargando…' : error || 'Sin fotos registradas'}</span><span className="figma-progress-photo-empty">Registro opcional</span></div>}{failure && <p role="alert">{failure}</p>}{image && createPortal(<div className="figma-progress-photo-modal" role="dialog" aria-modal="true" aria-label="Foto corporal privada"><button type="button" onClick={() => setImage(null)}>Cerrar</button><img src={image} alt="Foto corporal privada registrada por el paciente" /></div>, document.body)}</div>;
}

export function FigmaProgressMeasurements() {
  const { records, setPanel } = useProgress();
  const waist = records.filter((record) => record.data.kind === 'waist').sort(byDate).reverse().slice(0, 4);
  return <div className="figma-progress-measure-table"><div className="figma-progress-measure-heading"><strong>Medidas corporales</strong><button type="button" onClick={() => setPanel('care')}>Registrar cintura</button></div><div className="figma-progress-measure-row header"><span>Fecha</span><span>Pecho</span><span>Brazo</span><span>Cintura</span><span>Cadera</span><span>Muslo</span></div>{waist.length ? waist.map((record) => <div className="figma-progress-measure-row" key={record.id}><span>{recordLabel(record)}</span><span>—</span><span>—</span><strong>{record.data.kind === 'waist' ? `${record.data.value.toLocaleString('es-AR')} ${record.data.unit}` : '—'}</strong><span>—</span><span>—</span></div>) : <ProgressState empty="Todavía no hay medidas corporales registradas." />}</div>;
}

function ProgressPeriod() {
  const { days, setDays } = useProgress();
  return <select aria-label="Período de gráficos" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={5}>Últimos 5 días</option><option value={7}>Últimos 7 días</option></select>;
}
function ProgressBars({ kind }: { kind: 'calories' | 'sleep' | 'water' }) {
  const { patient, days } = useProgress();
  const recent = patient.journey.days.slice(-days);
  const values = recent.map((day) => kind === 'calories'
    ? patient.logs.filter((log) => day.mealLogIds.includes(log.id) && log.status !== 'pending_review').reduce((sum, log) => sum + (log.macros?.kcal ?? 0), 0)
    : kind === 'sleep' ? day.sleepMinutes : day.hydration);
  const max = Math.max(1, ...values.map((value) => value ?? 0));
  return <div className="figma-progress-bars" role="img" aria-label={recent.map((day, index) => `${day.label}: ${values[index] === null ? 'sin registro' : `${values[index]} ${kind === 'calories' ? 'kcal revisadas' : kind === 'sleep' ? 'minutos de sueño' : 'vasos de agua'}`}`).join('; ')}>{recent.map((day, index) => <div key={day.date}><span className="figma-progress-bar-track"><i className={`figma-progress-bar-${kind}`} style={{ height: values[index] === null ? 0 : `${Math.max(0, (values[index] ?? 0) / max * 100)}%` }} /></span><small>{day.label}</small></div>)}</div>;
}
export function FigmaProgressCalories() {
  const { patient, days } = useProgress();
  const recentIds = new Set(patient.journey.days.slice(-days).flatMap((day) => day.mealLogIds));
  const reviewed = patient.logs.filter((log) => recentIds.has(log.id) && log.status !== 'pending_review' && log.macros);
  const total = reviewed.reduce((sum, log) => sum + (log.macros?.kcal ?? 0), 0);
  return <div className="figma-progress-widget figma-progress-chart"><header><h2>Actividad calórica</h2><ProgressPeriod /></header><strong>{reviewed.length ? total.toLocaleString('es-AR') : '—'} <small>kcal revisadas</small></strong><p>{reviewed.length ? `${reviewed.length} comidas con valores confirmados` : 'Sin comidas con calorías revisadas'}</p><ProgressBars kind="calories" /></div>;
}
export function FigmaProgressSleep() {
  const { patient, days } = useProgress();
  const count = patient.journey.days.slice(-days).filter((day) => day.sleepMinutes !== null).length;
  return <div className="figma-progress-widget figma-progress-chart"><header><h2>Estadísticas de sueño</h2><ProgressPeriod /></header><p>{count ? `${count} ${count === 1 ? 'día registrado' : 'días registrados'}; sueño total declarado` : 'Sin registros de sueño'}</p><ProgressBars kind="sleep" /></div>;
}
export function FigmaProgressHydration() {
  const { patient } = useProgress();
  return <div className="figma-progress-widget figma-progress-chart"><header><h2>Hidratación</h2><ProgressPeriod /></header><strong>{patient.journey.hydrationAverage.toLocaleString('es-AR')} <small>vasos por día</small></strong><p>Promedio de registros de los últimos siete días</p><ProgressBars kind="water" /></div>;
}
