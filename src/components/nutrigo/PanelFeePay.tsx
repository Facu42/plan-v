import { useState } from 'react';
import { formatFeeDate, formatPesos } from '../../fees';

export type FeePayOption = { due_on: string; amount: number; title: string };

export function PanelFeePayDialog({ name, options, initialDue, busy, notice, link, onClose, onCreate, onCopy }: {
  name: string;
  options: FeePayOption[];
  initialDue?: string;
  busy: boolean;
  notice: string;
  link: string;
  onClose: () => void;
  onCreate: (dueOn: string) => void;
  onCopy: (url: string) => void;
}) {
  const [dueOn, setDueOn] = useState(initialDue && options.some(option => option.due_on === initialDue) ? initialDue : options[0]?.due_on ?? '');
  const chosen = options.find(option => option.due_on === dueOn) ?? options[0];
  return <div className="p5-dialog" role="dialog" aria-modal="true" aria-label={`Cobrar la cuota de ${name}`}>
    <form className="p5-card" onSubmit={event => { event.preventDefault(); if (chosen) onCreate(chosen.due_on); }}>
      <h3>Cobrar este mes</h3>
      <p>Un pago único de la cuota de {name}. No es un débito automático. La plata entra directo a tu cuenta de Mercado Pago.</p>
      {!options.length && <p className="p5-empty">No hay una cuota abierta para cobrar.</p>}
      {options.length > 0 && <label>Mes
        <select value={chosen?.due_on ?? ''} disabled={busy || Boolean(link)} onChange={event => setDueOn(event.target.value)}>
          {options.map(option => <option key={option.due_on} value={option.due_on}>{option.title} · {formatPesos(option.amount)} · vence el {formatFeeDate(option.due_on)}</option>)}
        </select>
      </label>}
      {link && <label>Enlace de pago<input readOnly value={link} aria-label="Enlace de pago" onFocus={event => event.currentTarget.select()} /></label>}
      {notice && <p className="p5-status" role="status">{notice}</p>}
      <div className="p5-row">
        <button type="button" className="p5-btn" onClick={onClose}>Volver</button>
        {link
          ? <button type="button" className="p5-btn p5-pri" onClick={() => onCopy(link)}>Copiar enlace</button>
          : <button className="p5-btn p5-pri" disabled={busy || !chosen}>Generar enlace</button>}
      </div>
    </form>
  </div>;
}
