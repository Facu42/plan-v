import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { usePublishedPlan, weekPlanForPatient } from '../nutrigo/usePublishedPlan';

type MealSlot = 'Desayuno' | 'Almuerzo' | 'Colación' | 'Cena';
type PlanDay = { day: string; date: string; meals: { slot: string; title: string }[] };
type SelectedMeal = { day: string; date: string; slot: MealSlot; title: string };
type PlanContext = {
  days: PlanDay[];
  month: string;
  year: number;
  mealTitle: (dayIndex: number, slot: MealSlot) => string;
  openMeal: (dayIndex: number, slot: MealSlot) => void;
  openShopping: () => void;
  openSearch: () => void;
  openFilter: () => void;
};

const context = createContext<PlanContext | null>(null);
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const matchesSlot = (mealSlot: string, slot: MealSlot) => mealSlot === slot || (slot === 'Colación' && ['Merienda', 'Snack'].includes(mealSlot));

export function FigmaMealPlanProvider({ patient, onShopping, children }: {
  patient: ShowroomPatient;
  onShopping: () => void;
  children: ReactNode;
}) {
  const { published, loaded, error } = usePublishedPlan(patient.id);
  const [selected, setSelected] = useState<SelectedMeal | null>(null);
  const [panel, setPanel] = useState<'search' | 'filter' | null>(null);
  const [query, setQuery] = useState('');
  const [filterSlot, setFilterSlot] = useState<MealSlot | 'Todas'>('Todas');
  useEffect(() => {
    if (!selected && !panel) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelected(null); setPanel(null); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [selected, panel]);
  const plan = useMemo(() => weekPlanForPatient(patient, published), [patient, published]);
  const days = useMemo(() => {
    const today = new Date();
    return dayNames.map((day, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + index, 12);
      return {
        day,
        date: date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
        meals: plan.find((entry) => entry.day === day)?.meals ?? [],
      };
    });
  }, [plan]);
  const today = new Date();
  const value: PlanContext = {
    days,
    month: today.toLocaleDateString('es-AR', { month: 'long' }),
    year: today.getFullYear(),
    mealTitle: (dayIndex, slot) => {
      const title = days[dayIndex]?.meals.find((meal) => matchesSlot(meal.slot, slot))?.title;
      if (!title) return 'Sin indicación';
      return (filterSlot !== 'Todas' && filterSlot !== slot) || (query && !title.toLocaleLowerCase('es-AR').includes(query.toLocaleLowerCase('es-AR')))
        ? '—' : title;
    },
    openMeal: (dayIndex, slot) => {
      const day = days[dayIndex];
      const meal = day?.meals.find((entry) => matchesSlot(entry.slot, slot));
      if (day && meal && (filterSlot === 'Todas' || filterSlot === slot)
        && (!query || meal.title.toLocaleLowerCase('es-AR').includes(query.toLocaleLowerCase('es-AR'))))
        setSelected({ day: day.day, date: day.date, slot, title: meal.title });
    },
    openShopping: onShopping,
    openSearch: () => setPanel('search'),
    openFilter: () => setPanel('filter'),
  };

  return <context.Provider value={value}>
    {children}
    {loaded && error && <p className="figma-plan-error" role="alert">No se pudo actualizar el plan publicado: {error}</p>}
    {selected && typeof document !== 'undefined' && createPortal(
      <div className="figma-plan-dialog-backdrop" onClick={() => setSelected(null)}>
        <section className="figma-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="figma-plan-dialog-title" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="figma-plan-dialog-close" aria-label="Cerrar detalle" onClick={() => setSelected(null)}>×</button>
          <span>{selected.day} {selected.date} · {selected.slot}</span>
          <h2 id="figma-plan-dialog-title">{selected.title}</h2>
          <p>Comida indicada en tu plan semanal vigente.</p>
          <button type="button" className="figma-plan-dialog-action" onClick={() => { setSelected(null); onShopping(); }}>Ver lista de compras</button>
        </section>
      </div>, document.body,
    )}
    {panel && typeof document !== 'undefined' && createPortal(
      <div className="figma-plan-dialog-backdrop" onClick={() => setPanel(null)}>
        <section className="figma-plan-dialog" role="dialog" aria-modal="true" aria-label={panel === 'search' ? 'Buscar en el plan' : 'Filtrar el plan'} onClick={(event) => event.stopPropagation()}>
          <button type="button" className="figma-plan-dialog-close" aria-label="Cerrar" onClick={() => setPanel(null)}>×</button>
          <h2>{panel === 'search' ? 'Buscar en el plan' : 'Filtrar comidas'}</h2>
          {panel === 'search' ? <label className="figma-plan-search">Nombre de la comida<input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: almuerzo, arroz…" /></label>
            : <div className="figma-plan-filters">{(['Todas', 'Desayuno', 'Almuerzo', 'Colación', 'Cena'] as const).map((slot) => <button type="button" key={slot} aria-pressed={filterSlot === slot} onClick={() => setFilterSlot(slot)}>{slot}</button>)}</div>}
          <button type="button" className="figma-plan-dialog-action" onClick={() => setPanel(null)}>Ver plan</button>
        </section>
      </div>, document.body,
    )}
  </context.Provider>;
}

export function useFigmaMealPlan() {
  const plan = useContext(context);
  if (!plan) throw new Error('La pantalla del plan necesita FigmaMealPlanProvider.');
  return plan;
}
