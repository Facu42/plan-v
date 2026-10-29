// Cajón «Mensaje a varias» de Mensajes (v29): mismas piezas del boceto (`#actw`, `.ach`, `.ai`). Le llega a cada paciente por separado, como un chat.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Patient } from '../../types';
import { api, isAbortError } from '../../api/client';
import { crmWorkApi, type TagGroup } from '../../api/crm-work';
import type { BillingBoard } from '../../types/fees';
import { useAppStore } from '../../store/useAppStore';
import { PanelV29Icon } from './PanelV29Icon';
import { avisoEnElPanel, usePanelBoceto } from './panel-v29-boceto';
import { MAX_MENSAJE, armarAudiencias, destinatarias, enviarAVarias, manianaALas9, programarAVarias } from './mensaje-varias';

const TEXTO_INICIAL = '¡Hola {nombre}! ';
const CUANDO = [['ahora', 'Ahora'], ['maniana', 'Mañana a las 9']] as const;
type Cuando = typeof CUANDO[number][0];

export function PanelMensajeVarias({ pacientes, ahora, onClose }: { pacientes: readonly Patient[]; ahora: Date; onClose: () => void }) {
  const [grupos, setGrupos] = useState<TagGroup[]>([]);
  const [board, setBoard] = useState<BillingBoard | null>(null);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [texto, setTexto] = useState(TEXTO_INICIAL);
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cuando, setCuando] = useState<Cuando>('ahora');
  const { clase, cerrar } = usePanelBoceto(onClose);
  useEffect(() => {
    const controller = new AbortController();
    crmWorkApi.tagGroups(controller.signal).then(r => setGrupos(r.groups)).catch(() => undefined);
    api.getBillingBoard().then(r => { if (!controller.signal.aborted) setBoard(r.board); }).catch(error => { if (!isAbortError(error)) setBoard(null); });
    return () => controller.abort();
  }, []);
  const opciones = armarAudiencias(pacientes, grupos, board, ahora);
  const ids = destinatarias(opciones, elegidas);
  const alternar = (id: string) => { setAviso(''); setElegidas(lista => lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id]); };
  const enviar = async () => {
    const cuerpo = texto.trim();
    if (!ids.length) { setAviso('No elegiste a quién mandarlo.'); return; }
    if (!cuerpo) { setAviso('Escribí el mensaje.'); return; }
    if (cuerpo.length > MAX_MENSAJE) { setAviso(`El mensaje puede tener hasta ${MAX_MENSAJE} letras.`); return; }
    setEnviando(true); setAviso('');
    const quienes = pacientes.filter(p => ids.includes(p.id));
    if (cuando === 'maniana') {
      try {
        await programarAVarias(quienes, cuerpo, manianaALas9(new Date()), api.scheduleMessages);
        avisoEnElPanel(`Mensaje programado a ${quienes.length} ${quienes.length === 1 ? 'paciente' : 'pacientes'}.`); cerrar();
      } catch (error) {
        setAviso(error instanceof Error && error.message ? error.message : 'No pudimos programar el mensaje. Probá de nuevo.');
      } finally { setEnviando(false); }
      return;
    }
    const r = await enviarAVarias(quienes, cuerpo, api.sendMessage);
    setEnviando(false);
    if (r.enviados) void useAppStore.getState().refreshDirectory().catch(() => undefined);
    if (!r.fallaron.length) { avisoEnElPanel(`Mensaje enviado a ${r.enviados} ${r.enviados === 1 ? 'paciente' : 'pacientes'}.`); cerrar(); return; }
    setElegidas([]);
    setAviso(`Salió a ${r.enviados}. No pudimos mandárselo a: ${r.fallaron.join(', ')}. Elegí a esas y probá de nuevo.`);
  };
  const nodo = <div id="actw" className={clase || undefined}>
    <div className="ascrim" onClick={cerrar} />
    <aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt">
      <header><div><h2 id="actt">Mensaje a varias</h2><p id="acts">Le llega a cada una por separado, como un chat</p></div><button type="button" className="ibtn" aria-label="Cerrar" onClick={cerrar}><PanelV29Icon name="x" size={13} /></button></header>
      <div className="abody" id="actb">
        <div className="af"><span>Para</span><div className="ach">{opciones.map(o => <button type="button" key={o.id} aria-pressed={elegidas.includes(o.id)} onClick={() => alternar(o.id)}>{o.texto} · {o.ids.length}</button>)}</div></div>
        <label className="af"><span>Mensaje</span><textarea className="ai" rows={4} maxLength={MAX_MENSAJE} value={texto} onChange={e => { setTexto(e.target.value); setAviso(''); }} /><small>Escribí {'{nombre}'} y se completa con el nombre de cada paciente.</small></label>
        <label className="af"><span>Cuándo</span><div className="aseg" role="radiogroup">{CUANDO.map(([v, t]) => <button type="button" key={v} role="radio" aria-label={t} aria-checked={cuando === v} onClick={() => { setCuando(v); setAviso(''); }}>{t}</button>)}</div></label>
        {ids.length ? <p className="sxsub">Le llega a {ids.length} {ids.length === 1 ? 'paciente' : 'pacientes'}.</p> : null}
        {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
      </div>
      <footer id="actf"><button type="button" className="chip" onClick={cerrar}>Cancelar</button><span style={{ flex: 1 }} /><button type="button" className="cta" disabled={enviando} onClick={() => void enviar()}>{enviando ? 'Enviando…' : 'Enviar'}</button></footer>
    </aside>
  </div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}
