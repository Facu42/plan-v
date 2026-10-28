// Página pública del panel con el HTML y las clases del boceto v29 (`pubV0`, `pubV1`, `pubV2`, `pubPhone`); solo se enchufan los datos reales de la agenda.
import type { ReactNode } from 'react';
import { monthlyLabel } from '../../lib/panel-subscriptions';
import type { SchedulingBooking, SchedulingSettings } from '../../types/scheduling';
import type { SubscriptionPlan } from '../../types/subscriptions';
import { FxKv, FxPanel } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';

export type VistaPublica = 0 | 1 | 2;
export const PESTANAS_PUBLICA = ['Mi página', 'Servicios', 'Reservas en línea'] as const;

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0] as const;
const plata = (centavos: number) => `$${(centavos / 100).toLocaleString('es-AR')}`;
const canal = (valor: 'video' | 'presencial') => (valor === 'video' ? 'Videollamada' : 'Consultorio');
const hora = (texto: string) => (texto.endsWith(':00') ? String(Number(texto.slice(0, 2))) : `${Number(texto.slice(0, 2))}:${texto.slice(3, 5)}`);

/** «9 a 13 · 15 a 19» por día; el día sin franjas queda en `null`. */
export function horariosPorDia(semana: SchedulingSettings['weekly']): Array<readonly [string, string | null]> {
  return ORDEN_DIAS.map(dia => {
    const franjas = semana.filter(franja => franja.weekday === dia).sort((a, b) => a.start.localeCompare(b.start));
    return [DIAS[dia], franjas.length ? franjas.map(franja => `${hora(franja.start)} a ${hora(franja.end)}`).join(' · ') : null] as const;
  });
}

const iniciales = (nombre: string) => nombre.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]?.toLocaleUpperCase('es-AR') ?? '').join('') || '·';
const cuando = (iso: string) => new Date(iso).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
const ESTADO_RESERVA: Record<SchedulingBooking['status'], readonly [string, string]> = { requested: ['Por confirmar', 'p-wait'], confirmed: ['Confirmada', 'p-conf'], cancelled: ['Cancelada', 'p-vid'] };

function Interruptor({ etiqueta, activo, onCambiar }: { etiqueta: string; activo: boolean; onCambiar?: () => void }) {
  return <button type="button" className="sw" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={!onCambiar} onClick={onCambiar} />;
}

function Celular({ config, publicados }: { config: SchedulingSettings; publicados: SchedulingSettings['types'] }) {
  const { page } = config;
  return <div className="pubph" aria-label="Vista previa en celular"><div className="pubsc">
    <div className="pubhero"><span className="av">{iniciales(page.title)}</span><b>{page.title}</b><small>{page.contact || 'Nutricionista'}</small></div>
    <div className="pubsec"><h5>Turnos</h5>{publicados.length ? publicados.slice(0, 3).map(tipo => <div className="pubsvc" key={tipo.id}><span><b>{tipo.name}</b><small>{tipo.duration_min} min · {canal(tipo.channel)}</small></span><em>{plata(tipo.price_minor)}</em></div>) : <small className="pubos">Todavía no cargaste servicios.</small>}</div>
    {page.location ? <div className="pubsec"><h5>Dónde</h5><small className="pubos"><PanelV29Icon name="pin" size={11} /> {page.location}</small></div> : null}
    {page.bio ? <div className="pubsec"><h5>Presentación</h5><small className="pubos">{page.bio}</small></div> : null}
  </div><div className="pubcta">Reservar turno</div></div>;
}

type Props = {
  config: SchedulingSettings; reservas: SchedulingBooking[]; publicada: boolean; sinPublicar: boolean; link: string; planes: SubscriptionPlan[] | null; mercadoPago: boolean;
  vista: VistaPublica; servicio: number; cargando: boolean; error: string; estado: string;
  onServicio: (indice: number) => void; onEditarPerfil: () => void; onEditarServicio: (id: string) => void; onQuitarServicio: (id: string) => void;
  onCopiar: () => void; onRecordatorios: () => void; onReservar: () => void; onReintentar: () => void; onConfirmar: (id: string) => void;
  onNuevoPlan?: () => void; onPlan?: (plan: SubscriptionPlan, visible: boolean) => void; conexiones?: ReactNode;
};

