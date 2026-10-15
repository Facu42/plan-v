import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../shared/Icon';
import { CarePanel } from './CarePanel';
import { NvBadge, NvState } from './primitives';
import { buildCalendarWeek } from './WeeklyPlanCalendar';
import type { ShowroomPatient } from './showroom-model';
import { recipesApi } from '../../api/recipes';
import { careErrorMessage } from '../../api/care';
import type { RecipeView } from '../../types/recipes';
import { usePublishedPlan, weekPlanForPatient } from './usePublishedPlan';
import './showroom-patient-plan.css';

type PatientPlanMeal = { slot: string; title: string; time: string; servings: number | null; recipe_id: string | null };
type PatientPlanDay = ReturnType<typeof buildCalendarWeek>[number] & { meals: PatientPlanMeal[] };

export function buildPatientPlanView(patient: Pick<ShowroomPatient, 'todayPlan' | 'weekPlan'>, now: Date) {
  const days: PatientPlanDay[] = buildCalendarWeek(now).map((calendarDay) => {
    const planned = patient.weekPlan.find((entry) => entry.day === calendarDay.day)?.meals ?? [];
    const meals = planned.map((meal) => {
      const current = calendarDay.isToday
        ? patient.todayPlan.find((entry) => entry.slot === meal.slot && entry.title === meal.title)
          ?? patient.todayPlan.find((entry) => entry.slot === meal.slot)
        : undefined;
      return { ...meal, time: current?.time ?? '', servings: null, recipe_id: null };
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
  const { published } = usePublishedPlan(patient.id);
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [recipeError, setRecipeError] = useState('');
  const weekPlan = weekPlanForPatient(patient, published);
  const view = useMemo(() => {
    const slotMeta = published?.slots ?? [];
    const days: PatientPlanDay[] = buildCalendarWeek(now).map((calendarDay) => {
      const planned = weekPlan.find((entry) => entry.day === calendarDay.day)?.meals ?? [];
      const meals = planned.map((meal) => {
        const current = calendarDay.isToday
          ? patient.todayPlan.find((entry) => entry.slot === meal.slot && entry.title === meal.title)
            ?? patient.todayPlan.find((entry) => entry.slot === meal.slot)
          : undefined;
        const meta = slotMeta.find((item) => item.day === calendarDay.day && item.slot === meal.slot);
        return { ...meal, time: current?.time ?? '', servings: meta?.servings ?? null, recipe_id: meta?.recipe_id ?? null };
      });
      return { ...calendarDay, meals };
    });
    return {
      days,
      totalMeals: days.reduce((total, day) => total + day.meals.length, 0),
      plannedDays: days.filter((day) => day.meals.length > 0).length,
    };
  }, [weekPlan, patient.todayPlan, now, published]);
  const todayIndex = Math.max(0, view.days.findIndex((day) => day.isToday));
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const [boardOpened, setBoardOpened] = useState(false);
  const term = query.trim().toLocaleLowerCase('es-AR');

  useEffect(() => setSelectedIndex(todayIndex), [patient.id, todayIndex]);
  useEffect(() => {
    const controller = new AbortController();
    recipesApi.published(patient.id, controller.signal)
      .then((result) => { setRecipes(result.recipes); setRecipeError(''); })
      .catch((err) => { if (err instanceof DOMException && err.name === 'AbortError') return; setRecipeError(careErrorMessage(err)); });
    return () => controller.abort();
  }, [patient.id]);

  const selectedDay = view.days[selectedIndex] ?? view.days[todayIndex];
  const displayDays = view.days;
  const displaySlots = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
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
    <section className="nvpp-figma-board" aria-label="Plan de comidas de la semana">
      <div className="nvpp-figma-toolbar"><div><button type="button" aria-label="Semana anterior" disabled><Icon name="chevron" size={15} /></button><button type="button" aria-label="Semana siguiente" disabled><Icon name="chevron" size={15} /></button><strong>{now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</strong></div><button type="button" className="nvpp-figma-shopping" onClick={onShopping}>Lista de compras</button></div>
      <div className="nvpp-figma-grid"><div className="nvpp-figma-head"><span>Semana actual</span>{displaySlots.map((slot) => <strong key={slot}>{slot}</strong>)}</div>{displayDays.map((day) => <div className="nvpp-figma-row" key={day.isoDate}><div className="nvpp-figma-day"><strong>{day.day}</strong><time dateTime={day.isoDate}>{day.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</time></div>{displaySlots.map((slot) => { const meal = day.meals.find((entry) => entry.slot === slot && (!term || `${entry.slot} ${entry.title}`.toLocaleLowerCase('es-AR').includes(term))); return <button type="button" key={slot} className={`nvpp-figma-meal nvpp-figma-${slot.toLocaleLowerCase('es-AR')}`} disabled={!meal} onClick={() => { setSelectedIndex(view.days.findIndex((entry) => entry.isoDate === day.isoDate)); setBoardOpened(true); window.setTimeout(() => document.querySelector('.nvpp-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }} aria-label={meal ? `${day.day}, ${slot}: ${meal.title}` : `${day.day}, ${slot}: ${term ? 'sin coincidencia' : 'sin indicación publicada'}`}><span aria-hidden="true" />{meal ? <strong>{meal.title}</strong> : <small>{term ? 'Sin coincidencia' : 'Sin indicación'}</small>}</button>; })}</div>)}</div>
    </section>
    <header className="nvpp-hero">
      <div><span>MI ALIMENTACIÓN</span><h2>Tu plan semanal</h2><p>Plan publicado por tu nutricionista. Elegí un día para revisar sus indicaciones.</p></div>
      <button type="button" className="nv-button primary" onClick={onShopping}><Icon name="check" size={18} /> Armar lista de compras</button>
    </header>

    <dl className="nvpp-summary" aria-label="Resumen del plan">
      <div><dt>Días con indicaciones</dt><dd>{view.plannedDays}<small> de 7 días</small></dd></div>
      <div><dt>Comidas asignadas</dt><dd>{view.totalMeals}<small> esta semana</small></dd></div>
      <div><dt>Tipo de plan</dt><dd>{published ? `Versión ${published.version}` : 'Semanal'}<small>{published ? `semana del ${published.period_start}` : 'vigente'}</small></dd></div>
    </dl>

    <section className="nvpp-week" aria-label="Elegir día del plan">
      <header><div><span>SEMANA ACTUAL</span><h3>{now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3></div><NvBadge>Lectura</NvBadge></header>
      <div className="nvpp-days">{view.days.map((day, index) => <button className="nvpp-day" type="button" key={day.isoDate} aria-current={day.isToday ? 'date' : undefined} aria-pressed={selectedIndex === index} onClick={() => setSelectedIndex(index)}><span>{day.day.slice(0, 3)}</span><time dateTime={day.isoDate}>{day.date.getDate()}</time><small>{day.meals.length || '—'}</small></button>)}</div>
    </section>

    {term ? <section className="nvpp-results" aria-label="Resultados en el plan">
      <header><div><span>BÚSQUEDA</span><h3>{results.length} {results.length === 1 ? 'resultado' : 'resultados'} en tu semana</h3></div><small>Se buscan títulos y momentos de comida.</small></header>
      {results.length ? <div className="nvpp-result-list">{results.map(({ day, meal }) => <article key={`${day.isoDate}-${meal.slot}`}><NvBadge tone={meal.slot === 'Cena' ? 'gold' : 'green'}>{meal.slot}</NvBadge><div><strong>{meal.title}</strong><small>{day.day}{meal.time ? ` · ${meal.time}` : ''}</small></div></article>)}</div> : <NvState title="Sin coincidencias" description="Probá con otro plato o momento de comida." />}
    </section> : <section className={`nvpp-detail${boardOpened ? ' is-board-open' : ''}`} aria-live="polite">
      <header><div><span>{selectedDay.isToday ? 'HOY' : 'PLAN SEMANAL'}</span><h3>{selectedDay.day} {selectedDay.date.getDate()}</h3></div><small>{selectedDay.meals.length} {selectedDay.meals.length === 1 ? 'comida asignada' : 'comidas asignadas'}</small><button type="button" className="nvpp-board-close" onClick={() => setBoardOpened(false)}>Cerrar</button></header>
      {selectedDay.meals.length ? <div className="nvpp-meals">{selectedDay.meals.map((meal, index) => {
        const recipe = meal.recipe_id ? recipes.find((item) => item.id === meal.recipe_id) : undefined;
        return <article key={`${selectedDay.isoDate}-${meal.slot}`}><span className="nvpp-number">{String(index + 1).padStart(2, '0')}</span><div className="nvpp-meal-copy"><div><NvBadge tone={meal.slot === 'Cena' ? 'gold' : 'green'}>{meal.slot}</NvBadge>{meal.time && <time>{meal.time}</time>}</div><strong>{meal.title}</strong><small>{meal.servings ? `${meal.servings} ${meal.servings === 1 ? 'porción registrada' : 'porciones registradas'}` : 'Indicación publicada · sin cantidades registradas'}</small>
          {recipe && <button type="button" className="nv-button" onClick={() => setOpenId(openId === recipe.id ? null : recipe.id)}>{openId === recipe.id ? 'Ocultar receta' : 'Ver receta publicada'}</button>}
          {recipe && openId === recipe.id && <div className="nvpp-recipe"><p>{recipe.explanation}</p><p>Ingredientes</p><ul>{recipe.ingredients.map((item, line) => <li key={line}>{item}</li>)}</ul><p>Preparación</p><ol>{recipe.steps.map((item, line) => <li key={line}>{item}</li>)}</ol></div>}
        </div><Icon name="leaf" size={18} /></article>;
      })}</div> : <NvState title="Sin comidas asignadas" description="Tu nutricionista todavía no publicó indicaciones para este día." />}
    </section>}

    {recipeError && <p className="nvpp-note" role="alert">{recipeError}</p>}
    <p className="nvpp-note"><Icon name="list" size={16} /> La lista se arma automáticamente desde el menú publicado. Revisá las preparaciones que todavía no tienen ingredientes detallados.</p>
    <CarePanel patientId={patient.id} mode="menu" />
  </section>;
}
