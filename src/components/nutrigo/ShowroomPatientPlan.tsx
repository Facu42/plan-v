import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../shared/Icon';
import { CarePanel } from './CarePanel';
import { mealSlotTone, NvBadge, NvState } from './primitives';
import { buildCalendarWeek } from './WeeklyPlanCalendar';
import type { ShowroomPatient } from './showroom-model';
import './showroom-patient-plan.css';

type PatientPlanMeal = { slot: string; title: string; time: string };
type PatientPlanDay = ReturnType<typeof buildCalendarWeek>[number] & { meals: PatientPlanMeal[] };

export function buildPatientPlanView(patient: Pick<ShowroomPatient, 'todayPlan' | 'weekPlan'>, now: Date) {
  const days: PatientPlanDay[] = buildCalendarWeek(now).map((calendarDay) => {
    const planned = patient.weekPlan.find((entry) => entry.day === calendarDay.day)?.meals ?? [];
    const meals = planned.map((meal) => {
      const current = calendarDay.isToday
        ? patient.todayPlan.find((entry) => entry.slot === meal.slot && entry.title === meal.title)
          ?? patient.todayPlan.find((entry) => entry.slot === meal.slot)
        : undefined;
      return { ...meal, time: current?.time ?? '' };
    });
    return { ...calendarDay, meals };
  });
  return {
    days,
    totalMeals: days.reduce((total, day) => total + day.meals.length, 0),
    plannedDays: days.filter((day) => day.meals.length > 0).length,
  };
}

export function ShowroomPatientPlan({ patient, now, query, onShopping }: {
  patient: ShowroomPatient;
  now: Date;
  query: string;
  onShopping?: () => void;
}) {
  const view = useMemo(() => buildPatientPlanView(patient, now), [patient, now]);
  const todayIndex = Math.max(0, view.days.findIndex((day) => day.isToday));
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const term = query.trim().toLocaleLowerCase('es-AR');

  useEffect(() => setSelectedIndex(todayIndex), [patient.id, todayIndex]);

  const selectedDay = view.days[selectedIndex] ?? view.days[todayIndex];
  const results = term
    ? view.days.flatMap((day) => day.meals
      .filter((meal) => `${meal.slot} ${meal.title}`.toLocaleLowerCase('es-AR').includes(term))
      .map((meal) => ({ day, meal })))
    : [];

  if (view.totalMeals === 0) return <section className="nvpp-plan" aria-label="Tu plan semanal">
    <NvState title="Tu plan está en preparación" description="Cuando tu nutricionista publique comidas, las vas a encontrar acá organizadas por día." />
    <CarePanel patientId={patient.id} mode="menu" />
  </section>;

  return <section className="nvpp-plan" aria-label="Tu plan semanal">
    <header className="nvpp-hero">
      <div><span>MI ALIMENTACIÓN</span><h2>Tu plan semanal</h2><p>Plan publicado por tu nutricionista. Elegí un día para revisar sus indicaciones.</p></div>
      <button type="button" className="nv-button primary" onClick={onShopping}><Icon name="check" size={18} /> Armar lista de compras</button>
    </header>

    <dl className="nvpp-summary" aria-label="Resumen del plan">
      <div><dt>Días con indicaciones</dt><dd>{view.plannedDays}<small> de 7 días</small></dd></div>
      <div><dt>Comidas asignadas</dt><dd>{view.totalMeals}<small> esta semana</small></dd></div>
      <div><dt>Tipo de plan</dt><dd>Semanal<small> vigente</small></dd></div>
    </dl>

    <section className="nvpp-week" aria-label="Elegir día del plan">
      <header><div><span>SEMANA ACTUAL</span><h3>{now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3></div><NvBadge>Lectura</NvBadge></header>
      <div className="nvpp-days">{view.days.map((day, index) => <button className="nvpp-day" type="button" key={day.isoDate} aria-current={day.isToday ? 'date' : undefined} aria-pressed={selectedIndex === index} onClick={() => setSelectedIndex(index)}><span>{day.day.slice(0, 3)}</span><time dateTime={day.isoDate}>{day.date.getDate()}</time><small>{day.meals.length || '—'}</small></button>)}</div>
    </section>

    {term ? <section className="nvpp-results" aria-label="Resultados en el plan">
      <header><div><span>BÚSQUEDA</span><h3>{results.length} {results.length === 1 ? 'resultado' : 'resultados'} en tu semana</h3></div><small>Se buscan títulos y momentos de comida.</small></header>
      {results.length ? <div className="nvpp-result-list">{results.map(({ day, meal }) => <article key={`${day.isoDate}-${meal.slot}`}><NvBadge tone={mealSlotTone(meal.slot)}>{meal.slot}</NvBadge><div><strong>{meal.title}</strong><small>{day.day}{meal.time ? ` · ${meal.time}` : ''}</small></div></article>)}</div> : <NvState title="Sin coincidencias" description="Probá con otro plato o momento de comida." />}
    </section> : <section className="nvpp-detail" aria-live="polite">
      <header><div><span>{selectedDay.isToday ? 'HOY' : 'PLAN SEMANAL'}</span><h3>{selectedDay.day} {selectedDay.date.getDate()}</h3></div><small>{selectedDay.meals.length} {selectedDay.meals.length === 1 ? 'comida asignada' : 'comidas asignadas'}</small></header>
      {selectedDay.meals.length ? <div className="nvpp-meals">{selectedDay.meals.map((meal, index) => <article key={`${selectedDay.isoDate}-${meal.slot}`}><span className="nvpp-number">{String(index + 1).padStart(2, '0')}</span><div className="nvpp-meal-copy"><div><NvBadge tone={mealSlotTone(meal.slot)}>{meal.slot}</NvBadge>{meal.time && <time>{meal.time}</time>}</div><strong>{meal.title}</strong><small>Indicación publicada · sin cantidades ni porciones registradas</small></div><Icon name="leaf" size={18} /></article>)}</div> : <NvState title="Sin comidas asignadas" description="Tu nutricionista todavía no publicó indicaciones para este día." />}
    </section>}

    <p className="nvpp-note"><Icon name="list" size={16} /> La lista se arma automáticamente desde el menú publicado. Revisá las preparaciones que todavía no tienen ingredientes detallados.</p>
    <CarePanel patientId={patient.id} mode="menu" />
  </section>;
}
