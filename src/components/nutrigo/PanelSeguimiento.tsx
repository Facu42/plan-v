import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { crmWorkApi } from '../../api/crm-work';
import type { MealLog, Patient } from '../../types';
import type { CrmFeedItem } from '../../types/crm-feed';
import type { CrmWorkItem } from '../../types/crm-work';
import { PanelV29Icon } from './PanelV29Icon';
import {
  armarComida, COMIDAS_PEDIDO, comidaId, diasDe, fondoAvatar, sentimientoDe, textoPedido,
  type ComidaFila, type DiasFila, type SentimientoFila,
} from './seguimiento-presentacion';

type Tab = 'pend' | 'ok';
type Dialogo =
  | null
  | { kind: 'comentar'; meal: ComidaFila }
  | { kind: 'ver'; meal: ComidaFila }
  | { kind: 'sentir'; row: SentimientoFila }
  | { kind: 'pedir' };

const REFRESH = 'plan-v:seguimiento-refresh';

function Avatar({ name, initials, tone }: { name: string; initials: string; tone: Patient['tone'] | undefined }) {
  return <span className="av" style={{ background: fondoAvatar(tone) }}>{initials}</span>;
}

function Foto({ url }: { url: string | null }) {
  return <span className="sxpic" title="Foto del plato">{url ? <img src={url} alt="" /> : <PanelV29Icon name="img" size={14} />}</span>;
}

function Barras({ on }: { on: number | null }) {
  return <span className="sxdays" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map(dia => <i key={dia} className={on != null && dia < on ? 'on' : undefined} />)}</span>;
}

function Tarjeta({ titulo, meta, children }: { titulo: string; meta: string; children: ReactNode }) {
  return <section className="fxp g"><header><h3>{titulo}</h3><span className="m">{meta}</span><span className="sp" /></header>{children}</section>;
}

export function PanelSeguimientoVista({
  tab, comidas, sentimientos, dias, pendientes, estado, mas, dialog, toast, pedir,
  onConfirm, onComment, onVer, onSentir, onClose, onGuardarComentario, onPedir, onAbrir,
}: {
  tab: Tab;
  comidas: ComidaFila[];
  sentimientos: SentimientoFila[];
  dias: DiasFila[];
  pendientes: number;
  estado: 'loading' | 'ready' | 'error';
  mas: boolean;
  dialog: Dialogo;
  toast: string;
  pedir: { pacientes: Patient[]; aviso: boolean; dias: 7 | 14; comidas: string[]; pacienteId: string };
  onConfirm: (meal: ComidaFila) => void;
  onComment: (meal: ComidaFila) => void;
  onVer: (meal: ComidaFila) => void;
  onSentir: (row: SentimientoFila) => void;
  onClose: () => void;
  onGuardarComentario: (texto: string) => void;
  onPedir: (pacienteId: string, dias: 7 | 14, comidas: string[], aviso: boolean) => void;
  onAbrir: (href: string) => void;
}) {
  const cargaron = dias.filter(fila => (fila.on ?? 0) > 0).length;
  const filas = estado === 'loading'
    ? <p className="sxsub">Cargando comidas…</p>
    : estado === 'error'
      ? <p className="sxsub">No se pudieron cargar las comidas.</p>
      : comidas.length
        ? comidas.map(comida => <div className="l" key={`${tab}:${comida.patientId}:${comida.id}`}>
          <span className="sxmeal">
            <Avatar name={comida.name} initials={comida.initials} tone={comida.tone} />
            <Foto url={comida.photoUrl} />
            <span className="sxwho"><b>{comida.title}</b><small>{comida.meta}</small></span>
          </span>
          <span className="sxacts">{tab === 'pend'
            ? <><button type="button" className="chip" onClick={() => onConfirm(comida)}>Confirmar</button><button type="button" className="chip" onClick={() => onComment(comida)}>Comentar</button></>
            : <button type="button" className="chip" onClick={() => onVer(comida)}>Ver</button>}</span>
        </div>)
        : <p className="sxsub">No hay comidas en esta lista.</p>;
  return <div id="s-seguimiento" className="sxw">
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '1.22fr .9fr' }}>
      <div className="c">
        <Tarjeta titulo={tab === 'pend' ? 'Comidas con foto' : 'Ya revisadas'} meta={`${pendientes} por revisar · la foto sale de la app`}>
          <div className="fxs"><div className="fxr">{filas}</div>{mas && tab === 'pend' ? <p className="sxsub">Hay más por revisar. Seguí en la ficha.</p> : null}</div>
        </Tarjeta>
      </div>
      <div className="c">
        <Tarjeta titulo="Cómo se sienten" meta="agua, sueño y síntomas de la semana">
          <div className="fxs">
            <div className="fxr">{sentimientos.length ? sentimientos.map(fila => <div className="l" key={fila.id}>
              <Avatar name={fila.name} initials={fila.initials} tone={fila.tone} />
              <span className="sxwho"><b>{fila.name}</b><small>{fila.line}</small></span>
              <span className={`pill ${fila.pill}`}>{fila.animo}</span>
              <button type="button" className="chip" onClick={() => onSentir(fila)}>Ver</button>
            </div>) : <p className="sxsub">No hay pacientes activas en la cartera.</p>}</div>
            <p className="sxsub">Si no hay dato, no es una falta. El sueño y los síntomas que faltan acá están en la ficha.</p>
          </div>
        </Tarjeta>
        <Tarjeta titulo="Días registrados" meta={`${cargaron} de ${dias.length} cargaron esta semana`}>
          <div className="fxs">
            <div className="fxr">{dias.length ? dias.map(fila => <div className="l" key={fila.id}>
              <Avatar name={fila.name} initials={fila.initials} tone={fila.tone} />
              <span className="sxwho"><b>{fila.name}</b><small>{fila.text}</small></span>
              <Barras on={fila.on} />
            </div>) : <p className="sxsub">No hay pacientes activas en la cartera.</p>}</div>
            <p className="sxsub">Quien no cargó no queda marcada en falta.</p>
          </div>
        </Tarjeta>
      </div>
    </div>
    {dialog ? <PanelLateral dialog={dialog} pedir={pedir} onClose={onClose} onGuardarComentario={onGuardarComentario} onPedir={onPedir} onAbrir={onAbrir} /> : null}
    {toast ? <Aviso texto={toast} /> : null}
  </div>;
}

