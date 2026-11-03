// Cajón «Lectura de los valores» del Laboratorio (v29): mismas piezas del boceto (`#actw`, `.fxkv`, `.ai`, `.nthint`).
// La lectura sale de los valores ya revisados; se puede editar y copiar, pero no se guarda.
import { useState } from 'react';
import { avisoEnElPanel, usePanelBoceto } from './panel-v29-boceto';
import { CajonMarco } from './CajonV29';
import { FxKv } from './ficha-fx';
import { fechaCorta } from './ficha-laboratorio';
import type { Lectura } from './lab-lectura';

export function LabLectura({ lectura, onClose, pedirIA }: { lectura: Lectura; onClose: () => void; pedirIA?: () => Promise<string> }) {
  const [texto, setTexto] = useState(lectura.texto);
  const [aviso, setAviso] = useState('');
  const [conIA, setConIA] = useState(false);
  const [esperando, setEsperando] = useState(false);
  const leerConIA = async () => {
    if (!pedirIA) return;
    setEsperando(true); setAviso('');
    try { setTexto(await pedirIA()); setConIA(true); }
    catch (error) { setAviso(error instanceof Error && error.message ? error.message : 'No pudimos pedir la lectura con IA. Queda la lectura automática.'); }
    finally { setEsperando(false); }
  };
  const { clase, cerrar } = usePanelBoceto(onClose);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto.trim()); avisoEnElPanel('Lectura copiada.'); cerrar(); }
    catch { setAviso('No pudimos copiar. Seleccioná el texto y copialo a mano.'); }
  };
  return <CajonMarco clase={clase} titulo="Lectura de los valores" sub="Calculada con lo que ya revisaste. No se guarda" onSolicitarCerrar={cerrar} pie={<><button type="button" className="chip" onClick={cerrar}>Cerrar</button><span style={{ flex: 1 }} />{pedirIA ? <button type="button" className="chip" disabled={esperando || !lectura.filas.length} onClick={() => void leerConIA()}>{esperando ? 'Pensando…' : 'Pedir lectura con IA'}</button> : null}<button type="button" className="cta" disabled={!lectura.filas.length} onClick={() => void copiar()}>Copiar lectura</button></>}>
        {lectura.filas.length ? <div className="af"><span>{lectura.previa ? `Comparado con el ${fechaCorta(lectura.previa)}` : `Análisis del ${fechaCorta(lectura.ultima!)}`}</span>
          <FxKv filas={lectura.filas.map(f => [f.nombre, `${f.valor} ${f.unidad} · ${f.cambio}${f.estado ? ` · ${f.estado.texto.toLowerCase()}` : ''}`] as const)} /></div> : null}
        <label className="af"><span>Lectura</span><textarea className="ai" rows={7} value={texto} onChange={e => { setTexto(e.target.value); setAviso(''); }} /></label>
        <small className="nthint">{conIA ? 'Borrador preparado con IA a partir de los valores revisados, sin nombre ni datos de contacto. Revisalo y editalo antes de usarlo.' : 'Es una lectura automática de tus valores revisados, sin IA externa. Podés editar el texto antes de copiarlo.'}</small>
        {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
  </CajonMarco>;
}
