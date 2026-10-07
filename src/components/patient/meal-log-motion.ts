import { useEffect, useState } from 'react';
import { countAt } from './meal-log-helpers';

const QUERY = '(prefers-reduced-motion: reduce)';
const COUNT_MS = 850;

/** Lee la preferencia «reducir movimiento»; sin `matchMedia` (servidor, pruebas) es falso. */
export function prefersReducedMotion(win: Pick<Window, 'matchMedia'> | undefined): boolean {
  return typeof win?.matchMedia === 'function' && win.matchMedia(QUERY).matches;
}

const readReducedMotion = () => prefersReducedMotion(typeof window === 'undefined' ? undefined : window);

/** Sigue la preferencia del sistema «reducir movimiento». */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(QUERY);
    const onChange = () => setReduced(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Cuenta de 0 a `target`; con movimiento reducido muestra el valor final de una. */
export function useCountUp(target: number, delayMs = 0): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? countAt(target, 1) : 0);
  useEffect(() => {
    if (reduced) { setValue(countAt(target, 1)); return; }
    let frame = 0;
    let startedAt = 0;
    const tick = (now: number) => {
      startedAt ||= now;
      const progress = (now - startedAt) / COUNT_MS;
      setValue(countAt(target, progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => { frame = requestAnimationFrame(tick); }, delayMs);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [target, delayMs, reduced]);
  return value;
}

/** Número que cambia cada `everyMs`; sirve para rotar mensajes. */
export function useTicker(everyMs: number, active = true): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), everyMs);
    return () => window.clearInterval(timer);
  }, [everyMs, active]);
  return tick;
}
