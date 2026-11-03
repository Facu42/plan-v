import type { HubHilo, HubLead, HubMensaje, HubNota, HubTarea } from '../../src/types/hub.js';
import { privilegedDb } from '../db/supabase-client.js';

type DbError = { message?: string };
type DbResult<T> = { data: T | null; error: DbError | null };

const NOTA = 'id, nutritionist_id, body, created_at';
const TAREA = 'id, nutritionist_id, title, due_on, done, created_at';
const LEAD = 'id, name, contact, source, stage, next_step, nutritionist_id, created_at, updated_at';
const HILO = 'id, channel, contact_name, contact_handle, status, lead_id, nutritionist_id, updated_at';
const MENSAJE = 'id, thread_id, direction, body, sent_at';

function client() {
  return privilegedDb() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        limit: (n: number) => Promise<DbResult<unknown[]>>;
        eq: (column: string, value: string) => { limit: (n: number) => Promise<DbResult<unknown[]>> };
      };
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => { single: () => Promise<DbResult<unknown>> };
      };
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => { maybeSingle: () => Promise<DbResult<unknown>> };
        };
      };
    };
  };
}

async function selectAll<T>(table: string, columns: string): Promise<{ ok: true; rows: T[] } | { ok: false }> {
  try {
    const query = client().from(table).select(columns);
    const result = await query.limit(500);
    if (result.error) return { ok: false };
    return { ok: true, rows: (result.data ?? []) as T[] };
  } catch {
    return { ok: false };
  }
}

async function insertOne<T>(table: string, row: Record<string, unknown>, columns: string): Promise<{ ok: true; row: T } | { ok: false }> {
  try {
    const result = await client().from(table).insert(row).select(columns).single();
    if (result.error || !result.data) return { ok: false };
    return { ok: true, row: result.data as T };
  } catch {
    return { ok: false };
  }
}

export function leerNotas() {
  return selectAll<HubNota>('platform_nutri_notes', NOTA);
}

export function guardarNota(row: HubNota) {
  return insertOne<HubNota>('platform_nutri_notes', row, NOTA);
}

export function leerTareas() {
  return selectAll<HubTarea>('platform_nutri_tasks', TAREA);
}

export function guardarTarea(row: HubTarea) {
  return insertOne<HubTarea>('platform_nutri_tasks', row, TAREA);
}

export async function marcarTarea(id: string, done: boolean): Promise<{ ok: true; row: HubTarea } | { ok: false }> {
  try {
    const result = await client().from('platform_nutri_tasks').update({ done }).eq('id', id).select(TAREA).maybeSingle();
    if (result.error || !result.data) return { ok: false };
    return { ok: true, row: result.data as HubTarea };
  } catch {
    return { ok: false };
  }
}

export function leerLeads() {
  return selectAll<HubLead>('platform_leads', LEAD);
}

export function guardarLead(row: HubLead) {
  return insertOne<HubLead>('platform_leads', row, LEAD);
}

export async function actualizarHilo(id: string, patch: Record<string, unknown>): Promise<{ ok: boolean }> {
  try {
    const result = await client().from('platform_inbox_threads').update(patch).eq('id', id).select(HILO).maybeSingle();
    return { ok: !result.error && Boolean(result.data) };
  } catch {
    return { ok: false };
  }
}

export async function actualizarLead(id: string, patch: Record<string, unknown>): Promise<{ ok: true; row: HubLead } | { ok: false }> {
  try {
    const result = await client().from('platform_leads').update(patch).eq('id', id).select(LEAD).maybeSingle();
    if (result.error || !result.data) return { ok: false };
    return { ok: true, row: result.data as HubLead };
  } catch {
    return { ok: false };
  }
}

export function leerHilos() {
  return selectAll<Omit<HubHilo, 'messages'>>('platform_inbox_threads', HILO);
}

export function guardarHilo(row: Omit<HubHilo, 'messages'>) {
  return insertOne<Omit<HubHilo, 'messages'>>('platform_inbox_threads', row, HILO);
}

export function leerMensajes() {
  return selectAll<HubMensaje>('platform_inbox_messages', MENSAJE);
}

export function guardarMensaje(row: HubMensaje) {
  return insertOne<HubMensaje>('platform_inbox_messages', row, MENSAJE);
}

export async function leerTabla<T>(table: string, columns: string): Promise<{ ok: true; rows: T[] } | { ok: false }> {
  return selectAll<T>(table, columns);
}

const SEGUIMIENTO = 'id, lead_id, title, due_on, done, created_at';
const AVISO = 'id, payment_id, nutritionist_id, kind, estado, detalle, created_at';
const BORRADOR = 'id, thread_id, body, origen';

export function guardarSeguimiento(row: { id: string; lead_id: string; title: string; due_on: string; done: boolean; created_at: string }) {
  return insertOne( 'platform_lead_followups', row, SEGUIMIENTO);
}

export function guardarAviso(row: { id: string; payment_id: string; nutritionist_id: string | null; kind: string; estado: string; detalle: string; created_at: string }) {
  return insertOne('platform_dunning_attempts', row, AVISO);
}

export function guardarBorrador(row: { id: string; thread_id: string; body: string; origen: string }) {
  return insertOne('platform_inbox_drafts', row, BORRADOR);
}

export function guardarBrief(row: { day: string; body: string; origen: string }) {
  return insertOne('platform_daily_briefs', row, 'day, body, origen');
}

export function ocultarActivacion(nutritionistId: string) {
  return insertOne('platform_onboarding_dismissals', { nutritionist_id: nutritionistId, dismissed_at: new Date().toISOString() }, 'nutritionist_id, dismissed_at');
}
