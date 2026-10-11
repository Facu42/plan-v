import { useLayoutEffect, useRef, useState } from 'react';

const DURATION_MS = 700;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const motionAllowed = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

/**
 * Número que sube contando hasta su valor: desde cero al entrar y desde el valor anterior cuando cambia.
 * Sin «reducir movimiento» muestra el valor final de entrada; el texto final es siempre el mismo que sin animar.
 */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef<number | null>(null);
  useLayoutEffect(() => {
    const start = from.current ?? 0;
    from.current = value;
    if (!Number.isFinite(value) || start === value || !motionAllowed()) { setShown(value); return; }
    const whole = Number.isInteger(start) && Number.isInteger(value);
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION_MS);
      const current = start + (value - start) * easeOut(t);
      setShown(whole ? Math.round(current) : current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setShown(start);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(value === shown ? value : shown)}</>;
}
