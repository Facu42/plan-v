import type { CrmWorkItem, CrmWorkKind } from '../../src/types/crm-work.js';
import type { WeeklyRegistration } from '../../src/types/weekly-registration.js';
import { ASSISTANT_NOTICE, type AssistantAnswer, type AssistantCard, type AssistantIntent, type AssistantPriority } from '../../src/types/assistant.js';

/** Paciente activo ya filtrado por el consultorio autenticado. */
export type PortfolioPatient = {
  id: string;
  name: string;
  /** null = el resumen no estuvo disponible; nunca se interpreta como cero registros. */
  weekly: WeeklyRegistration | null;
  /** Sugerencia vigente del copiloto de la ficha (IA ya existente), sin textos libres. */
  brief: { suggested_action: string; up_next_title: string | null } | null;
};

type Input = { question: string; patients: PortfolioPatient[]; workItems: CrmWorkItem[]; now?: Date; source?: AssistantAnswer['source'] };

const MAX_CARDS = 10;

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es-AR');
}

/** Reglas simples y auditables; la pregunta nunca sale del servidor. */
export function classifyQuestion(question: string): AssistantIntent {
  const text = normalize(question);
  if (/animo|emocion|estado emocional|sentimiento|se sienten?|humor|triste/.test(text)) return 'mood';
  if (/adherencia|cumpl|registr|constan/.test(text)) return 'adherence';
  if (/contactar|contacto|escrib|mensaje|llamar|semana/.test(text)) return 'contact_week';
  if (/atencion|hoy|urgente|priori|necesit|mirar|revisar|pendiente/.test(text)) return 'attention_today';
  return 'unsupported';
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Orden de importancia y textos de cada pendiente de la bandeja. */
const KIND_RULES: Record<CrmWorkKind, { priority: AssistantPriority; rank: number; action: string; reason: (items: CrmWorkItem[]) => string }> = {
  appointment: { priority: 'alta', rank: 0, action: 'Abrir consultas',
    reason: items => items.some(item => item.status === 'needs_change') ? 'Pidió reprogramar la consulta' : 'Consulta hoy' },
  intake: { priority: 'alta', rank: 1, action: 'Revisar ingreso', reason: () => 'Ingreso por revisar' },
  message: { priority: 'alta', rank: 2, action: 'Abrir conversación', reason: items => plural(items.length, 'mensaje sin leer', 'mensajes sin leer') },
  meal: { priority: 'media', rank: 3, action: 'Revisar comidas', reason: items => plural(items.length, 'comida por revisar', 'comidas por revisar') },
  record: { priority: 'media', rank: 4, action: 'Revisar registros', reason: items => plural(items.length, 'registro por revisar', 'registros por revisar') },
  payment: { priority: 'media', rank: 5, action: 'Confirmar pago', reason: items => plural(items.length, 'aviso de pago por confirmar', 'avisos de pago por confirmar') },
  ai_menu: { priority: 'media', rank: 6, action: 'Revisar propuesta', reason: items => plural(items.length, 'propuesta de menú por revisar', 'propuestas de menú por revisar') },
};

const fichaHref = (patientId: string) => `/crm/ficha?${new URLSearchParams({ paciente: patientId })}`;
const messagesHref = (patientId: string) => `/crm/mensajes?${new URLSearchParams({ paciente: patientId })}`;

type Ranked = AssistantCard & { weight: number };
function sortCards(cards: Ranked[]): AssistantCard[] {
  return cards
    .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'alta' ? -1 : 1) || b.weight - a.weight || a.patient_name.localeCompare(b.patient_name, 'es-AR'))
    .slice(0, MAX_CARDS)
    .map(({ weight: _weight, ...card }) => card);
}

function attentionToday(patients: PortfolioPatient[], workItems: CrmWorkItem[]): Ranked[] {
  const byPatient = new Map<string, CrmWorkItem[]>();
  for (const item of workItems) byPatient.set(item.patient_id, [...byPatient.get(item.patient_id) ?? [], item]);
  const cards: Ranked[] = [];
  for (const patient of patients) {
    const items = byPatient.get(patient.id) ?? [];
    const groups = new Map<CrmWorkKind, CrmWorkItem[]>();
    for (const item of items) groups.set(item.kind, [...groups.get(item.kind) ?? [], item]);
    const kinds = [...groups.keys()].sort((a, b) => KIND_RULES[a].rank - KIND_RULES[b].rank);
    const reasons = kinds.map(kind => KIND_RULES[kind].reason(groups.get(kind)!));
    if (patient.brief?.suggested_action && patient.brief.up_next_title) reasons.push(`Sugerencia del copiloto: ${patient.brief.up_next_title}`);
    if (!reasons.length) continue;
    const first = kinds[0];
    cards.push({
      patient_id: patient.id, patient_name: patient.name,
      priority: kinds.some(kind => KIND_RULES[kind].priority === 'alta') ? 'alta' : 'media',
      reason: reasons.join(' · '),
      action: first ? { label: KIND_RULES[first].action, href: groups.get(first)![0].href } : { label: 'Abrir ficha', href: fichaHref(patient.id) },
      weight: items.length + (patient.brief?.suggested_action ? 1 : 0),
    });
  }
  return cards;
}

