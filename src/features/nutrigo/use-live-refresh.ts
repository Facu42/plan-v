import { useEffect } from 'react';

/** Cada cuánto se trae de nuevo la ficha de la paciente mientras la app está a la vista. */
export const LIVE_REFRESH_MS = { chat: 15000, other: 60000 } as const;

type Page = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
type Timers = { setInterval: (run: () => void, ms: number) => number; clearInterval: (id: number) => void; now: () => number };

/**
 * Trae los datos nuevos de la paciente sin recargar la página: cada 15 s con la conversación
 * abierta (igual que el consultorio) y cada 60 s en el resto, para que la campanita avise de
 * mensajes nuevos. Solo con la pestaña a la vista, y apenas la paciente vuelve a ella.
 * Devuelve la función que lo apaga.
 */
export function startLiveRefresh(load: () => Promise<void>, chatOpen: boolean, page: Page, timers: Timers): () => void {
  let last = timers.now();
  const run = () => { last = timers.now(); void load().catch(() => undefined); };
  const tick = () => { if (page.visibilityState === 'visible') run(); };
  const onVisible = () => { if (page.visibilityState === 'visible' && timers.now() - last >= LIVE_REFRESH_MS.chat) run(); };
  const timer = timers.setInterval(tick, chatOpen ? LIVE_REFRESH_MS.chat : LIVE_REFRESH_MS.other);
  page.addEventListener('visibilitychange', onVisible);
  return () => { timers.clearInterval(timer); page.removeEventListener('visibilitychange', onVisible); };
}

export function usePatientLiveRefresh(patientId: string, chatOpen: boolean, refresh: (id: string) => Promise<void>): void {
  useEffect(() => startLiveRefresh(() => refresh(patientId), chatOpen, document, {
    setInterval: (run, ms) => window.setInterval(run, ms),
    clearInterval: id => window.clearInterval(id),
    now: () => Date.now(),
  }), [patientId, chatOpen, refresh]);
}
