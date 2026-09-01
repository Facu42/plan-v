import { randomUUID } from 'node:crypto';

export type MealStatus = 'pending_review' | 'confirmed' | 'adjusted';
export type SuggestedAction = 'mensaje' | 'ajuste_menu' | 'turno';
export type Stage = 'ingreso' | 'plan' | 'seguimiento' | 'alta';

export type FoodItem = {
  name: string;
  portion_est: number | null;
  portion_unit: 'g' | 'ml' | 'u';
  confidence: number;
};

export type Macros = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type MealLog = {
  id: string;
  patient_id: string;
  slot: string;
  photo_url: string | null;
  description: string | null;
  foods: FoodItem[];
  macros: Macros | null;
  confidence: number;
  note_for_nutri: string;
  status: MealStatus;
  logged_at: string;
};

export type TimelineEvent = {
  id: string;
  kind: 'meal_logged' | 'meal_missed' | 'habit' | 'reminder_fired' | 'appointment' | 'message';
  atLabel: string;
  title: string;
  body: string;
};

export type Brief = {
  suggested_action: SuggestedAction | null;
  up_next_title: string | null;
  up_next_body: string | null;
  draft_message: string | null;
  source_ids: string[];
  adherence_why: string;
};

export type Message = {
  id: string;
  patient_id: string;
  from: 'vero' | 'patient';
  text: string;
  suggested_by_ai: boolean;
  sent_at: string;
};

export type Patient = {
  id: string;
  name: string;
  initials: string;
  tone: 'peach' | 'lilac' | 'mint';
  status: string;
  stage: Stage;
  goal: string;
  sensitive_hours: string;
  plan_b: string;
  next_focus: string;
  adherence_score: number;
  adherence_why: string;
  time: string;
  hydration: number;
  energy: string | null;
  appointment: { when: string; duration: number; channel: string } | null;
  todayPlan: { slot: string; title: string; time: string }[];
  weekPlan: { day: string; meals: { slot: string; title: string }[] }[];
  brief: Brief | null;
  timeline: TimelineEvent[];
  meal_logs: MealLog[];
  messages: Message[];
};

const now = () => new Date().toISOString();

