// Mensajes del panel (`#s-mensajes` de design/panel-nutri/v29/panel-trabajo.html), solapa «Bandeja»:
// mismas clases y orden (`.mlist`, `.mchatp`, `.mside`), con las conversaciones reales de cada paciente.
// Sin backend todavía: grabar audio, respuestas guardadas y avisos automáticos (ver docs/traspaso-estado-proyecto.md).
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api/client';
import { assertChatFile, uploadChatAttachment } from '../../api/assets';
import { useAppStore } from '../../store/useAppStore';
import { ChatAttachmentView } from './ChatAttachment';
import { MESSAGES_READ_EVENT, mergeUnread } from './cartera-unread';
import { FxKv, FxPanel } from './ficha-fx';
import { dayDividerLabel, messageTime, sameDay } from './message-panel';
import { messageReceipt, messageReceiptLabel, unreadCount } from './message-receipts';
import { sendShowroomMessage } from './message-send';
import { alternar, conversacionesDe, enviadosDe, guardarMarcas, horaDeLista, leerMarcas, textoVacio, vistaPrevia, type FiltroBandeja } from './mensajes-presentacion';
import { sugerenciaDe } from './PanelFichaChat';
import { PanelV29Icon } from './PanelV29Icon';
import { avisoEnElPanel } from './panel-v29-boceto';
import type { ShowroomPatient } from './showroom-model';

const ACTIVE_REFRESH_MS = 15000;
const FILTROS: Array<[FiltroBandeja, string]> = [['all', 'Todas'], ['un', 'Sin leer'], ['star', 'Destacadas'], ['arch', 'Archivadas']];

type Props = {
  vista: number;
  pacientes: ShowroomPatient[];
  seleccionada: string;
  sinLeerRemoto: ReadonlyMap<string, number> | null;
  sinLeerInicial?: boolean;
  /** Sube cada vez que tocan «Nuevo mensaje» en el encabezado. */
  pedidoNuevo: number;
  onSelect: (id: string) => void;
  onFicha: () => void;
  onAgenda: () => void;
  onPlan: () => void;
};

/** `mAv` del boceto: cada persona tiene su color (`var(--c-t)` y `var(--c-ink)`); acá sale del id para que no cambie entre pantallas. */
const TONOS_BOCETO = ['azul', 'lima', 'azaf'] as const;
const tonoDe = (id: string) => TONOS_BOCETO[[...id].reduce((suma, letra) => suma + letra.charCodeAt(0), 0) % TONOS_BOCETO.length];
const Avatar = ({ paciente, tamano }: { paciente: ShowroomPatient; tamano: number }) => {
  const c = tonoDe(paciente.id);
  return (
  <span className="av" style={{ background: `var(--${c}-t)`, color: `var(--${c}-ink)`, width: tamano, height: tamano, fontSize: tamano > 40 ? 14 : tamano > 30 ? 11.5 : 10.5 }}>{paciente.initials}</span>
  );
};

