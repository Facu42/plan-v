import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DURATIONS = [15, 30, 45, 60, 90];
const CHANNELS = [
  { id: 'video', label: 'Videollamada' },
  { id: 'presencial', label: 'Presencial' },
];

type Props = { patient: Patient; startEditing?: boolean };

function parseWhen(when: string | undefined): { day: string; time: string } {
  const [day = '', time = ''] = (when ?? '').split(' · ');
  return {
    day: WEEK_DAYS.includes(day) ? day : 'Lunes',
    time: /^\d{2}:\d{2}$/.test(time) ? time : '14:30',
  };
}

export function CrmAppointmentsTab({ patient, startEditing = false }: Props) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const current = patient.appointment;
  const [editing, setEditing] = useState(() => startEditing || !current);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => ({
    ...parseWhen(current?.when),
    duration: current?.duration ?? 45,
    channel: current?.channel ?? 'video',
    meet_url: current?.meet_url ?? '',
  }));

  useEffect(() => {
    setEditing(startEditing || !patient.appointment);
    setConfirmingCancel(false);
    setError(null);
    setForm({
      ...parseWhen(patient.appointment?.when),
      duration: patient.appointment?.duration ?? 45,
      channel: patient.appointment?.channel ?? 'video',
      meet_url: patient.appointment?.meet_url ?? '',
    });
  }, [patient.id, patient.appointment, startEditing]);

  const save = async () => {
    setBusy(true);
    setError(null);
    const meet_url = form.meet_url.trim();
    try {
      await api.updateAppointment(patient.id, meet_url ? { ...form, meet_url } : { day: form.day, time: form.time, duration: form.duration, channel: form.channel });
      await refreshPatient(patient.id);
      setEditing(false);
    } catch {
      setError('No pudimos guardar el turno. Revisá que el enlace sea HTTPS.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.updateAppointment(patient.id, null);
      await refreshPatient(patient.id);
      setConfirmingCancel(false);
    } catch {
      setError('No pudimos cancelar el turno. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="appointments-tab" aria-label="Consultas">
      <article className="crm-card appointment-current-card">
        <div className="card-heading"><h3>Próxima consulta</h3><Icon name="video" size={15} /></div>
        {current ? (
          <>
            <p className="appointment-time">{current.when} <span>{current.duration} min</span></p>
            <p className="appointment-channel">{CHANNELS.find((c) => c.id === current.channel)?.label ?? current.channel}</p>
            {current.meet_url && (
              <a className="subtle-action appointment-link" href={current.meet_url} target="_blank" rel="noopener noreferrer">
                Abrir videollamada <Icon name="arrow" size={14} />
              </a>
            )}
            <div className="appointment-actions">
              <button type="button" className="soft-button" onClick={() => { setEditing(true); setConfirmingCancel(false); }}>
                <Icon name="edit" size={14} />Reagendar
              </button>
              {confirmingCancel ? (
                <>
                  <button type="button" className="danger-button" disabled={busy} onClick={cancel}>
                    Sí, cancelar el turno
                  </button>
                  <button type="button" className="soft-button" disabled={busy} onClick={() => setConfirmingCancel(false)}>
                    No, volver
                  </button>
                </>
              ) : (
                <button type="button" className="soft-button" onClick={() => { setConfirmingCancel(true); setEditing(false); }}>
                  Cancelar turno
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="menu-day-empty">Sin turno cargado. Agendá la próxima consulta abajo.</p>
        )}
      </article>

      {editing && (
        <article className="crm-card appointment-form-card">
          <div className="card-heading"><h3>{current ? 'Reagendar consulta' : 'Agendar consulta'}</h3><Icon name="calendar" size={15} /></div>
          <div className="appointment-form">
            <label>
              <span>Día</span>
              <select value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}>
                {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </label>
            <label>
              <span>Hora</span>
              <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
            </label>
            <label>
              <span>Duración</span>
              <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}>
                {DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
              </select>
            </label>
            <label>
              <span>Canal</span>
              <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
                {CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}
              </select>
            </label>
            <label className="appointment-meet-field">
              <span>Enlace de videollamada (opcional)</span>
              <input
                type="url"
                value={form.meet_url}
                maxLength={500}
                placeholder="https://…"
                aria-label="Enlace de videollamada"
                onChange={(e) => setForm((f) => ({ ...f, meet_url: e.target.value }))}
              />
            </label>
          </div>
          {error && <p className="review-error" role="alert">{error}</p>}
          <div className="appointment-actions">
            <button type="button" className="primary-button" disabled={busy} onClick={save}>
              <Icon name={busy ? 'loader' : 'check'} size={14} className={busy ? 'spin' : ''} />Guardar turno
            </button>
            {current && (
              <button type="button" className="soft-button" disabled={busy} onClick={() => setEditing(false)}>
                Volver
              </button>
            )}
          </div>
        </article>
      )}
    </section>
  );
}
