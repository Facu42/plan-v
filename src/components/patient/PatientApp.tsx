import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { useActivePatient, useAppStore } from '../../store/useAppStore';
import { Icon, Mark } from '../shared/Icon';
import { DailyRemindersPanel } from './DailyRemindersPanel';
import { MealLogModal } from './MealLogModal';
import { PatientCamino } from './PatientCamino';
import { PatientMessages } from './PatientMessages';
import { PatientPlan } from './PatientPlan';
import { buildDailyReminders } from './daily-reminders';
import { hasFullPatientAccess } from '../../billing';
import { PatientPaywall } from './PatientPaywall';
import { flavorTip, PERMITTED_SEASONINGS, preparationSteps, withColacion } from './planContent';

type Tab = 'hoy' | 'plan' | 'camino' | 'mensajes';

const mealIcons: Record<string, 'sun' | 'leaf' | 'heart' | 'moon'> = {
  Desayuno: 'sun',
  Colación: 'leaf',
  Almuerzo: 'leaf',
  Merienda: 'heart',
  Cena: 'moon',
};

const mealTones: Record<string, string> = {
  Desayuno: 'yellow',
  Colación: 'mint',
  Almuerzo: 'green',
  Merienda: 'coral',
  Cena: 'lilac',
};

function PatientHome({ openPhoto, onShowPlan, onShowMessages, darkMode, onToggleTheme }: { openPhoto: (slot?: string) => void; onShowPlan: () => void; onShowMessages: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  const patient = useActivePatient()!;
  const refreshPatient = useAppStore((s) => s.refreshPatient);
  const todayPlan = useMemo(() => withColacion(patient.todayPlan), [patient.todayPlan]);
  const reminders = useMemo(() => buildDailyReminders({
    todayPlan,
    meal_logs: patient.meal_logs,
    hydration: patient.hydration,
    sleep_minutes: patient.sleep_minutes,
    appointment: patient.appointment,
  }), [patient.appointment, patient.hydration, patient.meal_logs, patient.sleep_minutes, todayPlan]);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [sleepHours, setSleepHours] = useState(patient.sleep_minutes === null ? '' : String(patient.sleep_minutes / 60));
  const [sleepSaving, setSleepSaving] = useState(false);
  const [sleepError, setSleepError] = useState('');
  const mealPreferenceKey = `plan-v:${patient.id}:selected-meal`;
  const [selectedMeal, setSelectedMeal] = useState(() => {
    try {
      return window.localStorage.getItem(mealPreferenceKey) ?? todayPlan[1]?.slot ?? todayPlan[0]?.slot ?? 'Almuerzo';
    } catch {
      return todayPlan[1]?.slot ?? todayPlan[0]?.slot ?? 'Almuerzo';
    }
  });

  useEffect(() => {
    if (!todayPlan.some((meal) => meal.slot === selectedMeal)) {
      setSelectedMeal(todayPlan[1]?.slot ?? todayPlan[0]?.slot ?? 'Almuerzo');
    }
  }, [selectedMeal, todayPlan]);

  useEffect(() => {
    try {
      window.localStorage.setItem(mealPreferenceKey, selectedMeal);
    } catch {
      // La app sigue funcionando aunque el navegador no permita guardar preferencias.
    }
  }, [mealPreferenceKey, selectedMeal]);

  useEffect(() => {
    setSleepHours(patient.sleep_minutes === null ? '' : String(patient.sleep_minutes / 60));
  }, [patient.sleep_minutes]);

  const rhythmMessage = useMemo(() => {
    if (patient.hydration >= 7) return 'Tu ritmo está cuidado. Seguí escuchándote.';
    if (patient.hydration >= 5) return 'Vas bien. Un vaso más acompaña tu tarde.';
    return 'Hagamos una pausa breve para tomar agua.';
  }, [patient.hydration]);

  const loggedSlots = new Set(
    patient.meal_logs.filter((l) => l.logged_at.startsWith(new Date().toISOString().slice(0, 10))).map((l) => l.slot),
  );

  const addWater = async () => {
    await api.updateHabits(patient.id, { hydration: Math.min(patient.hydration + 1, 8) });
    await refreshPatient(patient.id);
  };

  const setEnergy = async (energy: string) => {
    await api.updateHabits(patient.id, { energy });
    await refreshPatient(patient.id);
  };

  const saveSleep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hours = Number(sleepHours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      setSleepError('Ingresá un valor entre 0 y 24 horas.');
      return;
    }

    setSleepSaving(true);
    setSleepError('');
    try {
      await api.updateHabits(patient.id, { sleep_minutes: Math.round(hours * 60) });
      await refreshPatient(patient.id);
    } catch (reason) {
      setSleepError(reason instanceof Error ? reason.message : 'No pudimos guardar el descanso.');
    } finally {
      setSleepSaving(false);
    }
  };

  const lastVeroMsg = [...patient.messages].reverse().find((m) => m.from === 'vero');
  const selectedMealPlan = todayPlan.find((meal) => meal.slot === selectedMeal);

  return (
    <main className="patient-shell">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Plan V</span></div>
        <div className="topbar-actions">
          <button className="round-button theme-toggle" type="button" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={18} /></button>
          <button className="round-button" type="button" aria-label="Ver recordatorios" aria-expanded={remindersOpen} aria-controls="daily-reminders-panel" onClick={() => setRemindersOpen(true)}>
            <Icon name="bell" size={18} />
            {reminders.some((reminder) => reminder.state === 'ahora' || reminder.state === 'perdido') && <b />}
          </button>
        </div>
      </header>

      <section className="patient-hello">
        <p className="eyebrow">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>Buen día, {patient.name.split(' ')[0]} <span>✦</span></h1>
        <p>Hoy no hace falta hacerlo perfecto. Solo elegir lo que te haga bien.</p>
      </section>

      <section className="pulse-card" aria-label="Tu ritmo de hoy">
        <div className="pulse-copy">
          <span className="pulse-label"><i /> Tu ritmo de hoy</span>
          <strong>{patient.adherence_score >= 70 ? 'En equilibrio' : 'Retomando el ritmo'}</strong>
          <p>{rhythmMessage}</p>
        </div>
        <div className="pulse-orbit" aria-hidden>
          <div className="orbit orbit-1" /><div className="orbit orbit-2" /><div className="orbit orbit-3" />
          <div className="pulse-core"><Icon name="heart" size={23} /></div>
          <span className="orbit-tag tag-water"><Icon name="drop" size={13} /> {patient.hydration}/8</span>
          <span className="orbit-tag tag-meals"><Icon name="check" size={13} /> {loggedSlots.size}/{todayPlan.length}</span>
        </div>
        <div className="pulse-footer">
          <span>Comidas</span>
          <div className="pulse-track">
            {todayPlan.map((m) => (
              <i key={m.slot} className={loggedSlots.has(m.slot) ? '' : 'empty'} />
            ))}
          </div>
          <span>Un paso a la vez</span>
        </div>
      </section>

      <section className="today-heading section-heading">
        <div><p className="eyebrow">Tu día, a tu manera</p><h2>¿Qué te toca ahora?</h2></div>
        <button className="text-button" type="button" onClick={onShowPlan}>Ver menú <Icon name="arrow" size={15} /></button>
      </section>

      <section className="meal-list" aria-label="Comidas de hoy">
        {todayPlan.map((meal) => {
          const logged = loggedSlots.has(meal.slot);
          return (
            <button
              key={meal.slot}
              type="button"
              className={`meal-row${meal.slot === 'Colación' ? ' colacion' : ''} ${selectedMeal === meal.slot ? 'active' : ''}`}
              onClick={() => setSelectedMeal(meal.slot)}
            >
              <time>{meal.time}</time>
              <span className={`meal-icon ${mealTones[meal.slot] ?? 'green'}`}>
                <Icon name={mealIcons[meal.slot] ?? 'leaf'} size={18} />
              </span>
              <span className="meal-copy"><b>{meal.slot}</b><small>{meal.title}{meal.slot === 'Colación' ? ' · entre desayuno y almuerzo' : ''}</small></span>
              <span className={`meal-state ${logged ? 'done' : ''}`}>
                {logged && <Icon name="check" size={13} />}
                {logged ? 'Registrado' : 'Pendiente'}
              </span>
              <Icon name="chevron" size={17} />
            </button>
          );
        })}
      </section>

      {selectedMealPlan && (
        <section className="meal-tip-card" aria-label="Tip para condimentar">
          <p className="eyebrow">Para {selectedMealPlan.slot.toLocaleLowerCase('es-AR')}</p>
          <h3>Cómo darle sabor</h3>
          <p>{flavorTip(selectedMealPlan.title)}</p>
          <div className="seasoning-chips">
            {PERMITTED_SEASONINGS.slice(0, 5).map((seasoning) => <span key={seasoning}>{seasoning}</span>)}
          </div>
          <ol className="quick-preparation">
            {preparationSteps(selectedMealPlan.title).map((step) => <li key={step}>{step}</li>)}
          </ol>
          <button type="button" className="text-button" onClick={onShowPlan}>Ver condimentos y próximas semanas <Icon name="arrow" size={15} /></button>
        </section>
      )}

      <section className="patient-actions">
        <button type="button" className="photo-action" onClick={() => openPhoto(selectedMeal)}>
          <span><Icon name="camera" size={21} /></span>
          <strong>Registrar una comida</strong>
          <small>Foto o descripción · macros automáticos</small>
          <Icon name="arrow" size={18} />
        </button>
        <div className="water-action">
          <span className="water-icon"><Icon name="drop" size={21} /></span>
          <div><strong>Un vaso de agua</strong><small>{patient.hydration} de 8 registrados</small></div>
          <button type="button" aria-label="Registrar vaso de agua" onClick={addWater}><Icon name="plus" size={18} /></button>
        </div>
      </section>

      <section className="checkin-card">
        <div>
          <span className="mini-icon coral"><Icon name="sparkle" size={16} /></span>
          <p className="eyebrow">Chequeo breve</p>
          <h3>¿Cómo viene tu energía?</h3>
        </div>
        <div className="feeling-options">
          {['Baja', 'Tranquila', 'Con energía'].map((feeling, index) => (
            <button
              type="button"
              className={patient.energy === feeling ? 'selected' : ''}
              key={feeling}
              onClick={() => setEnergy(feeling)}
            >
              <span>{['◔', '◡', '◒'][index]}</span>{feeling}
            </button>
          ))}
        </div>
        {patient.energy && <p className="checkin-feedback">Registrado. Verónica lo verá en tu próximo resumen.</p>}
        <form className="sleep-checkin" id="sleep-checkin" onSubmit={saveSleep}>
          <div className="sleep-checkin-heading">
            <span className="mini-icon lilac"><Icon name="moon" size={16} /></span>
            <div><p className="eyebrow">Descanso declarado</p><h3>¿Cuántas horas dormiste?</h3></div>
          </div>
          <div className="sleep-input-row">
            <label htmlFor="sleep-hours">Horas de sueño</label>
            <input id="sleep-hours" type="number" inputMode="decimal" min="0" max="24" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} placeholder="Ej. 7,5" required />
            <span>horas</span>
            <button type="submit" disabled={sleepSaving}>{sleepSaving ? 'Guardando…' : 'Guardar'}</button>
          </div>
          {patient.sleep_minutes !== null && <p className="checkin-feedback">Descanso registrado: {Math.floor(patient.sleep_minutes / 60)} h{patient.sleep_minutes % 60 > 0 ? ` ${patient.sleep_minutes % 60} min` : ''}. Es información para tu seguimiento, no una evaluación.</p>}
          {sleepError && <p className="form-error" role="alert">{sleepError}</p>}
        </form>
      </section>

      {lastVeroMsg && (
        <section className="message-card">
          <div className="avatar avatar-vero">VT</div>
          <div><p className="eyebrow">De Verónica · hoy</p><p>“{lastVeroMsg.text}”</p></div>
          <button aria-label="Responder a Verónica" type="button" onClick={onShowMessages}><Icon name="message" size={19} /></button>
        </section>
      )}

      {patient.appointment && (
        <section className="appointment-card-patient" aria-label="Tu próxima consulta">
          <span className="mini-icon lilac"><Icon name="video" size={16} /></span>
          <div>
            <p className="eyebrow">Tu próxima consulta</p>
            <h3>{patient.appointment.when}</h3>
            <p>{patient.appointment.duration} min · {patient.appointment.channel === 'video' ? 'Videollamada con Verónica' : 'Consulta presencial'}</p>
          </div>
        </section>
      )}

      {remindersOpen && (
        <DailyRemindersPanel
          patient={patient}
          onClose={() => setRemindersOpen(false)}
          onLogMeal={(slot) => {
            setRemindersOpen(false);
            openPhoto(slot);
          }}
          onLogSleep={() => {
            setRemindersOpen(false);
            requestAnimationFrame(() => document.getElementById('sleep-checkin')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
          }}
          onAddWater={addWater}
        />
      )}
    </main>
  );
}