function seedPatients(): Patient[] {
  return [
    {
      id: 'pat-sofia',
      name: 'Sofía R.',
      initials: 'SR',
      tone: 'peach',
      status: 'Atención',
      stage: 'seguimiento',
      goal: 'Comer con más regularidad',
      sensitive_hours: 'Después de las 20:30',
      plan_b: 'Tostada + huevo + palta',
      next_focus: 'Organización nocturna',
      adherence_score: 62,
      adherence_why: '4 de 7 almuerzos confirmados. Agua 3/7 días. Cena de ayer en revisión (no suma).',
      time: 'hace 38 min',
      hydration: 3,
      energy: 'Baja',
      appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video' },
      todayPlan: [
        { slot: 'Desayuno', title: 'Yogur griego, granola y frutas', time: '08:00' },
        { slot: 'Almuerzo', title: 'Bowl tibio de pollo y vegetales', time: '13:30' },
        { slot: 'Merienda', title: 'Tostada + huevo + palta', time: '17:30' },
        { slot: 'Cena', title: 'Elegí tu versión favorita', time: '21:00' },
      ],
      weekPlan: [
        { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Wrap de pollo' }, { slot: 'Cena', title: 'Ensalada tibia' }] },
        { day: 'Martes', meals: [{ slot: 'Almuerzo', title: 'Bowl de quinoa' }, { slot: 'Cena', title: 'Omelette + ensalada' }] },
        { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Bowl tibio de pollo y vegetales' }, { slot: 'Cena', title: 'Plan B: tostada + huevo' }] },
        { day: 'Jueves', meals: [{ slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada' }, { slot: 'Cena', title: 'Sopa de verduras' }] },
        { day: 'Viernes', meals: [{ slot: 'Almuerzo', title: 'Pasta integral con verduras' }, { slot: 'Cena', title: 'Pescado al horno' }] },
      ],
      brief: {
        suggested_action: 'mensaje',
        up_next_title: 'Mandarle un mensaje',
        up_next_body: 'Ayer no cargó el almuerzo y el agua quedó en 3/8. Un toque corto, no un sermón.',
        draft_message: 'Hola, vi que ayer se te escapó el almuerzo. ¿Lo resolvemos con el Plan B o lo pasamos a hoy?',
        source_ids: [],
        adherence_why: '4 de 7 almuerzos confirmados. Agua 3/7 días. Cena de ayer en revisión (no suma).',
      },
      timeline: [
        { id: 's1', kind: 'meal_logged', atLabel: 'HOY', title: 'Cena · foto en revisión', body: '21:47 · estimación floja (0.38). Macros no entran al gauge.' },
        { id: 's2', kind: 'habit', atLabel: 'HOY', title: 'Energía baja', body: 'Check-in del paciente' },
        { id: 's3', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · foto en revisión', body: '14:02 · estimación (0.62). Pendiente de Vero.' },
        { id: 's4', kind: 'meal_missed', atLabel: 'AYER', title: 'Sin registro · almuerzo', body: '13:30 · slot planificado, sin meal_log' },
      ],
      meal_logs: [
        {
          id: 'ml-s1',
          patient_id: 'pat-sofia',
          slot: 'Cena',
          photo_url: null,
          description: 'Pasta con salsa',
          foods: [{ name: 'pasta con salsa', portion_est: 200, portion_unit: 'g', confidence: 0.38 }],
          macros: { kcal: 380, protein_g: 12, carbs_g: 58, fat_g: 10 },
          confidence: 0.38,
          note_for_nutri: 'Foto oscura, difícil estimar porción de pasta y grasa de la salsa.',
          status: 'pending_review',
          logged_at: now(),
        },
        {
          id: 'ml-s2',
          patient_id: 'pat-sofia',
          slot: 'Almuerzo',
          photo_url: null,
          description: 'Bowl de pollo',
          foods: [
            { name: 'pollo a la plancha', portion_est: 120, portion_unit: 'g', confidence: 0.65 },
            { name: 'vegetales', portion_est: 80, portion_unit: 'g', confidence: 0.6 },
          ],
          macros: { kcal: 420, protein_g: 35, carbs_g: 28, fat_g: 14 },
          confidence: 0.62,
          note_for_nutri: 'Coincide con el bowl planificado. Aceite no visible.',
          status: 'pending_review',
          logged_at: now(),
        },
      ],
      messages: [
        { id: 'msg-1', patient_id: 'pat-sofia', from: 'vero', text: 'Me encantó cómo venís encontrando opciones simples para tus almuerzos.', suggested_by_ai: false, sent_at: now() },
      ],
    },
    {
      id: 'pat-marina',
      name: 'Marina C.',
      initials: 'MC',
      tone: 'lilac',
      status: 'Plan B',
      stage: 'plan',
      goal: 'Sostener el Plan B sin improvisar de noche',
      sensitive_hours: 'Salida del trabajo · 18:00',
      plan_b: 'Yogur + fruta + puñado de nueces',
      next_focus: 'Merienda pre-armada',
      adherence_score: 72,
      adherence_why: '5 de 7 meriendas confirmadas. Usó Plan B 3 veces. Agua 5/7.',
      time: 'ayer',
      hydration: 5,
      energy: 'Tranquila',
      appointment: { when: 'Viernes · 11:00', duration: 30, channel: 'video' },
      todayPlan: [
        { slot: 'Desayuno', title: 'Avena con frutas', time: '08:00' },
        { slot: 'Almuerzo', title: 'Wrap de pollo y ensalada', time: '13:00' },
        { slot: 'Merienda', title: 'Yogur + fruta + nueces (Plan B)', time: '17:30' },
        { slot: 'Cena', title: 'Ensalada completa', time: '21:00' },
      ],
      weekPlan: [
        { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Wrap de pollo' }, { slot: 'Merienda', title: 'Plan B' }] },
      ],
      brief: {
        suggested_action: 'ajuste_menu',
        up_next_title: 'Ajustar el menú',
        up_next_body: 'Plan B tres veces esta semana. Conviene dejar la merienda pre-armada en el slot.',
        draft_message: null,
        source_ids: [],
        adherence_why: '5 de 7 meriendas confirmadas. Usó Plan B 3 veces. Agua 5/7.',
      },
      timeline: [
        { id: 'm1', kind: 'meal_logged', atLabel: 'HOY', title: 'Merienda · foto en revisión', body: '17:40 · 0.58 · pendiente.' },
      ],
      meal_logs: [
        {
          id: 'ml-m1',
          patient_id: 'pat-marina',
          slot: 'Merienda',
          photo_url: null,
          description: 'Yogur con fruta',
          foods: [{ name: 'yogur con fruta', portion_est: 180, portion_unit: 'g', confidence: 0.58 }],
          macros: { kcal: 220, protein_g: 12, carbs_g: 28, fat_g: 6 },
          confidence: 0.58,
          note_for_nutri: 'Parece Plan B. Confirmar si incluyó nueces.',
          status: 'pending_review',
          logged_at: now(),
        },
      ],
      messages: [],
    },
    {
      id: 'pat-lucia',
      name: 'Lucía F.',
      initials: 'LF',
      tone: 'mint',
      status: 'En ritmo',
      stage: 'seguimiento',
      goal: 'Mantener regularidad de almuerzos',
      sensitive_hours: 'Ninguno marcado',
      plan_b: 'Huevos revueltos + pan',
      next_focus: 'Seguir como viene',
      adherence_score: 88,
      adherence_why: '6 de 7 almuerzos confirmados. Agua 6/7. Sueño cargado 6/7.',
      time: 'ayer',
      hydration: 6,
      energy: 'Con energía',
      appointment: { when: 'Jueves · 16:00', duration: 45, channel: 'presencial' },
      todayPlan: [
        { slot: 'Desayuno', title: 'Tostadas integrales + huevo', time: '08:00' },
        { slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada', time: '13:30' },
        { slot: 'Merienda', title: 'Fruta + yogur', time: '17:00' },
        { slot: 'Cena', title: 'Verduras al wok con arroz', time: '21:00' },
      ],
      weekPlan: [],
      brief: null,
      timeline: [
        { id: 'l1', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · confirmado', body: 'milanesa de pollo, ensalada · 520 kcal' },
      ],
      meal_logs: [
        {
          id: 'ml-l1',
          patient_id: 'pat-lucia',
          slot: 'Almuerzo',
          photo_url: null,
          description: 'Milanesa con ensalada',
          foods: [
            { name: 'milanesa de pollo', portion_est: 150, portion_unit: 'g', confidence: 0.82 },
            { name: 'ensalada mixta', portion_est: 100, portion_unit: 'g', confidence: 0.78 },
          ],
          macros: { kcal: 520, protein_g: 42, carbs_g: 22, fat_g: 28 },
          confidence: 0.85,
          note_for_nutri: 'Coincide con el menú. Porción adecuada.',
          status: 'confirmed',
          logged_at: now(),
        },
      ],
      messages: [],
    },
  ];
}

export type AppStore = {
  patients: Patient[];
  activePatientId: string;
};

let store: AppStore = {
  patients: seedPatients(),
  activePatientId: 'pat-sofia',
};

export function getStore(): AppStore {
  return store;
}

export function getPatient(id: string): Patient | undefined {
  return store.patients.find((p) => p.id === id);
}

export function updatePatient(id: string, patch: Partial<Patient>): Patient | undefined {
  const idx = store.patients.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  store.patients[idx] = { ...store.patients[idx], ...patch };
  return store.patients[idx];
}

export function addMealLog(patientId: string, log: Omit<MealLog, 'id' | 'patient_id' | 'logged_at' | 'status'>): MealLog {
  const entry: MealLog = {
    ...log,
    id: randomUUID(),
    patient_id: patientId,
    status: 'pending_review',
    logged_at: now(),
  };
  const patient = getPatient(patientId);
  if (patient) {
    patient.meal_logs.unshift(entry);
    patient.timeline.unshift({
      id: randomUUID(),
      kind: 'meal_logged',
      atLabel: 'HOY',
      title: `${entry.slot} · foto en revisión`,
      body: `${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · estimación (${entry.confidence.toFixed(2)}). Pendiente de Vero.`,
    });
  }
  return entry;
}

export function updateMealLog(patientId: string, logId: string, patch: Partial<MealLog>): MealLog | undefined {
  const patient = getPatient(patientId);
  if (!patient) return undefined;
  const idx = patient.meal_logs.findIndex((l) => l.id === logId);
  if (idx === -1) return undefined;
  patient.meal_logs[idx] = { ...patient.meal_logs[idx], ...patch };
  if (patch.status === 'confirmed' || patch.status === 'adjusted') {
    const log = patient.meal_logs[idx];
    patient.timeline.unshift({
      id: randomUUID(),
      kind: 'meal_logged',
      atLabel: 'HOY',
      title: `${log.slot} · ${patch.status === 'confirmed' ? 'confirmado' : 'ajustado'}`,
      body: log.macros ? `${log.foods.map((f) => f.name).join(', ')} · ${log.macros.kcal} kcal` : 'Sin macros',
    });
  }
  return patient.meal_logs[idx];
}

export function addMessage(patientId: string, text: string, from: 'vero' | 'patient', suggestedByAi = false): Message {
  const msg: Message = {
    id: randomUUID(),
    patient_id: patientId,
    from,
    text,
    suggested_by_ai: suggestedByAi,
    sent_at: now(),
  };
  const patient = getPatient(patientId);
  patient?.messages.push(msg);
  return msg;
}

export function setBrief(patientId: string, brief: Brief): void {
  updatePatient(patientId, { brief, adherence_why: brief.adherence_why });
}

export function computeShoppingList(patient: Patient): string[] {
  const items = new Set<string>();
  for (const day of patient.weekPlan) {
    for (const meal of day.meals) items.add(meal.title);
  }
  for (const meal of patient.todayPlan) items.add(meal.title);
  return [...items];
}
