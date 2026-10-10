import type { CSSProperties } from 'react';
import { formatMetricDate, formatMetricValue } from './measurement-format';

export interface MetricPoint { date: string; value: number }

/** Línea simple de una métrica. Con un solo punto dibuja sólo ese punto; no completa fechas sin registro. */
export function MetricChart({ points, unit, label }: { points: readonly MetricPoint[]; unit: string; label: string }) {
  const width = 520;
  const height = 150;
  const pad = 14;
  const ordered = [...points].sort((a, b) => a.date.localeCompare(b.date));
  if (!ordered.length) return null;
  const values = ordered.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (index: number) => ordered.length === 1 ? width / 2 : pad + (width - pad * 2) * index / (ordered.length - 1);
  const y = (value: number) => max === min ? height / 2 : height - pad - (height - pad * 2) * (value - min) / span;
  const path = ordered.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
  const text = `${label}: ${ordered.map((point) => `${formatMetricDate(point.date)} ${formatMetricValue(point.value, unit)}`).join('; ')}`;
  return <svg className="pm-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={text} style={{ '--pm-chart-height': `${height}px` } as CSSProperties} preserveAspectRatio="none">
    {ordered.length > 1 && <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    {ordered.map((point, index) => <circle key={`${point.date}-${index}`} cx={x(index)} cy={y(point.value)} r={3.5} fill="currentColor" vectorEffect="non-scaling-stroke" />)}
  </svg>;
}

/** Mini gráfico de la tarjeta: sólo la forma de la serie. Los valores y la tendencia van en el texto de la tarjeta. */
export function MetricSparkline({ values }: { values: readonly number[] }) {
  if (values.length < 2) return null;
  const width = 100;
  const height = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => `${(width * index / (values.length - 1)).toFixed(1)},${(max === min ? height / 2 : height - 2 - (height - 4) * (value - min) / span).toFixed(1)}`).join(' ');
  return <svg className="pm-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
  </svg>;
}
