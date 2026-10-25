import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  PERIODOS, SUGERENCIAS, textoIdeas, textoPermiso,
  type FuenteVista, type PeriodoAsistente, type PropuestaVista,
} from './asistente-presentacion';

export type TurnoAsistente = {
  clave: string;
  pregunta: string;
  respuesta: string;
  aviso: string;
  excluidas: number;
  propuestas: PropuestaVista[];
  fuentes: FuenteVista[];
};

export function AccionesAsistente({
  days, ocupado, onDays, onDescargar, onConsultar,
}: {
  days: PeriodoAsistente;
  ocupado: boolean;
  onDays: (days: PeriodoAsistente) => void;
  onDescargar: () => void;
  onConsultar: () => void;
}) {
  return <>
    <div className="tabs" aria-label="Período">
      {PERIODOS.map(periodo => <button type="button" key={periodo} className={days === periodo ? 'on' : undefined} disabled={ocupado} onClick={() => onDays(periodo)}>{periodo} días</button>)}
    </div>
    <button className="chip" type="button" onClick={onDescargar}>Descargar indicadores</button>
    <button className="cta" type="button" disabled={ocupado} onClick={onConsultar}>{ocupado ? 'Consultando…' : 'Consultar'}</button>
  </>;
}

function Aviso({ texto }: { texto: string }) {
  const nodo = <div id="atoast" className="on" role="status">{texto}</div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}

export function PanelAsistenteVista({
  pregunta, propuestasOn, turnos, estado, ocupado, error, aviso, acciones,
  onPregunta, onConsultar, onSugerencia, onToggle, onFicha, onFuente, onRevisar,
}: {
  pregunta: string;
  propuestasOn: boolean;
  turnos: TurnoAsistente[];
  estado: 'cargando' | 'lista' | 'error';
  ocupado: boolean;
  error: string;
  aviso: string;
  acciones: ReactNode;
  onPregunta: (texto: string) => void;
  onConsultar: () => void;
  onSugerencia: (texto: string) => void;
  onToggle: () => void;
  onFicha: (href: string, nombre: string | null) => void;
  onFuente: (fuente: FuenteVista) => void;
  onRevisar: () => void;
}) {
  const ultima = turnos[turnos.length - 1] ?? null;
  const fuentes = ultima?.fuentes ?? [];
  const hayPropuesta = Boolean(ultima?.propuestas.length);
  return <div id="s-asistente" className="sxw">
    {acciones ? <div className="sxq">{acciones}</div> : null}
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '1.7fr .78fr' }}>
      <div className="c">
        <section className="fxp g">
          <header>
            <h3>Conversación</h3>
            <span className="m">escribí de una paciente o de toda la cartera</span>
            <span className="sp" />
          </header>
          <div className="sxask">
            <textarea aria-label="Pedido para el asistente" placeholder="Ej.: ¿cómo viene Sofía esta semana?" value={pregunta} maxLength={1000} disabled={ocupado} onChange={evento => onPregunta(evento.target.value)} />
            <div className="sxrow">
              <span className="sxsub">Nada se le manda a ella hasta que vos lo revisás.</span>
              <button type="button" className="cta" disabled={ocupado} onClick={onConsultar}>{ocupado ? 'Consultando…' : 'Consultar'}</button>
            </div>
          </div>
          <div className="sxq">{SUGERENCIAS.map(texto => <button type="button" className="chip" key={texto} onClick={() => onSugerencia(texto)}>{texto}</button>)}</div>
          <div className="fxs" id="sxchat" role="log" aria-label="Conversación del asistente" aria-live="polite">
            {turnos.map(turno => <article key={turno.clave}>
              <span className="sxfrom">Vos</span>
              <b>{turno.pregunta}</b>
              <span className="sxfrom">Asistente</span>
              <p>{turno.respuesta}</p>
              {turno.aviso ? <p role="status">{turno.aviso}</p> : null}
              {turno.propuestas.map(propuesta => <div key={propuesta.clave}>
                <p><b>Propuesta para revisar.</b> {propuesta.texto}</p>
                <div className="sxq">
                  {propuesta.ficha ? <button type="button" className="chip" onClick={() => onFicha(propuesta.ficha!, propuesta.nombre)}>Abrir ficha</button> : null}
                  <button type="button" className="chip" onClick={onRevisar}>Marcar revisada</button>
                </div>
              </div>)}
            </article>)}
            {turnos.length === 0 && estado === 'cargando' ? <p className="sxsub">Cargando el resumen…</p> : null}
            {turnos.length === 0 && estado === 'error' ? <p className="sxsub">{error || 'No pudimos consultar la cartera.'}</p> : null}
            {error && turnos.length > 0 ? <p role="alert">{error}</p> : null}
          </div>
        </section>
      </div>
      <div className="c">
        <div className="fxdk">
          <small>Gasto de este mes</small>
          <b className="num">Sin dato</b>
          <span>El gasto no llega a esta pantalla. El tope es US$ 5: si se pasa, avisa y no consulta.</span>
          <div className="fxdkp" aria-hidden="true"><i style={{ width: '0%' }} /></div>
          <div className="fxdk2"><span>Tope</span><b>US$ 5</b></div>
        </div>
        <section className="fxp">
          <header>
            <h3>Propuestas</h3>
            <span className="m">{propuestasOn ? 'prendidas' : 'apagadas'}</span>
            <span className="sp" />
            <button type="button" className="chip" onClick={onToggle}>{propuestasOn ? 'Apagar' : 'Prender'}</button>
          </header>
          <p className="sxsub">{textoPermiso(ultima?.excluidas ?? 0)}</p>
          <p className="sxsub">{textoIdeas(propuestasOn, hayPropuesta, ultima?.aviso ?? '')}</p>
        </section>
        <section className="fxp g">
          <header>
            <h3>De dónde sale la última</h3>
            <span className="m">{fuentes.length === 1 ? '1 fuente' : `${fuentes.length} fuentes`}</span>
            <span className="sp" />
          </header>
          <div className="fxs">
            <div className="fxr">{fuentes.length ? fuentes.map(fuente => <button type="button" className="l" key={fuente.id} onClick={() => onFuente(fuente)}>
              <span className="av" style={{ background: fuente.fondo }}>{fuente.iniciales}</span>
              <span className="sxwho"><b>{fuente.nombre}</b><small>{fuente.registros} registros · ficha</small></span>
            </button>) : <p className="sxsub">{estado === 'cargando' ? 'Cargando las fuentes…' : 'Todavía no hay fuentes en este período.'}</p>}</div>
          </div>
        </section>
      </div>
    </div>
    {aviso ? <Aviso texto={aviso} /> : null}
  </div>;
}
