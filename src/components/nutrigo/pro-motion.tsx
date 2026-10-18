import { useEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Number ticker de Magic UI, adaptado a `motion` y al formato es-AR.
 * El valor final está en el HTML desde el primer render (lectores y pruebas).
 * Con menos movimiento la cifra igual avanza, más corto y desde cerca.
 */
export function NumberTicker({ value, format }: { value: number; format?: (amount: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = (amount: number) => format ? format(amount) : amount.toLocaleString('es-AR');
  useEffect(() => {
    const node = ref.current;
    if (!node || !Number.isFinite(value)) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = reduce ? value * 0.92 : 0;
    const controls = animate(from, value, {
      duration: reduce ? 0.16 : 0.36,
      ease: EASE,
      onUpdate: (latest) => {
        const shown = Math.abs(latest - value) < 0.5 ? value : Math.round(latest);
        node.textContent = text(shown);
      },
    });
    return () => controls.stop();
  }, [value, format]);
  return <span ref={ref} className="pv-ticker">{Number.isFinite(value) ? text(value) : '—'}</span>;
}

/**
 * Entrada de Magic UI blur-fade, sin filtro: el pedido es solo transform y opacidad.
 */
export function BlurFade({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div
    className={className}
    initial={{ opacity: 0, y: reduce ? 2 : 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: reduce ? 0.16 : 0.28, delay: reduce ? 0 : delay, ease: EASE }}
  >{children}</motion.div>;
}
