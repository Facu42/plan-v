import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../shared/Icon';

export function NvButton({ children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`nv-button ${className}`} {...props}>{children}</button>;
}
export function NvCard({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`nv-card ${className}`}><header className="nv-card-head"><h2>{title}</h2>{action}</header>{children}</section>;
}
export function NvBadge({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'gold' | 'coral' }) {
  return <span className={`nv-badge nv-${tone}`}>{children}</span>;
}
export function NvState({ title, description }: { title: string; description: string }) {
  return <div className="nv-state" role="status"><Icon name="leaf" size={28} /><h2>{title}</h2><p>{description}</p></div>;
}
export function NvProgress({ value, label }: { value: number; label: string }) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return <div className="nv-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><span style={{ width: `${safeValue}%` }} /></div>;
}
export function NvMetric({ label, value, note, icon, tone = 'green', children, onOpen }: { label: string; value: ReactNode; note: string; icon: IconName; tone?: 'green' | 'gold' | 'coral'; children?: ReactNode; onOpen?: () => void }) {
  const content = <><div className="nv-metric-label"><h2>{label}</h2><span className="nv-icon-tile"><Icon name={icon} size={18} /></span></div><strong>{value}</strong>{children}<small>{note}</small></>;
  if (onOpen) return <button type="button" className={`nv-metric nv-openable nv-${tone}`} aria-label={`Ver detalle de ${label}`} onClick={onOpen}>{content}</button>;
  return <section className={`nv-metric nv-${tone}`}>{content}</section>;
}
export function NvBars({ values, label }: { values: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...values.map((v) => v.value));
  return <div className="nv-bars" role="img" aria-label={`${label}. ${values.map((v) => `${v.label}: ${v.value}`).join('; ')}`}>
    {values.map((v, i) => <div key={`${v.label}-${i}`}><span style={{ '--bar-height': `${Math.max(0, v.value) / max * 100}%` } as CSSProperties}><i /></span><small>{v.label}</small></div>)}
  </div>;
}
export function NvRing({ value, label }: { value: number; label: string }) {
  const percentage = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return <div className="nv-ring" role="img" aria-label={`${label}: ${percentage}%`}>
    <svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="82" /><circle cx="100" cy="100" r="82" pathLength="100" strokeDasharray={`${percentage} 100`} /></svg>
    <div><strong>{percentage}<small>%</small></strong><span>{label}</span></div>
  </div>;
}
