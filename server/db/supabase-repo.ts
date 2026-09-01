import type { Brief, MealLog, Message, Patient } from '../../src/types/index.ts';
import { getSupabaseAdmin } from './supabase-client.ts';

const SLOT_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

function mapPatient(row: Record<string, unknown>, extras: {
  todayPlan?: Patient['todayPlan'];
  weekPlan?: Patient['weekPlan'];
  meal_logs?: MealLog[];
  messages?: Message[];
  brief?: Brief | null;
  timeline?: Patient['timeline'];
}): Patient {
  return {
    id: row.id as string,
    name: row.full_name as string,
    initials: (row.initials as string) || (row.full_name as string).slice(0, 2).toUpperCase(),
    tone: (row.tone as Patient['tone']) ?? 'mint',
    status: row.status as string,
    stage: row.stage as Patient['stage'],
    goal: row.goal as string,
    sensitive_hours: row.sensitive_hours as string,
    plan_b: row.plan_b as string,
    next_focus: row.next_focus as string,
    adherence_score: row.adherence_score as number,
    adherence_why: row.adherence_why as string,
    time: 'hoy',
    hydration: (row.hydration as number) ?? 0,
    energy: (row.energy as string | null) ?? null,
    appointment: null,
    todayPlan: extras.todayPlan ?? [],
    weekPlan: extras.weekPlan ?? [],
    brief: extras.brief ?? null,
    timeline: extras.timeline ?? [],
    meal_logs: extras.meal_logs ?? [],
    messages: extras.messages ?? [],
  };
}

function mapMealLog(row: Record<string, unknown>): MealLog {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    slot: (row.slot_label as string) || SLOT_LABELS[row.slot as string] || 'Extra',
    photo_url: (row.photo_url as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    foods: row.foods as MealLog['foods'],
    macros: row.macros as MealLog['macros'],
    confidence: Number(row.confidence),
    note_for_nutri: row.note_for_nutri as string,
    status: row.status as MealLog['status'],
    logged_at: row.logged_at as string,
  };
}

async function loadPatientExtras(patientId: string): Promise<Pick<Patient, 'todayPlan' | 'weekPlan' | 'meal_logs' | 'messages' | 'brief' | 'timeline'>> {
  const sb = getSupabaseAdmin()!;
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: slots }, { data: logs }, { data: msgs }, { data: briefs }] = await Promise.all([
    sb.from('meal_slots').select('*').eq('patient_id', patientId).gte('for_date', today).order('scheduled_time'),
    sb.from('meal_logs').select('*').eq('patient_id', patientId).order('logged_at', { ascending: false }).limit(20),
    sb.from('messages').select('*').eq('patient_id', patientId).order('sent_at', { ascending: true }),
    sb.from('ai_briefs').select('*').eq('patient_id', patientId).eq('status', 'pending_review').maybeSingle(),
  ]);

  const todayPlan = (slots ?? [])
    .filter((s) => s.for_date === today)
    .map((s) => ({
      slot: SLOT_LABELS[s.slot as string] ?? s.slot,
      title: s.title,
      time: String(s.scheduled_time).slice(0, 5),
    }));

  const brief: Brief | null = briefs
    ? {
        suggested_action: briefs.suggested_action,
        up_next_title: briefs.up_next_title,
        up_next_body: briefs.up_next_body,
        draft_message: briefs.draft_message,
        source_ids: briefs.source_ids ?? [],
        adherence_why: briefs.adherence_why ?? '',
      }
    : null;

  const meal_logs = (logs ?? []).map(mapMealLog);
  const messages: Message[] = (msgs ?? []).map((m) => ({
    id: m.id,
    patient_id: m.patient_id,
    from: m.author_id === m.patient_id ? 'patient' : 'vero',
    text: m.body,
    suggested_by_ai: m.suggested_by_ai,
    sent_at: m.sent_at,
  }));

  const timeline = meal_logs.slice(0, 8).map((l) => ({
    id: l.id,
    kind: 'meal_logged' as const,
    atLabel: 'HOY',
    title: `${l.slot} · ${l.status === 'pending_review' ? 'en revisión' : l.status}`,
    body: l.macros ? `${l.macros.kcal} kcal · conf ${l.confidence.toFixed(2)}` : 'Sin macros',
  }));

  return { todayPlan, weekPlan: [], meal_logs, messages, brief, timeline };
}

