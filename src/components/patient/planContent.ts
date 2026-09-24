import type { Patient } from '../../types';

export type PlanMeal = { slot: string; title: string; time: string };
export type PlanDay = { id: string; label: string; longLabel: string; isToday: boolean; meals: PlanMeal[] };
export type PlanWeek = { id: string; label: string; range: string; days: PlanDay[] };

const TIMES: Record<string, string> = {
  Desayuno: '08:00',
  Colación: '10:30',
  Almuerzo: '13:30',
  Merienda: '17:30',
  Cena: '21:00',
};

const COLACIONES = [
  'Fruta fresca + puñado de frutos secos',
  'Yogur natural + canela',
  'Tostada integral con queso untable',
  'Fruta + un puñado de nueces',
  'Yogur + fruta',
  'Galletas de arroz + queso',
  'Fruta de estación',
];

const FUTURE_MENUS: readonly (readonly PlanMeal[])[] = [
  [
    { slot: 'Desayuno', title: 'Avena con yogur y fruta', time: '08:00' },
    { slot: 'Almuerzo', title: 'Pollo al horno con verduras', time: '13:30' },
    { slot: 'Merienda', title: 'Tostada con palta y huevo', time: '17:30' },
    { slot: 'Cena', title: 'Tortilla de verduras + ensalada', time: '21:00' },
  ],
  [
    { slot: 'Desayuno', title: 'Yogur griego, granola y fruta', time: '08:00' },
    { slot: 'Almuerzo', title: 'Bowl de quinoa, pollo y vegetales', time: '13:30' },
    { slot: 'Merienda', title: 'Fruta + yogur', time: '17:30' },
    { slot: 'Cena', title: 'Sopa de zapallo + pan integral', time: '21:00' },
  ],
  [
    { slot: 'Desayuno', title: 'Huevos revueltos + pan integral', time: '08:00' },
    { slot: 'Almuerzo', title: 'Wrap de pollo y ensalada', time: '13:30' },
    { slot: 'Merienda', title: 'Yogur + fruta + nueces', time: '17:30' },
    { slot: 'Cena', title: 'Pescado al horno con vegetales', time: '21:00' },
  ],
  [
    { slot: 'Desayuno', title: 'Tostadas integrales + queso y fruta', time: '08:00' },
    { slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada', time: '13:30' },
    { slot: 'Merienda', title: 'Licuado de fruta + semillas', time: '17:30' },
    { slot: 'Cena', title: 'Omelette de verduras', time: '21:00' },
  ],
  [
    { slot: 'Desayuno', title: 'Yogur con avena y banana', time: '08:00' },
    { slot: 'Almuerzo', title: 'Pasta integral con verduras', time: '13:30' },
    { slot: 'Merienda', title: 'Tostada con queso untable', time: '17:30' },
    { slot: 'Cena', title: 'Ensalada completa con huevo', time: '21:00' },
  ],
  [
    { slot: 'Desayuno', title: 'Pan integral + huevo', time: '09:00' },
    { slot: 'Almuerzo', title: 'Bowl tibio de pollo y vegetales', time: '13:30' },
    { slot: 'Merienda', title: 'Fruta + nueces', time: '17:30' },
    { slot: 'Cena', title: 'Plan B: tostada + huevo + palta', time: '21:00' },
  ],
  [
    { slot: 'Desayuno', title: 'Yogur + fruta + semillas', time: '09:00' },
    { slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada', time: '13:30' },
    { slot: 'Merienda', title: 'Yogur + fruta', time: '17:30' },
    { slot: 'Cena', title: 'Elegí tu versión favorita', time: '21:00' },
  ],
];

const SECOND_FUTURE_MENU = [FUTURE_MENUS[2], FUTURE_MENUS[3], FUTURE_MENUS[4], FUTURE_MENUS[5], FUTURE_MENUS[6], FUTURE_MENUS[0], FUTURE_MENUS[1]];

export const PERMITTED_SEASONINGS = ['Orégano', 'Perejil', 'Albahaca', 'Pimienta', 'Pimentón', 'Cúrcuma', 'Comino', 'Ajo', 'Limón', 'Vinagre'];

export function flavorTip(title: string) {
  const meal = title.toLocaleLowerCase('es-AR');
  if (meal.includes('pollo') || meal.includes('milanesa')) return 'Pimentón, ajo y perejil; terminá con limón si te gusta.';
  if (meal.includes('wrap')) return 'Comino y pimentón en el pollo; yogur con limón para unirlo.';
  if (meal.includes('bowl') || meal.includes('quinoa')) return 'Pimentón y ajo en el pollo; oliva, limón y pimienta en los vegetales.';
  if (meal.includes('tortilla') || meal.includes('omelette') || meal.includes('huevo')) return 'Orégano, pimienta y pimentón suave. Agregalos al final.';
  if (meal.includes('sopa') || meal.includes('zapallo')) return 'Ajo al cocinar; pimienta y nuez moscada al servir.';
  if (meal.includes('pescado')) return 'Limón, perejil y pimienta. Sumalos al final para que se sientan más.';
  if (meal.includes('yogur') || meal.includes('avena') || meal.includes('fruta')) return 'Canela y ralladura de limón o naranja para variar el sabor.';
  return 'Orégano, pimienta, pimentón o limón son buenas opciones para darle sabor.';
}

export function preparationSteps(title: string) {
  const meal = title.toLocaleLowerCase('es-AR');
  if (meal.includes('wrap')) return ['Condimentá el pollo con pimentón y comino.', 'Calentá la tortilla, sumá pollo y ensalada.', 'Cerrá con yogur, limón y pimienta.'];
  if (meal.includes('bowl') || meal.includes('quinoa')) return ['Cociná el pollo con ajo y pimentón.', 'Horneá o salteá los vegetales con oliva.', 'Serví junto y terminá con limón.'];
  if (meal.includes('milanesa')) return ['Mezclá el rebozado con ajo, perejil y pimentón.', 'Cociná hasta dorar de ambos lados.', 'Acompañá con ensalada, limón y pimienta.'];
  if (meal.includes('tortilla') || meal.includes('omelette')) return ['Rehogá las verduras con ajo y orégano.', 'Sumá el huevo batido y cociná a fuego bajo.', 'Terminá con pimienta o pimentón suave.'];
  if (meal.includes('sopa') || meal.includes('zapallo')) return ['Cociná zapallo, cebolla y ajo hasta que estén tiernos.', 'Procesá con el líquido de cocción.', 'Serví con pimienta y nuez moscada.'];
  if (meal.includes('pescado')) return ['Condimentá con limón, perejil y pimienta.', 'Cociná al horno hasta que esté tierno.', 'Sumá los vegetales ya cocidos.'];
  if (meal.includes('yogur') || meal.includes('avena') || meal.includes('fruta') || meal.includes('colación')) return ['Armalo en un recipiente o llevátelo listo.', 'Sumá canela, ralladura o semillas si te gustan.', 'Dejalo a mano para resolver el momento sin improvisar.'];
  return ['Elegí una base del plan y preparala simple.', 'Sumá los condimentos que aparecen en tu menú.', 'Probalo y ajustá el sabor a tu gusto.'];
}

export function withColacion(meals: readonly PlanMeal[], dayIndex = 0): PlanMeal[] {
  if (meals.some((meal) => meal.slot.toLocaleLowerCase('es-AR') === 'colación')) return [...meals];
  return [...meals, { slot: 'Colación', title: COLACIONES[dayIndex % COLACIONES.length], time: TIMES.Colación }]
    .sort((a, b) => a.time.localeCompare(b.time));
}

function dateId(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function displayDay(date: Date) {
  const label = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric' }).format(date).replace('.', '');
  const longLabel = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return { label: label.charAt(0).toUpperCase() + label.slice(1), longLabel: longLabel.charAt(0).toUpperCase() + longLabel.slice(1) };
}

function displayRange(start: Date) {
  const end = addDays(start, 6);
  const day = new Intl.DateTimeFormat('es-AR', { day: 'numeric' });
  const month = new Intl.DateTimeFormat('es-AR', { month: 'long' });
  const startLabel = start.getMonth() === end.getMonth() ? day.format(start) : `${day.format(start)} de ${month.format(start)}`;
  return `Del ${startLabel} al ${day.format(end)} de ${month.format(end)}`;
}

function sameWeekday(label: string, date: Date) {
  const expected = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date).toLocaleLowerCase('es-AR');
  return label.toLocaleLowerCase('es-AR').startsWith(expected);
}

function normalizeMeals(meals: readonly { slot: string; title: string; time?: string }[]) {
  return meals.map((meal) => ({ ...meal, time: meal.time ?? TIMES[meal.slot] ?? '12:00' }));
}

export function buildMenuWeeks(patient: Patient, today = new Date()): PlanWeek[] {
  const weekStart = startOfWeek(today);
  const current = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const isToday = dateId(date) === dateId(today);
    const weekly = patient.weekPlan.find((day) => sameWeekday(day.day, date))?.meals ?? [];
    const source = isToday && patient.todayPlan.length > 0 ? patient.todayPlan : weekly;
    const labels = displayDay(date);
    return { id: dateId(date), ...labels, isToday, meals: source.length ? withColacion(normalizeMeals(source), index) : [] };
  });

  const futureWeek = (id: string, label: string, offset: number, templates: readonly (readonly PlanMeal[])[]): PlanWeek => {
    const start = addDays(weekStart, offset * 7);
    return {
      id,
      label,
      range: displayRange(start),
      days: templates.map((meals, index) => {
        const date = addDays(start, index);
        return { id: dateId(date), ...displayDay(date), isToday: false, meals: withColacion(meals, index) };
      }),
    };
  };

  return [
    { id: 'current', label: 'Esta semana', range: displayRange(weekStart), days: current },
    futureWeek('next', 'Próxima semana', 1, FUTURE_MENUS),
    futureWeek('following', 'Semana siguiente', 2, SECOND_FUTURE_MENU),
  ];
}
