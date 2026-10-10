import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { crmProgressApi } from '../../api/crm-progress';
import { filterRows, mealsNote, sortRows, weightLines, type GlobalFilter, type GlobalSort } from '../../lib/progress-global';
import { PROGRESS_PERIODS, type ProgressPeriodDays } from '../../types/progress';
import type { GlobalProgressResponse } from '../../types/progress-global';
import { Icon } from '../shared/Icon';
import { variationText } from './InicioIndicators';
import { NvBadge, NvButton, NvCard, NvMetric, NvState } from './primitives';
import { variation } from '../../lib/inicio-indicators';
import './professional-workspace.css';

const FILTERS: Array<{ id: GlobalFilter; label: string }> = [
  { id: 'all', label: 'Todas las pacientes' }, { id: 'with-records', label: 'Con registros en el período' }, { id: 'without-records', label: 'Sin registros en el período' },
];
const SORTS: Array<{ id: GlobalSort; label: string }> = [
  { id: 'name', label: 'Nombre' }, { id: 'meals', label: 'Más comidas registradas' }, { id: 'weight-change', label: 'Mayor cambio de peso' },
];
const COLUMNS = 'minmax(170px,1.2fr) minmax(170px,1.2fr) minmax(150px,1fr) minmax(110px,.7fr) minmax(190px,1fr)';
const dateText = (dateId: string) => dateId.split('-').reverse().join('/');

