import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { buildBoardRows, type BoardRow } from './cobranzas-utils';
import { buildProNotices, type ProNotice, type ProNoticePerson } from './pro-notices';

const REFRESH_MS = 30000;

/** Avisos de la nutricionista: mensajes y turnos salen de los pacientes ya cargados; los cobros se consultan al tablero. */
export function useProNotices(enabled: boolean, patients: readonly ProNoticePerson[], now: Date): ProNotice[] {
  const [board, setBoard] = useState<BoardRow[]>([]);
  useEffect(() => {
    if (!enabled) { setBoard([]); return; }
    let active = true;
    const load = () => api.getBillingBoard().then(({ board: next }) => { if (active) setBoard(buildBoardRows(next)); }).catch(() => { if (active) setBoard([]); });
    void load();
    const timer = window.setInterval(load, REFRESH_MS);
    window.addEventListener('plan-v:care-changed', load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('plan-v:care-changed', load); };
  }, [enabled]);
  return useMemo(() => (enabled ? buildProNotices({ patients, board, now }) : []), [enabled, patients, board, now]);
}
