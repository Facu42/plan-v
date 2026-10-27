// Cajón «Etiquetas de …» de la Ficha v29: mismas piezas del boceto (`#actw`, `.ach`, `.ai`), con las etiquetas reales.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PanelV29Icon } from './PanelV29Icon';
import { usePanelBoceto } from './panel-v29-boceto';

export const ETIQUETAS_SUGERIDAS = ['Celíaca', 'Sin lactosa', 'Hipotiroidismo', 'Programa mensual', 'Deportista', 'Embarazo', 'Vegetariana', 'Prioridad'] as const;
export const MAX_ETIQUETAS = 8;
export const LARGO_ETIQUETA = 30;

const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function FichaEtiquetas({ nombre, actuales, onGuardar, onClose }: { nombre: string; actuales: readonly string[]; onGuardar: (etiquetas: string[]) => Promise<boolean>; onClose: () => void }) {
  const [elegidas, setElegidas] = useState<string[]>([...actuales]);
  const [nueva, setNueva] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { clase, cerrar } = usePanelBoceto(onClose);
  const opciones = [...ETIQUETAS_SUGERIDAS, ...actuales.filter(a => !ETIQUETAS_SUGERIDAS.some(s => igual(s, a)))];
  const alternar = (texto: string) => { setAviso(''); setElegidas(actual => actual.some(e => igual(e, texto)) ? actual.filter(e => !igual(e, texto)) : [...actual, texto]); };
  const guardar = async () => {
    const extra = nueva.trim();
    const final = extra && !elegidas.some(e => igual(e, extra)) ? [...elegidas, extra] : elegidas;
    if (final.length > MAX_ETIQUETAS) { setAviso(`Hasta ${MAX_ETIQUETAS} etiquetas por paciente.`); return; }
    setGuardando(true);
    const ok = await onGuardar(final);
    setGuardando(false);
    if (ok) cerrar(); else setAviso('No pudimos guardar las etiquetas. Probá de nuevo.');
  };
  const nodo = <div id="actw" className={clase || undefined}>
    <div className="ascrim" onClick={cerrar} />
    <aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt">
      <header><div><h2 id="actt">Etiquetas de {nombre}</h2><p id="acts">Sirven para filtrar en Pacientes</p></div><button type="button" className="ibtn" aria-label="Cerrar" onClick={cerrar}><PanelV29Icon name="x" size={13} /></button></header>
      <div className="abody" id="actb">
        <div className="af"><span>Elegí</span><div className="ach">{opciones.map(texto => <button type="button" key={texto} aria-pressed={elegidas.some(e => igual(e, texto))} onClick={() => alternar(texto)}>{texto}</button>)}</div></div>
        <label className="af"><span>Nueva etiqueta</span><input className="ai" type="text" maxLength={LARGO_ETIQUETA} placeholder="Ej.: Running" value={nueva} onChange={event => { setNueva(event.target.value); setAviso(''); }} /></label>
        {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
      </div>
      <footer id="actf"><button type="button" className="chip" onClick={cerrar}>Cancelar</button><span style={{ flex: 1 }} /><button type="button" className="cta" disabled={guardando} onClick={() => void guardar()}>Guardar</button></footer>
    </aside>
  </div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}