/** Vista de toda la cartera. La falta de registros se muestra como falta de datos, nunca como incumplimiento. */
export function ProgressGlobalView({ data, days, onDays, onOpen }: { data: GlobalProgressResponse; days: ProgressPeriodDays; onDays: (days: ProgressPeriodDays) => void; onOpen: (href: string) => void }) {
  const [filter, setFilter] = useState<GlobalFilter>('all');
  const [sort, setSort] = useState<GlobalSort>('name');
  const rows = useMemo(() => sortRows(filterRows(data.patients, filter), sort), [data.patients, filter, sort]);
  const { totals } = data;
  const mealChange = variationText(variation(totals.meals, totals.previous_meals), String(totals.previous_meals));
  return <section className="pw-work pw-global" aria-label="Progreso global">
    <header className="pw-work-head"><div><h2>Progreso global</h2><p>Cómo viene toda tu cartera en el período: peso y comidas registradas, con acceso a la ficha de cada paciente.</p></div>
      <label className="pw-global-period">Período<select value={days} onChange={(event) => onDays(Number(event.target.value) as ProgressPeriodDays)}>{PROGRESS_PERIODS.map((option) => <option key={option} value={option}>Últimos {option} días</option>)}</select></label></header>
    <div className="pw-indicator-cards">
      <NvMetric label="Pacientes con registros" icon="users" tone="green" value={`${totals.with_records} de ${totals.patients}`} note="Cargaron una comida o tienen un peso en el período. Quien no registró no se marca como incumplimiento." />
      <NvMetric label="Comidas registradas" icon="leaf" tone="gold" value={String(totals.meals)} note={`${totals.pending_review} por revisar. ${mealChange}`} />
      <NvMetric label="Pacientes con peso" icon="trend" tone="coral" value={String(totals.with_weight)} note={totals.without_measurement_permission ? `${totals.without_measurement_permission} no autorizaron compartir mediciones.` : 'Con al menos un peso en el período.'} />
    </div>
    {data.unavailable.length > 0 && <p role="status" className="pw-global-alert">No pudimos consultar a {data.unavailable.map((entry) => entry.patient_name).join(', ')}. Recargá para volver a intentarlo; no se las cuenta como cero.</p>}
    <NvCard className="nv-directory-panel" title="Pacientes">
      <div className="pw-work-filters" aria-label="Filtros del progreso">
        <label>Mostrar<select value={filter} onChange={(event) => setFilter(event.target.value as GlobalFilter)}>{FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Ordenar por<select value={sort} onChange={(event) => setSort(event.target.value as GlobalSort)}>{SORTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <p>Del {dateText(data.current.start)} al {dateText(data.current.end)} · comparado con el {dateText(data.previous.start)} al {dateText(data.previous.end)}</p>
      </div>
      {rows.length === 0 ? <NvState title={data.patients.length ? 'Ninguna paciente en este filtro' : 'Todavía no hay pacientes activas'} description={data.patients.length ? 'Cambiá el filtro para ver al resto de tu cartera.' : 'Cuando sumes pacientes, acá vas a ver cómo avanzan todas juntas.'} /> :
        <div className="nv-directory-scroll"><div className="nv-patient-table nv-directory-table" style={{ '--dir-cols': COLUMNS } as CSSProperties} role="table" aria-label="Progreso de las pacientes">
          <div role="row" className="nv-table-head"><span role="columnheader">Paciente</span><span role="columnheader">Peso</span><span role="columnheader">Comidas registradas</span><span role="columnheader">Por revisar</span><span role="columnheader">Acciones</span></div>
          {rows.map((row) => {
            const weight = weightLines(row.weight);
            return <div role="row" key={row.patient_id}>
              <span role="cell"><span><strong>{row.patient_name}</strong><small>{row.meals.logged > 0 || row.weight.state === 'ok' ? 'Con registros' : 'Sin registros en el período'}</small></span></span>
              <span role="cell"><em className="pw-cell-label">Peso</em><strong>{weight.main}</strong><small>{weight.note}</small></span>
              <span role="cell"><em className="pw-cell-label">Comidas registradas</em><strong>{row.meals.logged}</strong><small>{mealsNote(row.meals)}</small></span>
              <span role="cell"><em className="pw-cell-label">Por revisar</em>{row.meals.pending > 0 ? <NvBadge tone="gold">{row.meals.pending}</NvBadge> : <small>Nada pendiente</small>}</span>
              <span role="cell" className="nv-directory-actions">
                <NvButton className="nv-soft" aria-label={`Abrir ficha de ${row.patient_name}`} onClick={() => onOpen(`/crm/ficha?paciente=${encodeURIComponent(row.patient_id)}`)}><Icon name="contact" size={14} />Ficha</NvButton>
                <NvButton className="nv-soft" aria-label={`Ver registros de ${row.patient_name}`} onClick={() => onOpen(`/crm/ficha?paciente=${encodeURIComponent(row.patient_id)}&seccion=registros`)}><Icon name="history" size={14} />Registros</NvButton>
              </span>
            </div>;
          })}
        </div></div>}
    </NvCard>
    <p className="pw-indicator-foot">Comidas: las que la paciente cargó en el período. Peso: el último valor cargado por la paciente o por vos, comparado con el último del período anterior. Solo se muestran pacientes de tu consultorio y mediciones con permiso vigente.</p>
    {data.source === 'memory' && <p className="nv-caption">Modo demo · datos ficticios para recorrer el consultorio.</p>}
  </section>;
}

export function ProfessionalProgressGlobal({ onOpen }: { onOpen: (href: string) => void }) {
  const [days, setDays] = useState<ProgressPeriodDays>(30);
  const [data, setData] = useState<GlobalProgressResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    crmProgressApi.global(days, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((reason) => { if (!controller.signal.aborted) { setData(null); setError(reason instanceof Error ? reason.message : 'No pudimos consultar el progreso.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, refresh]);
  if (loading && !data) return <NvState kind="loading" title="Consultando el progreso…" description="Estamos reuniendo los registros de tus pacientes." />;
  if (error || !data) return <NvState kind="error" title="No pudimos cargar el progreso global" description={error || 'Reintentá en un momento.'} action={<NvButton onClick={() => setRefresh((value) => value + 1)}>Reintentar</NvButton>} />;
  return <ProgressGlobalView data={data} days={days} onDays={setDays} onOpen={onOpen} />;
}