function Aviso({ texto }: { texto: string }) {
  const nodo = <div id="atoast" className="on" role="status">{texto}</div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}

function PanelLateral({ dialog, pedir, onClose, onGuardarComentario, onPedir, onAbrir }: {
  dialog: Exclude<Dialogo, null>;
  pedir: { pacientes: Patient[]; aviso: boolean; dias: 7 | 14; comidas: string[]; pacienteId: string };
  onClose: () => void;
  onGuardarComentario: (texto: string) => void;
  onPedir: (pacienteId: string, dias: 7 | 14, comidas: string[], aviso: boolean) => void;
  onAbrir: (href: string) => void;
}) {
  const [comentario, setComentario] = useState('');
  const [pacienteId, setPacienteId] = useState(pedir.pacienteId);
  const [dias, setDias] = useState<7 | 14>(pedir.dias);
  const [comidas, setComidas] = useState<string[]>(pedir.comidas);
  const [aviso, setAviso] = useState(pedir.aviso);
  const [falta, setFalta] = useState('');
  const paciente = pedir.pacientes.find(persona => persona.id === pacienteId);
  const titulo = dialog.kind === 'comentar' ? 'Comentar la comida'
    : dialog.kind === 'ver' ? `${dialog.meal.name} · ${dialog.meal.slot}`
      : dialog.kind === 'sentir' ? `Cómo se siente ${dialog.row.name}`
        : 'Pedir registro';
  const subtitulo = dialog.kind === 'comentar' ? `${dialog.meal.name} · ${dialog.meal.slot}`
    : dialog.kind === 'ver' ? dialog.meal.when
      : dialog.kind === 'sentir' ? 'Hábitos y síntomas de esta semana'
        : 'Le llega por la app. No se usa otro canal.';
  const guardar = dialog.kind === 'comentar'
    ? () => { if (!comentario.trim()) { setFalta('Escribí el comentario.'); return; } onGuardarComentario(comentario.trim()); }
    : dialog.kind === 'pedir'
      ? () => { if (!aviso) { setFalta('El aviso va solo por la app.'); return; } if (!pacienteId) { setFalta('Elegí una paciente.'); return; } onPedir(pacienteId, dias, comidas, aviso); }
      : null;
  const nodo = <div id="actw" className="on">
    <div className="ascrim" onClick={onClose} />
    <aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt">
      <header><div><h2 id="actt">{titulo}</h2><p id="acts">{subtitulo}</p></div><button type="button" className="ibtn" aria-label="Cerrar" onClick={onClose}><PanelV29Icon name="x" size={13} /></button></header>
      <div className="abody" id="actb">
        {dialog.kind === 'comentar' && <label className="af"><span>Comentario</span><textarea className="ai" rows={4} placeholder="Ej.: la porción de pizza fue el doble" value={comentario} onChange={event => { setComentario(event.target.value); setFalta(''); }} /></label>}
        {dialog.kind === 'ver' && <><p>{dialog.meal.title}</p><p>{dialog.meal.meta}</p><button type="button" className="chip" onClick={() => onAbrir(dialog.meal.href)}>Abrir ficha</button></>}
        {dialog.kind === 'sentir' && <><p>{dialog.row.detail}</p><p className="sxsub">{dialog.row.line.includes('Sin dato') || dialog.row.animo === 'Sin registros' ? 'Sin registros no es un incumplimiento.' : 'Sale de lo que ella cargó en la app.'}</p><button type="button" className="chip" onClick={() => onAbrir(dialog.row.href)}>Abrir ficha</button></>}
        {dialog.kind === 'pedir' && <>
          <label className="af"><span>Paciente</span><select className="ai" value={pacienteId} onChange={event => setPacienteId(event.target.value)}>{pedir.pacientes.map(persona => <option key={persona.id} value={persona.id}>{persona.name}</option>)}</select></label>
          <label className="af"><span>Días</span><select className="ai" value={String(dias)} onChange={event => setDias(event.target.value === '14' ? 14 : 7)}><option value="7">7 días</option><option value="14">14 días</option></select></label>
          <div className="af"><span>Qué cargar</span><div className="ach">{COMIDAS_PEDIDO.map(comida => <button type="button" key={comida} aria-pressed={comidas.includes(comida)} onClick={() => setComidas(actual => actual.includes(comida) ? actual.filter(item => item !== comida) : [...actual, comida])}>{comida}</button>)}</div></div>
          <div className="ack"><label><input type="checkbox" checked={aviso} onChange={event => { setAviso(event.target.checked); setFalta(''); }} /><span>Avisarle por la app</span></label></div>
          {paciente?.has_account === false && <p className="sxsub">El mensaje queda en el chat hasta que vincule la app.</p>}
        </>}
        {falta ? <p className="sxsub">{falta}</p> : null}
      </div>
      <footer id="actf">{guardar
        ? <><button type="button" className="chip" onClick={onClose}>Cancelar</button><span style={{ flex: 1 }} /><button type="button" className="cta" onClick={guardar}>{dialog.kind === 'comentar' ? 'Guardar comentario' : 'Pedir registro'}</button></>
        : <button type="button" className="chip" onClick={onClose}>Cerrar</button>}</footer>
    </aside>
  </div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}

