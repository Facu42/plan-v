// Página pública del panel con el HTML y las clases del boceto v29 (`pubV0`, `pubV1`, `pubV2`, `pubPhone`); solo se enchufan los datos reales de la agenda.
import type { ReactNode } from 'react';
import { monthlyLabel } from '../../lib/panel-subscriptions';
import type { SchedulingBooking, SchedulingSettings } from '../../types/scheduling';
import type { SubscriptionPlan } from '../../types/subscriptions';
import { FxKv, FxPanel } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';
import { etiquetaModalidad, fotoPublica, precioConsulta } from '../../lib/public-page-profile';
import { AVISOS_DE_RESERVA, celdasQr, claseModo, pedidosAlReservar, textoModo, type AvisoReserva } from './publica-extras';

export type VistaPublica = 0 | 1 | 2;
export type CajonPublica = 'perfil' | 'lugar' | 'obras' | 'desc' | 'servicio' | 'pide' | 'horarios' | 'reglas' | 'abrir';
export const PESTANAS_PUBLICA = ['Mi página', 'Servicios', 'Reservas en línea'] as const;

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0] as const;
const plata = (centavos: number) => `$${(centavos / 100).toLocaleString('es-AR')}`;
const canal = (valor: 'video' | 'presencial') => (valor === 'video' ? 'Videollamada' : 'Consultorio');
const hora = (texto: string) => (texto.endsWith(':00') ? String(Number(texto.slice(0, 2))) : `${Number(texto.slice(0, 2))}:${texto.slice(3, 5)}`);

/** «9 a 13 · 15 a 19» por día (con el número de día de la semana); el día sin franjas queda en `null`. */
export function horariosPorDia(semana: SchedulingSettings['weekly']): Array<readonly [string, string | null, number]> {
  return ORDEN_DIAS.map(dia => {
    const franjas = semana.filter(franja => franja.weekday === dia).sort((a, b) => a.start.localeCompare(b.start));
    return [DIAS[dia], franjas.length ? franjas.map(franja => `${hora(franja.start)} a ${hora(franja.end)}`).join(' · ') : null, dia] as const;
  });
}

const iniciales = (nombre: string) => nombre.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]?.toLocaleUpperCase('es-AR') ?? '').join('') || '·';
const cuando = (iso: string) => new Date(iso).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
const ESTADO_RESERVA: Record<SchedulingBooking['status'], readonly [string, string]> = { requested: ['Por confirmar', 'p-wait'], confirmed: ['Confirmada', 'p-conf'], cancelled: ['Cancelada', 'p-vid'] };
const AVISOS: ReadonlyArray<readonly [AvisoReserva, string, string]> = [['confirm', 'Al reservar', 'le llega la confirmación'], ['unconfirmed', 'Si no confirma', 'te avisamos 12 h antes del turno'], ['reopen', 'Si cancela', 'el lugar vuelve a quedar libre para reservar'], ['review', 'Después del turno', 'le pedimos una opinión para tu página']];
const mismoMes = (iso: string) => { const a = new Date(iso); const b = new Date(); return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); };

function Interruptor({ etiqueta, activo, onCambiar }: { etiqueta: string; activo: boolean; onCambiar?: () => void }) {
  return <button type="button" className="sw" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={!onCambiar} onClick={onCambiar} />;
}

function Estrellas({ n }: { n: number }) {
  return <span className="pubst" aria-label={`${n} de 5`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? 'on' : ''}><PanelV29Icon name="star" size={11} /></i>)}</span>;
}

export function Qr({ link }: { link: string }) {
  const { lado, celdas } = celdasQr(link);
  return <svg className="pubqr" viewBox={`-1 -1 ${lado + 2} ${lado + 2}`} role="img" aria-label={`Código QR de ${link}`}>{celdas.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />)}</svg>;
}

