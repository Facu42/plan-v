import { planReviewSnapshot } from '../../src/types/plans.js';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { CONSENT_CATALOG, type ConsentPurpose } from '../intake/consent.js';
import { SEEDED_EXERCISES } from '../../src/types/exercise.js';

/**
 * Contenido de ejemplo para recorrer la app en modo demo.
 *
 * Todo pasa por las mismas rutas que usa la interfaz (validación, permisos y
 * versionado incluidos), así que nada se escribe por fuera de la API. Se llama
 * con APP_MODE=demo y datos en memoria, y para llenar las cuentas de prueba del
 * administrador (sólo esas: `target` es la paciente de prueba recién vinculada).
 */

type Fetcher = (path: string, init?: RequestInit) => Response | Promise<Response>;
export type DemoStep = { step: string; ok: boolean; status?: number };

const TZ = 'America/Argentina/Buenos_Aires';
const SOFIA = 'pat-sofia';
const MARINA = 'pat-marina';
const LUCIA = 'pat-lucia';

function isoInTz(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana de `iso` (la semana de Plan V empieza el lunes). */
function mondayOf(iso: string): string {
  const weekday = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return addDays(iso, -((weekday + 6) % 7));
}

type Recipe = { title: string; photo: string; portions: number; steps: string[]; items: Array<{ name: string; quantity: number; unit: 'g' | 'ml' | 'u' | 'cdita' | 'cda' | 'taza' }> };

const RECIPES: Recipe[] = [
  {
    title: 'Bowl tibio de pollo y vegetales',
    photo: 'bowl-pollo-vegetales.jpg',
    portions: 2,
    steps: ['Cortar el pollo en tiras y dorarlo a la plancha.', 'Saltear zapallo, zanahoria y brócoli 8 minutos.', 'Servir sobre arroz integral con semillas.'],
    items: [
      { name: 'Pechuga de pollo', quantity: 250, unit: 'g' },
      { name: 'Arroz integral cocido', quantity: 1, unit: 'taza' },
      { name: 'Brócoli', quantity: 150, unit: 'g' },
      { name: 'Zapallo', quantity: 150, unit: 'g' },
      { name: 'Aceite de oliva', quantity: 1, unit: 'cda' },
    ],
  },
  {
    title: 'Yogur griego, granola y frutas',
    photo: 'yogur-granola.jpg',
    portions: 1,
    steps: ['Servir el yogur en un vaso.', 'Sumar la fruta cortada y la granola por encima.'],
    items: [
      { name: 'Yogur griego natural', quantity: 170, unit: 'g' },
      { name: 'Granola sin azúcar', quantity: 2, unit: 'cda' },
      { name: 'Frutillas', quantity: 80, unit: 'g' },
      { name: 'Banana', quantity: 0.5, unit: 'u' },
    ],
  },
  {
    title: 'Omelette de queso con ensalada',
    photo: 'omelette-ensalada.jpg',
    portions: 1,
    steps: ['Batir los huevos con sal y pimienta.', 'Cocinar en sartén, sumar el queso y doblar.', 'Servir con hojas verdes, tomate y pepino.'],
    items: [
      { name: 'Huevos', quantity: 2, unit: 'u' },
      { name: 'Queso por salut', quantity: 40, unit: 'g' },
      { name: 'Hojas verdes', quantity: 60, unit: 'g' },
      { name: 'Tomate cherry', quantity: 6, unit: 'u' },
    ],
  },
  {
    title: 'Ensalada tibia de garbanzos y calabaza',
    photo: 'ensalada-tibia.jpg',
    portions: 2,
    steps: ['Hornear la calabaza en cubos 25 minutos.', 'Mezclar con garbanzos cocidos y espinaca.', 'Terminar con queso feta y perejil.'],
    items: [
      { name: 'Calabaza', quantity: 300, unit: 'g' },
      { name: 'Garbanzos cocidos', quantity: 200, unit: 'g' },
      { name: 'Espinaca', quantity: 80, unit: 'g' },
      { name: 'Queso feta', quantity: 50, unit: 'g' },
      { name: 'Aceite de oliva', quantity: 1, unit: 'cda' },
    ],
  },
  {
    title: 'Merluza al horno con papas',
    photo: 'pescado-horno.jpg',
    portions: 2,
    steps: ['Cortar las papas en rodajas finas y hornear 15 minutos.', 'Sumar la merluza con limón y perejil.', 'Hornear 15 minutos más.'],
    items: [
      { name: 'Filet de merluza', quantity: 300, unit: 'g' },
      { name: 'Papa', quantity: 2, unit: 'u' },
      { name: 'Limón', quantity: 1, unit: 'u' },
      { name: 'Aceite de oliva', quantity: 1, unit: 'cda' },
    ],
  },
  {
    title: 'Wrap integral de pollo',
    photo: 'wrap-pollo.jpg',
    portions: 1,
    steps: ['Calentar la tortilla integral.', 'Rellenar con pollo, lechuga, tomate y palta.', 'Enrollar y cortar al medio.'],
    items: [
      { name: 'Tortilla integral', quantity: 1, unit: 'u' },
      { name: 'Pechuga de pollo cocida', quantity: 100, unit: 'g' },
      { name: 'Lechuga', quantity: 30, unit: 'g' },
      { name: 'Palta', quantity: 0.25, unit: 'u' },
    ],
  },
  {
    title: 'Tostada con huevo y tomate',
    photo: 'tostada-huevo.jpg',
    portions: 1,
    steps: ['Tostar el pan integral.', 'Cocinar el huevo a la plancha.', 'Servir con rodajas de tomate y orégano.'],
    items: [
      { name: 'Pan integral', quantity: 1, unit: 'u' },
      { name: 'Huevos', quantity: 1, unit: 'u' },
      { name: 'Tomate', quantity: 0.5, unit: 'u' },
    ],
  },
  {
    title: 'Bowl de quinoa, huevo y vegetales',
    photo: 'bowl-quinoa.jpg',
    portions: 1,
    steps: ['Cocinar la quinoa 15 minutos.', 'Hervir el huevo 7 minutos.', 'Servir con morrón, tomate, palta y brócoli.'],
    items: [
      { name: 'Quinoa cocida', quantity: 1, unit: 'taza' },
      { name: 'Huevos', quantity: 1, unit: 'u' },
      { name: 'Morrón', quantity: 0.5, unit: 'u' },
      { name: 'Palta', quantity: 0.25, unit: 'u' },
    ],
  },
  {
    title: 'Milanesa de pollo al horno con ensalada',
    photo: 'milanesa-ensalada.jpg',
    portions: 2,
    steps: ['Pasar el pollo por huevo y pan rallado.', 'Hornear 20 minutos a 200 °C, dando vuelta a mitad.', 'Servir con ensalada de lechuga, tomate y zanahoria.'],
    items: [
      { name: 'Pechuga de pollo', quantity: 300, unit: 'g' },
      { name: 'Pan rallado', quantity: 4, unit: 'cda' },
      { name: 'Huevos', quantity: 1, unit: 'u' },
      { name: 'Lechuga', quantity: 80, unit: 'g' },
    ],
  },
  {
    title: 'Fideos integrales salteados con vegetales',
    photo: 'pasta-integral.jpg',
    portions: 2,
    steps: ['Hervir los fideos integrales.', 'Saltear zucchini, tomate y choclo.', 'Mezclar todo en la sartén con queso rallado.'],
    items: [
      { name: 'Fideos integrales', quantity: 160, unit: 'g' },
      { name: 'Zucchini', quantity: 1, unit: 'u' },
      { name: 'Tomate cherry', quantity: 8, unit: 'u' },
      { name: 'Queso rallado', quantity: 1, unit: 'cda' },
    ],
  },
  {
    title: 'Sopa de verduras y garbanzos',
    photo: 'sopa-verduras.jpg',
    portions: 3,
    steps: ['Rehogar cebolla, zanahoria y apio.', 'Sumar papa, garbanzos y caldo; cocinar 25 minutos.', 'Agregar espinaca al final.'],
    items: [
      { name: 'Zanahoria', quantity: 2, unit: 'u' },
      { name: 'Papa', quantity: 1, unit: 'u' },
      { name: 'Garbanzos cocidos', quantity: 150, unit: 'g' },
      { name: 'Espinaca', quantity: 80, unit: 'g' },
    ],
  },
  {
    title: 'Pavo a la plancha con espárragos',
    photo: 'pavo-esparragos.jpg',
    portions: 1,
    steps: ['Dorar la pechuga de pavo a la plancha.', 'Saltear los espárragos 5 minutos.', 'Servir con arroz integral.'],
    items: [
      { name: 'Pechuga de pavo', quantity: 150, unit: 'g' },
      { name: 'Espárragos', quantity: 120, unit: 'g' },
      { name: 'Arroz integral cocido', quantity: 0.5, unit: 'taza' },
    ],
  },
];

/** Qué comer cada día de la semana: [desayuno, almuerzo, merienda, cena]; un número es una receta del catálogo. */
const WEEK: Array<[string | number, string | number, string | number, string | number]> = [
  [1, 3, 6, 4],
  [6, 0, 1, 2],
  [1, 5, 'Fruta y un puñado de nueces', 10],
  [1, 7, 'Licuado de banana con leche', 11],
  [1, 8, 6, 4],
  ['Panqueques de avena y banana', 'Asado con ensalada mixta', 'Fruta de estación', 9],
  [1, 9, 6, 10],
];
const SLOTS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'] as const;

/** Foto ilustrativa del plato (hecha con IA), guardada junto a este archivo. Sin la foto, la receta queda sin portada. */
async function demoPhoto(file: string): Promise<string | null> {
  try {
    const bytes = await readFile(new URL(`./fotos/${file}`, import.meta.url));
    return `data:image/jpeg;base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export type DemoTarget = {
  /** Paciente que recibe recetas, plan, medidas, comidas, hábitos y rutina. */
  patientId: string;
  /** Pacientes a las que se les completan las alergias (por defecto, sólo la principal). */
  intakePatients?: string[];
  /** Respuestas a turnos de ejemplo (sólo en el demo, donde los turnos ya existen). */
  appointments?: boolean;
};

const DEMO_TARGET: DemoTarget = { patientId: SOFIA, intakePatients: [SOFIA, MARINA, LUCIA], appointments: true };

export async function seedDemoContent(fetcher: Fetcher, now = new Date(), target: DemoTarget = DEMO_TARGET): Promise<DemoStep[]> {
  const MAIN = target.patientId;
  const steps: DemoStep[] = [];
  const call = async (step: string, path: string, method: string, body?: unknown) => {
    try {
      const response = await fetcher(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const ok = response.ok;
      steps.push({ step, ok, status: response.status });
      return ok ? await response.json() as Record<string, any> : null;
    } catch {
      steps.push({ step, ok: false });
      return null;
    }
  };

  const today = isoInTz(now);
  const monday = mondayOf(today);

  // Alergias declaradas: publicar recetas y planes valida contra ellas.
  for (const id of target.intakePatients ?? [MAIN]) {
    const intake = await call(`ingreso ${id}`, `/api/patients/${id}/intake`, 'GET');
    if (!intake) continue;
    await call(`alergias ${id}`, `/api/patients/${id}/intake`, 'PATCH', {
      expected_revision: intake.intake.revision,
      step: 'allergies',
      payload: { allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } },
    });
  }

  // Catálogo de recetas publicado y asignado a Sofía.
  const recipeIds: string[] = [];
  for (const recipe of RECIPES) {
    const id = randomUUID();
    const saved = await call(`receta ${recipe.title}`, '/api/recipes', 'POST', {
      id,
      title: recipe.title,
      yield_portions: recipe.portions,
      steps: recipe.steps,
      nutrient_source: 'Tabla del consultorio 2026',
      items: recipe.items,
    });
    if (!saved) continue;
    await call(`publicar ${recipe.title}`, `/api/recipes/${id}/publish`, 'POST', { expected_version: 1, expected_revision: saved.recipe.current.revision });
    const photo = await demoPhoto(recipe.photo);
    if (photo) await call(`foto ${recipe.title}`, `/api/recipes/${id}/cover/manual`, 'POST', { expected_version: 1, expected_cover_url: null, data_url: photo });
    await call(`asignar ${recipe.title}`, `/api/recipes/${id}/assign`, 'POST', { patient_id: MAIN, expected_version: 1 });
    recipeIds.push(id);
  }

  // Plan fechado de esta semana, publicado.
  if (recipeIds.length === RECIPES.length) {
    const planId = randomUUID();
    const items = WEEK.flatMap((meals, day) => meals.map((meal, slot) => {
      const base = { for_date: addDays(monday, day), slot: SLOTS[slot], portions: 1, public_note: '' };
      return typeof meal === 'number'
        ? { ...base, recipe_id: recipeIds[meal], recipe_version: 1 }
        : { ...base, free_text: meal };
    }));
    const plan = await call('plan de la semana', `/api/patients/${MAIN}/plans`, 'POST', {
      id: planId, period_start: monday, period_end: addDays(monday, 6), timezone: TZ, items,
    });
    if (plan) await call('publicar plan', `/api/plans/${planId}/publish`, 'POST', { expected_version: 1, expected_snapshot: planReviewSnapshot(plan.plan.current) });
  }

  // Medidas: permiso y seis semanas de peso, cintura y cadera.
  const consent = (purpose: ConsentPurpose) => {
    const text = CONSENT_CATALOG.find((entry) => entry.purpose === purpose)!;
    return call(`permiso ${purpose}`, `/api/patients/${MAIN}/consents`, 'POST', {
      purpose, text_version: text.text_version, text_hash: text.text_hash, decision: 'granted',
    });
  };
  await consent('measurement');
  const weights = [68.4, 68.0, 67.7, 67.1, 66.8, 66.3];
  for (const [index, value] of weights.entries()) {
    const recorded_on = addDays(today, -7 * (weights.length - 1 - index));
    await call(`peso ${recorded_on}`, `/api/patients/${MAIN}/care/records`, 'POST', {
      id: randomUUID(), recorded_on, data: { kind: 'weight', value, unit: 'kg', source: 'patient', note: '' },
    });
  }
  for (const [index, [waist, hip]] of [[82, 101], [80, 100], [78.5, 99]].entries()) {
    const recorded_on = addDays(today, -14 * (2 - index));
    await call(`cintura ${recorded_on}`, `/api/patients/${MAIN}/care/records`, 'POST', {
      id: randomUUID(), recorded_on, data: { kind: 'waist', value: waist, unit: 'cm', source: 'professional', note: '' },
    });
    await call(`cadera ${recorded_on}`, `/api/patients/${MAIN}/care/records`, 'POST', {
      id: randomUUID(), recorded_on, data: { kind: 'hip', value: hip, unit: 'cm', source: 'professional', note: '' },
    });
  }

  // Comidas de hoy revisadas, para que el registro nutricional tenga valores.
  const meals = [
    { slot: 'Desayuno', description: 'Yogur griego con granola y frutillas', macros: { kcal: 320, protein_g: 18, carbs_g: 38, fat_g: 10 } },
    { slot: 'Almuerzo', description: 'Bowl tibio de pollo, arroz integral y vegetales', macros: { kcal: 540, protein_g: 42, carbs_g: 52, fat_g: 16 } },
  ];
  for (const meal of meals) {
    const created = await call(`comida ${meal.slot}`, `/api/patients/${MAIN}/meals/analyze`, 'POST', { slot: meal.slot, description: meal.description });
    const log = created?.log;
    if (!log) continue;
    await call(`revisar ${meal.slot}`, `/api/patients/${MAIN}/meals/${log.id}`, 'PATCH', {
      status: 'confirmed', foods: log.foods ?? [], macros: meal.macros,
    });
  }

  // Hábitos de hoy.
  await call('hábitos de hoy', `/api/patients/${MAIN}/habits`, 'PATCH', { hydration: 5, sleep_minutes: 445, energy: 'Buena' });

  // Actividad del dispositivo (card superior de Ejercicio) y la declarada a mano.
  for (const [daysAgo, activity, minutes, intensity, kcal] of [[1, 'Caminata', 40, 'moderada', 180], [3, 'Bicicleta fija', 30, 'intensa', 240], [5, 'Pilates', 50, 'suave', null]] as const) {
    await call(`dispositivo ${activity}`, `/api/patients/${MAIN}/care/records`, 'POST', {
      id: randomUUID(), recorded_on: addDays(today, -daysAgo), data: { kind: 'activity', activity, minutes, intensity, kcal, note: '' },
    });
  }
  // Actividad registrada y una rutina asignada.
  for (const activity of [
    { activity: 'Caminata al aire libre', duration_minutes: 35, intensity: 'moderada', note: 'Por la costanera' },
    { activity: 'Yoga', duration_minutes: 45, intensity: 'suave', note: '' },
  ]) {
    await call(`actividad ${activity.activity}`, `/api/patients/${MAIN}/activities`, 'POST', activity);
  }
  const [mobility, squat, bridge, walk] = SEEDED_EXERCISES;
  await call('rutina', `/api/patients/${MAIN}/routines?audience=pro`, 'POST', {
    title: 'Fuerza suave en casa',
    items: [
      { exercise_id: mobility.id, sets: 2, reps: 10, rest_seconds: 30 },
      { exercise_id: squat.id, sets: 3, reps: 12, rest_seconds: 45 },
      { exercise_id: bridge.id, sets: 3, reps: 12, rest_seconds: 45 },
      { exercise_id: walk.id, sets: 1, reps: 1, rest_seconds: 0 },
    ],
  });

  // Historial de consultas: Sofía confirma y Marina pide otro horario.
  if (target.appointments) {
    await call('confirmar consulta', `/api/patients/${MAIN}/appointment/confirm`, 'POST', { reply: 'attending' });
    await call('reprogramar consulta', `/api/patients/${MARINA}/appointment/reschedule`, 'POST', { day: 'Viernes', time: '10:00' });
  }

  return steps;
}
