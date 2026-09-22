import { randomUUID } from 'node:crypto';
import { CONSENT_CATALOG, type ConsentPurpose } from '../intake/consent.js';
import { SEEDED_EXERCISES } from '../../src/types/exercise.js';

/**
 * Contenido de ejemplo para recorrer la app en modo demo.
 *
 * Todo pasa por las mismas rutas que usa la interfaz (validación, permisos y
 * versionado incluidos), así que nada se escribe por fuera de la API. Sólo se
 * llama con APP_MODE=demo y datos en memoria; las pruebas no lo cargan.
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

type Recipe = { title: string; portions: number; steps: string[]; items: Array<{ name: string; quantity: number; unit: 'g' | 'ml' | 'u' | 'cdita' | 'cda' | 'taza' }> };

const RECIPES: Recipe[] = [
  {
    title: 'Bowl tibio de pollo y vegetales',
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
    portions: 1,
    steps: ['Servir el yogur en un bowl.', 'Sumar la fruta cortada y la granola por encima.'],
    items: [
      { name: 'Yogur griego natural', quantity: 170, unit: 'g' },
      { name: 'Granola sin azúcar', quantity: 2, unit: 'cda' },
      { name: 'Frutillas', quantity: 80, unit: 'g' },
      { name: 'Banana', quantity: 0.5, unit: 'u' },
    ],
  },
  {
    title: 'Tortilla de espinaca al horno',
    portions: 3,
    steps: ['Batir los huevos con la ricota.', 'Sumar la espinaca salteada y la cebolla.', 'Hornear 25 minutos a 180 °C.'],
    items: [
      { name: 'Huevos', quantity: 4, unit: 'u' },
      { name: 'Espinaca', quantity: 300, unit: 'g' },
      { name: 'Ricota', quantity: 100, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'u' },
    ],
  },
  {
    title: 'Ensalada de lentejas y vegetales',
    portions: 2,
    steps: ['Cocinar las lentejas 20 minutos y enfriar.', 'Mezclar con tomate, pepino y cebolla morada.', 'Condimentar con limón y aceite de oliva.'],
    items: [
      { name: 'Lentejas secas', quantity: 120, unit: 'g' },
      { name: 'Tomate', quantity: 1, unit: 'u' },
      { name: 'Pepino', quantity: 0.5, unit: 'u' },
      { name: 'Aceite de oliva', quantity: 1, unit: 'cda' },
    ],
  },
  {
    title: 'Merluza al horno con papas',
    portions: 2,
    steps: ['Cortar las papas en rodajas finas y hornear 15 minutos.', 'Sumar la merluza con limón y perejil.', 'Hornear 15 minutos más.'],
    items: [
      { name: 'Filet de merluza', quantity: 300, unit: 'g' },
      { name: 'Papa', quantity: 2, unit: 'u' },
      { name: 'Limón', quantity: 1, unit: 'u' },
      { name: 'Aceite de oliva', quantity: 1, unit: 'cda' },
    ],
  },
];

/** Qué comer cada día de la semana: [desayuno, almuerzo, merienda, cena]; un número es una receta del catálogo. */
const WEEK: Array<[string | number, string | number, string | number, string | number]> = [
  [1, 3, 'Tostada integral con queso untable', 4],
  ['Avena con manzana y canela', 0, 1, 2],
  [1, 'Wrap de pollo y vegetales', 'Fruta y un puñado de nueces', 3],
  ['Tostada + huevo + palta', 0, 1, 4],
  [1, 2, 'Licuado de banana con leche', 'Pizza casera de vegetales'],
  ['Panqueques de avena y banana', 'Asado con ensalada mixta', 'Tostada + huevo + palta', 3],
  [1, 'Pastas con salsa de tomate y pollo', 'Fruta de estación', 2],
];
const SLOTS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'] as const;

