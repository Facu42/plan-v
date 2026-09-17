import type { AppointmentHistoryEntry } from '../../types';
import { NvState } from './primitives';
import { HISTORY_ACTION_LABEL, channelLabel, historyActorLabel } from './appointment-history';

export function AppointmentHistoryList({
  entries,
  audience = 'patient',
}: {
  entries: readonly AppointmentHistoryEntry[];
  audience?: 'patient' | 'professional';
}) {
  return <section className="nv-history" aria-label="Historial de turnos">
    <header>
      <h3>Historial de turnos</h3>
      <small>Cambios publicados y fechas vencidas. No registra asistencia ni notas clínicas.</small>
    </header>
    {entries.length ? <ol>
      {entries.map((entry) => <li key={entry.id}>
        <strong>{HISTORY_ACTION_LABEL[entry.action]}</strong>
        <small>{entry.when} · {entry.duration} min · {channelLabel(entry.channel)}</small>
        <small>{entry.dateId ? entry.dateId : 'Sin fecha puntual'} · {historyActorLabel(entry.actor)}</small>
      </li>)}
    </ol> : <NvState
      title="Todavía no hay historial"
      description={audience === 'patient'
        ? 'Cuando se venza, cancele o reprogramen un turno, va a aparecer acá. No inventamos consultas pasadas.'
        : 'Los cambios de turno y las fechas vencidas de esta paciente van a listarse acá. No se rellena historia clínica.'}
    />}
  </section>;
}