function adherence(patients: PortfolioPatient[]): { summary: string; cards: Ranked[] } {
  let steady = 0, partial = 0, none = 0, unknown = 0;
  const cards: Ranked[] = [];
  for (const patient of patients) {
    if (!patient.weekly) { unknown++; continue; }
    const days = patient.weekly.recorded_days;
    if (days >= 5) { steady++; continue; }
    if (days === 0) none++; else partial++;
    if (days <= 2) cards.push({
      patient_id: patient.id, patient_name: patient.name, priority: 'media',
      reason: days === 0 ? 'Sin registros en los últimos 7 días' : `Registró ${days} de los últimos 7 días`,
      action: { label: 'Abrir ficha', href: fichaHref(patient.id) }, weight: 7 - days,
    });
  }
  const parts = [
    `${steady} ${steady === 1 ? 'paciente registró' : 'pacientes registraron'} 5 días o más`,
    `${partial} ${partial === 1 ? 'registró' : 'registraron'} entre 1 y 4 días`,
    `${none} ${none === 1 ? 'no registró' : 'no registraron'} ningún día`,
  ];
  const summary = `En los últimos 7 días, ${parts[0]}, ${parts[1]} y ${parts[2]}${unknown ? ` (${unknown} sin dato disponible)` : ''}. `
    + 'Cuenta días con comidas, agua u otros hábitos cargados; no mide si se siguió el plan.';
  return { summary, cards };
}

function contactWeek(patients: PortfolioPatient[], workItems: CrmWorkItem[]): Ranked[] {
  const cards: Ranked[] = [];
  for (const patient of patients) {
    const items = workItems.filter(item => item.patient_id === patient.id);
    const reschedule = items.find(item => item.kind === 'appointment' && item.status === 'needs_change');
    const unread = items.filter(item => item.kind === 'message');
    if (reschedule) cards.push({ patient_id: patient.id, patient_name: patient.name, priority: 'alta', reason: 'Pidió reprogramar la consulta',
      action: { label: 'Abrir consultas', href: reschedule.href }, weight: 3 });
    else if (unread.length) cards.push({ patient_id: patient.id, patient_name: patient.name, priority: 'alta',
      reason: `Te escribió: ${plural(unread.length, 'mensaje sin leer', 'mensajes sin leer')}`, action: { label: 'Abrir conversación', href: messagesHref(patient.id) }, weight: 2 });
    else if (patient.weekly?.recorded_days === 0) cards.push({ patient_id: patient.id, patient_name: patient.name, priority: 'media',
      reason: 'Sin registros en los últimos 7 días', action: { label: 'Abrir conversación', href: messagesHref(patient.id) }, weight: 1 });
  }
  return cards;
}

const SOURCES = {
  queue: 'Bandeja del consultorio (pendientes actuales)',
  weekly: 'Registro semanal (últimos 7 días)',
  copilot: 'Sugerencias del copiloto de cada ficha',
};

export function answerPortfolioQuestion({ question, patients, workItems, now = new Date(), source = 'memory' }: Input): AssistantAnswer {
  const intent = classifyQuestion(question);
  const ids = new Set(patients.map(patient => patient.id));
  // Defensa adicional: sólo se usan pendientes de pacientes del consultorio recibido.
  const scoped = workItems.filter(item => ids.has(item.patient_id));
  const base = { intent, question, notice: ASSISTANT_NOTICE, generated_at: now.toISOString(), source };
  if (intent === 'mood') return { ...base, cards: [], sources: [],
    summary: 'Plan V todavía no registra el ánimo de tus pacientes, así que no puedo responder esto con datos. Puedo mostrarte quién necesita atención hoy o un resumen de los registros de la semana.' };
  if (intent === 'unsupported') return { ...base, cards: [], sources: [],
    summary: 'Por ahora respondo sobre tu cartera: quién necesita atención hoy, cómo vienen los registros de la semana y a quién conviene contactar.' };
  if (!patients.length) return { ...base, cards: [], sources: [], summary: 'Todavía no tenés pacientes activos en tu consultorio.' };

  if (intent === 'adherence') {
    const result = adherence(patients);
    return { ...base, summary: result.summary, cards: sortCards(result.cards), sources: [SOURCES.weekly] };
  }
  if (intent === 'contact_week') {
    const cards = sortCards(contactWeek(patients, scoped));
    return { ...base, cards, sources: [SOURCES.queue, SOURCES.weekly],
      summary: cards.length ? `Te sugiero contactar a ${plural(cards.length, 'paciente', 'pacientes')} esta semana. Revisá cada caso antes de escribirle.`
        : 'Esta semana no encontré pacientes con mensajes sin leer, consultas para reprogramar ni semanas sin registros.' };
  }
  const all = attentionToday(patients, scoped);
  const cards = sortCards(all);
  return { ...base, cards, sources: [SOURCES.queue, SOURCES.copilot],
    summary: all.length ? `Hay ${plural(all.length, 'paciente', 'pacientes')} con algo para mirar hoy${all.length > cards.length ? `; te muestro ${cards.length}` : ''}.`
      : 'Hoy no hay pendientes en tu consultorio.' };
}
