import { useEffect, useState } from 'react';
import { crmWorkApi } from '../../api/crm-work';
import type { CrmWorkItem, CrmWorkQuery, CrmWorkResponse } from '../../types/crm-work';

export const MESSAGES_READ_EVENT = 'plan-v:messages-read';
const POLL_MS = 30000;

export async function loadCarteraUnread(list: (query: CrmWorkQuery, signal?: AbortSignal) => Promise<CrmWorkResponse>, signal?: AbortSignal): Promise<{ byPatient: Map<string, number>; total: number }> {
  const messages = new Map<string, CrmWorkItem>();
  const seen = new Set<string>();
  let cursor: string | undefined;
  let total = 0;
  do {
    if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
    const page = await list({ kind: 'message', limit: 100, ...(cursor ? { cursor } : {}) }, signal);
    total = page.total;
    for (const item of page.items) messages.set(item.id, item);
    if (!page.next_cursor) break;
    if (seen.has(page.next_cursor)) throw new Error('No se pudieron cargar todos los mensajes.');
    seen.add(page.next_cursor);
    cursor = page.next_cursor;
  } while (cursor);
  return { byPatient: unreadByPatient([...messages.values()]), total };
}

export function unreadByPatient(items: readonly CrmWorkItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) if (item.kind === 'message') counts.set(item.patient_id, (counts.get(item.patient_id) ?? 0) + 1);
  return counts;
}

/** The directory does not carry every thread, so the server count fills in conversations not opened yet. */
export function mergeUnread(local: number, remote: ReadonlyMap<string, number> | null, patientId: string): number {
  return Math.max(local, remote?.get(patientId) ?? 0);
}

/** Unread messages across the whole caseload, refreshed while the page is visible. */
export function useCarteraUnread(enabled: boolean): { byPatient: Map<string, number> | null; total: number | null } {
  const [state, setState] = useState<{ byPatient: Map<string, number> | null; total: number | null }>({ byPatient: null, total: null });
  useEffect(() => {
    if (!enabled) { setState({ byPatient: null, total: null }); return; }
    const controller = new AbortController();
    let loading = false;
    const load = async () => {
      if (loading || document.visibilityState === 'hidden') return;
      loading = true;
      try {
        const result = await loadCarteraUnread(crmWorkApi.list, controller.signal);
        if (!controller.signal.aborted) setState(result);
      } catch {
        // Sin conexión se conserva el último conteo; el de la pantalla sigue funcionando.
      } finally { loading = false; }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    window.addEventListener(MESSAGES_READ_EVENT, load);
    document.addEventListener('visibilitychange', onVisible);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener(MESSAGES_READ_EVENT, load); document.removeEventListener('visibilitychange', onVisible); };
  }, [enabled]);
  return state;
}