export async function seedDemoContent(fetcher: Fetcher, now = new Date()): Promise<DemoStep[]> {
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
  for (const id of [SOFIA, MARINA, LUCIA]) {
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
    await call(`publicar ${recipe.title}`, `/api/recipes/${id}/publish`, 'POST', { expected_version: 1 });
    await call(`asignar ${recipe.title}`, `/api/recipes/${id}/assign`, 'POST', { patient_id: SOFIA, expected_version: 1 });
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
    const plan = await call('plan de la semana', `/api/patients/${SOFIA}/plans`, 'POST', {
      id: planId, period_start: monday, period_end: addDays(monday, 6), timezone: TZ, items,
    });
    if (plan) await call('publicar plan', `/api/plans/${planId}/publish`, 'POST', { expected_version: 1 });
  }

  // Medidas: permiso y seis semanas de peso, cintura y cadera.
  const consent = (purpose: ConsentPurpose) => {
    const text = CONSENT_CATALOG.find((entry) => entry.purpose === purpose)!;
    return call(`permiso ${purpose}`, `/api/patients/${SOFIA}/consents`, 'POST', {
      purpose, text_version: text.text_version, text_hash: text.text_hash, decision: 'granted',
    });
  };
  await consent('measurement');
  const weights = [68.4, 68.0, 67.7, 67.1, 66.8, 66.3];
  for (const [index, value] of weights.entries()) {
    const recorded_on = addDays(today, -7 * (weights.length - 1 - index));
    await call(`peso ${recorded_on}`, `/api/patients/${SOFIA}/care/records`, 'POST', {
      id: randomUUID(), recorded_on, data: { kind: 'weight', value, unit: 'kg', source: 'patient', note: '' },
    });
  }
  for (const [index, [waist, hip]] of [[82, 101], [80, 100], [78.5, 99]].entries()) {
    const recorded_on = addDays(today, -14 * (2 - index));
    await call(`cintura ${recorded_on}`, `/api/patients/${SOFIA}/care/records`, 'POST', {
      id: randomUUID(), recorded_on, data: { kind: 'waist', value: waist, unit: 'cm', source: 'professional', note: '' },
    });
    await call(`cadera ${recorded_on}`, `/api/patients/${SOFIA}/care/records`, 'POST', {
      id: randomUUID(), recorded_on, data: { kind: 'hip', value: hip, unit: 'cm', source: 'professional', note: '' },
    });
  }

  // Comidas de hoy revisadas, para que el registro nutricional tenga valores.
  const meals = [
    { slot: 'Desayuno', description: 'Yogur griego con granola y frutillas', macros: { kcal: 320, protein_g: 18, carbs_g: 38, fat_g: 10 } },
    { slot: 'Almuerzo', description: 'Bowl tibio de pollo, arroz integral y vegetales', macros: { kcal: 540, protein_g: 42, carbs_g: 52, fat_g: 16 } },
  ];
  for (const meal of meals) {
    const created = await call(`comida ${meal.slot}`, `/api/patients/${SOFIA}/meals/analyze`, 'POST', { slot: meal.slot, description: meal.description });
    const log = created?.log;
    if (!log) continue;
    await call(`revisar ${meal.slot}`, `/api/patients/${SOFIA}/meals/${log.id}`, 'PATCH', {
      status: 'confirmed', foods: log.foods ?? [], macros: meal.macros,
    });
  }

  // Hábitos de hoy.
  await call('hábitos de hoy', `/api/patients/${SOFIA}/habits`, 'PATCH', { hydration: 5, sleep_minutes: 445, energy: 'Buena' });

  // Actividad del dispositivo (card superior de Ejercicio) y la declarada a mano.
  for (const [daysAgo, activity, minutes, intensity, kcal] of [[1, 'Caminata', 40, 'moderada', 180], [3, 'Bicicleta fija', 30, 'intensa', 240], [5, 'Pilates', 50, 'suave', null]] as const) {
    await call(`dispositivo ${activity}`, `/api/patients/${SOFIA}/care/records`, 'POST', {
      id: randomUUID(), recorded_on: addDays(today, -daysAgo), data: { kind: 'activity', activity, minutes, intensity, kcal, note: '' },
    });
  }
  // Actividad registrada y una rutina asignada.
  for (const activity of [
    { activity: 'Caminata al aire libre', duration_minutes: 35, intensity: 'moderada', note: 'Por la costanera' },
    { activity: 'Yoga', duration_minutes: 45, intensity: 'suave', note: '' },
  ]) {
    await call(`actividad ${activity.activity}`, `/api/patients/${SOFIA}/activities`, 'POST', activity);
  }
  const [mobility, squat, bridge, walk] = SEEDED_EXERCISES;
  await call('rutina', `/api/patients/${SOFIA}/routines?audience=pro`, 'POST', {
    title: 'Fuerza suave en casa',
    items: [
      { exercise_id: mobility.id, sets: 2, reps: 10, rest_seconds: 30 },
      { exercise_id: squat.id, sets: 3, reps: 12, rest_seconds: 45 },
      { exercise_id: bridge.id, sets: 3, reps: 12, rest_seconds: 45 },
      { exercise_id: walk.id, sets: 1, reps: 1, rest_seconds: 0 },
    ],
  });

  // Historial de consultas: Sofía confirma y Marina pide otro horario.
  await call('confirmar consulta', `/api/patients/${SOFIA}/appointment/confirm`, 'POST', { reply: 'attending' });
  await call('reprogramar consulta', `/api/patients/${MARINA}/appointment/reschedule`, 'POST', { day: 'Viernes', time: '10:00' });

  return steps;
}
