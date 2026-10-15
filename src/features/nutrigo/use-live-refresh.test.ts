import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIVE_REFRESH_MS, startLiveRefresh } from './use-live-refresh';

function fakePage() {
  const listeners = new Set<() => void>();
  const page = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (_: string, fn: () => void) => { listeners.add(fn); },
    removeEventListener: (_: string, fn: () => void) => { listeners.delete(fn); },
  };
  const show = (state: DocumentVisibilityState) => { page.visibilityState = state; listeners.forEach(fn => fn()); };
  return { page: page as unknown as Parameters<typeof startLiveRefresh>[2], show, listeners };
}
const timers = { setInterval: (run: () => void, ms: number) => setInterval(run, ms) as unknown as number, clearInterval: (id: number) => clearInterval(id), now: () => Date.now() };

describe('startLiveRefresh', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('trae los mensajes nuevos cada 15 s con la conversación abierta', () => {
    const load = vi.fn().mockResolvedValue(undefined); const { page } = fakePage();
    startLiveRefresh(load, true, page, timers);
    vi.advanceTimersByTime(LIVE_REFRESH_MS.chat * 2);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('en las otras pantallas actualiza cada 60 s para que la campanita avise', () => {
    const load = vi.fn().mockResolvedValue(undefined); const { page } = fakePage();
    startLiveRefresh(load, false, page, timers);
    vi.advanceTimersByTime(LIVE_REFRESH_MS.chat * 3);
    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(LIVE_REFRESH_MS.other - LIVE_REFRESH_MS.chat * 3);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('no pide nada con la pestaña oculta y actualiza apenas la paciente vuelve', () => {
    const load = vi.fn().mockResolvedValue(undefined); const { page, show } = fakePage();
    startLiveRefresh(load, true, page, timers);
    show('hidden');
    vi.advanceTimersByTime(LIVE_REFRESH_MS.chat * 4);
    expect(load).not.toHaveBeenCalled();
    show('visible');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('no repite el pedido si vuelve a la pestaña enseguida', () => {
    const load = vi.fn().mockResolvedValue(undefined); const { page, show } = fakePage();
    startLiveRefresh(load, true, page, timers);
    show('hidden'); show('visible');
    expect(load).not.toHaveBeenCalled();
  });

  it('un error de red no rompe nada y el siguiente intento sigue', async () => {
    const load = vi.fn().mockRejectedValue(new Error('sin conexión')); const { page } = fakePage();
    startLiveRefresh(load, true, page, timers);
    vi.advanceTimersByTime(LIVE_REFRESH_MS.chat); await Promise.resolve();
    vi.advanceTimersByTime(LIVE_REFRESH_MS.chat); await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('deja de pedir al salir de la app', () => {
    const load = vi.fn().mockResolvedValue(undefined); const { page, show, listeners } = fakePage();
    const stop = startLiveRefresh(load, true, page, timers);
    stop();
    vi.advanceTimersByTime(LIVE_REFRESH_MS.other);
    show('hidden'); show('visible');
    expect(load).not.toHaveBeenCalled();
    expect(listeners.size).toBe(0);
  });
});
