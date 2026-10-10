import { useCallback, useEffect, useState } from 'react';
import { crmWorkApi } from '../../api/crm-work';
import { NvButton } from './primitives';
import { groupUnreadMessages, relativeTimeLabel, type UnreadMessageGroup } from './message-notices';

export type MessageNoticesState =
  | { status: 'loading'; groups: UnreadMessageGroup[]; total: number }
  | { status: 'error'; groups: UnreadMessageGroup[]; total: number }
  | { status: 'ready'; groups: UnreadMessageGroup[]; total: number };

const MAX_GROUPS = 5;

/** Lee los mensajes sin leer del consultorio de la sesión al abrir el panel. */
export function useUnreadMessageNotices(active: boolean) {
  const [state, setState] = useState<MessageNoticesState>({ status: 'loading', groups: [], total: 0 });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setState(current => ({ ...current, status: 'loading' }));
    crmWorkApi.list({ kind: 'message', limit: 100 }, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setState({ status: 'ready', groups: groupUnreadMessages(result.items), total: result.counts.message });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: 'error', groups: [], total: 0 });
    });
    return () => controller.abort();
  }, [active, attempt]);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { state, retry };
}

export function MessageNotices({ state, now, onOpen, onViewAll, onRetry }: {
  state: MessageNoticesState;
  now: Date;
  onOpen: (group: UnreadMessageGroup) => void;
  onViewAll: () => void;
  onRetry?: () => void;
}) {
  const shown = state.groups.slice(0, MAX_GROUPS);
  const shownCount = shown.reduce((sum, group) => sum + group.count, 0);
  return <section className="nv-alerts-messages" aria-label="Mensajes" aria-busy={state.status === 'loading'}>
    <h3>Mensajes</h3>
    {state.status === 'loading' && <p className="nv-alerts-empty" role="status">Buscando mensajes…</p>}
    {state.status === 'error' && <div role="alert">
      <p className="nv-alerts-empty">No pudimos cargar tus mensajes. Eso no significa que no tengas ninguno.</p>
      {onRetry && <div className="nv-alerts-actions"><NvButton className="nv-ghost" onClick={onRetry}>Reintentar</NvButton></div>}
    </div>}
    {state.status === 'ready' && (shown.length === 0
      ? <p className="nv-alerts-empty">Sin mensajes nuevos</p>
      : <ul>{shown.map(group => <li key={group.patientId}>
        <div>
          <strong>{group.patientName}</strong>
          <small>{group.count === 1 ? '1 mensaje sin leer' : `${group.count} mensajes sin leer`} · {relativeTimeLabel(group.latestAt, now)}</small>
        </div>
        <div className="nv-alerts-actions"><NvButton onClick={() => onOpen(group)}>Abrir conversación</NvButton></div>
      </li>)}</ul>)}
    {state.status === 'ready' && state.total > shownCount && shown.length > 0 && <p className="nv-alerts-more">{state.total} mensajes sin leer en total</p>}
    <div className="nv-alerts-actions nv-alerts-all"><NvButton className="nv-ghost" onClick={onViewAll}>Ver todos los mensajes</NvButton></div>
  </section>;
}
