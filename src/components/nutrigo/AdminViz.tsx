import { useEffect, useState } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const COUNT_MS = 900;

/** Número que cuenta desde cero al aparecer. Con «reducir movimiento» (o sin navegador) muestra el valor final. */
export function CountUp({ value, format = (n: number) => String(n) }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') { setShown(value); return undefined; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(shown)}</>;
}

export interface DonutSlice { id: string; label: string; value: number; color: string }

/** Dona de estados del servicio: cada tramo se dibuja con su propio retraso. */
export function StateDonut({ slices, centerLabel }: { slices: DonutSlice[]; centerLabel: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;
  return <div className="adm-donut">
    <svg viewBox="0 0 120 120" role="img" aria-label={total ? slices.filter((s) => s.value > 0).map((s) => `${s.label}: ${s.value}`).join(', ') : 'Todavía no hay nutricionistas'}>
      <circle className="adm-donut-track" cx="60" cy="60" r="46" pathLength={100} />
      {total > 0 && slices.filter((slice) => slice.value > 0).map((slice, index) => {
        const share = (slice.value / total) * 100;
        const gap = share > 4 ? 1.2 : 0;
        const node = <circle key={slice.id} className="adm-donut-slice" cx="60" cy="60" r="46" pathLength={100} stroke={slice.color}
          strokeDasharray={`${Math.max(share - gap, 0.5)} ${100 - Math.max(share - gap, 0.5)}`} strokeDashoffset={-offset}
          style={{ ['--adm-delay' as string]: `${index * 140}ms` }}><title>{`${slice.label}: ${slice.value}`}</title></circle>;
        offset += share;
        return node;
      })}
    </svg>
    <div className="adm-donut-center"><strong><CountUp value={total} /></strong><span>{centerLabel}</span></div>
    <ul className="adm-legend">{slices.map((slice) => <li key={slice.id}><i style={{ background: slice.color }} />{slice.label}<b>{slice.value}</b></li>)}</ul>
  </div>;
}
