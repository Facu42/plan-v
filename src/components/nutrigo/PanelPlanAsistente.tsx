import type { FormEvent } from 'react';
import type { PlanVersionView } from '../../types/plans';
import { PanelV29Icon } from './PanelV29Icon';
import { SUGERENCIAS_ASISTENTE, AVISO_PDF_TOGGLES } from './planes-asistente';

export type MensajeAsistente = { rol: 'vos' | 'ia'; texto: string };
export type LineaPropuesta = { etiqueta: string; texto: string };
export type EstadoTarjeta = 'nueva' | 'ok' | 'no';
export type ViaCompartir = 'app' | 'mail' | 'pdf' | 'impreso';
export type OpcionesPdf = { logo: boolean; caseras: boolean; compras: boolean; recetas: boolean; hoja: boolean };

const VIAS: Array<[ViaCompartir, 'send' | 'chat' | 'dl' | 'file', string, string]> = [
  ['app', 'send', 'En su app', 'le llega el aviso al publicar'],
  ['mail', 'chat', 'Por mail', 'Próximamente. Todavía no se manda por correo.'],
  ['pdf', 'dl', 'PDF descargable', 'para guardar o mandar vos'],
  ['impreso', 'file', 'Impreso', 'Próximamente. Todavía no hay una copia para papel distinta del PDF.'],
];

const INTERRUPTORES: Array<[keyof OpcionesPdf, string]> = [
  ['logo', 'Logo y colores del consultorio'],
  ['caseras', 'Medidas caseras'],
  ['compras', 'Lista de compras'],
  ['recetas', 'Recetas del plan'],
  ['hoja', 'Una semana por hoja'],
];

function estadoVersion(estado: PlanVersionView['status']) {
  if (estado === 'published') return 'Publicada';
  if (estado === 'scheduled') return 'Programada';
  if (estado === 'archived') return 'Archivada';
  return 'Borrador';
}

export function AtajoAsistente({ onAbrir }: { onAbrir: () => void }) {
  return <section className="fxp p28-ai-shortcut">
    <div><PanelV29Icon name="spark" size={16} /><span><b>Asistente del plan</b><small>Pedí cambios sin salir de la edición.</small></span></div>
    <button type="button" className="sbtn" onClick={onAbrir}>Ajustar con IA <PanelV29Icon name="chev" size={13} /></button>
  </section>;
}

export function CompartirPlan({ nombre, via, onVia, onCompartir }: {
  nombre: string;
  via: ViaCompartir;
  onVia: (via: ViaCompartir) => void;
  onCompartir: () => void;
}) {
  return <section className="fxp">
    <header><h3>Compartir con {nombre}</h3><span className="sp" /></header>
    <div className="peshare">
      {VIAS.map(([id, icono, titulo, detalle]) => <div key={id} role="button" tabIndex={0} aria-pressed={via === id} onClick={() => onVia(id)} onKeyDown={evento => { if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); onVia(id); } }}>
        <PanelV29Icon name={icono} size={14} />
        <span><b>{titulo}</b><small>{detalle}</small></span>
      </div>)}
    </div>
    <div className="macts"><button type="button" className="sbtn k" onClick={onCompartir}><PanelV29Icon name="send" size={13} />Compartir ahora</button></div>
  </section>;
}

export function GestionPlan({ nombre, onNuevo, onAsistente, onPlantilla, onCopiar, onProgramar, onVer, onVersiones, onAjustes }: {
  nombre: string;
  onNuevo: () => void;
  onAsistente: () => void;
  onPlantilla: () => void;
  onCopiar: () => void;
  onProgramar: () => void;
  onVer: () => void;
  onVersiones: () => void;
  onAjustes: () => void;
}) {
  const acciones = [
    ['plus', 'Nuevo plan', onNuevo],
    ['spark', 'Asistente con IA', onAsistente],
    ['copy', 'Guardar como plantilla', onPlantilla],
    ['users', 'Copiar a otra paciente', onCopiar],
    ['cal', 'Programar publicación', onProgramar],
    ['eye', `Ver como ${nombre}`, onVer],
    ['swap', 'Versiones', onVersiones],
    ['pen', 'Ajustes del plan', onAjustes],
  ] as const;
  return <section className="fxp">
    <header><h3>Gestión del plan</h3><span className="sp" /></header>
    <div className="pegest">
      {acciones.map(([icono, etiqueta, accion]) => <button type="button" key={etiqueta} onClick={accion}><PanelV29Icon name={icono} size={14} /><span>{etiqueta}</span></button>)}
    </div>
  </section>;
}

export function OpcionesImpresion({ opciones, onCambio, onDescargar, onImprimir }: {
  opciones: OpcionesPdf;
  onCambio: (clave: keyof OpcionesPdf) => void;
  onDescargar: () => void;
  onImprimir: () => void;
}) {
  return <>
    <div className="pepo">
      {INTERRUPTORES.map(([clave, etiqueta]) => <div className="tog" key={clave}>
        <span className="tx"><b>{etiqueta}</b></span>
        <button type="button" className="sw" role="switch" aria-checked={opciones[clave]} aria-label={etiqueta} onClick={() => onCambio(clave)} />
      </div>)}
    </div>
    <p className="mhelp">{AVISO_PDF_TOGGLES}</p>
    <div className="macts">
      <button type="button" className="sbtn k" onClick={onDescargar}><PanelV29Icon name="dl" size={13} />Descargar PDF</button>
      <button type="button" className="sbtn" onClick={onImprimir}>Imprimir</button>
    </div>
  </>;
}