export function PanelPublicaV29(p: Props) {
  const { config, reservas, vista } = p;
  const publicados = p.publicada ? config.types : [];
  const horarios = horariosPorDia(config.weekly);
  const confirmar = reservas.filter(reserva => reserva.status === 'requested').length;
  const marco = (hijos: ReactNode) => <div id="s-publica" className="sxw"><div id="pubwrap" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
    {p.error ? <p className="sxsub" role="alert">{p.error} <button type="button" className="chip" onClick={p.onReintentar}>Reintentar</button></p> : null}
    {p.estado ? <p className="sxsub" role="status">{p.estado}</p> : null}{hijos}</div></div>;
  if (p.cargando) return marco(<p className="sxsub">Cargando tu página…</p>);
  if (vista === 1) {
    const actual = config.types[Math.min(p.servicio, Math.max(0, config.types.length - 1))];
    return marco(<div className="fx" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
      <div className="c">
        <FxPanel titulo="Servicios" meta={`${config.types.length} · ${publicados.length} publicados`} grande>
          {config.types.length ? <div className="fxs pubts"><table className="pubt"><thead><tr><th>Servicio</th><th>Dónde</th><th>Duración</th><th>Seña</th><th>Precio</th><th>Estado</th></tr></thead><tbody>
            {config.types.map((tipo, i) => <tr key={tipo.id} className={i === p.servicio ? 'on' : undefined} tabIndex={0} onClick={() => p.onServicio(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); p.onServicio(i); } }}>
              <td><b>{tipo.name}</b></td><td>{canal(tipo.channel)}</td><td>{tipo.duration_min} min</td><td className="num">{tipo.deposit_minor ? plata(tipo.deposit_minor) : '—'}</td><td className="num">{plata(tipo.price_minor)}</td><td><span className={`pill ${p.publicada ? 'p-conf' : 'p-wait'}`}>{p.publicada ? 'Publicado' : 'Borrador'}</span></td></tr>)}
          </tbody></table></div> : <p className="sxsub">Todavía no hay servicios. Creá el primero con «Nuevo servicio».</p>}
        </FxPanel>
        <FxPanel titulo="Planes de seguimiento" meta={p.planes ? `${p.planes.length}` : 'no disponible'} derecha={p.onNuevoPlan ? <button type="button" className="sbtn cbtn" onClick={p.onNuevoPlan}>Nuevo plan</button> : undefined}>
          {p.planes?.length ? <div className="publk">{p.planes.map(plan => <div key={plan.id}><span className="t"><b>{plan.name}</b><small>{monthlyLabel(plan.amount_cents)} · {plan.description || 'Seguimiento mensual'}</small></span>{p.onPlan ? <Interruptor etiqueta={`Mostrar ${plan.name} en la página`} activo={plan.public_visible} onCambiar={p.mercadoPago ? () => p.onPlan?.(plan, !plan.public_visible) : undefined} /> : null}</div>)}</div> : <p className="sxsub">{p.planes ? 'Todavía no hay planes de seguimiento.' : 'Los planes de seguimiento no están activos en tu cuenta.'}</p>}
          {p.planes && !p.mercadoPago ? <p className="sxsub">Conectá Mercado Pago para mostrar los planes en la página y cobrar con débito automático.</p> : null}
        </FxPanel>
      </div>
      <div className="c">
        {actual ? <FxPanel titulo={actual.name} meta={p.publicada ? 'Publicado' : 'Borrador'} derecha={<button type="button" className="sbtn cbtn" onClick={() => p.onEditarServicio(actual.id)}><PanelV29Icon name="pen" size={13} />Editar</button>} grande>
          <FxKv filas={[['Duración', `${actual.duration_min} min`], ['Dónde', canal(actual.channel)], ['Precio', plata(actual.price_minor)], ['Seña', actual.deposit_minor ? plata(actual.deposit_minor) : 'Sin seña']]} />
          <div className="fxfoot pubft"><button type="button" className="sbtn cbtn" onClick={() => p.onQuitarServicio(actual.id)}>Quitar</button><span className="sp" style={{ flex: 1 }} /><button type="button" className="sbtn k cbtn" onClick={p.onCopiar} disabled={!p.link}><PanelV29Icon name="copy" size={13} />Copiar link</button></div>
        </FxPanel> : <FxPanel titulo="Sin servicio elegido" meta="" grande><p className="sxsub">Elegí un servicio de la lista para ver su detalle.</p></FxPanel>}
        <FxPanel titulo="Cancelar o cambiar" meta="reglas de la página"><FxKv filas={[['Anticipación mínima', '24 horas'], ['Cambiar o cancelar', 'desde la app o con el link del mail']]} /></FxPanel>
      </div>
    </div>);
  }
  if (vista === 2) {
    return marco(<div className="fx" style={{ gridTemplateColumns: '1fr 1fr 1.15fr' }}>
      <div className="c">
        <FxPanel titulo="Reglas para reservar" meta=""><FxKv filas={[['Anticipación', 'mínimo 24 h antes'], ['Reservas desde la página', config.page.enabled ? 'Abiertas' : 'Cerradas'], ['Seña', p.mercadoPago ? '50% con Mercado Pago' : 'se activa al conectar Mercado Pago'], ['Meet por consulta', config.create_meet ? 'Sí' : 'No']]} /></FxPanel>
        <FxPanel titulo="Cómo cobrás" meta="transferencia y Mercado Pago" grande><FxKv filas={[['Alias de transferencia', config.transfer_alias || 'Sin cargar'], ['Mercado Pago', p.mercadoPago ? 'Conectado' : 'Sin conectar'], ['Google Calendar', config.google_enabled ? 'Comprueba tus horarios' : 'No se usa']]} />{p.conexiones}</FxPanel>
      </div>
      <div className="c">
        <FxPanel titulo="Horarios de atención" meta="se editan en Agenda">
          <div className="pubhr">{horarios.map(([dia, texto]) => <div key={dia} className={texto ? '' : 'off'}><b>{dia}</b><span>{texto ?? 'No atiendo'}</span><Interruptor etiqueta={`Atiende el ${dia.toLowerCase()}`} activo={Boolean(texto)} /></div>)}</div>
        </FxPanel>
        <FxPanel titulo="Confirmación y recordatorio" meta="por la app y por mail">
          <div className="pubhr pubev"><div><b>Al reservar</b><span>le llega la confirmación</span><Interruptor etiqueta="Confirmación al reservar" activo /></div>
            <div><b>24 h antes</b><span>recordatorio con «Confirmo» o «Necesito cambiar»</span><Interruptor etiqueta="Recordatorio 24 h antes" activo={config.reminders_enabled !== false} onCambiar={p.onRecordatorios} /></div></div>
        </FxPanel>
      </div>
      <div className="c">
        <FxPanel titulo="Reservas en línea" meta={`${reservas.length} en total · ${confirmar} por confirmar`} grande>
          <div className="fxs">{reservas.length ? <div className="pubrs">{reservas.map(reserva => { const [texto, tono] = ESTADO_RESERVA[reserva.status]; return <div key={reserva.id}><span className="av">{iniciales(reserva.contact_name)}</span><span className="t"><b>{reserva.contact_name}</b><small>{config.types.find(tipo => tipo.id === reserva.type_id)?.name ?? 'Consulta'} · {cuando(reserva.starts_at)}</small></span>{reserva.status === 'requested' ? <button type="button" className="sbtn k" onClick={() => p.onConfirmar(reserva.id)}>Aceptar</button> : <span className={`pill ${tono}`}>{texto}</span>}</div>; })}</div> : <p className="sxsub">Todavía no hay reservas desde la página.</p>}</div>
        </FxPanel>
      </div>
    </div>);
  }
  return marco(<div className="fx" style={{ gridTemplateColumns: '1.12fr 312px 1fr' }}>
    <div className="c">
      <FxPanel titulo="Perfil" meta={p.publicada ? (p.sinPublicar ? 'Cambios sin publicar' : 'Publicada') : 'Sin publicar'} derecha={<button type="button" className="sbtn cbtn" onClick={p.onEditarPerfil}><PanelV29Icon name="pen" size={13} />Editar</button>}>
        <div className="pubpf"><span className="av">{iniciales(config.page.title)}</span><span><b>{config.page.title}</b><small>{config.page.contact || 'Sin contacto público'}</small></span></div>
        <p className="pubbio">{config.page.bio || 'Todavía no escribiste una presentación.'}</p>
      </FxPanel>
      <FxPanel titulo="Dónde atendés" meta={`${config.page.location ? 1 : 0} lugar`}>
        <FxKv filas={[['Consultorio', config.page.location || 'Sin cargar'], ['Videollamada', config.create_meet ? 'Meet, con el link en la app de la paciente' : 'Sin Meet automático'], ['Horarios', horarios.filter(([, t]) => t).length ? `${horarios.filter(([, t]) => t).length} días por semana` : 'Sin horarios cargados']]} />
      </FxPanel>
      <FxPanel titulo="Obras sociales" meta="todavía sin cargar"><p className="sxsub">Todavía no se cargan obras sociales en la página.</p></FxPanel>
      <FxPanel titulo="Opiniones" meta="0 verificadas" grande><p className="sxsub">Todavía no hay opiniones de pacientes.</p></FxPanel>
    </div>
    <div className="c"><FxPanel titulo="Así la ve una paciente nueva" meta="" grande><Celular config={config} publicados={config.types} /></FxPanel></div>
    <div className="c">
      <FxPanel titulo="Compartir" meta="">
        <div className="pubsh"><div><small>Tu link</small><b>{p.link ? p.link.replace(/^https?:\/\//, '') : 'Publicá la página para tener link'}</b><div className="pubshb"><button type="button" className="sbtn k cbtn" onClick={p.onCopiar} disabled={!p.link}><PanelV29Icon name="copy" size={13} />Copiar link</button></div></div></div>
      </FxPanel>
      <FxPanel titulo="Reservas" meta="desde la página" grande>
        <div className="pubkp"><div><small>Reservas</small><b className="num">{reservas.length}</b><em>en total</em></div><div><small>Por confirmar</small><b className="num">{confirmar}</b><em>esperan tu ok</em></div><div><small>Visitas</small><b className="num">0</b><em>sin medir</em></div></div>
        <button type="button" className="sbtn cbtn" onClick={p.onReservar}>Ver reservas en línea</button>
      </FxPanel>
    </div>
  </div>);
}