/** `pubPhone`: la página como la ve una paciente nueva. */
export function Celular({ config, publicados, marcaLogo = '', fotoBorrador = false }: { config: SchedulingSettings; publicados: SchedulingSettings['types']; marcaLogo?: string; fotoBorrador?: boolean }) {
  const { page, page_extras: extras } = config;
  const obras = (extras?.insurers ?? []).filter(o => o.mode === 'copago' || o.mode === 'reintegro');
  const foto = fotoPublica(page, marcaLogo);
  const modalidad = etiquetaModalidad(extras?.modality);
  const precio = precioConsulta(extras?.consult_price_minor);
  const subtitulo = [page.contact || 'Nutricionista', extras?.license, extras?.area, modalidad].filter(Boolean).join(' · ');
  return <div className="pubph" aria-label="Vista previa en celular"><div className="pubsc">
    <div className="pubhero">{foto ? <img className="av" src={foto} alt="" width={40} height={40} /> : <span className="av">{iniciales(page.title)}</span>}<b>{page.title}</b><small>{subtitulo}</small>{precio ? <em>{precio}</em> : null}<span className="pubrt"><em>Sin opiniones todavía</em></span></div>
    {fotoBorrador ? <small className="nthint">Borrador: se ve en tu página al publicar.</small> : null}
    {extras?.specialties?.length ? <div className="pubtg">{extras.specialties.slice(0, 3).map(e => <span key={e}>{e}</span>)}</div> : null}
    <div className="pubsec"><h5>Turnos</h5>{publicados.length ? publicados.slice(0, 3).map(tipo => <div className="pubsvc" key={tipo.id}><span><b>{tipo.name}</b><small>{tipo.duration_min} min · {canal(tipo.channel)}</small></span><em>{plata(tipo.price_minor)}</em></div>) : <small className="pubos">Todavía no cargaste servicios.</small>}</div>
    <div className="pubsec"><h5>Próximos lugares</h5><small className="pubos">Se muestran los lugares libres de tu agenda.</small></div>
    <div className="pubsec"><h5>Obras sociales</h5><small className="pubos">{obras.length ? obras.map(o => o.name).join(' · ') : 'Solo particular'}</small></div>
    <div className="pubsec"><h5>Dónde</h5><small className="pubos">{page.location ? <><PanelV29Icon name="pin" size={11} /> {page.location}</> : 'Sin dirección cargada'}{config.create_meet ? <><br /><PanelV29Icon name="video" size={11} /> También por videollamada</> : null}</small></div>
    <div className="pubsec"><h5>Opiniones</h5><small className="pubos">Todavía no hay opiniones.</small></div>
  </div><div className="pubcta">Reservar turno</div></div>;
}

type Props = {
  config: SchedulingSettings; reservas: SchedulingBooking[]; publicada: boolean; sinPublicar: boolean; link: string; planes: SubscriptionPlan[] | null; mercadoPago: boolean;
  marcaLogo?: string; fotoBorrador?: boolean;
  vista: VistaPublica; servicio: number; cargando: boolean; error: string; estado: string;
  onServicio: (indice: number) => void; onCajon: (cajon: CajonPublica, id?: string) => void; onQuitarServicio: (id: string) => void; onDuplicarServicio: (id: string) => void;
  onCopiar: () => void; onDescargarQr: () => void; onRecordatorios: () => void; onAviso: (aviso: AvisoReserva, activo: boolean) => void; onDia: (dia: number, activo: boolean) => void;
  onReservar: () => void; onReintentar: () => void; onConfirmar: (id: string) => void;
  onNuevoPlan?: () => void; onPlan?: (plan: SubscriptionPlan, visible: boolean) => void; conexiones?: ReactNode;
};

const Boton = ({ texto, onClick, icono, clave, deshabilitado }: { texto: string; onClick: () => void; icono?: 'pen' | 'copy' | 'dl'; clave?: boolean; deshabilitado?: boolean }) => <button type="button" className={`sbtn${clave ? ' k' : ''} cbtn`} onClick={onClick} disabled={deshabilitado}>{icono ? <PanelV29Icon name={icono} size={13} /> : null}{texto}</button>;
const ListaObras = ({ obras, chico }: { obras: NonNullable<SchedulingSettings['page_extras']>['insurers']; chico?: boolean }) => <div className={`pubosl${chico ? ' sm' : ''}`}>{(obras ?? []).map(o => <span key={o.name} className={claseModo(o.mode)}><b>{o.name}</b>{textoModo(o.mode, o.note)}</span>)}</div>;
const SinObras = () => <p className="sxsub">Todavía no cargaste obras sociales. Con «Editar» las sumás.</p>;

