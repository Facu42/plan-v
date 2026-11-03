// Cajón de edición de Ajustes: las mismas piezas del boceto (`#actw`, `#act`, `.af`, `.ai`, `.aseg`) que ya usa «Etiquetas».
import { useState, type ReactNode } from 'react';
import { CajonMarco } from './CajonV29';
import { usePanelBoceto } from './panel-v29-boceto';
import { friendlyError } from '../../lib/error-messages';

export const Campo = ({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) =>
  <label className="af"><span>{etiqueta}</span>{children}{ayuda ? <small>{ayuda}</small> : null}</label>;
export const Fila = ({ children }: { children: ReactNode }) => <div className="arow">{children}</div>;
export const Texto = ({ valor, alCambiar, ayuda, max = 120, tipo = 'text' }: { valor: string; alCambiar: (v: string) => void; ayuda?: string; max?: number; tipo?: string }) =>
  <input className="ai" type={tipo} value={valor} maxLength={max} placeholder={ayuda} onChange={e => alCambiar(e.target.value)} />;
export function Segmentos<T extends string>({ opciones, valor, alCambiar }: { opciones: readonly T[]; valor: T; alCambiar: (v: T) => void }) {
  return <div className="aseg" role="radiogroup">{opciones.map(o => <button key={o} type="button" role="radio" aria-label={o} aria-checked={o === valor} onClick={() => alCambiar(o)}>{o}</button>)}</div>;
}

type Props = { titulo: string; sub?: string; guardar?: string; sinGuardar?: boolean; children: ReactNode; onGuardar: () => Promise<void>; onClose: () => void };

/** Muestra el cajón; `onGuardar` lanza un error si algo falla y el cajón queda abierto con el motivo. */
export function CajonAjustes({ titulo, sub, guardar = 'Guardar', sinGuardar, children, onGuardar, onClose }: Props) {
  const { clase, cerrar } = usePanelBoceto(onClose);
  const [aviso, setAviso] = useState(''), [ocupado, setOcupado] = useState(false);
  async function aceptar() {
    setOcupado(true); setAviso('');
    try { await onGuardar(); cerrar(); } catch (e) { setAviso(friendlyError(e)); setOcupado(false); }
  }
  const pie = <><button type="button" className="chip" onClick={cerrar}>Cancelar</button><span style={{ flex: 1 }} />{sinGuardar ? null : <button type="button" className="cta" disabled={ocupado} onClick={() => void aceptar()}>{guardar}</button>}</>;
  return <CajonMarco clase={clase} titulo={titulo} sub={sub} pie={pie} onSolicitarCerrar={cerrar}>{children}{aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}</CajonMarco>;
}