export function PatientApp({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const patient = useActivePatient();
  const [tab, setTab] = useState<Tab>('hoy');
  const [photoOpen, setPhotoOpen] = useState(false);
  const [defaultSlot, setDefaultSlot] = useState('Almuerzo');

  if (!patient) return <div className="loading-shell">Cargando…</div>;

  const accessLocked = !hasFullPatientAccess(patient);

  const openPhoto = (slot?: string) => {
    if (slot) setDefaultSlot(slot);
    setPhotoOpen(true);
  };

  if (accessLocked) {
    return (
      <div className={`patient-app${darkMode ? ' dark' : ''}`}>
        {tab === 'mensajes' ? (
          <PatientMessages patient={patient} />
        ) : (
          <PatientPaywall patient={patient} darkMode={darkMode} onToggleTheme={onToggleTheme} onShowMessages={() => setTab('mensajes')} />
        )}
        <nav className="patient-nav billing-nav" aria-label="Navegación del paciente">
          <button type="button" className={tab !== 'mensajes' ? 'current' : ''} onClick={() => setTab('hoy')}>
            <Icon name="heart" size={18} /><span>Acceso</span>
          </button>
          <button type="button" className={tab === 'mensajes' ? 'current' : ''} onClick={() => setTab('mensajes')}>
            <Icon name="message" size={18} /><span>Mensajes</span>
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className={`patient-app${darkMode ? ' dark' : ''}`}>
      {tab === 'hoy' && <PatientHome openPhoto={openPhoto} onShowPlan={() => setTab('plan')} onShowMessages={() => setTab('mensajes')} darkMode={darkMode} onToggleTheme={onToggleTheme} />}
      {tab === 'plan' && <PatientPlan patient={patient} darkMode={darkMode} onToggleTheme={onToggleTheme} />}
      {tab === 'camino' && <PatientCamino patient={patient} />}
      {tab === 'mensajes' && <PatientMessages patient={patient} />}

      <nav className="patient-nav" aria-label="Navegación del paciente">
        <button type="button" className={tab === 'hoy' ? 'current' : ''} onClick={() => setTab('hoy')}>
          <Icon name="heart" size={18} /><span>Hoy</span>
        </button>
        <button type="button" className={tab === 'plan' ? 'current' : ''} onClick={() => setTab('plan')}>
          <Icon name="calendar" size={18} /><span>Mi plan</span>
        </button>
        <button type="button" className="nav-plus" onClick={() => openPhoto()} aria-label="Registrar comida">
          <Icon name="camera" size={21} />
        </button>
        <button type="button" className={tab === 'camino' ? 'current' : ''} onClick={() => setTab('camino')}>
          <Icon name="trend" size={18} /><span>Mi camino</span>
        </button>
        <button type="button" className={tab === 'mensajes' ? 'current' : ''} onClick={() => setTab('mensajes')}>
          <Icon name="message" size={18} /><span>Mensajes</span>
        </button>
      </nav>

      {photoOpen && <MealLogModal patient={patient} defaultSlot={defaultSlot} close={() => setPhotoOpen(false)} />}
    </div>
  );
}