export function PanelMensajes({ vista, pacientes, seleccionada, sinLeerRemoto, sinLeerInicial = false, pedidoNuevo, onSelect, onFicha, onAgenda, onPlan }: Props) {
  const [filtro, setFiltro] = useState<FiltroBandeja>(sinLeerInicial ? 'un' : 'all');
  const [consulta, setConsulta] = useState('');
  const [marcas, setMarcas] = useState(leerMarcas);
  const busqueda = useRef<HTMLInputElement>(null);
  const sinLeer = (paciente: ShowroomPatient) => mergeUnread(unreadCount(enviadosDe(paciente), 'pro'), sinLeerRemoto, paciente.id);
  const lista = useMemo(() => conversacionesDe(pacientes, filtro, consulta, marcas, sinLeer), [pacientes, filtro, consulta, marcas, sinLeerRemoto]); // eslint-disable-line react-hooks/exhaustive-deps
  const actual = pacientes.find(p => p.id === seleccionada) ?? lista[0] ?? pacientes[0] ?? null;
  const totalSinLeer = pacientes.filter(p => !marcas.archivadas.has(p.id) && sinLeer(p) > 0).length;

  useEffect(() => {
    if (!pedidoNuevo) return;
    setConsulta(''); setFiltro('all');
    busqueda.current?.focus();
  }, [pedidoNuevo]);

  const marcar = (clave: 'destacadas' | 'archivadas', id: string) => {
    const siguiente = { ...marcas, [clave]: alternar(marcas[clave], id) };
    setMarcas(siguiente); guardarMarcas(siguiente);
    return siguiente[clave].has(id);
  };

  if (vista !== 0) return <div id="s-mensajes" className="sxw"><div id="mwrap" className={`mv${vista}`}><div className="fx mfx">
    <FxPanel titulo={vista === 1 ? 'Respuestas guardadas' : 'Avisos automáticos'} grande>
      <p className="mempty">{vista === 1 ? 'Todavía no se pueden guardar respuestas. Cuando se pueda, las vas a elegir desde cualquier chat.' : 'Los avisos automáticos se prenden y editan en Ajustes.'}</p>
    </FxPanel></div></div></div>;
  return <div id="s-mensajes" className="sxw">
    <div id="mwrap" className="mv0"><div className="fx mfx">
      <section className="fxp mlist">
        <div className="msearch"><PanelV29Icon name="search" size={14} />
          <input ref={busqueda} id="mq" type="search" placeholder="Buscar conversación" value={consulta} aria-label="Buscar conversación" onChange={e => setConsulta(e.target.value)} /></div>
        <div className="tabs" id="mfil">{FILTROS.map(([id, texto]) => (
          <button type="button" key={id} className={filtro === id ? 'on' : undefined} onClick={() => setFiltro(id)}>{texto}{id === 'un' ? <> <span className="num">{totalSinLeer}</span></> : null}</button>
        ))}</div>
        <div className="fxs mcvs" id="mlist">
          {lista.length ? lista.map(p => {
            const nuevos = sinLeer(p);
            if (filtro === 'arch') return <div key={p.id} className="mcv arch"><Avatar paciente={p} tamano={34} />
              <span className="mt"><span className="mr"><b>{p.name}</b></span><span className="mr"><small>{vistaPrevia(p)}</small></span></span>
              <button type="button" className="sbtn" onClick={() => { marcar('archivadas', p.id); avisoEnElPanel(`Restauraste la conversación con ${p.name.split(' ')[0]}.`); }}>Restaurar</button></div>;
            return <button type="button" key={p.id} className={`mcv${p.id === actual?.id ? ' on' : ''}${nuevos ? ' un' : ''}`} onClick={() => onSelect(p.id)}>
              <Avatar paciente={p} tamano={34} />
              <span className="mt">
                <span className="mr"><b>{p.name}</b>{marcas.destacadas.has(p.id) ? <i className="mstar" aria-label="Destacada" /> : null}<time>{horaDeLista(p)}</time></span>
                <span className="mr"><small>{vistaPrevia(p)}</small>{nuevos ? <em className="num">{nuevos}</em> : null}</span>
              </span>
            </button>;
          }) : <p className="mempty">{textoVacio(filtro, consulta)}</p>}
        </div>
      </section>
      {actual ? <>
        <Conversacion key={actual.id} paciente={actual} destacada={marcas.destacadas.has(actual.id)}
          onDestacar={() => avisoEnElPanel(marcar('destacadas', actual.id) ? `Destacaste la conversación con ${actual.name.split(' ')[0]}.` : 'Ya no está destacada.')}
          onArchivar={() => { marcar('archivadas', actual.id); avisoEnElPanel(`Archivaste la conversación con ${actual.name.split(' ')[0]}.`); }}
          onFicha={onFicha} />
        <div className="c mside"><Contexto paciente={actual} onAgenda={onAgenda} onPlan={onPlan} /></div>
      </> : <>
        <section className="fxp mchatp"><p className="mempty">Todavía no hay pacientes para escribirles.</p></section>
        <div className="c mside" />
      </>}
    </div></div>
  </div>;
}

