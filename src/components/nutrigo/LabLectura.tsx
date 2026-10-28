// Cajón «Lectura de los valores» del Laboratorio (v29): mismas piezas del boceto (`#actw`, `.fxkv`, `.ai`, `.nthint`).
// La lectura sale de los valores ya revisados; se puede editar y copiar, pero no se guarda.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PanelV29Icon } from './PanelV29Icon';
import { avisoEnElPanel, usePanelBoceto } from './panel-v29-boceto';
import { FxKv } from './ficha-fx';
import { fechaCorta } from './ficha-laboratorio';
import type { Lectura } from './lab-lectura';

export function LabLectura({ lectura, onClose }: { lectura: Lectura; onClose: () => void }) {
  const [texto, setTexto] = useState(lectura.texto);
  const [aviso, setAviso] = useState('');
  const { clase, cerrar } = usePanelBoceto(onClose);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto.trim()); avisoEnElPanel('Lectura copiada.'); cerrar(); }
    catch { setAviso('No pudimos copiar. Seleccioná el texto y copialo a mano.'); }
  };
  const nodo = <div id="actw" className={clase || undefined}>
    <div className="ascrim" onClick={cerrar} />
    <aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt">
      <header><div><h2 id="actt">Lectura de los valores</h2><p id="acts">Calculada con lo que ya revisaste. No se guarda</p></div><button type="button" className="ibtn" aria-label="Cerrar" onClick={cerrar}><PanelV29Icon name="x" size={13} /></button></header>
      <div className="abody" id="actb">
        {lectura.filas.length ? <div className="af"><span>{lectura.previa ? `Comparado con el ${fechaCorta(lectura.previa)}` : `Análisis del ${fechaCorta(lectura.ultima!)}`}</span>
          <FxKv filas={lectura.filas.map(f => [f.nombre, `${f.valor} ${f.unidad} · ${f.cambio}${f.estado ? ` · ${f.estado.texto.toLowerCase()}` : ''}`] as const)} /></div> : null}
        <label className="af"><span>Lectura</span><textarea className="ai" rows={7} value={texto} onChange={e => { setTexto(e.target.value); setAviso(''); }} /></label>
        <small className="nthint">Es una lectura automática de tus valores revisados, sin IA externa. Podés editar el texto antes de copiarlo.</small>
        {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
      </div>
      <footer id="actf"><button type="button" className="chip" onClick={cerrar}>Cerrar</button><span style={{ flex: 1 }} /><button type="button" className="cta" disabled={!lectura.filas.length} onClick={() => void copiar()}>Copiar lectura</button></footer>
    </aside>
  </div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}
