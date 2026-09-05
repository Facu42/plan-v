import { useEffect, useMemo, useState } from 'react';
import type { Patient } from '../../types';
import { Icon, Mark } from '../shared/Icon';
import { buildMenuWeeks, flavorTip, PERMITTED_SEASONINGS, preparationSteps } from './planContent';

function readPreference(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // La selección sigue disponible durante esta visita aunque no se pueda guardar.
  }
}

export function PatientPlan({ patient, darkMode, onToggleTheme }: { patient: Patient; darkMode: boolean; onToggleTheme: () => void }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expandedMealKey, setExpandedMealKey] = useState<string | null>(null);
  const weeks = useMemo(() => buildMenuWeeks(patient), [patient]);
  const weekKey = `plan-v:${patient.id}:selected-week`;
  const dayKey = `plan-v:${patient.id}:selected-day`;
  const [selectedWeekId, setSelectedWeekId] = useState(() => readPreference(weekKey, 'current'));
  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0];
  const [selectedDayId, setSelectedDayId] = useState(() => readPreference(dayKey, selectedWeek.days.find((day) => day.isToday)?.id ?? selectedWeek.days[0]?.id ?? ''));
  const selectedDay = selectedWeek.days.find((day) => day.id === selectedDayId) ?? selectedWeek.days.find((day) => day.isToday) ?? selectedWeek.days[0];
  const shopping = useMemo(() => [...new Set(selectedWeek.days.flatMap((day) => day.meals.map((meal) => meal.title)))], [selectedWeek]);

  useEffect(() => {
    if (!weeks.some((week) => week.id === selectedWeekId)) setSelectedWeekId('current');
  }, [selectedWeekId, weeks]);

  useEffect(() => {
    if (!selectedWeek.days.some((day) => day.id === selectedDayId)) {
      setSelectedDayId(selectedWeek.days.find((day) => day.isToday)?.id ?? selectedWeek.days[0]?.id ?? '');
    }
  }, [selectedDayId, selectedWeek]);

  useEffect(() => savePreference(weekKey, selectedWeek.id), [selectedWeek.id, weekKey]);
  useEffect(() => {
    if (selectedDay) savePreference(dayKey, selectedDay.id);
  }, [dayKey, selectedDay]);

  const selectWeek = (weekId: string) => {
    const next = weeks.find((week) => week.id === weekId);
    if (!next) return;
    setSelectedWeekId(next.id);
    setSelectedDayId(next.days.find((day) => day.isToday)?.id ?? next.days[0]?.id ?? '');
  };

  const toggle = (item: string) => {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  return (
    <main className="patient-shell patient-subpage">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Mi plan</span></div>
        <button className="round-button theme-toggle" type="button" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={18} /></button>
      </header>

      <section className="subpage-hero">
        <p className="eyebrow">{selectedWeek.label}</p>
        <h1>Tu menú</h1>
        <p>Elegí el día que querés mirar. La app recuerda esta selección cuando volvés.</p>
      </section>

      <section className="plan-period-picker" aria-label="Elegir semana">
        {weeks.map((week) => (
          <button key={week.id} type="button" className={selectedWeek.id === week.id ? 'active' : ''} onClick={() => selectWeek(week.id)}>
            <strong>{week.label}</strong><small>{week.range}</small>
          </button>
        ))}
      </section>

      <section className="plan-day-picker" aria-label="Elegir día">
        {selectedWeek.days.map((day) => (
          <button key={day.id} type="button" className={selectedDay?.id === day.id ? 'active' : ''} onClick={() => setSelectedDayId(day.id)}>
            <span>{day.label}</span>{day.isToday && <small>Hoy</small>}
          </button>
        ))}
      </section>

      {selectedDay ? (
        <section className="plan-day-card selected-day">
          <div className="plan-day-heading"><div><p className="eyebrow">{selectedWeek.label}</p><h3>{selectedDay.longLabel}</h3></div>{selectedDay.isToday && <span>Hoy</span>}</div>
          {selectedDay.meals.length > 0 ? selectedDay.meals.map((meal, index) => {
            const mealKey = `${selectedDay.id}-${meal.slot}`;
            const expanded = expandedMealKey === mealKey;
            return <article className={`plan-meal-step${expanded ? ' expanded' : ''}`} key={mealKey}>
              <button type="button" aria-expanded={expanded} onClick={() => setExpandedMealKey(expanded ? null : mealKey)}>
                <span className="plan-step-number">{index + 1}</span>
                <time>{meal.time}</time>
                <div>
                  <b>{meal.slot}</b>
                  <strong>{meal.title}</strong>
                  <p><span>Tip de sabor</span>{flavorTip(meal.title)}</p>
                </div>
                <Icon name="chevron" size={15} />
              </button>
              {expanded && <div className="plan-preparation"><span>Cómo prepararla</span><ol>{preparationSteps(meal.title).map((step) => <li key={step}>{step}</li>)}</ol></div>}
            </article>;
          }) : <p className="plan-empty-day">Verónica todavía no cargó comidas para este día.</p>}
        </section>
      ) : null}

      <section className="seasoning-card">
        <div><p className="eyebrow">Para tus comidas</p><h2>Condimentos de tu plan</h2></div>
        <p>Podés usar estos para variar el sabor. Si Verónica te indicó una restricción particular, esa indicación siempre tiene prioridad.</p>
        <div className="seasoning-chips">
          {PERMITTED_SEASONINGS.map((seasoning) => <span key={seasoning}>{seasoning}</span>)}
        </div>
        <small>La sal queda a gusto, salvo que tu plan indique otra cosa.</small>
      </section>

      <section className="shopping-section">
        <div className="section-heading">
          <div><p className="eyebrow">Lista de compras</p><h2>{selectedWeek.label}</h2></div>
        </div>
        <ul className="shopping-list">
          {shopping.map((item) => (
            <li key={item}>
              <button type="button" className={checked.has(item) ? 'checked' : ''} onClick={() => toggle(item)}>
                <span className="check-box">{checked.has(item) && <Icon name="check" size={12} />}</span>
                {item}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="plan-b-banner">
        <Icon name="heart" size={18} />
        <div>
          <strong>Tu Plan B</strong>
          <p>{patient.plan_b}</p>
        </div>
      </div>
    </main>
  );
}
