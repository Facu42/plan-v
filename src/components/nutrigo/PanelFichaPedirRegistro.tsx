// «Pedir registro» de la Ficha: el cajón del boceto (`#actw`), que le manda a la paciente el mismo pedido que Seguimiento, por la app.
import { useState } from 'react';
import { api } from '../../api/client';
import type { Patient } from '../../types';
import { usePanelBoceto } from './panel-v29-boceto';
import { CajonMarco } from './CajonV29';
import { COMIDAS_PEDIDO, textoPedido } from './seguimiento-presentacion';

export function PanelFichaPedirRegistro({ patient, onClose, onSent }: { patient: Patient; onClose: () => void; onSent: (aviso: string) => void }) {
  const [dias, setDias] = useState<7 | 14>(7);
  const [comidas, setComidas] = useState<string[]>([...COMIDAS_PEDIDO]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { clase, cerrar } = usePanelBoceto(onClose);
  const primerNombre = patient.name.split(' ')[0] ?? patient.name;
  const enviar = async () => {
    if (!comidas.length) { setError('Elegí al menos una comida.'); return; }
    setEnviando(true);
    setError('');
    try {
      await api.sendMessage(patient.id, textoPedido(patient.name, dias, comidas), 'vero', false, crypto.randomUUID());
      onSent(`Pedido anotado para ${primerNombre}. Le llega por la app.`);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo enviar el pedido.');
      setEnviando(false);
    }
  };
  return <CajonMarco clase={clase} titulo={<>Pedir registro a {primerNombre}</>} sub="Le llega por la app. No se usa otro canal." onSolicitarCerrar={cerrar} pie={<><button type="button" className="chip" onClick={cerrar}>Cancelar</button><span style={{ flex: 1 }} /><button type="button" className="cta" disabled={enviando} onClick={() => void enviar()}>{enviando ? 'Enviando…' : 'Pedir registro'}</button></>}>
        <label className="af"><span>Días</span><select className="ai" value={String(dias)} onChange={event => setDias(event.target.value === '14' ? 14 : 7)}><option value="7">7 días</option><option value="14">14 días</option></select></label>
        <div className="af"><span>Qué cargar</span><div className="ach">{COMIDAS_PEDIDO.map(comida => <button type="button" key={comida} aria-pressed={comidas.includes(comida)} onClick={() => { setError(''); setComidas(actual => actual.includes(comida) ? actual.filter(item => item !== comida) : [...actual, comida]); }}>{comida}</button>)}</div></div>
        {patient.has_account === false ? <p className="sxsub">El mensaje queda en el chat hasta que {primerNombre} vincule la app.</p> : null}
        {error ? <p className="sxsub" role="alert">{error}</p> : null}
  </CajonMarco>;
}
