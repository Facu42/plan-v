import { useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useActivePatient, useAppStore } from '../../store/useAppStore';
import { Icon, Mark } from '../shared/Icon';
import { MealLogModal } from './MealLogModal';
import { PatientCamino } from './PatientCamino';
import { PatientMessages } from './PatientMessages';
import { PatientPlan } from './PatientPlan';

type Tab = 'hoy' | 'plan' | 'camino' | 'mensajes';

const mealIcons: Record<string, 'sun' | 'leaf' | 'heart' | 'moon'> = {
  Desayuno: 'sun',
  Almuerzo: 'leaf',
  Merienda: 'heart',
  Cena: 'moon',
};

const mealTones: Record<string, string> = {
  Desayuno: 'yellow',
  Almuerzo: 'green',
  Merienda: 'coral',
  Cena: 'lilac',
};

function PatientHome({ openPhoto }: { openPhoto: (slot?: string) => void }) {
  const patient = useActivePatient()!;
  const refreshPatient = useAppStore((s) => s.refreshPatient);
  const [selectedMeal, setSelectedMeal] = useState(patient.todayPlan[1]?.slot ?? 'Almuerzo');

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

  const lastVeroMsg = [...patient.messages].reverse().find((m) => m.from === 'vero');

  return (
    <main className="patient-shell">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Plan V</span></div>
        <button className="round-button" aria-label="Ver recordatorios"><Icon name="bell" size={18} /><b /></button>
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
          <span className="orbit-tag tag-meals"><Icon name="check" size={13} /> {loggedSlots.size}/{patient.todayPlan.length}</span>
        </div>
        <div className="pulse-footer">
          <span>Comidas</span>
          <div className="pulse-track">
            {patient.todayPlan.map((m) => (
              <i key={m.slot} className={loggedSlots.has(m.slot) ? '' : 'empty'} />
            ))}
          </div>
          <span>Un paso a la vez</span>
        </div>
      </section>

      <section className="today-heading section-heading">
        <div><p className="eyebrow">Tu día, a tu manera</p><h2>¿Qué te toca ahora?</h2></div>
        <button className="text-button" type="button">Ver menú <Icon name="arrow" size={15} /></button>
      </section>

      <section className="meal-list" aria-label="Comidas de hoy">
        {patient.todayPlan.map((meal) => {
          const logged = loggedSlots.has(meal.slot);
          return (
            <button
              key={meal.slot}
              type="button"
              className={`meal-row ${selectedMeal === meal.slot ? 'active' : ''}`}
              onClick={() => setSelectedMeal(meal.slot)}
            >
              <time>{meal.time}</time>
              <span className={`meal-icon ${mealTones[meal.slot] ?? 'green'}`}>
                <Icon name={mealIcons[meal.slot] ?? 'leaf'} size={18} />
              </span>
              <span className="meal-copy"><b>{meal.slot}</b><small>{meal.title}</small></span>
              <span className={`meal-state ${logged ? 'done' : ''}`}>
                {logged && <Icon name="check" size={13} />}
                {logged ? 'Registrado' : 'Pendiente'}
              </span>
              <Icon name="chevron" size={17} />
            </button>
          );
        })}
      </section>

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
      </section>

      {lastVeroMsg && (
        <section className="message-card">
          <div className="avatar avatar-vero">VT</div>
          <div><p className="eyebrow">De Verónica · hoy</p><p>“{lastVeroMsg.text}”</p></div>
          <button aria-label="Responder a Verónica" type="button"><Icon name="message" size={19} /></button>
        </section>
      )}
    </main>
  );
}

export function PatientApp() {
  const patient = useActivePatient();
  const [tab, setTab] = useState<Tab>('hoy');
  const [photoOpen, setPhotoOpen] = useState(false);
  const [defaultSlot, setDefaultSlot] = useState('Almuerzo');

  if (!patient) return <div className="loading-shell">Cargando…</div>;

  const openPhoto = (slot?: string) => {
    if (slot) setDefaultSlot(slot);
    setPhotoOpen(true);
  };

  return (
    <>
      {tab === 'hoy' && <PatientHome openPhoto={openPhoto} />}
      {tab === 'plan' && <PatientPlan patient={patient} />}
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
    </>
  );
}
