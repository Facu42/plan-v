import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { useCare } from '../nutrigo/useCare';
import { usePublishedPlan, weekPlanForPatient } from '../nutrigo/usePublishedPlan';
import { FigmaDashboardCheckIn, type DashboardHabitPatch, type DashboardMetricKind } from './FigmaDashboardCheckIn';

type DashboardValues = {
  weight: string;
  weightNumber: string;
  weightUnit: string;
  weightNote: string;
  steps: string;
  demo: boolean;
  sleep: string;
  water: string;
  sleepWeek: (number | null)[];
  hasNutrition: boolean;
  calories: string;
  macros: { amount: string; label: string; share: number }[];
  activities: { title: string; duration: string; date: string; intensity: string }[];
  month: string;
  year: number;
  weekDays: { date: string; day: string; active: boolean }[];
  meals: { slot: string; title: string; completed: boolean; description: string }[];
  feed: { time: string; text: string; page: ShowroomPage }[];
  openMetric: (kind: DashboardMetricKind) => void;
  shiftCalendar: (days: number) => void;
  onNavigate: (page: ShowroomPage) => void;
};
const context = createContext<DashboardValues | null>(null);

export function useFigmaDashboardValues() {
  const values = useContext(context);
  if (!values) throw new Error('El dashboard Figma necesita datos del paciente.');
  return values;
}

