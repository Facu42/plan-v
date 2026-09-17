import { useEffect, useRef, useState } from 'react';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { buildDailyReminders, type DailyReminder, type DailyReminderState } from './daily-reminders';
import { withColacion } from './planContent';

const stateLabels: Record<DailyReminderState, string> = {
  done: 'Registrado',
  perdido: 'Horario anterior',
  ahora: 'Ahora',
  proximo: 'Próximo',
};

const reminderIcons: Record<DailyReminder['kind'], 'clock' | 'drop' | 'video' | 'moon'> = {
  comida: 'clock',
  agua: 'drop',
  consulta: 'video',
  sueno: 'moon',
};

type Props = {
  patient: Patient;
  onClose: () => void;
  onLogMeal: (slot: string) => void;
  onLogSleep: () => void;
  onAddWater: () => Promise<void>;
};

export function DailyRemindersPanel({ patient, onClose, onLogMeal, onLogSleep, onAddWater }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reminders = buildDailyReminders({
    todayPlan: withColacion(patient.todayPlan),
    meal_logs: patient.meal_logs,
    hydration: patient.hydration,
    sleep_minutes: patient.sleep_minutes,
    appointment: patient.appointment,
  });

  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const addWater = async () => {
    setBusy(true);
    setError('');
    try {
      await onAddWater();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos registrar el vaso.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop reminders-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="reminders-panel" id="daily-reminders-panel" role="dialog" aria-modal="true" aria-labelledby="reminders-title">
        <header className="reminders-head">
          <div>
            <p className="eyebrow">Tu día</p>
            <h2 id="reminders-title">Recordatorios</h2>
            <p>Una guía breve para acompañarte, sin evaluarte.</p>
          </div>
          <button ref={closeRef} type="button" className="modal-close" aria-label="Cerrar recordatorios" onClick={onClose}>×</button>
        </header>

        <ol className="reminders-list">
          {reminders.map((reminder) => (
            <li className={`reminder-row ${reminder.state}`} key={reminder.id}>
              <span className={`reminder-icon ${reminder.kind}`}><Icon name={reminderIcons[reminder.kind]} size={16} /></span>
              <div className="reminder-copy">
                <span><time>{reminder.time ?? 'Durante el día'}</time><small>{stateLabels[reminder.state]}</small></span>
                <strong>{reminder.title === 'agua' ? 'Tomar agua' : reminder.title === 'consulta' ? 'Consulta con Verónica' : reminder.title}</strong>
                <p>{reminder.detail}</p>
              </div>
              {reminder.kind === 'comida' && reminder.state !== 'done' && (
                <button type="button" className="reminder-action" onClick={() => onLogMeal(reminder.title)}>Registrar</button>
              )}
              {reminder.kind === 'agua' && (
                <button type="button" className="reminder-action" disabled={busy} onClick={addWater}>{busy ? 'Guardando…' : '+1 vaso'}</button>
              )}
              {reminder.kind === 'sueno' && reminder.state !== 'done' && (
                <button type="button" className="reminder-action" onClick={onLogSleep}>Registrar</button>
              )}
              {reminder.state === 'done' && <span className="reminder-done" aria-label="Registrado"><Icon name="check" size={14} /></span>}
            </li>
          ))}
        </ol>

        {reminders.length === 0 && <p className="reminders-empty">No tenés recordatorios pendientes para hoy.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