function logDe(mapa: Map<string, MealLog>, patientId: string, itemId: string) {
  return mapa.get(`${patientId}:${comidaId(itemId)}`) ?? null;
}

async function completarLogs(pares: { patientId: string; itemId: string }[], mapa: Map<string, MealLog>, signal: AbortSignal) {
  const faltan = [...new Set(pares.filter(par => !mapa.has(`${par.patientId}:${comidaId(par.itemId)}`)).map(par => par.patientId))].slice(0, 16);
  await Promise.all(faltan.map(async id => {
    try {
      const [pendientes, revisadas] = await Promise.all([
        crmWorkApi.patientMeals(id, { status: 'pending_review', limit: 30 }, signal),
        crmWorkApi.patientMeals(id, { status: 'reviewed', days: 7, limit: 30 }, signal),
      ]);
      for (const log of [...pendientes.logs, ...revisadas.logs]) mapa.set(`${id}:${log.id}`, log);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }));
}

export function PanelSeguimiento({ patients, onOpen, onReview, onHeader }: {
  patients: Patient[];
  onOpen: (href: string) => void;
  onReview: (log: MealLog) => void;
  onHeader: (actions: ReactNode) => void;
}) {
  const [tab, setTab] = useState<Tab>('pend');
  const [pendientes, setPendientes] = useState<ComidaFila[]>([]);
  const [revisadas, setRevisadas] = useState<ComidaFila[]>([]);
  const [pendienteTotal, setPendienteTotal] = useState(0);
  const [mas, setMas] = useState(false);
  const [estado, setEstado] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dialog, setDialog] = useState<Dialogo>(null);
  const [toast, setToast] = useState('');
  const [marca, setMarca] = useState(0);
  const ordenadas = [...patients].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const sentimientos = ordenadas.map(sentimientoDe);
  const dias = ordenadas.map(diasDe);
  const avisar = useCallback((texto: string) => {
    setToast(texto);
    window.setTimeout(() => setToast(actual => actual === texto ? '' : actual), 3600);
  }, []);

  useEffect(() => () => onHeader(null), [onHeader]);
  useEffect(() => {
    onHeader(<>
      <div className="tabs">
        <button type="button" className={tab === 'pend' ? 'on' : undefined} onClick={() => setTab('pend')}>Por revisar</button>
        <button type="button" className={tab === 'ok' ? 'on' : undefined} onClick={() => setTab('ok')}>Revisadas</button>
      </div>
      <button className="cta" type="button" onClick={() => setDialog({ kind: 'pedir' })}>Pedir registro</button>
    </>);
  }, [onHeader, tab]);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const [cola, feed] = await Promise.all([
          crmWorkApi.list({ kind: 'meal', limit: 30 }, ac.signal),
          crmWorkApi.feed({ days: 7, status: 'reviewed' }, ac.signal),
        ]);
        const mapa = new Map<string, MealLog>();
        for (const persona of patients) for (const log of persona.meal_logs ?? []) mapa.set(`${persona.id}:${log.id}`, log);
        const comidasCola = cola.items.filter(item => item.kind === 'meal');
        const comidasFeed = feed.items.filter((item): item is Extract<CrmFeedItem, { kind: 'meal' }> => item.kind === 'meal' && item.status !== 'pending_review');
        await completarLogs([...comidasCola, ...comidasFeed].map(item => ({ patientId: item.patient_id, itemId: item.id })), mapa, ac.signal);
        const personaDe = (id: string) => patients.find(persona => persona.id === id) ?? null;
        const filaDe = (item: CrmWorkItem | Extract<CrmFeedItem, { kind: 'meal' }>, slot: string, titulo: string) => armarComida({
          id: comidaId(item.id), patientId: item.patient_id, patientName: item.patient_name, slot, at: 'updated_at' in item ? item.updated_at : item.at,
          href: item.href, title: titulo, log: logDe(mapa, item.patient_id, item.id), patient: personaDe(item.patient_id),
        });
        if (ac.signal.aborted) return;
        setPendientes(comidasCola.map(item => filaDe(item, item.title.split('·').pop()?.trim() || 'Comida', item.title)));
        setRevisadas(comidasFeed.map(item => filaDe(item, item.slot, item.slot)));
        setPendienteTotal(cola.total);
        setMas(Boolean(cola.next_cursor));
        setEstado('ready');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (!ac.signal.aborted) setEstado('error');
      }
    })();
    return () => ac.abort();
  }, [marca, patients]);

  useEffect(() => {
    const refrescar = () => setMarca(valor => valor + 1);
    window.addEventListener(REFRESH, refrescar);
    return () => window.removeEventListener(REFRESH, refrescar);
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    const cerrar = (event: KeyboardEvent) => { if (event.key === 'Escape') setDialog(null); };
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [dialog]);

  const confirmar = async (meal: ComidaFila) => {
    try {
      await api.updateMeal(meal.patientId, meal.id, { status: 'confirmed' });
      setTab('ok');
      setMarca(valor => valor + 1);
      avisar(`${meal.name}: comida confirmada.`);
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo confirmar.');
    }
  };

  const comentar = async (texto: string) => {
    if (dialog?.kind !== 'comentar') return;
    const meal = dialog.meal;
    try {
      await api.sendMessage(meal.patientId, texto, 'vero', false, `seg-${crypto.randomUUID()}`);
      await api.updateMeal(meal.patientId, meal.id, { status: 'confirmed' });
      setDialog(null);
      setTab('ok');
      setMarca(valor => valor + 1);
      avisar('Comentario enviado por la app.');
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo enviar el comentario.');
    }
  };

  const pedir = async (pacienteId: string, diasPedido: 7 | 14, comidas: string[]) => {
    const persona = patients.find(patient => patient.id === pacienteId);
    if (!persona) { avisar('Elegí una paciente.'); return; }
    try {
      await api.sendMessage(persona.id, textoPedido(persona.name, diasPedido, comidas), 'vero', false, `seg-${crypto.randomUUID()}`);
      setDialog(null);
      avisar(`Pedido anotado para ${persona.name}. Le llega por la app.`);
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo enviar el pedido.');
    }
  };

  return <PanelSeguimientoVista
    tab={tab} comidas={tab === 'pend' ? pendientes : revisadas} sentimientos={sentimientos} dias={dias}
    pendientes={pendienteTotal} estado={estado} mas={mas} dialog={dialog} toast={toast}
    pedir={{ pacientes: ordenadas, aviso: true, dias: 7, comidas: [...COMIDAS_PEDIDO], pacienteId: ordenadas[0]?.id ?? '' }}
    onConfirm={meal => void confirmar(meal)}
    onComment={meal => setDialog({ kind: 'comentar', meal })}
    onVer={meal => { if (meal.log) onReview(meal.log); else setDialog({ kind: 'ver', meal }); }}
    onSentir={row => setDialog({ kind: 'sentir', row })}
    onClose={() => setDialog(null)}
    onGuardarComentario={texto => void comentar(texto)}
    onPedir={(pacienteId, diasPedido, comidas) => void pedir(pacienteId, diasPedido, comidas)}
    onAbrir={href => { setDialog(null); onOpen(href); }}
  />;
}