export async function sbGetPatientsForNutri(userId: string): Promise<Patient[]> {
  const sb = getSupabaseAdmin()!;
  const { data: nutri } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  if (!nutri) return [];

  const { data: rows } = await sb.from('patients').select('*').eq('nutritionist_id', nutri.id).order('created_at');
  const patients: Patient[] = [];
  for (const row of rows ?? []) {
    const extras = await loadPatientExtras(row.id);
    patients.push(mapPatient(row, extras));
  }
  return patients;
}

export async function sbGetPatientForUser(userId: string): Promise<Patient | null> {
  const sb = getSupabaseAdmin()!;
  const { data: row } = await sb.from('patients').select('*').eq('user_id', userId).maybeSingle();
  if (!row) return null;
  const extras = await loadPatientExtras(row.id);
  return mapPatient(row, extras);
}

export async function sbGetPatientById(id: string): Promise<Patient | null> {
  const sb = getSupabaseAdmin()!;
  const { data: row } = await sb.from('patients').select('*').eq('id', id).maybeSingle();
  if (!row) return null;
  const extras = await loadPatientExtras(row.id);
  return mapPatient(row, extras);
}

export async function sbAddMealLog(patientId: string, log: Omit<MealLog, 'id' | 'patient_id' | 'logged_at' | 'status'>): Promise<MealLog> {
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb.from('meal_logs').insert({
    patient_id: patientId,
    slot_label: log.slot,
    photo_url: log.photo_url,
    description: log.description,
    foods: log.foods,
    macros: log.macros,
    confidence: log.confidence,
    note_for_nutri: log.note_for_nutri,
    status: 'pending_review',
  }).select().single();
  if (error) throw error;
  return mapMealLog(data);
}

export async function sbUpdateMealLog(patientId: string, mealId: string, patch: Partial<MealLog>): Promise<MealLog | null> {
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb.from('meal_logs').update({
    status: patch.status,
    foods: patch.foods,
    macros: patch.macros,
  }).eq('id', mealId).eq('patient_id', patientId).select().single();
  if (error) return null;
  return mapMealLog(data);
}

export async function sbSetBrief(patientId: string, nutritionistId: string, brief: Brief): Promise<void> {
  const sb = getSupabaseAdmin()!;
  await sb.from('ai_briefs').delete().eq('patient_id', patientId).eq('status', 'pending_review');
  if (brief.suggested_action) {
    await sb.from('ai_briefs').insert({
      patient_id: patientId,
      nutritionist_id: nutritionistId,
      suggested_action: brief.suggested_action,
      up_next_title: brief.up_next_title,
      up_next_body: brief.up_next_body,
      draft_message: brief.draft_message,
      source_ids: brief.source_ids,
      adherence_why: brief.adherence_why,
      status: 'pending_review',
    });
  }
  await sb.from('patients').update({ adherence_why: brief.adherence_why }).eq('id', patientId);
}

export async function sbUpdateHabits(patientId: string, data: { hydration?: number; energy?: string | null }): Promise<void> {
  const sb = getSupabaseAdmin()!;
  await sb.from('patients').update(data).eq('id', patientId);
}

export async function sbAddMessage(patientId: string, nutritionistId: string, authorId: string, text: string, suggestedByAi: boolean): Promise<void> {
  const sb = getSupabaseAdmin()!;
  await sb.from('messages').insert({
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    author_id: authorId,
    body: text,
    suggested_by_ai: suggestedByAi,
  });
}

export async function sbGetNutritionistId(userId: string): Promise<string | null> {
  const sb = getSupabaseAdmin()!;
  const { data } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  return data?.id ?? null;
}

export async function sbEnsureNutritionist(userId: string, displayName: string): Promise<string> {
  const existing = await sbGetNutritionistId(userId);
  if (existing) return existing;
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb.from('nutritionists').insert({ user_id: userId, display_name: displayName }).select('id').single();
  if (error) throw error;
  return data.id;
}

export function computeShoppingList(patient: Patient): string[] {
  const items = new Set<string>();
  for (const day of patient.weekPlan) for (const meal of day.meals) items.add(meal.title);
  for (const meal of patient.todayPlan) items.add(meal.title);
  return [...items];
}