export function CajonAsistente({
  abierto, pestana, nombre, alcances, alcance, mensajes, armando, pedido, tarjeta, historial, onCerrar, onPestana, onAlcance, onPedido, onEnviar, onSugerencia, onAplicar, onDescartar, onDeshacer,
}: {
  abierto: boolean;
  pestana: 'chat' | 'historial';
  nombre: string;
  alcances: readonly string[];
  alcance: number;
  mensajes: readonly MensajeAsistente[];
  armando: boolean;
  pedido: string;
  tarjeta: { lineas: readonly LineaPropuesta[]; estado: EstadoTarjeta } | null;
  historial: readonly PlanVersionView[];
  onCerrar: () => void;
  onPestana: (pestana: 'chat' | 'historial') => void;
  onAlcance: (indice: number) => void;
  onPedido: (texto: string) => void;
  onEnviar: () => void;
  onSugerencia: (texto: string) => void;
  onAplicar: () => void;
  onDescartar: () => void;
  onDeshacer: () => void;
}) {
  function enviar(evento: FormEvent) {
    evento.preventDefault();
    onEnviar();
  }
  return <aside className={`iadr${abierto ? ' open' : ''}`} id="iadr" aria-label="Asistente del plan" aria-hidden={abierto ? undefined : true}>
    <header>
      <span className="iabadge"><PanelV29Icon name="spark" size={12} />Asistente</span>
      <div className="iatab" role="tablist">
        <button type="button" role="tab" aria-selected={pestana === 'chat'} onClick={() => onPestana('chat')}>Chat</button>
        <button type="button" role="tab" aria-selected={pestana === 'historial'} onClick={() => onPestana('historial')}>Historial de cambios</button>
      </div>
      <span className="sp" />
      <button type="button" className="ibtn" aria-label="Cerrar asistente" onClick={onCerrar}><PanelV29Icon name="x" size={13} /></button>
    </header>
    {pestana === 'historial' ? <div className="iahist">
      {historial.length ? historial.map(version => <div key={version.id}>
        <time>v{version.version}</time>
        <span><b>Versión {version.version}</b><small>{estadoVersion(version.status)} · {version.period_start}</small></span>
        <button type="button" className="sbtn" onClick={onDeshacer}><PanelV29Icon name="undo" size={12} />Deshacer</button>
      </div>) : <p className="mhelp">Todavía no hay versiones guardadas de este plan.</p>}
    </div> : <>
      <div className="iascope"><span>Cambios en</span><div className="iaseg" role="radiogroup" aria-label="Cambios en">
        {alcances.map((etiqueta, indice) => <button type="button" role="radio" key={etiqueta} aria-checked={alcance === indice} onClick={() => onAlcance(indice)}>{etiqueta}</button>)}
      </div></div>
      <div className="iachat">
        {mensajes.length ? mensajes.map((mensaje, indice) => <div className={mensaje.rol === 'ia' ? 'iam a' : 'iam u'} key={`${mensaje.rol}-${indice}`}>{mensaje.texto}</div>) : <p className="mhelp">Pedile un cambio. La propuesta queda en borrador hasta que la apliques.</p>}
        {armando ? <div className="iam a iatyp" aria-label="El asistente está escribiendo"><i /><i /><i /></div> : null}
        {tarjeta ? <div className={`iaprop${tarjeta.estado === 'no' ? ' no' : tarjeta.estado === 'ok' ? ' ok' : ''}`}>
          {tarjeta.lineas.map(linea => <div key={linea.etiqueta}><small>{linea.etiqueta}</small><b>{linea.texto}</b></div>)}
          <div className="iapa">
            {tarjeta.estado === 'ok' ? <><span><PanelV29Icon name="check" size={12} />Aplicado en el borrador</span><button type="button" className="lnk" onClick={onDeshacer}>Deshacer</button></> : tarjeta.estado === 'no' ? <span>Descartado</span> : <>
              <button type="button" className="sbtn k" disabled={armando} onClick={onAplicar}>Aplicar</button>
              <button type="button" className="sbtn" disabled={armando} onClick={onDescartar}>Descartar</button>
            </>}
          </div>
        </div> : null}
      </div>
      <div className="iasug">{SUGERENCIAS_ASISTENTE.map(texto => <button type="button" key={texto} onClick={() => onSugerencia(texto)}>{texto}</button>)}</div>
      <form className="iain" onSubmit={enviar}>
        <input aria-label="Pedile un cambio" autoComplete="off" placeholder={`Pedile un cambio a la IA para ${nombre}…`} value={pedido} onChange={evento => onPedido(evento.target.value)} />
        <button type="submit" className="ibtn go" aria-label="Enviar"><PanelV29Icon name="send" size={14} /></button>
      </form>
    </>}
  </aside>;
}