function Conversacion({ paciente, destacada, onDestacar, onArchivar, onFicha }: {
  paciente: ShowroomPatient; destacada: boolean; onDestacar: () => void; onArchivar: () => void; onFicha: () => void;
}) {
  const refresh = useAppStore(s => s.refreshPatient);
  const crudo = useAppStore(s => s.patients.find(p => p.id === paciente.id));
  const [texto, setTexto] = useState('');
  const [ocupada, setOcupada] = useState(false);
  const [error, setError] = useState('');
  const [pidiendo, setPidiendo] = useState(false);
  const enCurso = useRef(false);
  const clientId = useRef(crypto.randomUUID());
  const hilo = useRef<HTMLDivElement>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const mensajes = enviadosDe(paciente);
  const sugerida = crudo ? sugerenciaDe(crudo) : null;
  const nuevos = unreadCount(mensajes, 'pro');
  const primerNombre = paciente.name.split(' ')[0];

  useEffect(() => { if (hilo.current) hilo.current.scrollTop = hilo.current.scrollHeight; }, [mensajes.length]);
  useEffect(() => {
    if (!nuevos) return;
    void api.markMessagesRead(paciente.id, 'vero').then(() => { window.dispatchEvent(new Event(MESSAGES_READ_EVENT)); return refresh(paciente.id); }).catch(() => undefined);
  }, [paciente.id, refresh, nuevos]);
  useEffect(() => {
    // La conversación abierta trae mensajes nuevos sin recargar la página.
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(paciente.id).catch(() => undefined); }, ACTIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [paciente.id, refresh]);

  const enviar = async (evento?: FormEvent, adjunto?: File) => {
    evento?.preventDefault();
    if (enCurso.current || (!texto.trim() && !adjunto)) return;
    enCurso.current = true; setOcupada(true); setError('');
    try {
      const subido = adjunto ? await uploadChatAttachment(paciente.id, adjunto, true) : null;
      await sendShowroomMessage({
        patientId: paciente.id, text: texto, role: 'pro', client_id: clientId.current, suggestedByAi: Boolean(sugerida) && texto.trim() === sugerida,
        asset_id: subido?.asset_id, filename: subido?.filename,
      }, { send: api.sendMessage, refresh });
      clientId.current = crypto.randomUUID();
      setTexto('');
    } catch { setError('No pudimos enviar el mensaje. Se conserva lo que escribiste para reintentar.'); }
    finally { enCurso.current = false; setOcupada(false); if (archivo.current) archivo.current.value = ''; }
  };
  const pedirSugerencia = async () => {
    if (pidiendo) return;
    setPidiendo(true); setError('');
    try { await api.generateBrief(paciente.id); await refresh(paciente.id); }
    catch { setError('No pudimos preparar una respuesta sugerida. Puede faltar el permiso de la paciente para el seguimiento con IA.'); }
    finally { setPidiendo(false); }
  };
  const elegirArchivo = (siguiente: File | null) => {
    if (!siguiente) return;
    try { assertChatFile(siguiente); } catch (caught) { setError(caught instanceof Error ? caught.message : 'El archivo no se puede adjuntar.'); if (archivo.current) archivo.current.value = ''; return; }
    void enviar(undefined, siguiente);
  };
  const ultimoVisto = [...mensajes].reverse().find(m => m.from !== 'vero');

  return <section className="fxp mchatp" aria-label={`Conversación con ${paciente.name}`}>
    <header className="mh"><Avatar paciente={paciente} tamano={36} />
      <span className="mt"><b>{paciente.name}</b><small>{ultimoVisto ? `Último mensaje ${messageTime(ultimoVisto.sent_at)}` : 'Sin mensajes de la paciente'}</small></span>
      <span className="sp" />
      <button type="button" className="sbtn" onClick={onDestacar}>{destacada ? 'Destacada' : 'Destacar'}</button>
      <button type="button" className="sbtn" onClick={onArchivar}>Archivar</button>
      <button type="button" className="sbtn k" onClick={onFicha}>Ver ficha</button></header>
    <div className="chat" id="mchat" ref={hilo} role="log" aria-live="polite" aria-label="Mensajes enviados">
      {!mensajes.length ? <span className="day">Todavía no hay mensajes</span> : null}
      {mensajes.map((m, k) => {
        const propio = m.from === 'vero';
        return <div key={m.id} style={{ display: 'contents' }}>
          {k === 0 || !sameDay(mensajes[k - 1].sent_at, m.sent_at) ? <span className="day">{dayDividerLabel(m.sent_at)}</span> : null}
          <div className={`bub ${propio ? 'out' : 'in'}`}>
            {m.attachment ? <ChatAttachmentView patientId={paciente.id} messageId={m.id} attachment={m.attachment} /> : null}
            {m.text}
            <small>{messageTime(m.sent_at)}{propio ? ` · ${messageReceiptLabel(messageReceipt(m)).toLowerCase()}` : ''}</small>
          </div>
        </div>;
      })}
    </div>
    <div className="msug" id="msug">
      <span>{sugerida ? <><b>Respuesta sugerida</b> «{sugerida}»</> : 'Sin respuesta sugerida por ahora.'}</span>
      {sugerida
        ? <><button type="button" className="sbtn" disabled={ocupada || pidiendo} onClick={() => void pedirSugerencia()}>{pidiendo ? 'Preparando…' : 'Otra'}</button><button type="button" className="sbtn k" disabled={ocupada} onClick={() => setTexto(sugerida)}>Usar</button></>
        : <button type="button" className="sbtn k" disabled={pidiendo} onClick={() => void pedirSugerencia()}>{pidiendo ? 'Preparando…' : 'Pedir una'}</button>}
    </div>
    {error ? <p role="alert" className="mnote">{error}</p> : null}
    <form className="mcomp" onSubmit={enviar}>
      <input ref={archivo} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" aria-label="Adjuntar archivo" disabled={ocupada} onChange={e => elegirArchivo(e.target.files?.[0] ?? null)} />
      <button type="button" className="ibtn" aria-label="Adjuntar archivo" disabled={ocupada} onClick={() => archivo.current?.click()}><PanelV29Icon name="pclip" size={15} /></button>
      <span className="mbox"><textarea id="mtxt" rows={1} maxLength={2000} value={texto} disabled={ocupada} placeholder={`Escribile a ${primerNombre}…`} aria-label={`Mensaje para ${paciente.name}`}
        onChange={e => setTexto(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void enviar(); } }} /></span>
      <button type="submit" className="ibtn go" aria-label="Enviar" disabled={ocupada || !texto.trim()}><PanelV29Icon name="send" size={15} /></button>
    </form>
    <p className="mnote">Le llega a su app. Si no la abre en 2 h, le avisa por mail.</p>
  </section>;
}

