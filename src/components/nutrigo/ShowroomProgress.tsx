import { useEffect, useState } from 'react';
import { CaretDown, DropHalfBottom, PintGlass } from '@phosphor-icons/react';
import { CarePanel } from './CarePanel';
import { NvBadge, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import { MEASUREMENT_SOURCE_LABELS } from '../../types/care';
import { progressApi } from '../../api/progress';
import { isAbortError } from '../../api/client';
import { careErrorMessage } from '../../api/care';
import {
  PROGRESS_PERIODS,
  PROGRESS_PERIOD_LABELS,
  isProgressPeriodDays,
  type PatientProgressView,
  type ProgressPeriodDays,
  type ProgressSeries,
} from '../../types/progress';
import './showroom-progress.css';
import './progreso-recursos-fig.css';

/* Progreso = frame 25 "Progress" (105:2790; móvil 498:18237).
   Cuerpo 767 + 20 + 374. Izquierda: Main Info (440 + 20 + 275) y la tabla de medidas;
   derecha: tres widgets (Calories Activities, Sleep Statistics, Hydration) mapeados a
   comidas, descanso/energía e hidratación, que es lo que Plan V registra de verdad. */

function formatSleep(minutes: number | null): string {
  if (minutes === null) return 'Sin registro';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h${remainder ? ` ${remainder} min` : ''}`;
}

/** Etiqueta corta del eje, como el "6h 45m" del archivo. */
export function sleepAxisLabel(minutes: number | null): string {
  if (minutes === null) return '—';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function formatQty(value: number): string {
  return String(value).replace('.', ',');
}

function formatDelta(series: ProgressSeries): string {
  if (series.declared_delta == null) return 'Sin comparativa: falta un valor declarado en alguno de los dos períodos.';
  const formatted = formatQty(series.declared_delta);
  const signed = series.declared_delta > 0 ? `+${formatted}` : formatted;
  return `Cambio declarado: ${signed} ${series.unit}`;
}

export function buildProgressView(patient: ShowroomPatient) {
  const activeDays = patient.journey.days.filter((day) => day.hydration > 0 || day.energy !== null || day.sleepMinutes !== null || day.reviewedMeals > 0 || day.pendingMeals > 0).length;
  const energyRecordedDays = patient.journey.days.filter((day) => day.energy !== null).length;
  const maxHydration = patient.journey.days.reduce((maximum, day) => Math.max(maximum, day.hydration), 0);
  const maxMeals = patient.journey.days.reduce((maximum, day) => Math.max(maximum, day.reviewedMeals + day.pendingMeals), 0);
  const recentIds = new Set(patient.journey.days.flatMap((day) => day.mealLogIds));
  const recentLogs = patient.logs.filter((log) => recentIds.has(log.id)).sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  return { activeDays, energyRecordedDays, maxHydration, maxMeals, reviewedMeals: patient.journey.reviewedMeals, pendingMeals: patient.journey.pendingMeals, recentLogs };
}

const TABLE_KINDS = [
  { kind: 'weight', label: 'Peso' },
  { kind: 'waist', label: 'Cintura' },
  { kind: 'hip', label: 'Cadera' },
] as const;

export type MeasurementRow = {
  date: string;
  sources: string[];
  values: Partial<Record<ProgressSeries['kind'], string>>;
};

/** Filas de la tabla de medidas (182:8021): una por fecha con registro, sin rellenar huecos. */
export function buildMeasurementRows(series: ProgressSeries[]): MeasurementRow[] {
  const rows = new Map<string, MeasurementRow>();
  for (const entry of series) {
    for (const point of [...entry.previous, ...entry.current]) {
      const row = rows.get(point.captured_on) ?? { date: point.captured_on, sources: [], values: {} };
      row.values[entry.kind] = formatQty(point.value);
      const source = MEASUREMENT_SOURCE_LABELS[point.source];
      if (!row.sources.includes(source)) row.sources.push(source);
      rows.set(point.captured_on, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const ENERGY_TONES = [
  { value: 'Alta', label: 'Energía alta', tone: 'high' },
  { value: 'Media', label: 'Energía media', tone: 'mid' },
  { value: 'Baja', label: 'Energía baja', tone: 'low' },
] as const;

function energyTone(energy: string | null): string {
  return ENERGY_TONES.find((entry) => entry.value === energy)?.tone ?? 'none';
}

/** Button Picker del archivo: Green, 11 medium, radio 8, caret de 14. Acá elige el período real. */
function PeriodPicker({ days, onChange }: { days: ProgressPeriodDays; onChange: (days: ProgressPeriodDays) => void }) {
  return <label className="nvpf-picker">
    <span className="nvpf-sr">Período a comparar</span>
    <select value={days} onChange={(event) => { const next = Number(event.target.value); if (isProgressPeriodDays(next)) onChange(next); }}>
      {PROGRESS_PERIODS.map((period) => <option key={period} value={period}>{PROGRESS_PERIOD_LABELS[period]}</option>)}
    </select>
    <CaretDown size={14} aria-hidden />
  </label>;
}

function WeightChart({ series }: { series: ProgressSeries }) {
  const points = [...series.previous, ...series.current];
  if (!points.length) return <p className="nvpf-note">Sin pesos declarados en estos períodos.</p>;
  const values = points.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  // Área de la línea: 13,26 % arriba y 17,13 % abajo del chart de 181, como Line Area (182:8478).
  const y = (value: number) => 24 + (1 - (value - min) / span) * 71.5;
  const x = (index: number) => points.length === 1 ? 50 : (index + 0.5) / points.length * 100;
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index)} ${y(point.value)}`).join(' ');
  return <div className="nvpf-weight-chart" role="img" aria-label={`Pesos declarados: ${points.map((point) => `${formatQty(point.value)} ${series.unit} el ${shortDate(point.captured_on)}`).join(', ')}`}>
    <div className="nvpf-grid-lines" aria-hidden="true">{[0, 1, 2, 3, 4].map((line) => <i key={line} />)}</div>
    <svg viewBox="0 0 100 181" preserveAspectRatio="none" aria-hidden="true">
      <path className="nvpf-area" d={`${path} L${x(points.length - 1)} 150 L${x(0)} 150 Z`} />
      <path className="nvpf-line" d={path} vectorEffect="non-scaling-stroke" />
    </svg>
    <ol aria-hidden="true">{points.map((point, index) => <li key={point.id} style={{ left: `${x(index)}%`, top: `${y(point.value)}px` }}><small>{formatQty(point.value)} {series.unit}</small><i /></li>)}</ol>
    <div className="nvpf-weight-x" aria-hidden="true">{points.map((point) => <span key={point.id}>{shortDate(point.captured_on)}</span>)}</div>
  </div>;
}

