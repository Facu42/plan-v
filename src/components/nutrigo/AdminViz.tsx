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

const DONUT = { cx: 200, cy: 104, r: 66, width: 400, height: 208 };

/** Dona de estados del servicio con etiquetas a los costados (como la del diseño de referencia).
 *  Cada tramo se dibuja con su propio retraso. */
export function StateDonut({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const shown = slices.filter((slice) => slice.value > 0);
  let offset = 0;
  const parts = shown.map((slice, index) => {
    const share = (slice.value / total) * 100;
    const start = offset;
    offset += share;
    const mid = ((start + share / 2) / 100) * Math.PI * 2 - Math.PI / 2;
    return { slice, index, share, start, mid };
  });
  return <div className="adm-donut">
    <svg viewBox={`0 0 ${DONUT.width} ${DONUT.height}`} role="img" aria-label={total ? shown.map((s) => `${s.label}: ${s.value}`).join(', ') : 'Todavía no hay nutricionistas'}>
      <g transform={`rotate(-90 ${DONUT.cx} ${DONUT.cy})`}>
        <circle className="adm-donut-track" cx={DONUT.cx} cy={DONUT.cy} r={DONUT.r} pathLength={100} />
        {parts.map(({ slice, index, share, start }) => {
          const gap = shown.length > 1 ? 0.8 : 0;
          const length = Math.max(share - gap, 0.4);
          return <circle key={slice.id} className="adm-donut-slice" cx={DONUT.cx} cy={DONUT.cy} r={DONUT.r} pathLength={100} stroke={slice.color}
            strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start}
            style={{ ['--adm-delay' as string]: `${index * 140}ms` }}><title>{`${slice.label}: ${slice.value}`}</title></circle>;
        })}
      </g>
      {parts.map(({ slice, index, mid }) => {
        const cos = Math.cos(mid); const sin = Math.sin(mid);
        const x1 = DONUT.cx + cos * (DONUT.r + 14); const y1 = DONUT.cy + sin * (DONUT.r + 14);
        const x2 = DONUT.cx + cos * (DONUT.r + 26); const y2 = DONUT.cy + sin * (DONUT.r + 26);
        const right = cos >= 0;
        return <g key={slice.id} className="adm-donut-label" style={{ ['--adm-delay' as string]: `${300 + index * 140}ms` }}>
          <path d={`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} h${right ? 8 : -8}`} />
          <text x={x2 + (right ? 11 : -11)} y={y2 + 4} textAnchor={right ? 'start' : 'end'} className={index === 0 ? 'adm-donut-label-on' : ''}>{slice.label} · {slice.value}</text>
        </g>;
      })}
    </svg>
  </div>;
}

const LINE = { width: 520, height: 230, left: 58, right: 16, top: 22, bottom: 30 };

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / step) * step;
}

/** Línea de cobros por mes: grilla suave, área debajo y el último punto marcado. */
export function CollectionsChart({ points, format }: { points: Array<{ month: string; label: string; total: number }>; format: (n: number) => string }) {
  const max = niceMax(Math.max(...points.map((point) => point.total), 0));
  const innerW = LINE.width - LINE.left - LINE.right;
  const innerH = LINE.height - LINE.top - LINE.bottom;
  const x = (index: number) => LINE.left + (points.length > 1 ? (index / (points.length - 1)) * innerW : innerW / 2);
  const y = (value: number) => LINE.top + innerH - (value / max) * innerH;
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(point.total).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => share * max);
  const last = points[points.length - 1];
  const short = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)} mil` : String(n));
  return <svg className="adm-line" viewBox={`0 0 ${LINE.width} ${LINE.height}`} role="img" aria-label={points.map((point) => `${point.label}: ${format(point.total)}`).join(', ')}>
    {ticks.map((tick) => <g key={tick}><line className="adm-grid" x1={LINE.left} x2={LINE.width - LINE.right} y1={y(tick)} y2={y(tick)} /><text className="adm-axis" x={LINE.left - 8} y={y(tick) + 4} textAnchor="end">{short(tick)}</text></g>)}
    {points.map((point, index) => <text key={point.month} className="adm-axis" x={x(index)} y={LINE.height - 8} textAnchor="middle">{point.label}</text>)}
    <path className="adm-line-area" d={area} />
    <path className="adm-line-path" d={line} pathLength={100} />
    {points.map((point, index) => <circle key={point.month} className={index === points.length - 1 ? 'adm-line-end' : 'adm-line-dot'} cx={x(index)} cy={y(point.total)} r={index === points.length - 1 ? 4.5 : 2.5}><title>{`${point.label}: ${format(point.total)}`}</title></circle>)}
    {last && <text className="adm-line-value" x={x(points.length - 1) - 8} y={y(last.total) - 10} textAnchor="end">{format(last.total)}</text>}
  </svg>;
}
