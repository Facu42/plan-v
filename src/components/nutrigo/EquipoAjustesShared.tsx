import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './equipo-ajustes.css';

export function SectionTabs({ labels, value, onChange, label }: { labels: readonly string[]; value: number; onChange: (value: number) => void; label: string }) {
  return <div className="tabs ea-tabs" role="tablist" aria-label={label}>{labels.map((text, i) => <button key={text} type="button" role="tab" aria-selected={value === i} tabIndex={value === i ? 0 : -1} className={value === i ? 'on' : ''} onClick={() => onChange(i)} onKeyDown={e => {
    const next = e.key === 'ArrowRight' ? (i + 1) % labels.length : e.key === 'ArrowLeft' ? (i + labels.length - 1) % labels.length : e.key === 'Home' ? 0 : e.key === 'End' ? labels.length - 1 : null;
    if (next === null) return; e.preventDefault(); onChange(next); (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
  }}>{text}</button>)}</div>;
}
export function SettingsCard({ title, children, action, grow = false }: { title: string; children: ReactNode; action?: ReactNode; grow?: boolean }) {
  return <section className={`fxp${grow ? ' g' : ''}`} aria-label={title}><header><h3>{title}</h3><span className="sp"/>{action}</header>{children}</section>;
}
export function Soon({ children }: { children: ReactNode }) { return <p className="ea-empty"><b>Próximamente</b><span>{children}</span></p>; }
export function SettingsDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.showModal(); return () => previous?.focus(); }, []);
  const dialog = <dialog ref={ref} className="ea-dialog" aria-labelledby="ea-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}><header><h2 id="ea-dialog-title">{title}</h2><button type="button" className="ibtn" aria-label="Cerrar" onClick={onClose}>×</button></header><div className="ea-dialog-body">{children}</div></dialog>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(dialog, host) : dialog;
}