export function ShowroomProgress({
  patient,
  professional = false,
  progress: injected,
}: {
  patient: ShowroomPatient;
  professional?: boolean;
  progress?: PatientProgressView | null;
}) {
  const view = buildProgressView(patient);
  const [days, setDays] = useState<ProgressPeriodDays>(injected?.period_days ?? 7);
  const [remote, setRemote] = useState<PatientProgressView | null>(injected ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!injected);

  useEffect(() => {
    if (injected) {
      setRemote(injected);
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    progressApi.get(patient.id, days, controller.signal).then((result) => {
      setRemote(result.progress);
      setLoading(false);
    }).catch((failure) => {
      if (isAbortError(failure)) return;
      setRemote(null);
      setLoading(false);
      setError(careErrorMessage(failure));
    });
    return () => controller.abort();
  }, [patient.id, days, injected]);

  const weight = remote?.measurements_included ? remote.series.find((series) => series.kind === 'weight') ?? null : null;
  const weightPoints = weight ? [...weight.previous, ...weight.current] : [];
  const rows = remote?.measurements_included ? buildMeasurementRows(remote.series) : [];
  const goalProgress = Math.max(0, Math.min(100, patient.goalProgress));
  const maxSleep = Math.max(600, ...patient.journey.days.map((day) => day.sleepMinutes ?? 0));
  const sleepTicks = [1, 0.75, 0.5, 0.25, 0].map((share) => `${formatQty(Math.round(maxSleep * share / 6) / 10)} h`);
  const mealScale = Math.max(4, Math.ceil(view.maxMeals / 4) * 4);
  const mealTicks = [1, 0.75, 0.5, 0.25, 0].map((share) => mealScale * share);
  const today = patient.journey.days.find((day) => day.isToday);

  return <section className="nvp-progress nvpf" aria-label={professional ? `Progreso de ${patient.name}` : 'Progreso del paciente'}>
    <div className="nvpf-body">
      <div className="nvpf-main">
        <div className="nvpf-info">
          {/* Image Area (161:6761): Plan V no tiene la ilustración del cuerpo; en su lugar van
              los registros personales de medidas, que es de donde salen esos valores. */}
          <div className="nvpf-image"><CarePanel patientId={patient.id} mode={professional ? 'professional' : 'progress'} /></div>
          <div className="nvpf-side">
            <section className="nvpf-widget nvpf-weight" aria-label={professional ? `Objetivo de ${patient.name}` : 'Tu objetivo'}>
              <header className="nvpf-head"><h3>{professional ? `Objetivo de ${patient.name}` : 'Tu objetivo'}</h3></header>
              <div className="nvpf-weight-body">
                <p className="nvpf-goal-text">{patient.goal || 'Sin objetivo publicado'}</p>
                <dl className="nvpf-rows">
                  <div><dt>Avance del objetivo</dt><dd><strong>{goalProgress}</strong><span>%</span></dd></div>
                  <div><dt>Adherencia actual</dt><dd><strong>{patient.adherence}</strong><span>%</span></dd></div>
                  <div><dt>Peso declarado</dt><dd>{weightPoints.length ? <><strong>{formatQty(weightPoints[weightPoints.length - 1].value)}</strong><span>{weight!.unit}</span></> : <strong>—</strong>}</dd></div>
                </dl>
                {weight && <WeightChart series={weight} />}
                {weight && <p className="nvpf-note">{formatDelta(weight)}</p>}
                {remote && !remote.measurements_included && <p className="nvpf-note">Las medidas no se muestran: falta el permiso de peso y medidas.</p>}
              </div>
            </section>
            <section className="nvpf-meals" aria-label="Comidas de esta semana">
              <header className="nvpf-head"><h3>Comidas de esta semana</h3><NvBadge>{view.recentLogs.length}</NvBadge></header>
              {view.recentLogs.length ? <div className="nvpf-carousel">{view.recentLogs.map((log) => <article key={log.id}>
                <header><small>{new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(log.logged_at))}</small><strong>{log.slot}</strong></header>
                <div><p>{log.description || 'Sin descripción registrada'}</p><NvBadge tone={log.status === 'pending_review' ? 'gold' : 'green'}>{log.status === 'pending_review' ? 'En revisión' : log.status === 'adjusted' ? 'Ajustada' : 'Confirmada'}</NvBadge></div>
              </article>)}</div> : <NvState title="Sin comidas registradas esta semana" description={professional ? 'Cuando registre comidas, sus estados aparecerán acá.' : 'Cuando registres comidas, sus estados aparecerán acá.'} />}
            </section>
          </div>
        </div>
        {remote?.measurements_included && <section className="nvpf-table" aria-label="Medidas declaradas">
          <table>
            <thead><tr><th scope="col">{shortDate(remote.previous.start)} – {shortDate(remote.current.end)}</th>{TABLE_KINDS.map(({ kind, label }) => <th scope="col" key={kind}>{label} ({remote.series.find((series) => series.kind === kind)?.unit ?? (kind === 'weight' ? 'kg' : 'cm')})</th>)}</tr></thead>
            <tbody>{rows.length ? rows.map((row) => <tr key={row.date}><th scope="row">{shortDate(row.date)} · {row.sources.join(' y ')}</th>{TABLE_KINDS.map(({ kind }) => <td key={kind}><span>{row.values[kind] ?? '—'}</span></td>)}</tr>) : <tr><td colSpan={4} className="nvpf-empty-row">Sin medidas en estos períodos. No se completa un período vacío ni se arrastra un valor más antiguo.</td></tr>}</tbody>
          </table>
        </section>}
      </div>

      <div className="nvpf-rail">
        <section className="nvpf-widget nvpf-activity" aria-label="Comparativa del mismo paciente">
          <header className="nvpf-head"><h3>Comidas</h3><PeriodPicker days={days} onChange={setDays} /></header>
          {error && <NvState kind="error" title="No se pudo cargar el progreso" description={error} />}
          {loading && !remote && <NvState kind="loading" title="Cargando períodos…" description="Comparativa del mismo paciente, sin rankings." />}
          {remote && <div className="nvpf-top">
            <div className="nvpf-total"><p><strong>{remote.meals.current.logged}</strong><span>comidas registradas</span></p><small>Período anterior: {remote.meals.previous.logged} · {remote.meals.current.reviewed} revisadas</small></div>
            <ul className="nvpf-legend"><li><i className="reviewed" />Revisadas</li><li><i className="pending" />En revisión</li></ul>
          </div>}
          <div className="nvpf-columns" role="img" aria-label={`Comidas por día: ${patient.journey.days.map((day) => `${day.isToday ? 'hoy' : day.label} ${day.reviewedMeals} revisadas y ${day.pendingMeals} en revisión`).join(', ')}`}>
            <div className="nvpf-y" aria-hidden="true">{mealTicks.map((tick, index) => <span key={index}>{formatQty(tick)}</span>)}<span /></div>
            {patient.journey.days.map((day) => <div className="nvpf-col" key={day.date}>
              <div className="nvpf-lines" aria-hidden="true">{[0, 1, 2, 3, 4].map((line) => <i key={line} />)}
                <div className="nvpf-pair">
                  <b className="reviewed" style={{ height: `${view.maxMeals ? day.reviewedMeals / mealScale * 100 : 0}%` }} />
                  <b className="pending" style={{ height: `${view.maxMeals ? day.pendingMeals / mealScale * 100 : 0}%` }} />
                </div>
              </div>
              <span>{day.isToday ? 'Hoy' : day.label}</span>
            </div>)}
          </div>
        </section>

        <section className="nvpf-widget nvpf-sleep" aria-label="Descanso y energía">
          <header className="nvpf-head"><h3>Descanso y energía</h3><span className="nvpf-chip">Últimos 7 días</span></header>
          <ul className="nvpf-legend nvpf-legend-row">{ENERGY_TONES.map((entry) => <li key={entry.tone}><i className={entry.tone} />{entry.label}</li>)}<li><i className="none" />Sin registro</li></ul>
          <div className="nvpf-columns nvpf-sleep-chart" role="img" aria-label={`Descanso por día: ${patient.journey.days.map((day) => `${day.isToday ? 'hoy' : day.label} ${formatSleep(day.sleepMinutes)}, energía ${day.energy ?? 'sin registro'}`).join('; ')}`}>
            <div className="nvpf-y" aria-hidden="true">{sleepTicks.map((tick) => <span key={tick}>{tick}</span>)}<span /></div>
            {patient.journey.days.map((day) => <div className="nvpf-col" key={day.date}>
              <div className="nvpf-lines" aria-hidden="true">{[0, 1, 2, 3, 4].map((line) => <i key={line} />)}
                {day.sleepMinutes !== null && <b className={`nvpf-stage ${energyTone(day.energy)}`} style={{ height: `${day.sleepMinutes / maxSleep * 100}%` }} />}
              </div>
              <span><small>{sleepAxisLabel(day.sleepMinutes)}</small><strong>{day.isToday ? 'Hoy' : day.label}</strong></span>
            </div>)}
          </div>
        </section>

        <section className="nvpf-widget nvpf-hydration" aria-label="Hidratación">
          <header className="nvpf-head"><h3>Hidratación</h3><span className="nvpf-chip">Últimos 7 días</span></header>
          <div className="nvpf-hydration-top">
            <div><span className="nvpf-tile level"><DropHalfBottom size={18} aria-hidden /></span><p><small>Promedio de agua</small><strong>{patient.journey.hydrationAverage.toLocaleString('es-AR')} vasos/día</strong></p></div>
            <div><span className="nvpf-tile intake"><PintGlass size={18} aria-hidden /></span><p><small>Hoy</small><strong>{today ? `${today.hydration} vasos` : 'Sin registro'}</strong></p></div>
          </div>
          <div className="nvpf-glasses" role="img" aria-label={`Vasos por día: ${patient.journey.days.map((day) => `${day.isToday ? 'hoy' : day.label} ${day.hydration}`).join(', ')}`}>
            {patient.journey.days.map((day) => <div className="nvpf-glass" key={day.date}>
              <div className="nvpf-glass-bar" aria-hidden="true"><b style={{ height: `${view.maxHydration ? day.hydration / view.maxHydration * 100 : 0}%` }} /></div>
              <span><strong>{day.hydration} vasos</strong>{day.isToday ? 'Hoy' : day.label}</span>
            </div>)}
          </div>
        </section>
      </div>
    </div>
  </section>;
}
