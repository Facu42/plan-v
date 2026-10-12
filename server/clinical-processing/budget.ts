import { privilegedDb } from '../db/supabase-client.js';

export const MAX_CLINICAL_MICROS = 5_000_000;
export type Reservation = { key: string; month: string; micros: number };
export type BudgetStatus = 'charged' | 'uncertain' | 'released';
export interface ClinicalBudget {
  reserve(input: Reservation): Promise<void>;
  settle(key: string, status: BudgetStatus, chargedMicros: number): Promise<void>;
}

export function argentinaBudgetMonth(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit' }).formatToParts(date);
  return `${parts.find(p => p.type === 'year')!.value}-${parts.find(p => p.type === 'month')!.value}`;
}
export function estimateAudioMicros(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 7200) throw new Error('Duración de audio inválida.');
  return Math.ceil(Math.max(10, seconds) * 111_000 / 3600);
}
/** Cada byte puede convertirse en un token; se reserva también el máximo de salida. */
export function estimateSummaryMicros(text: string, outputTokens: number): number {
  return Math.ceil((Buffer.byteLength(text, 'utf8') + 512) * 0.15 + outputTokens * 0.60);
}

export class MemoryClinicalBudget implements ClinicalBudget {
  private readonly rows = new Map<string, Reservation & { status: 'reserved' | BudgetStatus; chargedMicros: number }>();
  constructor(private readonly cap = MAX_CLINICAL_MICROS) {
    if (!Number.isSafeInteger(cap) || cap < 0 || cap > MAX_CLINICAL_MICROS) throw new Error('El tope no puede superar USD 5.');
  }
  async used(month: string): Promise<number> {
    return [...this.rows.values()].filter(r => r.month === month).reduce((sum, r) => sum + (r.status === 'reserved' || r.status === 'uncertain' ? r.micros : r.chargedMicros), 0);
  }
  async reserve(input: Reservation): Promise<void> {
    const existing = this.rows.get(input.key);
    if (existing && existing.status !== 'released') throw new Error('La operación ya tiene una reserva.');
    if (!Number.isSafeInteger(input.micros) || input.micros < 0 || !/^\d{4}-\d{2}$/.test(input.month)) throw new Error('Reserva inválida.');
    // No await entre lectura y escritura: sección crítica de la demo en un único proceso.
    const used = [...this.rows.values()].filter(r => r.month === input.month).reduce((sum, r) => sum + (r.status === 'reserved' || r.status === 'uncertain' ? r.micros : r.chargedMicros), 0);
    if (used + input.micros > this.cap) throw new Error('Se alcanzó la bolsa mensual de IA. Podés seguir con notas manuales.');
    this.rows.set(input.key, { ...input, status: 'reserved', chargedMicros: 0 });
  }
  async settle(key: string, status: BudgetStatus, chargedMicros: number): Promise<void> {
    const row = this.rows.get(key);
    if (!row || !Number.isSafeInteger(chargedMicros) || chargedMicros < 0 || chargedMicros > row.micros) throw new Error('Liquidación inválida.');
    if (row.status !== 'reserved') {
      if (row.status === status && row.chargedMicros === chargedMicros) return;
      throw new Error('La reserva ya fue liquidada.');
    }
    this.rows.set(key, { ...row, status, chargedMicros: status === 'released' ? 0 : chargedMicros });
  }
}

/** Las funciones SQL son exclusivas del trabajador; ninguna usuaria puede gastar el saldo directamente. */
export class SupabaseClinicalBudget implements ClinicalBudget {
  async reserve(input: Reservation): Promise<void> {
    const { error } = await privilegedDb().rpc('reserve_clinical_ai_budget', { operation_key: input.key, budget_month: input.month, reserve_micros: input.micros });
    if (error) throw new Error('La bolsa de IA no está disponible o llegó a su límite.');
  }
  async settle(key: string, status: BudgetStatus, chargedMicros: number): Promise<void> {
    const { error } = await privilegedDb().rpc('settle_clinical_ai_budget', { operation_key: key, outcome: status, cost_micros: chargedMicros });
    if (error) throw new Error('No pudimos confirmar el gasto. La reserva se conserva.');
  }
}
