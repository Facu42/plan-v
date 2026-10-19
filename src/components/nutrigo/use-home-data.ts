import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { crmWorkApi } from '../../api/crm-work';
import { schedulingApi, type SchedulingWorkspaceSnapshot } from '../../api/scheduling';
import type { BillingBoard } from '../../types/fees';
import type { CrmWorkKind, CrmWorkResponse } from '../../types/crm-work';

export type HomeFilter = CrmWorkKind | 'reservas' | '';
/** Agota la paginación antes de presentar un número de reservas como total. */
export async function loadHomeScheduling(signal: AbortSignal): Promise<SchedulingWorkspaceSnapshot> {
  const first = await schedulingApi.workspace(0, signal);
  let current = first;
  let offset = 0;
  const bookings = [...first.bookings];
  while (current.has_more) {
    if (signal.aborted) throw new DOMException('Cancelado', 'AbortError');
    // La misma página de 50 incluye reservas y transferencias; has_more puede venir de cualquiera.
    offset += 50;
    current = await schedulingApi.workspace(offset, signal);
    if (current.has_more && !current.bookings.length && !current.transfers.length) throw new Error('No pudimos consultar todas las reservas.');
    bookings.push(...current.bookings);
  }
  return { ...first, bookings, has_more: false };
}

export function useHomeData(today?: string) {
  const [kind, setKind] = useState<HomeFilter>('');
  const [cursor, setCursor] = useState<string>();
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<CrmWorkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [board, setBoard] = useState<BillingBoard | null>(null);
  const [billingError, setBillingError] = useState(false);
  const [scheduling, setScheduling] = useState<SchedulingWorkspaceSnapshot | null>(null);
  const [schedulingError, setSchedulingError] = useState(false);
  const refresh = () => { setCursor(undefined); setRevision(value => value + 1); };
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    // No borrar los contadores durante un cambio de pestaña; nunca reutilizar las filas del filtro anterior.
    crmWorkApi.list({ include_home: '1', kind: kind && kind !== 'reservas' ? kind : undefined, cursor, limit: 30 }, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted) { setData(null); setError('No pudimos cargar los pendientes.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, cursor, revision, today]);
  useEffect(() => {
    const controller = new AbortController();
    setBoard(null); setBillingError(false); setScheduling(null); setSchedulingError(false);
    api.getBillingBoard().then(result => { if (!controller.signal.aborted) setBoard(result.board); }).catch(() => { if (!controller.signal.aborted) setBillingError(true); });
    loadHomeScheduling(controller.signal).then(result => { if (!controller.signal.aborted) setScheduling(result); }).catch(() => { if (!controller.signal.aborted) setSchedulingError(true); });
    return () => controller.abort();
  }, [revision, today]);
  useEffect(() => {
    window.addEventListener('focus', refresh);
    window.addEventListener('plan-v:care-changed', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('plan-v:care-changed', refresh); };
  }, []);
  return { data, loading, error, kind, onKind: (value: HomeFilter) => { setCursor(undefined); setKind(value); }, onRefresh: refresh, onNext: () => setCursor(data?.next_cursor ?? undefined), hasPrevious: Boolean(cursor), board, billingError, scheduling, schedulingError };
}