export function PanelPublicaV29(p: Props) {
  const { config, reservas, vista } = p;
  const extras = config.page_extras;
  const publicados = p.publicada ? config.types : [];
  const horarios = horariosPorDia(config.weekly);
  const obras = extras?.insurers ?? [];
  const confirmar = reservas.filter(reserva => reserva.status === 'requested').length;
  const marco = (hijos: ReactNode) => <div id="s-publica" className="sxw"><div id="pubwrap" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
    {p.error ? <p className="sxsub" role="alert">{p.error} <button type="button" className="chip" onClick={p.onReintentar}>Reintentar</button></p> : null}
    {p.estado ? <p className="sxsub" role="status">{p.estado}</p> : null}{hijos}</div></div>;
  if (p.cargando) return marco(<p className="sxsub">Cargando tu página…</p>);
  const linkCorto = p.link.replace(/^https?:\/\//, '');
  if (vista === 1) {
    const actual = config.types[Math.min(p.servicio, Math.max(0, config.types.length - 1))];
    const nota = actual ? extras?.service_notes?.[actual.id] : undefined;
    const descuentos = extras?.discounts;
    const estado = p.publicada ? ['Publicado', 'p-conf'] : ['Borrador', 'p-wait'];
    return marco(<div className="fx" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
      <div className="c">
        <FxPanel titulo="Servicios" meta={`${config.types.length} · ${publicados.length} publicados`} grande>
          {config.types.length ? <div className="fxs pubts"><table className="pubt"><thead><tr><th>Servicio</th><th>Tipo</th><th>Duración</th><th>Quién reserva</th><th>Precio</th><th>Estado</th></tr></thead><tbody>
            {config.types.map((tipo, i) => <tr key={tipo.id} className={i === p.servicio ? 'on' : undefined} tabIndex={0} onClick={() => p.onServicio(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); p.onServicio(i); } }}>
              <td><b>{tipo.name}</b><small>{canal(tipo.channel)}</small></td><td>Consulta</td><td>{tipo.duration_min} min</td><td>{extras?.service_notes?.[tipo.id]?.who === 'patients' ? 'Solo pacientes' : 'Cualquier persona'}</td><td className="num">{plata(tipo.price_minor)}</td><td><span className={`pill ${estado[1]}`}>{estado[0]}</span></td></tr>)}
          </tbody></table></div> : <p className="sxsub">Todavía no hay servicios. Creá el primero con «Nuevo servicio».</p>}
        </FxPanel>
        <FxPanel titulo="Descuentos por medio de pago" meta="se ven al reservar" derecha={<Boton texto="Editar" onClick={() => p.onCajon('desc')} />}>
          <div className="pubkp"><div><small>Transferencia</small><b className="num">{descuentos?.transfer ?? 0}%</b><em>menos</em></div><div><small>Efectivo</small><b className="num">{descuentos?.cash ?? 0}%</b><em>menos</em></div><div><small>Tarjeta</small><b className="num">{descuentos?.card ?? 0}%</b><em>precio de lista</em></div></div>
        </FxPanel>
        <FxPanel titulo="Planes de seguimiento" meta={p.planes ? `${p.planes.length}` : 'no disponible'} derecha={p.onNuevoPlan ? <Boton texto="Nuevo plan" onClick={p.onNuevoPlan} /> : undefined}>
          {p.planes?.length ? <div className="publk">{p.planes.map(plan => <div key={plan.id}><span className="t"><b>{plan.name}</b><small>{monthlyLabel(plan.amount_cents)} · {plan.description || 'Seguimiento mensual'}</small></span>{p.onPlan ? <Interruptor etiqueta={`Mostrar ${plan.name} en la página`} activo={plan.public_visible} onCambiar={p.mercadoPago ? () => p.onPlan?.(plan, !plan.public_visible) : undefined} /> : null}</div>)}</div> : <p className="sxsub">{p.planes ? 'Todavía no hay planes de seguimiento.' : 'Los planes de seguimiento no están activos en tu cuenta.'}</p>}
          {p.planes && !p.mercadoPago ? <p className="sxsub">Conectá Mercado Pago para mostrar los planes en la página y cobrar con débito automático.</p> : null}
        </FxPanel>
      </div>
      <div className="c">
        {actual ? <FxPanel titulo={actual.name} meta={<span className={`pill ${estado[1]}`}>{estado[0]}</span>} derecha={<Boton texto="Editar" icono="pen" onClick={() => p.onCajon('servicio', actual.id)} />} grande>
          <FxKv filas={[['Tipo', 'Consulta'], ['Duración', `${actual.duration_min} min`], ['Dónde', canal(actual.channel)], ['Precio', plata(actual.price_minor)], ['Seña', actual.deposit_minor ? plata(actual.deposit_minor) : 'Sin seña'], ['Quién reserva', nota?.who === 'patients' ? 'Solo pacientes' : 'Cualquier persona'], ['Obra social', nota && !nota.insurer ? 'Solo particular' : 'Acepta (copago o reintegro)'], ['Link', linkCorto || 'Publicá la página para tener link']]} />
          <div className="pubins"><small>Obras sociales</small>{nota && !nota.insurer ? <p>Solo particular. Se puede pedir reintegro con la factura.</p> : obras.length ? <ListaObras obras={obras} chico /> : <p>Todavía no cargaste obras sociales.</p>}</div>
          <div className="pubins"><small>Le llega a la paciente al reservar</small><p>{nota?.instructions || 'Sin indicaciones.'}</p></div>
          <div className="fxfoot pubft"><Boton texto="Duplicar" onClick={() => p.onDuplicarServicio(actual.id)} /><Boton texto="Quitar" onClick={() => p.onQuitarServicio(actual.id)} /><span className="sp" style={{ flex: 1 }} /><Boton texto="Copiar link" icono="copy" clave onClick={p.onCopiar} deshabilitado={!p.link} /></div>
        </FxPanel> : <FxPanel titulo="Sin servicio elegido" meta="" grande><p className="sxsub">Elegí un servicio de la lista para ver su detalle.</p></FxPanel>}
        <FxPanel titulo="Cancelar o cambiar" meta="reglas para todos los servicios" derecha={<Boton texto="Ver" onClick={() => p.onCajon('reglas')} />}>
          <FxKv filas={[['Cambiar', 'hasta 24 h antes, desde la app'], ['Cancelar', 'hasta 24 h antes, sin cargo'], ['Si avisa tarde', 'queda como ausente; la seña llega con Mercado Pago']]} />
        </FxPanel>
      </div>
    </div>);
  }
  if (vista === 2) {
    const pedidos = pedidosAlReservar(extras);
    const aviso = (clave: AvisoReserva) => extras?.notices?.[clave] === true;
    return marco(<div className="fx" style={{ gridTemplateColumns: '1fr 1fr 1.15fr' }}>
      <div className="c">
        <FxPanel titulo="Reglas para reservar" meta="" derecha={<Boton texto="Ver" onClick={() => p.onCajon('reglas')} />}>
          <FxKv filas={[['Anticipación', 'mínimo 1 h antes'], ['Hasta', '90 días adelante'], ['Por día', 'sin tope'], ['Primera vez', 'cualquier turno'], ['Cambiar o cancelar', 'hasta 24 h antes'], ['Reservas desde la página', config.page.enabled ? 'Abiertas' : 'Cerradas'], ['Seña', p.mercadoPago ? '50% con Mercado Pago' : 'se activa al conectar Mercado Pago']]} />
        </FxPanel>
        <FxPanel titulo="Qué le pedimos al reservar" meta="" derecha={<Boton texto="Editar" onClick={() => p.onCajon('pide')} />}>
          <div className="pubpide">{pedidos.map(({ text, on }) => <div key={text} className={on ? '' : 'off'}><PanelV29Icon name={on ? 'check' : 'x'} size={13} /><span>{text}</span></div>)}</div>
        </FxPanel>
        <FxPanel titulo="Obras sociales en la reserva" meta="la paciente ve el copago antes de confirmar" derecha={<Boton texto="Editar" onClick={() => p.onCajon('obras')} />} grande>
          {obras.length ? <div className="pubhr pubev">{obras.map(o => <div key={o.name}><b>{o.name}</b><span>{textoModo(o.mode, o.note)}</span><span className={`pill ${o.mode === 'copago' ? 'p-conf' : o.mode === 'reintegro' ? 'p-vid' : 'p-ok'}`}>{o.mode === 'no' ? 'No la acepta' : o.mode === 'completo' ? 'Sin cobertura' : o.mode === 'copago' ? 'Copago' : 'Reintegro'}</span></div>)}</div> : <SinObras />}
        </FxPanel>
      </div>
      <div className="c">
        <FxPanel titulo="Horarios de atención" meta="reservas en línea" derecha={<Boton texto="Editar" onClick={() => p.onCajon('horarios')} />}>
          <div className="pubhr">{horarios.map(([dia, texto, numero]) => <div key={dia} className={texto ? '' : 'off'}><b>{dia}</b><span>{texto ?? 'No atiendo'}</span><Interruptor etiqueta={`Atiende el ${dia.toLowerCase()}`} activo={Boolean(texto)} onCambiar={() => p.onDia(numero, !texto)} /></div>)}</div>
        </FxPanel>
        <FxPanel titulo="Confirmación y recordatorio" meta="por la app y por mail" grande>
          <div className="pubhr pubev">
            <div><b>{AVISOS[0][1]}</b><span>{AVISOS[0][2]}</span><Interruptor etiqueta="Confirmación al reservar" activo /></div>
            <div><b>24 h antes</b><span>recordatorio con «Confirmo» o «Necesito cambiar»</span><Interruptor etiqueta="Recordatorio 24 h antes" activo={config.reminders_enabled !== false} onCambiar={p.onRecordatorios} /></div>
            {AVISOS.slice(1).map(([clave, titulo, texto]) => <div key={clave}><b>{titulo}</b><span>{texto}</span><Interruptor etiqueta={titulo} activo={aviso(clave)} onCambiar={() => p.onAviso(clave, !aviso(clave))} /></div>)}
          </div>
          <small className="nthint">Hoy se envían la confirmación al reservar y el recordatorio de 24 h. Los otros avisos quedan guardados para cuando se activen.</small>
        </FxPanel>
      </div>
      <div className="c">
        <FxPanel titulo="Reservas en línea" meta={`${reservas.length} en total · ${confirmar} por confirmar`} derecha={<button className="lnk" type="button" onClick={p.onReservar}>Agenda <PanelV29Icon name="chev" size={11} /></button>} grande>
          <div className="fxs">{reservas.length ? <div className="pubrs">{reservas.map(reserva => { const [texto, tono] = ESTADO_RESERVA[reserva.status]; return <div key={reserva.id}><span className="av">{iniciales(reserva.contact_name)}</span><span className="t"><b>{reserva.contact_name}</b><small>{config.types.find(tipo => tipo.id === reserva.type_id)?.name ?? 'Consulta'} · {cuando(reserva.starts_at)}</small></span>{reserva.status === 'requested' ? <button type="button" className="sbtn k" onClick={() => p.onConfirmar(reserva.id)}>Aceptar</button> : <span className={`pill ${tono}`}>{texto}</span>}</div>; })}</div> : <p className="sxsub">Todavía no hay reservas desde la página.</p>}</div>
        </FxPanel>
        <FxPanel titulo="Cómo cobrás" meta="transferencia y Mercado Pago"><FxKv filas={[['Alias de transferencia', config.transfer_alias || 'Sin cargar'], ['Mercado Pago', p.mercadoPago ? 'Conectado' : 'Sin conectar'], ['Google Calendar', config.google_enabled ? 'Comprueba tus horarios' : 'No se usa']]} />{p.conexiones}</FxPanel>
      </div>
    </div>);
  }
  const reservasDelMes = reservas.filter(reserva => reserva.status !== 'cancelled' && mismoMes(reserva.created_at)).length;
  return marco(<div className="fx" style={{ gridTemplateColumns: '1.12fr 312px 1fr' }}>
    <div className="c">
      <FxPanel titulo="Perfil" meta={<span className={`pill ${p.publicada && !p.sinPublicar ? 'p-conf' : 'p-wait'}`}>{p.publicada ? (p.sinPublicar ? 'Cambios sin publicar' : 'Publicada') : 'Sin publicar'}</span>} derecha={<Boton texto="Editar" icono="pen" onClick={() => p.onCajon('perfil')} />}>
        <div className="pubpf">{fotoPublica(config.page, p.marcaLogo) ? <img className="av" src={fotoPublica(config.page, p.marcaLogo)} alt="" width={40} height={40} /> : <span className="av">{iniciales(config.page.title)}</span>}<span><b>{config.page.title}</b><small>{[config.page.contact || 'Nutricionista', extras?.license, extras?.area, etiquetaModalidad(extras?.modality)].filter(Boolean).join(' · ')}</small></span>{p.fotoBorrador ? <small className="nthint">Borrador: se ve en tu página al publicar.</small> : null}</div>
        <p className="pubbio">{config.page.bio || 'Todavía no escribiste una presentación.'}</p>
        {precioConsulta(extras?.consult_price_minor) ? <p className="pubbio">Consulta {precioConsulta(extras?.consult_price_minor)}</p> : null}
        {extras?.booking_url ? <p className="pubbio">Reserva: {extras.booking_url.replace(/^https?:\/\//, '')}</p> : null}
        {extras?.specialties?.length ? <div className="pubchips">{extras.specialties.map(e => <span key={e}>{e}</span>)}</div> : null}
      </FxPanel>
      <FxPanel titulo="Dónde atendés" meta={`${(config.page.location ? 1 : 0) + (config.create_meet ? 1 : 0)} lugares`} derecha={<Boton texto="Cambiar" onClick={() => p.onCajon('lugar')} />}>
        <FxKv filas={[['Consultorio', config.page.location || 'Sin cargar'], ['Videollamada', config.create_meet ? 'Meet, con el link en la app de la paciente' : 'Sin Meet automático'], ['Horarios', horarios.filter(([, t]) => t).length ? `${horarios.filter(([, t]) => t).length} días por semana` : 'Sin horarios cargados']]} />
      </FxPanel>
      <FxPanel titulo="Obras sociales" meta={obras.length ? `${obras.length} cargadas` : 'sin cargar'} derecha={<Boton texto="Editar" onClick={() => p.onCajon('obras')} />}>
        {obras.length ? <ListaObras obras={obras} /> : <SinObras />}
      </FxPanel>
      <FxPanel titulo="Opiniones" meta="0 verificadas" derecha={<span className="pubask">Pedir después del turno <Interruptor etiqueta="Pedir opinión después del turno" activo={extras?.notices?.review === true} onCambiar={() => p.onAviso('review', extras?.notices?.review !== true)} /></span>} grande>
        <p className="sxsub">Todavía no hay opiniones de pacientes. Cuando el pedido esté activo, las verificadas van a aparecer acá.</p>
      </FxPanel>
    </div>
    <div className="c"><FxPanel titulo="Así la ve una paciente nueva" meta="" derecha={<button className="lnk" type="button" onClick={() => p.onCajon('abrir')}>Abrir <PanelV29Icon name="chev" size={11} /></button>} grande clase="pubprev"><Celular config={config} publicados={config.types} marcaLogo={p.marcaLogo} fotoBorrador={p.fotoBorrador} /></FxPanel></div>
    <div className="c">
      <FxPanel titulo="Compartir" meta="">
        <div className="pubsh">{p.link ? <Qr link={p.link} /> : null}<div><small>Tu link</small><b>{linkCorto || 'Publicá la página para tener link'}</b><div className="pubshb"><Boton texto="Copiar link" icono="copy" clave onClick={p.onCopiar} deshabilitado={!p.link} /><Boton texto="Descargar QR" icono="dl" onClick={p.onDescargarQr} deshabilitado={!p.link} /></div><small className="nthint">El QR sirve para la puerta del consultorio o una tarjeta.</small></div></div>
      </FxPanel>
      <FxPanel titulo="Links por servicio" meta="para Instagram o tu estado">
        {config.types.length ? <div className="publk">{config.types.slice(0, 4).map(tipo => <div key={tipo.id}><span className="t"><b>{tipo.name}</b><small>{linkCorto || 'Sin publicar'}</small></span><button type="button" className="ibtn" onClick={p.onCopiar} disabled={!p.link} aria-label={`Copiar link de ${tipo.name}`}><PanelV29Icon name="copy" size={14} /></button></div>)}</div> : <p className="sxsub">Todavía no hay servicios.</p>}
        <small className="nthint">Por ahora todos los links abren tu página y la paciente elige el servicio ahí.</small>
      </FxPanel>
      <FxPanel titulo="Este mes" meta="visitas y reservas" grande>
        <div className="pubkp"><div><small>Visitas</small><b className="num">0</b><em>sin medir</em></div><div><small>Reservas</small><b className="num">{reservasDelMes}</b><em>este mes</em></div><div><small>Reservan</small><b className="num">—</b><em>sin visitas</em></div></div>
        <div className="pubsrc"><small>De dónde llegan</small><p className="sxsub">Todavía no medimos las visitas a tu página.</p></div>
        <button type="button" className="sbtn cbtn" onClick={p.onReservar}>Ver reservas en línea</button>
      </FxPanel>
    </div>
  </div>);
}
