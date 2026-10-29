import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { CareError } from '../care/errors.js';
import type { NoticeSave, NoticeView, TemplateInput, TemplateView } from '../../src/types/ajustes.js';

const templates = new Map<string, TemplateView>(), notices = new Map<string, NoticeView>();
registerDemoState('ajustes', () => ({ templates, notices }));
export function resetAjustes() { templates.clear(); notices.clear(); }
const keyOf = (owner: string, id: string) => `${owner}:${id}`;

function dbError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esa configuración.');
  throw new CareError(503, 'No pudimos guardar el cambio. Probá de nuevo en un momento.');
}

export async function listTemplates(owner: string, persistent: boolean): Promise<TemplateView[]> {
  if (!persistent) return [...templates].filter(([k]) => k.startsWith(`${owner}:`)).map(([, v]) => structuredClone(v)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const { data, error } = await getRequestDb().from('nutrition_templates').select('id,payload,updated_at').eq('owner_id', owner).order('updated_at', { ascending: false }).limit(100);
  dbError(error);
  return (data ?? []).map(row => ({ ...row.payload, id: row.id, updated_at: row.updated_at }));
}

export async function saveTemplate(owner: string, input: TemplateInput, persistent: boolean): Promise<TemplateView> {
  if (!persistent) {
    if (!templates.has(keyOf(owner, input.id)) && [...templates.keys()].filter(k => k.startsWith(`${owner}:`)).length >= 100) throw new CareError(409, 'Llegaste al máximo de 100 plantillas.');
    const view = { ...structuredClone(input), updated_at: new Date().toISOString() };
    templates.set(keyOf(owner, input.id), view); return structuredClone(view);
  }
  const { id, ...payload } = input;
  const { data, error } = await getRequestDb().from('nutrition_templates').upsert({ id, owner_id: owner, payload, updated_at: new Date().toISOString() }, { onConflict: 'owner_id,id' }).select('id,payload,updated_at').single();
  dbError(error);
  return { ...data!.payload, id: data!.id, updated_at: data!.updated_at };
}

export async function deleteTemplate(owner: string, id: string, persistent: boolean): Promise<void> {
  if (!persistent) { templates.delete(keyOf(owner, id)); return; }
  const { error } = await getRequestDb().from('nutrition_templates').delete().eq('owner_id', owner).eq('id', id);
  dbError(error);
}

export async function listNotices(owner: string, persistent: boolean): Promise<NoticeView[]> {
  if (!persistent) return [...notices].filter(([k]) => k.startsWith(`${owner}:`)).map(([, v]) => structuredClone(v));
  const { data, error } = await getRequestDb().from('notice_settings').select('key,enabled,when_text,message,updated_at').eq('owner_id', owner).limit(50);
  dbError(error);
  return (data ?? []) as NoticeView[];
}

export async function saveNotice(owner: string, input: NoticeSave, persistent: boolean): Promise<NoticeView> {
  const updated_at = new Date().toISOString();
  if (!persistent) { const view = { ...input, updated_at }; notices.set(keyOf(owner, input.key), view); return structuredClone(view); }
  const { data, error } = await getRequestDb().from('notice_settings').upsert({ owner_id: owner, ...input, updated_at }, { onConflict: 'owner_id,key' }).select('key,enabled,when_text,message,updated_at').single();
  dbError(error);
  return data as NoticeView;
}
export const newTemplateId = () => randomUUID();