export function FigmaDashboardProvider({ patient, onNavigate, onUpdateHabits, children }: {
  patient: ShowroomPatient;
  onNavigate: (page: ShowroomPage) => void;
  onUpdateHabits?: (patch: DashboardHabitPatch) => Promise<void>;
  children: ReactNode;
}) {
  const care = useCare(patient.id);
  const [openMetric, setOpenMetric] = useState<DashboardMetricKind | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const showMetric = (kind: DashboardMetricKind) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenMetric(kind);
  };
  const closeMetric = () => {
    setOpenMetric(null);
    window.requestAnimationFrame(() => returnFocus.current?.focus());
  };
  const { published } = usePublishedPlan(patient.id);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const today = new Date();
  const dateKey = (value: Date) => Number.isFinite(value.getTime())
    ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
    : '';
  const todayKey = dateKey(today);
  const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(today).map(({ type, value }) => [type, value]));
  const todayNoon = new Date(Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day), 15));
  const daysSinceMonday = (todayNoon.getUTCDay() + 6) % 7;
  const calendarStart = new Date(Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day) - daysSinceMonday + calendarOffset, 15));
  const calendarMonth = new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(calendarStart);
  const dayName = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(today);
  const currentDay = dayName[0].toLocaleUpperCase('es-AR') + dayName.slice(1);
  const plannedDay = weekPlanForPatient(patient, published).find((day) => day.day === currentDay);
  const plannedMeals = plannedDay?.meals ?? patient.todayPlan;
  const slots = ['Desayuno', 'Almuerzo', 'Colación', 'Cena'];
  const matchesSlot = (value: string, slot: string) => value === slot || (slot === 'Colación' && ['Merienda', 'Snack'].includes(value));
  const meals = slots.map((slot) => {
    const meal = plannedMeals.find((entry) => matchesSlot(entry.slot, slot));
    const completed = patient.logs.some((log) => dateKey(new Date(log.logged_at)) === todayKey && matchesSlot(log.slot, slot));
    return { slot, title: meal?.title || 'Sin indicación', completed, description: meal ? 'Comida indicada en tu plan vigente.' : 'Todavía no hay una comida indicada.' };
  });
  const weekDays = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(calendarStart.getTime() + index * 24 * 60 * 60 * 1000);
    return {
      date: new Intl.DateTimeFormat('es-AR', { day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(date),
      day: new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(date).replace('.', ''),
      active: dateKey(date) === todayKey,
    };
  });
  const latestWeight = care.data?.records.filter((record) => record.data.kind === 'weight')
    .sort((a, b) => b.recorded_on.localeCompare(a.recorded_on))[0];
  const demo = care.data?.source === 'memory';
  const weight = care.error ? 'No disponible' : !care.data ? 'Cargando…' : latestWeight?.data.kind === 'weight'
    ? `${latestWeight.data.value.toLocaleString('es-AR')} ${latestWeight.data.unit}` : 'Sin registro';
  const weightNumber = latestWeight?.data.kind === 'weight' ? latestWeight.data.value.toLocaleString('es-AR') : '—';
  const weightUnit = latestWeight?.data.kind === 'weight' ? latestWeight.data.unit : '';
  const hasNutrition = patient.nutritionLogCount > 0;
  const macroAmounts = [patient.macros.carbs_g, patient.macros.protein_g, patient.macros.fat_g];
  const macroEnergy = [macroAmounts[0] * 4, macroAmounts[1] * 4, macroAmounts[2] * 9];
  const totalMacroEnergy = macroEnergy.reduce((sum, amount) => sum + amount, 0);
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentActivities = patient.activities
    .filter((activity) => new Date(activity.logged_at).getTime() >= weekStart)
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    .slice(0, 3);
  const feed = [
    ...patient.logs.map((log) => ({ at: log.logged_at, text: `Registraste ${log.slot.toLocaleLowerCase('es-AR')}: ${log.description || 'comida sin descripción'}.`, page: 'diario' as const })),
    ...patient.activities.map((activity) => ({ at: activity.logged_at, text: `Registraste ${activity.activity} durante ${activity.duration_minutes} min.`, page: 'ejercicio' as const })),
    ...patient.messages.map((message) => ({ at: message.sent_at, text: message.from === 'patient' ? `Enviaste un mensaje: ${message.text}` : `Mensaje de tu nutricionista: ${message.text}`, page: 'mensajes' as const })),
  ].filter((item) => Number.isFinite(new Date(item.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 4)
    .map((item) => ({
      time: new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(item.at)),
      text: item.text.length > 145 ? `${item.text.slice(0, 142)}…` : item.text,
      page: item.page,
    }));
  const values: DashboardValues = {
    weight,
    demo,
    weightNumber,
    weightUnit,
    weightNote: care.error ? 'No se pudo cargar el peso' : !care.data ? 'Consultando mediciones' : weightNumber === '—' ? 'Sin mediciones registradas' : demo ? 'Muestra demo · última medición' : 'Última medición registrada',
    steps: patient.steps == null ? 'Sin registro' : patient.steps.toLocaleString('es-AR'),
    sleep: patient.sleepMinutes === null ? 'Sin registro' : `${(Math.round(patient.sleepMinutes / 6) / 10).toLocaleString('es-AR')} h`,
    water: `${patient.hydration} vasos`,
    sleepWeek: patient.journey.days.slice(-7).map((day) => day.sleepMinutes),
    hasNutrition,
    calories: hasNutrition ? patient.kcal.toLocaleString('es-AR') : '—',
    macros: ['Carbohidratos', 'Proteínas', 'Grasas'].map((label, index) => ({
      label,
      amount: hasNutrition ? String(macroAmounts[index]) : '—',
      share: hasNutrition && totalMacroEnergy > 0 ? Math.round(macroEnergy[index] / totalMacroEnergy * 100) : 0,
    })),
    activities: Array.from({ length: 3 }, (_, index) => {
      const activity = recentActivities[index];
      return activity ? {
        title: activity.activity,
        duration: `${activity.duration_minutes} min`,
        date: new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(new Date(activity.logged_at)),
        intensity: activity.intensity,
      } : {
        title: index === 0 ? 'Sin actividad registrada' : 'Sin otro registro',
        duration: '—', date: '', intensity: '—',
      };
    }),
    month: calendarMonth[0].toLocaleUpperCase('es-AR') + calendarMonth.slice(1),
    year: Number(new Intl.DateTimeFormat('es-AR', { year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(calendarStart)),
    weekDays,
    meals,
    feed,
    openMetric: showMetric,
    shiftCalendar: (days) => setCalendarOffset((current) => current + days),
    onNavigate,
  };
  return <context.Provider value={values}>{children}{openMetric && <FigmaDashboardCheckIn key={`${patient.id}:${openMetric}`} kind={openMetric} patient={patient} onClose={closeMetric} onUpdateHabits={onUpdateHabits} />}</context.Provider>;
}

export function FigmaDashboardMetric({ kind, assetPathPrefix }: { kind: DashboardMetricKind; assetPathPrefix: string }) {
  const values = useFigmaDashboardValues();
  const labels = { weight: 'Peso', steps: 'Pasos', sleep: 'Sueño', water: 'Consumo de agua' };
  const icons = { weight: '7544e.svg', steps: '94e6c.svg', sleep: '7d1c2.svg', water: '99830.svg' };
  const notes = {
    weight: values.weight === 'Sin registro' ? 'Todavía no hay una medición' : values.weight === 'Cargando…' ? 'Consultando mediciones' : values.weight === 'No disponible' ? 'No se pudieron cargar las mediciones' : values.demo ? 'Muestra demo · última medición' : 'Última medición registrada',
    steps: values.steps === 'Sin registro' ? 'Todavía no hay un conteo' : values.demo ? 'Muestra demo · pasos de hoy' : 'Registro de hoy',
    sleep: values.sleep === 'Sin registro' ? 'Sin registro de hoy' : values.demo ? 'Muestra demo · sueño de hoy' : 'Registro de hoy',
    water: values.demo ? 'Muestra demo · vasos de hoy' : 'Registro de hoy · sin meta prescrita',
  };
  const bars = values.sleepWeek.map((minutes, index) => <i key={index} style={{ height: minutes === null ? '15%' : `${Math.max(10, Math.min(100, minutes / 600 * 100))}%`, background: minutes === null ? '#eeeeef' : '#ffcb65' }} />);
  return <button type="button" className={`figma-dash-metric figma-dash-${kind}`} data-name="Card Statistic - Dashboard" aria-label={`Registrar ${labels[kind].toLocaleLowerCase('es-AR')}`} onClick={() => values.openMetric(kind)}>
    <span className="figma-dash-metric-head"><span>{labels[kind]}</span><span className="figma-dash-metric-icon" aria-hidden="true"><img src={`${assetPathPrefix}/${icons[kind]}`} alt="" /></span></span>
    <strong>{values[kind]}</strong>
    {kind === 'sleep' ? <span className="figma-dash-sleep-bars" aria-hidden="true">{bars}</span> : <span className={`figma-dash-track${kind === 'water' ? ' is-water' : ''}`} aria-hidden="true" />}
    <small>{notes[kind]}</small>
  </button>;
}
