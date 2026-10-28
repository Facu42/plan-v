// Cajón lateral del boceto v29 (`#actw > .ascrim + aside#act`), genérico: título, cuerpo con los campos `.af/.ai/.aseg/.ach/.ack/.arow` y pie con Cancelar y el botón principal.
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { PanelV29Icon } from './PanelV29Icon';
import { usePanelBoceto } from './panel-v29-boceto';

export function CajonV29({ titulo, sub, ok = 'Guardar', aviso, onGuardar, onClose, children }: { titulo: string; sub?: string; ok?: string | false; aviso?: string; onGuardar?: () => boolean | void; onClose: () => void; children: ReactNode }) {
  const { clase, cerrar } = usePanelBoceto(onClose);
  const guardar = () => { if (onGuardar?.() !== false) cerrar(); };
  const nodo = <div id="actw" className={clase || undefined}>
    <div className="ascrim" onClick={cerrar} />
    <aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt">
      <header><div><h2 id="actt">{titulo}</h2><p id="acts">{sub ?? ''}</p></div><button type="button" className="ibtn" aria-label="Cerrar" onClick={cerrar}><PanelV29Icon name="x" size={13} /></button></header>
      <div className="abody" id="actb">{children}{aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}</div>
      <footer id="actf">{ok === false ? <button type="button" className="chip" onClick={cerrar}>Cerrar</button> : <><button type="button" className="chip" onClick={cerrar}>Cancelar</button><span style={{ flex: 1 }} /><button type="button" className="cta" onClick={guardar}>{ok}</button></>}</footer>
    </aside>
  </div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}

export const Campo = ({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) => <label className="af"><span>{etiqueta}</span>{children}{ayuda ? <small>{ayuda}</small> : null}</label>;
export const Fila = ({ children }: { children: ReactNode }) => <div className="arow">{children}</div>;

export function Segmentado<T extends string>({ opciones, valor, onCambiar, etiqueta }: { opciones: ReadonlyArray<readonly [T, string]>; valor: T; onCambiar: (v: T) => void; etiqueta: string }) {
  return <div className="af"><span>{etiqueta}</span><div className="aseg" role="radiogroup">{opciones.map(([v, texto]) => <button type="button" key={v} role="radio" aria-label={texto} aria-checked={v === valor} onClick={() => onCambiar(v)}>{texto}</button>)}</div></div>;
}

export function Chips({ etiqueta, opciones, elegidas, onCambiar }: { etiqueta: string; opciones: readonly string[]; elegidas: readonly string[]; onCambiar: (siguiente: string[]) => void }) {
  return <div className="af"><span>{etiqueta}</span><div className="ach">{opciones.map(texto => { const on = elegidas.includes(texto); return <button type="button" key={texto} aria-pressed={on} onClick={() => onCambiar(on ? elegidas.filter(e => e !== texto) : [...elegidas, texto])}>{texto}</button>; })}</div></div>;
}

export function Tildes({ filas, onCambiar }: { filas: ReadonlyArray<{ text: string; on: boolean }>; onCambiar: (texto: string, on: boolean) => void }) {
  return <div className="ack">{filas.map(fila => <label key={fila.text}><input type="checkbox" checked={fila.on} onChange={event => onCambiar(fila.text, event.target.checked)} /><span>{fila.text}</span></label>)}</div>;
}
