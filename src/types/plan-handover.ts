/** Cambio entre el plan que la paciente ve hoy y el que empieza después. */
export type PlanChangeKind = 'added' | 'removed' | 'changed';

export type PlanChangeLine = {
  kind: PlanChangeKind;
  for_date: string;
  slot: string;
  before: string | null;
  after: string | null;
};

export type PlanChangeSummary = {
  added: number;
  removed: number;
  changed: number;
  lines: PlanChangeLine[];
};

export type PlanHandover = {
  version: number;
  previous_version: number | null;
  starts_on: string;
  scheduled_at?: string | null;
  waiting: boolean;
  seen: boolean;
  changes: PlanChangeSummary;
};

export type PlanChangeItem = {
  for_date: string;
  slot: string;
  label: string;
  public_note: string;
  portions: number | null;
};

export const PLAN_CHANGE_LINE_LIMIT = 12;

const SLOT_ORDER = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'];

export function argentinaDateId(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(now);
}

export function planDateLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day, 15)).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  }).replace('.', '');
}

export function planItemLabel(item: { free_text?: string | null; recipe_title?: string | null; components?: unknown[] | null }): string {
  const text = item.free_text?.trim();
  if (text) return text;
  const title = item.recipe_title?.trim();
  if (title) return title;
  if (item.components && item.components.length > 0) return 'Comida armada';
  return 'Comida';
}

/**
 * Publicar reemplaza el plan de hoy sólo si no hay uno vigente o si el nuevo ya empezó.
 * Si empieza más adelante, el anterior sigue hasta esa fecha.
 */
export function planTakesEffectNow(periodStart: string, today: string, hasPublished: boolean): boolean {
  return !hasPublished || periodStart <= today;
}

export function planChangeSummary(previous: PlanChangeItem[] | null, next: PlanChangeItem[]): PlanChangeSummary {
  const before = new Map((previous ?? []).map(item => [`${item.for_date}|${item.slot}`, item]));
  const after = new Map(next.map(item => [`${item.for_date}|${item.slot}`, item]));
  const lines: PlanChangeLine[] = [];
  for (const item of after.values()) {
    const old = before.get(`${item.for_date}|${item.slot}`);
    if (!old) {
      lines.push({ kind: 'added', for_date: item.for_date, slot: item.slot, before: null, after: item.label });
      continue;
    }
    if (old.label !== item.label || old.public_note !== item.public_note || old.portions !== item.portions) {
      lines.push({ kind: 'changed', for_date: item.for_date, slot: item.slot, before: old.label, after: item.label });
    }
  }
  for (const item of before.values()) {
    if (!after.has(`${item.for_date}|${item.slot}`)) {
      lines.push({ kind: 'removed', for_date: item.for_date, slot: item.slot, before: item.label, after: null });
    }
  }
  lines.sort((a, b) => a.for_date.localeCompare(b.for_date) || SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  return {
    added: lines.filter(line => line.kind === 'added').length,
    removed: lines.filter(line => line.kind === 'removed').length,
    changed: lines.filter(line => line.kind === 'changed').length,
    lines: lines.slice(0, PLAN_CHANGE_LINE_LIMIT),
  };
}

export function planChangeLineText(line: PlanChangeLine): string {
  const when = `${planDateLabel(line.for_date)} · ${line.slot}`;
  if (line.kind === 'added') return `${when}: se agrega ${line.after ?? 'una comida'}`;
  if (line.kind === 'removed') return `${when}: se saca ${line.before ?? 'una comida'}`;
  if (line.before === line.after) return `${when}: ${line.after ?? 'la comida'} (cambió la cantidad o la nota)`;
  return `${when}: ${line.before ?? 'la comida'} pasa a ${line.after ?? 'otra comida'}`;
}

/** Fecha y hora efectivas de entrega; el período de comidas puede empezar antes. */
export function planHandoverWhen(handover: PlanHandover): string {
  const day = planDateLabel(handover.starts_on);
  return handover.scheduled_at ? `${day} a las ${new Date(handover.scheduled_at).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false })}` : day;
}

/** Aviso de la campana. Si ya lo vio, no vuelve a sonar. */
export function planHandoverNotice(handover: PlanHandover | null): { title: string; note: string } | null {
  if (!handover || handover.seen) return null;
  if (handover.waiting) {
    return {
      title: 'Tenés un plan nuevo',
      note: `Empieza el ${planHandoverWhen(handover)}. Hasta entonces seguís con el actual.`,
    };
  }
  if (handover.previous_version == null) return { title: 'Tenés tu plan', note: 'Tu nutricionista lo publicó.' };
  const total = handover.changes.added + handover.changes.removed + handover.changes.changed;
  if (total === 0) return { title: 'Tu plan cambió de fechas', note: 'Las comidas indicadas siguen igual.' };
  return { title: 'Tu plan cambió', note: 'Mirá qué es distinto.' };
}

/** Texto en el plan. Mientras el nuevo no empieza, queda a la vista aunque ya haya abierto los cambios. */
export function planHandoverBanner(handover: PlanHandover | null): string | null {
  if (!handover) return null;
  if (handover.waiting) return `Seguís con este plan hasta el ${planHandoverWhen(handover)}. Después empieza uno nuevo.`;
  if (handover.seen) return null;
  if (handover.previous_version == null) return 'Tu nutricionista publicó tu plan.';
  return 'Tu plan cambió. Mirá qué es distinto.';
}
