import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { DEFAULT_HABIT_REMINDERS, type HabitReminders } from '../../habit-reminders';

type Props = {
  prefs?: HabitReminders;
  onSave?: (next: HabitReminders) => Promise<void> | void;
  status?: string;
};

/** Horarios de comer, agua y dormir. Empiezan apagados. */
export function HabitReminderFields({ prefs = DEFAULT_HABIT_REMINDERS, onSave, status }: Props) {
  const [draft, setDraft] = useState(prefs);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(prefs); }, [prefs]);
  const times = [draft.mealTimes[0] ?? '08:30', draft.mealTimes[1] ?? '13:00', draft.mealTimes[2] ?? '20:30'];
  const setTime = (index: number, value: string) => setDraft((current) => {
    const mealTimes = [current.mealTimes[0] ?? '08:30', current.mealTimes[1] ?? '13:00', current.mealTimes[2] ?? '20:30'];
    mealTimes[index] = value;
    return { ...current, mealTimes };
  });

  return (
    <form className="pms-habits" onSubmit={(event) => {
      event.preventDefault();
      if (!onSave || busy) return;
      setBusy(true);
      void Promise.resolve(onSave(draft)).finally(() => setBusy(false));
    }}>
      <p className="pms-group">Recordatorios</p>
      <fieldset className="pms-habit">
        <label><input type="checkbox" checked={draft.mealsOn} onChange={(event) => setDraft({ ...draft, mealsOn: event.target.checked })} /> Avisame para comer</label>
        <span className="pms-habit-times">
          {['Desayuno', 'Almuerzo', 'Cena'].map((label, index) => (
            <label key={label}>{label}<input aria-label={label} type="time" value={times[index]} disabled={!draft.mealsOn} onChange={(event) => setTime(index, event.target.value)} /></label>
          ))}
        </span>
      </fieldset>
      <fieldset className="pms-habit">
        <label><input type="checkbox" checked={draft.waterOn} onChange={(event) => setDraft({ ...draft, waterOn: event.target.checked })} /> Avisame para tomar agua</label>
        <label>Cada
          <select aria-label="Cada cuántas horas" value={draft.waterEveryHours} disabled={!draft.waterOn} onChange={(event) => setDraft({ ...draft, waterEveryHours: Number(event.target.value) })}>
            {[1, 2, 3, 4].map((hours) => <option key={hours} value={hours}>{hours === 1 ? '1 hora' : `${hours} horas`}</option>)}
          </select>
        </label>
        <span className="pms-habit-times">
          <label>Desde<input aria-label="Agua desde" type="time" value={draft.waterFrom} disabled={!draft.waterOn} onChange={(event) => setDraft({ ...draft, waterFrom: event.target.value })} /></label>
          <label>Hasta<input aria-label="Agua hasta" type="time" value={draft.waterUntil} disabled={!draft.waterOn} onChange={(event) => setDraft({ ...draft, waterUntil: event.target.value })} /></label>
        </span>
      </fieldset>
      <fieldset className="pms-habit">
        <label><input type="checkbox" checked={draft.sleepOn} onChange={(event) => setDraft({ ...draft, sleepOn: event.target.checked })} /> Avisame para dormir</label>
        <label>A las<input aria-label="Hora de dormir" type="time" value={draft.sleepTime} disabled={!draft.sleepOn} onChange={(event) => setDraft({ ...draft, sleepTime: event.target.value })} /></label>
      </fieldset>
      <button type="submit" disabled={busy}>Guardar recordatorios</button>
      <small>{status || 'Te llegan al teléfono si tenés los avisos activados. Empiezan apagados.'}</small>
    </form>
  );
}

/** Carga y guarda los horarios de la paciente. Si la base todavía no tiene la tabla, lo dice. */
export function HabitRemindersPanel() {
  const [prefs, setPrefs] = useState<HabitReminders>(DEFAULT_HABIT_REMINDERS);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let alive = true;
    api.getHabitReminders().then((result) => { if (alive) setPrefs(result.prefs); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  return <HabitReminderFields prefs={prefs} status={status} onSave={async (next) => {
    try {
      const saved = await api.saveHabitReminders(next);
      setPrefs(saved.prefs);
      setStatus('Listo. Te vamos a avisar en esos horarios.');
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : 'No pudimos guardar. Probá de nuevo.');
    }
  }} />;
}