function Contexto({ paciente, onAgenda, onPlan }: { paciente: ShowroomPatient; onAgenda: () => void; onPlan: () => void }) {
  const cita = paciente.appointment;
  const modalidad = cita ? (cita.channel === 'video' ? 'Videollamada' : cita.channel === 'presencial' ? 'Consultorio' : cita.channel) : 'Por coordinar';
  return <>
  <section className="fxp mctx">
    <div className="mwho"><Avatar paciente={paciente} tamano={48} /><b>{paciente.name}</b><small>{paciente.goal || 'Objetivo sin definir'}</small></div>
    <div className="mnum">
      <div><small>Adherencia</small><b className="num">{Math.round(paciente.adherence)}%</b></div>
      <div><small>Hidratación</small><b className="num">{paciente.hydration}/{paciente.waterGoal}</b></div>
    </div>
    <FxKv filas={[
      ['Próxima consulta', cita ? `${cita.when} · ${cita.duration} min` : 'Por coordinar'],
      ['Modalidad', modalidad],
    ]} />
    <div className="macts"><button type="button" className="sbtn" onClick={onAgenda}>Nuevo turno</button><button type="button" className="sbtn" onClick={onPlan}>Ver plan</button></div>
  </section>
  <FxPanel titulo="Respuestas guardadas" grande><p className="mempty">Todavía no hay respuestas guardadas.</p></FxPanel>
  </>;
}
