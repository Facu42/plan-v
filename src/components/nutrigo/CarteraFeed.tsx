import { useEffect, useRef, useState } from 'react';
import { crmWorkApi } from '../../api/crm-work';
import { FEED_DAYS, type CrmFeedItem, type CrmFeedResponse, type FeedDays, type FeedStatus } from '../../types/crm-feed';
import { NvBadge, NvState } from './primitives';

const STATUS_OPTIONS: { id: FeedStatus; label: string }[] = [{ id: 'all', label: 'Todas' }, { id: 'pending_review', label: 'Por revisar' }, { id: 'reviewed', label: 'Revisadas' }];
const MEAL_STATUS: Record<string, string> = { pending_review: 'Por revisar', confirmed: 'Revisada', adjusted: 'Revisada con ajustes' };
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });

export type FeedDay = { date: string; meals: number; pending: number; water: number; patients: { id: string; name: string; href: string; items: CrmFeedItem[] }[] };

/** Agrupa por fecha (de lo nuevo a lo viejo) y, dentro del día, por paciente en el orden en que aparecen. */
export function groupFeedByDay(items: readonly CrmFeedItem[]): FeedDay[] {
  const days = new Map<string, FeedDay>();
  for (const item of items) {
    const day = days.get(item.date) ?? { date: item.date, meals: 0, pending: 0, water: 0, patients: [] };
    let patient = day.patients.find((entry) => entry.id === item.patient_id);
    if (!patient) { patient = { id: item.patient_id, name: item.patient_name, href: item.href, items: [] }; day.patients.push(patient); }
    patient.items.push(item);
    if (item.kind === 'meal') { day.meals += 1; if (item.status === 'pending_review') day.pending += 1; } else day.water += 1;
    days.set(item.date, day);
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date));
}

const messagesHref = (patientId: string) => `/crm/ficha?paciente=${encodeURIComponent(patientId)}&seccion=mensajes`;

function FeedLink({ href, label, onOpen, children }: { href: string; label: string; onOpen: (href: string) => void; children: string }) {
  return <a className="nv-button nv-soft" href={href} aria-label={label} onClick={(event) => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(href); }}>{children}</a>;
}

function daySummary(day: FeedDay) {
  return [plural(day.meals, 'comida', 'comidas'), day.pending ? `${day.pending} por revisar` : '', day.water ? `agua de ${plural(day.water, 'paciente', 'pacientes')}` : ''].filter(Boolean).join(' · ');
}

export function CarteraFeedView({ feed, loading, error, patients, days, status, patientId, onChange, onOpen }: {
  feed: CrmFeedResponse | null; loading: boolean; error: string; patients: readonly { id: string; name: string }[];
  days: FeedDays; status: FeedStatus; patientId: string;
  onChange: (next: { days?: FeedDays; status?: FeedStatus; patientId?: string }) => void; onOpen: (href: string) => void;
}) {
  const grouped = feed ? groupFeedByDay(feed.items) : [];
  return <section className="pw-feed" aria-label="Novedades de la cartera">
    <header>
      <div><h3>Novedades de la cartera</h3><p>Comidas y agua que registraron tus pacientes, día por día. Un día sin registros no significa que no haya comido.</p></div>
      <div className="pw-feed-filters">
        <label>Período<select value={days} onChange={(event) => onChange({ days: Number(event.target.value) as FeedDays })}>{FEED_DAYS.map((option) => <option key={option} value={option}>Últimos {option} días</option>)}</select></label>
        <label>Revisión<select value={status} onChange={(event) => onChange({ status: event.target.value as FeedStatus })}>{STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <label>Paciente<select value={patientId} onChange={(event) => onChange({ patientId: event.target.value })}><option value="">Todas las pacientes</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label>
      </div>
    </header>
    {error ? <NvState title="No se pudo cargar" description={error} />
      : loading && !feed ? <p role="status">Cargando novedades…</p>
      : !grouped.length ? <NvState title="Sin registros en este período" description="Probá con un período más largo u otro filtro." />
      : <ol className="pw-feed-days">{grouped.map((day, index) => <li key={day.date}>
        <details open={index === 0}>
          <summary><strong>{dayLabel(day.date)}</strong><span>{daySummary(day)}</span></summary>
          <ul className="pw-feed-patients">{day.patients.map((patient) => <li key={patient.id}>
            <div><h4>{patient.name}</h4><ul>{patient.items.map((item) => <li key={item.id}>{item.kind === 'meal'
              ? <><span>{item.slot}</span><NvBadge tone={item.status === 'pending_review' ? 'gold' : 'green'}>{MEAL_STATUS[item.status] ?? 'Registrada'}</NvBadge></>
              : <span>{plural(item.glasses, 'vaso de agua', 'vasos de agua')}</span>}</li>)}</ul></div>
            <div className="pw-feed-actions">
              <FeedLink href={patient.href} label={`Abrir la ficha de ${patient.name}`} onOpen={onOpen}>Ver registros</FeedLink>
              <FeedLink href={messagesHref(patient.id)} label={`Escribirle a ${patient.name}`} onOpen={onOpen}>Escribirle</FeedLink>
            </div>
          </li>)}</ul>
        </details>
      </li>)}</ol>}
  </section>;
}

export function CarteraFeed({ patients, onOpen }: { patients: readonly { id: string; name: string }[]; onOpen: (href: string) => void }) {
  const [days, setDays] = useState<FeedDays>(7);
  const [status, setStatus] = useState<FeedStatus>('all');
  const [patientId, setPatientId] = useState('');
  const [feed, setFeed] = useState<CrmFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => {
    const controller = new AbortController(); const current = ++request.current;
    setLoading(true); setError('');
    crmWorkApi.feed({ days, status, patient_id: patientId || undefined }, controller.signal)
      .then((result) => { if (current === request.current) setFeed(result); })
      .catch((reason) => { if (current === request.current && !controller.signal.aborted) { setFeed(null); setError(reason instanceof Error ? reason.message : 'No pudimos consultar las novedades.'); } })
      .finally(() => { if (current === request.current && !controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, status, patientId]);
  return <CarteraFeedView feed={feed} loading={loading} error={error} patients={patients} days={days} status={status} patientId={patientId}
    onChange={(next) => { if (next.days) setDays(next.days); if (next.status) setStatus(next.status); if (next.patientId !== undefined) setPatientId(next.patientId); }} onOpen={onOpen} />;
}
