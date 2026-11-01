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

export type PermisoAviso = 'permitido' | 'bloqueado' | 'sin-pedir' | 'no-disponible';

export function textoDiagnostico(input: { permiso: PermisoAviso; suscripcion: boolean; prueba: boolean; avisosActivos: boolean }) {
  const permiso = {
    permitido: 'Permiso: el teléfono permite los avisos.',
    bloqueado: 'Permiso: los avisos están bloqueados en los ajustes del teléfono.',
    'sin-pedir': 'Permiso: todavía no pedimos permiso en este teléfono.',
    'no-disponible': 'Permiso: este navegador no recibe avisos.',
  }[input.permiso];
  const suscripcion = input.suscripcion ? 'Suscripción: este teléfono está anotado.' : 'Suscripción: este teléfono no está anotado.';
  const prueba = !input.prueba
    ? 'El aviso de prueba no está en la versión publicada.'
    : input.avisosActivos
      ? 'Podés mandar un aviso de prueba.'
      : 'Los avisos todavía no están activos en el servidor.';
  return { permiso, suscripcion, prueba, puedeProbar: input.prueba && input.avisosActivos };
}

/** Permiso, suscripción y, solo en local o staging, un aviso de prueba. */
export function HabitPushDiagnostics({ permiso, suscripcion, prueba, avisosActivos, aviso = '', busy = false, onProbar }: {
  permiso: PermisoAviso; suscripcion: boolean; prueba: boolean; avisosActivos: boolean; aviso?: string; busy?: boolean; onProbar?: () => void;
}) {
  const texto = textoDiagnostico({ permiso, suscripcion, prueba, avisosActivos });
  return (
    <section className="pms-habit" aria-label="Diagnóstico de avisos">
      <p className="pms-group">Diagnóstico de avisos</p>
      <p>{texto.permiso}</p>
      <p>{texto.suscripcion}</p>
      <p>{texto.prueba}</p>
      {texto.puedeProbar ? <button type="button" disabled={busy || !suscripcion} onClick={onProbar}>Mandar aviso de prueba</button> : null}
      {aviso ? <small>{aviso}</small> : null}
    </section>
  );
}

function permisoDelTelefono(): PermisoAviso {
  if (typeof Notification === 'undefined') return 'no-disponible';
  if (Notification.permission === 'granted') return 'permitido';
  if (Notification.permission === 'denied') return 'bloqueado';
  return 'sin-pedir';
}

export function HabitPushDiagnosticsPanel() {
  const [permiso, setPermiso] = useState<PermisoAviso>('sin-pedir');
  const [suscripcion, setSuscripcion] = useState(false);
  const [prueba, setPrueba] = useState(false);
  const [avisosActivos, setAvisosActivos] = useState(false);
  const [aviso, setAviso] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let vivo = true;
    setPermiso(permisoDelTelefono());
    api.getHabitDiagnostics().then(resultado => {
      if (!vivo) return;
      setSuscripcion(resultado.suscripcion);
      setPrueba(resultado.prueba);
      setAvisosActivos(resultado.avisos_activos);
    }).catch(() => undefined);
    return () => { vivo = false; };
  }, []);
  return <HabitPushDiagnostics permiso={permiso} suscripcion={suscripcion} prueba={prueba} avisosActivos={avisosActivos} aviso={aviso} busy={busy} onProbar={() => {
    setBusy(true);
    setAviso('');
    void api.sendHabitTest().then(resultado => setAviso(resultado.enviados > 0 ? 'Mandamos un aviso de prueba a este teléfono.' : 'No había un teléfono anotado.')).catch(error => {
      setAviso(error instanceof ApiError ? error.message : 'No pudimos mandar el aviso de prueba.');
    }).finally(() => setBusy(false));
  }} />;
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
  return <>
    <HabitReminderFields prefs={prefs} status={status} onSave={async (next) => {
      try {
        const saved = await api.saveHabitReminders(next);
        setPrefs(saved.prefs);
        setStatus('Listo. Te vamos a avisar en esos horarios.');
      } catch (error) {
        setStatus(error instanceof ApiError ? error.message : 'No pudimos guardar. Probá de nuevo.');
      }
    }} />
    <HabitPushDiagnosticsPanel />
  </>;
}
