import type { ShowroomPatient } from './showroom-model';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function buildCalendarWeek(now: Date) {
  const mondayOffset = (now.getDay() + 6) % 7;
  return WEEK_DAYS.map((day, index) => {
    // Local noon avoids UTC rollover and daylight-saving midnight boundaries.
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset + index, 12);
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { day, date, isoDate, isToday: index === mondayOffset };
  });
}

export function resolveCalendarMeals(patient: Pick<ShowroomPatient, 'todayPlan' | 'weekPlan'>, now: Date, selectedIndex: number) {
  const day = buildCalendarWeek(now)[selectedIndex];
  if (selectedIndex === -1 || day?.isToday) return patient.todayPlan;
  // The menu is a weekday template, not a dated appointment or historical plan.
  return patient.weekPlan.find((entry) => entry.day === day?.day)?.meals.map((meal) => ({ ...meal, time: '' })) ?? [];
}

export function WeeklyPlanCalendar({ now, selectedIndex, onSelect }: { now: Date; selectedIndex: number; onSelect: (index: number) => void }) {
  const days = buildCalendarWeek(now);
  return <section className="nw-calendar" aria-label="Días del plan semanal">
    <header><h2>{now.toLocaleDateString('es-AR', { month: 'long' })}<small>{now.getFullYear()}</small></h2><button type="button" className="nw-today" aria-label="Volver a hoy" onClick={() => onSelect(-1)}>Hoy</button></header>
    <div className="nw-days">{days.map((day, index) => <button type="button" className="nw-day" key={day.isoDate} aria-label={`Ver ${day.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} aria-current={day.isToday ? 'date' : undefined} aria-pressed={selectedIndex === -1 ? day.isToday : selectedIndex === index} onClick={() => onSelect(index)}><span>{day.day.slice(0, 3)}</span><time dateTime={day.isoDate}>{day.date.getDate()}</time></button>)}</div>
  </section>;
}
