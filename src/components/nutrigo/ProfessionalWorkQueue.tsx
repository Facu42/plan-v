import { useEffect, useRef, useState } from 'react';
import { crmWorkApi } from '../../api/crm-work';
import { CRM_WORK_KINDS, type CrmWorkItem, type CrmWorkKind, type CrmWorkResponse } from '../../types/crm-work';
import type { Patient } from '../../types';
import { NvButton, NvState } from './primitives';
import './professional-workspace.css';

export const WORK_LABELS: Record<CrmWorkKind, string> = {
  intake: 'Ingresos por revisar', meal: 'Comidas por revisar', ai_menu: 'Propuestas de IA', message: 'Mensajes sin leer',
  payment: 'Pagos por confirmar', appointment: 'Consultas de hoy', record: 'Registros por revisar',
};
const STATUS_LABELS: Record<string, string> = { succeeded: 'Lista para revisar', failed: 'Requiere reintento', stale: 'Contexto actualizado', queued: 'En espera', running: 'Generando', submitted: 'Enviado', pending_review: 'Pendiente de revisión', reported: 'Por confirmar', unread: 'Sin leer', scheduled: 'Programada' };

export function WorkQueueList({ items, onOpen }: { items: CrmWorkItem[]; onOpen: (href: string) => void }) {
  return <ul className="pw-work-list">{items.map((item) => <li key={item.id}>
    <div><p>{WORK_LABELS[item.kind]} · {STATUS_LABELS[item.status] ?? 'Pendiente'}</p><h3>{item.patient_name}</h3><p>{item.title}</p>
      {item.period && <p>{item.period.start} → {item.period.end}</p>}
      <time dateTime={item.updated_at}>{new Date(item.updated_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
    </div>
    <a className="nv-button nv-soft" href={item.href} onClick={(event) => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(item.href); }} aria-label={`Abrir ${WORK_LABELS[item.kind].toLocaleLowerCase('es-AR')} de ${item.patient_name}`}>Abrir tarea</a>
  </li>)}</ul>;
}

export function ProfessionalWorkQueue({ patients, mode = 'inicio', initialKind = '', onOpen }: {
  patients: Patient[]; mode?: 'inicio' | 'seguimiento' | 'planes'; initialKind?: CrmWorkKind | ''; onOpen: (href: string) => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [kind, setKind] = useState<CrmWorkKind | ''>(initialKind);
  const [data, setData] = useState<CrmWorkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [refresh, setRefresh] = useState(0);
  const request = useRef(0);
  useEffect(() => {
    const controller = new AbortController(); const current = ++request.current;
    setLoading(true); setError('');
    crmWorkApi.list({ patient_id: patientId || undefined, kind: kind || undefined, cursor, limit: 30 }, controller.signal)
      .then((result) => { if (current === request.current && !controller.signal.aborted) setData(result); })
      .catch((reason) => { if (current === request.current && !controller.signal.aborted) { setData(null); setError(reason instanceof Error ? reason.message : 'No pudimos consultar los pendientes.'); } })
      .finally(() => { if (current === request.current && !controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [patientId, kind, cursor, refresh]);
  useEffect(() => {
    const refreshOnFocus = () => { setCursor(undefined); setRefresh((value) => value + 1); };
    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('plan-v:care-changed', refreshOnFocus);
    return () => { window.removeEventListener('focus', refreshOnFocus); window.removeEventListener('plan-v:care-changed', refreshOnFocus); };
  }, []);
  const chooseKind = (next: CrmWorkKind | '') => { setKind(next); setCursor(undefined); };
  return <section className="pw-work" aria-label={mode === 'planes' ? 'Propuestas de IA del consultorio' : 'Bandeja del consultorio'}>
    <header className="pw-work-head"><div><h2>{mode === 'inicio' ? 'Tu consultorio, hoy' : mode === 'planes' ? 'Menús pendientes de revisión' : 'Seguimiento de pacientes'}</h2><p>Revisá los pendientes y continuá el trabajo en la ficha correspondiente.</p></div><NvButton className="nv-soft" disabled={loading} onClick={() => { setCursor(undefined); setRefresh((value) => value + 1); }}>Actualizar pendientes</NvButton></header>
    {loading ? <NvState kind="loading" title="Consultando pendientes…" description="Estamos buscando el trabajo de tu consultorio." /> : error ? <NvState kind="error" title="No pudimos cargar la bandeja" description={error} action={<NvButton onClick={() => setRefresh((value) => value + 1)}>Reintentar bandeja</NvButton>} /> : data && <>
      <div className="pw-work-counts" aria-label="Pendientes por tipo">{CRM_WORK_KINDS.map((id) => <button key={id} type="button" aria-pressed={kind === id} onClick={() => chooseKind(kind === id ? '' : id)}><strong>{data.counts[id]}</strong><span>{WORK_LABELS[id]}</span></button>)}</div>
      <div className="pw-work-filters"><label>Paciente<select value={patientId} onChange={(event) => { setPatientId(event.target.value); setCursor(undefined); }}><option value="">Todo el consultorio</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label>
        <label>Tipo de pendiente<select value={kind} onChange={(event) => chooseKind(event.target.value as CrmWorkKind | '')}><option value="">Todos los pendientes</option>{CRM_WORK_KINDS.map((id) => <option key={id} value={id}>{WORK_LABELS[id]}</option>)}</select></label><p>{data.total} {data.total === 1 ? 'tarea' : 'tareas'}</p></div>
      {data.items.length ? <WorkQueueList items={data.items} onOpen={onOpen} /> : <NvState title="Sin pendientes en este filtro" description="Podés cambiar el filtro o continuar desde Pacientes y Planes." />}
      <div className="pw-work-pagination">{cursor && <NvButton className="nv-soft" onClick={() => setCursor(undefined)}>Volver al principio</NvButton>}{data.next_cursor && <NvButton onClick={() => setCursor(data.next_cursor!)}>Siguientes pendientes</NvButton>}</div>
      {data.source === 'memory' && <p className="nv-caption">Modo demo · datos ficticios para recorrer el consultorio.</p>}
    </>}
  </section>;
}
