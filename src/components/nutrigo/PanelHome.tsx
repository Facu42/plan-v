import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import type { Patient } from '../../types';
import type { IntakeHealthFact } from '../../types/intake';
import type { CrmWorkResponse } from '../../types/crm-work';
import type { BillingBoard } from '../../types/fees';
import type { SchedulingWorkspaceSnapshot } from '../../api/scheduling';
import { api } from '../../api/client';
import { careApi } from '../../api/care';
import { HOME_ZONE, homeAttention, homeDay, homeNews } from '../../lib/panel-home';
import { PanelV29Icon } from './PanelV29Icon';
import { movimientoReducido } from './panel-v29-motion';
import { useHomeData, type HomeFilter } from './use-home-data';
import {
  armarAtencion, armarConsultas, armarKpis, armarPendientes, encabezadoInicio, type Detalle, type DetalleExtra, type RangoConsultas,
} from './inicio-presentacion';

type Open = (href: string) => void;

/** Fecha del encabezado de Inicio como en el boceto: «Miércoles 21 de octubre». */
export function panelHomeWhen(now: Date) {
  const text = now.toLocaleDateString('es-AR', { timeZone: HOME_ZONE, weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Saludo de Inicio según la hora del consultorio, con el primer nombre si existe (nunca uno inventado). */
export function panelHomeGreeting(name: string, now: Date) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: HOME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(now));
  const greeting = hour < 12 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  return `${greeting}${name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ''}`;
}

/** Título y fecha del encabezado de Inicio: «Buen día, Verónica · 6 consultas hoy» y «Martes 21 de octubre · la próxima es a las 10:30». */
export function panelHomeHeading(name: string, patients: readonly Patient[], now: Date) {
  const { sufijo, proxima } = encabezadoInicio(patients, now);
  return { title: panelHomeGreeting(name, now), titleSuffix: sufijo, when: `${panelHomeWhen(now)} · ${proxima}` };
}

const TABS_PENDIENTES: Array<{ id: 'all' | 'hacer' | 'fel'; label: string }> = [{ id: 'all', label: 'Todos' }, { id: 'hacer', label: 'Para hacer' }, { id: 'fel', label: 'Felicitar' }];
const TABS_CONSULTAS: Array<{ id: RangoConsultas; label: string }> = [{ id: 'hoy', label: 'Hoy' }, { id: 'manana', label: 'Mañana' }, { id: 'semana', label: 'Semana' }];

const hechoCorto = (hecho: IntakeHealthFact | undefined) => !hecho || hecho.state === 'unknown' ? 'sin dato' : hecho.state === 'none' ? 'ninguna' : hecho.items.join(', ') || 'sin detalle';

/** Último peso y alergias o restricciones de la paciente elegida, con los mismos endpoints que ya usaba Inicio. */
function useExtraDe(pacienteId: string | undefined, hoy: string) {
  const [extras, setExtras] = useState<Record<string, DetalleExtra>>({});
  useEffect(() => {
    if (!pacienteId) return undefined;
    const controller = new AbortController();
    setExtras(previos => (previos[pacienteId] ? previos : { ...previos, [pacienteId]: { peso: 'Consultando…', alergias: '', restricciones: '', estado: 'cargando' } }));
    Promise.all([api.getProfessionalIntake(pacienteId, { signal: controller.signal }), careApi.snapshot(pacienteId, true, controller.signal)]).then(([intake, care]) => {
      if (controller.signal.aborted) return;
      const pesos = care.measurements.filter(m => m.kind === 'weight' && m.captured_on <= hoy).sort((a, b) => b.captured_on.localeCompare(a.captured_on) || b.created_at.localeCompare(a.created_at));
      const peso = pesos[0];
      setExtras(previos => ({ ...previos, [pacienteId]: {
        peso: peso ? `${peso.value_numeric.toLocaleString('es-AR')} ${peso.unit}` : 'Sin dato',
        alergias: hechoCorto(intake.intake.payload.allergies), restricciones: hechoCorto(intake.intake.payload.restrictions), estado: 'listo',
      } }));
    }).catch(() => {
      if (!controller.signal.aborted) setExtras(previos => ({ ...previos, [pacienteId]: { peso: 'No disponible', alergias: '', restricciones: '', estado: 'error' } }));
    });
    return () => controller.abort();
  }, [pacienteId, hoy]);
  return extras;
}

/** Las seis formas de línea del boceto («J · Noche»): cada 4,5 s se dibuja la siguiente. */
const RAYOS = (cx: number, cy: number, r: number) => Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; return `M${cx} ${cy}L${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`; });
const FORMAS: Array<{ paths: string[]; circles?: Array<[number, number, number]> }> = [
  { paths: ['M70 200C90 150 112 100 150 40', ...[[96, 150], [106, 128], [116, 106], [127, 85], [139, 64]].map(([x, y]) => `M${x} ${y}c-16-4-24-16-22-30 14 4 22 16 22 30zM${x} ${y}c6-14 18-20 32-16-6 14-18 20-32 16z`)] },
  { paths: ['M112 70c-10-12-34-16-50-2-22 20-14 66 8 88 12 12 28 14 42 4 14 10 30 8 42-4 22-22 30-68 8-88-16-14-40-10-50 2z', 'M112 70c0-14 4-24 12-32', 'M120 50c8-16 28-20 40-12-8 16-26 20-40 12z'] },
  { paths: RAYOS(112, 116, 60), circles: [[112, 116, 70], [112, 116, 60]] },
  { paths: ['M112 44c-26 0-38 30-44 60-8 40 10 82 44 82s52-42 44-82c-6-30-18-60-44-60z'], circles: [[112, 134, 22]] },
  { paths: ['M66 186L136 72c10-8 22 2 16 14L82 196c-6 6-20 0-16-10z', 'M96 150l12 6M112 124l12 6M124 102l10 6', 'M146 70c4-16 14-26 28-28M142 66c-4-16 2-30 12-38M152 76c14-6 28-2 34 8'] },
  { paths: ['M60 196C80 150 110 110 160 70', 'M88 150c-24-2-36-16-36-34 22 0 36 14 36 34zM104 124c4-22 20-34 38-32-2 22-18 32-38 32zM120 106c-22-6-30-22-26-40 20 6 30 22 26 40zM140 84c6-20 24-28 40-22-6 20-24 28-40 22z'] },
];
const CAMBIO_FORMA_MS = 4500;

function Fondo({ forma }: { forma: number }) {
  const actual = FORMAS[forma % FORMAS.length]!;
  return <>
    <div className="gbg" aria-hidden="true"><i className="b1" /><i className="b2" /><i className="b3" /><i className="b4" /><i className="b5" />
      <svg className="grain"><filter id="gn"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#gn)" /></svg></div>
    <svg className="shape" viewBox="0 0 200 200" aria-hidden="true"><g className="sway" key={forma}>
      {actual.circles?.map(([cx, cy, r], i) => <circle key={`c${i}`} className="ln" pathLength={1} cx={cx} cy={cy} r={r} style={{ '--i': i } as CSSProperties} />)}
      {actual.paths.map((d, i) => <path key={d} className="ln" pathLength={1} d={d} style={{ '--i': i } as CSSProperties} />)}</g></svg>
  </>;
}

/** Cuenta hasta el número como el boceto (1,1 s, frena al final). Sin movimiento o sin cifra, deja el texto. Solo la primera vez que aparece. */
export function Cuenta({ valor }: { valor: string }) {
  const [texto, setTexto] = useState(valor);
  const hecho = useRef(false);
  useEffect(() => {
    setTexto(valor);
    if (hecho.current || movimientoReducido() || valor.includes(':')) return undefined;
    const m = valor.match(/^([^\d]*)([\d.]*\d(?:,\d+)?)(.*)$/);
    if (!m) return undefined;
    const decimales = (m[2]!.split(',')[1] ?? '').length;
    const meta = parseFloat(m[2]!.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(meta)) return undefined;
    hecho.current = true;
    const inicio = performance.now();
    let cuadro = 0;
    const paso = (ahora: number) => {
      const k = Math.min(1, (ahora - inicio) / 1100);
      const avance = 1 - (1 - k) ** 3;
      setTexto(`${m[1]}${(meta * avance).toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}${m[3]}`);
      if (k < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor]);
  return <>{texto}</>;
}

/** Tarjeta oscura «J · Noche» del boceto: lo que se toca en las listas se muestra acá. */
function TarjetaDetalle({ detalle, posicion, total, onOpen }: { detalle: Detalle; posicion: number; total: number; onOpen: Open }) {
  const [forma, setForma] = useState(0);
  useEffect(() => {
    if (movimientoReducido()) return undefined;
    const reloj = window.setInterval(() => setForma(actual => (actual + 1) % FORMAS.length), CAMBIO_FORMA_MS);
    return () => window.clearInterval(reloj);
  }, []);
  // El fondo y la forma siguen al puntero, cada uno para su lado (18/14 px y −12/−10 px del boceto).
  const mover = (evento: PointerEvent<HTMLDivElement>) => {
    if (movimientoReducido()) return;
    const caja = evento.currentTarget.getBoundingClientRect();
    evento.currentTarget.style.setProperty('--px', String((evento.clientX - caja.left) / caja.width - 0.5));
    evento.currentTarget.style.setProperty('--py', String((evento.clientY - caja.top) / caja.height - 0.5));
  };
  const soltar = (evento: PointerEvent<HTMLDivElement>) => { evento.currentTarget.style.setProperty('--px', '0'); evento.currentTarget.style.setProperty('--py', '0'); };
  return <div className="dv dvx dv-j" id="det" aria-live="polite" data-detalle={detalle.hd} onPointerMove={mover} onPointerLeave={soltar}>
    <Fondo forma={forma} />
    <div className="hd"><span className="xchip"><PanelV29Icon name="spark" size={13} />{detalle.hd}</span><span className="sp" />
      {detalle.live ? <span className="xlive"><i />{detalle.live}</span> : null}{total ? <span className="num">{posicion} de {total}</span> : null}</div>
    <div className="xhero"><b className="num gnum"><Cuenta valor={detalle.hero} /></b><span>{detalle.unidad}{detalle.unidad && detalle.leyenda ? <br /> : null}{detalle.leyenda}</span></div>
    <div className="xname"><b>{detalle.nombre}</b> · {detalle.sub}</div>
    {detalle.grid ? <div className="xgrid">{detalle.grid.map(([a, b, c], i) => <div key={a} style={{ '--i': i } as CSSProperties}><small className="l">{a}</small><span className="v num">{b}{c ? <> <em className="e" style={{ display: 'inline' }}>{c}</em></> : null}</span></div>)}</div> : null}
    {detalle.lista ? <div className="xlist">{detalle.lista.map(([a, b]) => <div key={`${a}:${b}`}><span>{a}</span><b>{b}</b></div>)}</div> : null}
    {detalle.observaciones || detalle.sinObservaciones ? <div className="xobs"><small className="l">Observaciones</small><div>
      {detalle.observaciones ? detalle.observaciones.map(obs => <span key={obs.titulo} className={`ob ${obs.clase}`} title={`${obs.titulo}: ${obs.texto}`}><PanelV29Icon name={obs.icono} size={12} /><b>{obs.titulo}</b> <em>{obs.texto}</em></span>)
        : <span className="ob p0"><b>{detalle.sinObservaciones}</b></span>}</div></div> : null}
    <div className="xacts">{detalle.acciones.map((accion, i) => <button type="button" key={accion.texto} style={{ '--i': i } as CSSProperties} className={accion.principal ? 'go' : undefined} onClick={() => onOpen(accion.href)}>
      {accion.principal ? null : <PanelV29Icon name={accion.icono} size={13} />}{accion.texto}{accion.principal ? <span className="ar"><PanelV29Icon name="chev" size={13} /></span> : null}</button>)}</div>
  </div>;
}

const VACIO: Detalle = {
  hd: 'Todo al día', iniciales: '·', fondo: 'transparent', nombre: 'Tu bandeja está al día', sub: 'Cuando haya algo para hacer, lo ves acá', hero: '0', unidad: 'pendientes',
  acciones: [{ icono: 'cal', texto: 'Abrir agenda', href: '/crm/agenda' }, { icono: 'users', texto: 'Ver pacientes', href: '/crm/pacientes', principal: true }],
};

type ViewProps = {
  patients: Patient[]; now: Date; data: CrmWorkResponse | null; loading: boolean; error: string; kind?: HomeFilter;
  onKind?: (kind: HomeFilter) => void; onRefresh: () => void; onNext: () => void; hasPrevious: boolean;
  board: BillingBoard | null; billingError: boolean; scheduling: SchedulingWorkspaceSnapshot | null; schedulingError: boolean;
  onOpen: Open;
};

function Mensaje({ children }: { children: ReactNode }) {
  return <p className="sxsub">{children}</p>;
}

export function PanelHomeView({ patients, now, data, loading, error, onRefresh, onNext, hasPrevious, board, billingError, scheduling, schedulingError, onOpen }: ViewProps) {
  const [filtro, setFiltro] = useState<'all' | 'hacer' | 'fel'>('all');
  const [rango, setRango] = useState<RangoConsultas>('hoy');
  const [elegida, setElegida] = useState<string | null>(null);
  const hoy = homeDay(now);
  const reservas = useMemo(() => (scheduling?.bookings ?? []).filter(reserva => reserva.status === 'requested').map(reserva => ({
    id: reserva.id, nombre: reserva.contact_name,
    cuando: new Date(reserva.starts_at).toLocaleString('es-AR', { timeZone: HOME_ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  })), [scheduling]);
  const [pidiendo, setPidiendo] = useState<string | undefined>(undefined);
  const extras = useExtraDe(pidiendo, hoy);
  const entrada = useMemo(() => ({
    pacientes: patients, ahora: now, data, reservas, rachas: data?.home?.meal_streaks ?? [],
    novedades: homeNews(patients, now, data?.home?.meal_streaks), atencion: homeAttention(patients, data?.home?.quiet ?? []),
  }), [patients, now, data, reservas]);
  const pendientes = useMemo(() => armarPendientes(entrada, extras), [entrada, extras]);
  const atencion = useMemo(() => armarAtencion(entrada, extras), [entrada, extras]);
  const visibles = pendientes.filter(fila => filtro === 'all' || fila.filtro === filtro);
  const activa = visibles.find(fila => fila.key === elegida) ?? atencion.find(fila => fila.key === elegida) ?? visibles[0] ?? atencion[0];
  const detalle = activa?.detalle ?? VACIO;
  useEffect(() => { setPidiendo(detalle.pacienteId); }, [detalle.pacienteId]);
  const enAtencion = atencion.some(fila => fila.key === activa?.key);
  const lista = enAtencion ? atencion : visibles;
  const posicion = Math.max(0, lista.findIndex(fila => fila.key === activa?.key)) + 1;
  const consultas = useMemo(() => armarConsultas(patients, now, rango, board), [patients, now, rango, board]);
  const porVideo = consultas.filter(fila => fila.video).length;
  const kpis = useMemo(() => armarKpis(patients, now, board, billingError), [patients, now, board, billingError]);
  const abrir = (href: string) => (evento: MouseEvent<HTMLAnchorElement>) => {
    if (evento.button || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault(); onOpen(href);
  };
  const cargandoLista = loading && !data;
  return <div className="scr" id="s-inicio">
    <section className="iup" data-mk="1">
      <div className="card">
        <div className="ch"><h2>Pendientes</h2><span className="meta num" id="pcount">{cargandoLista || error ? '—' : visibles.length}</span><span className="sp" />
          <div className="tabs" id="pfil2">{TABS_PENDIENTES.map(tab => <button key={tab.id} type="button" className={filtro === tab.id ? 'on' : undefined} aria-pressed={filtro === tab.id} onClick={() => setFiltro(tab.id)}>{tab.label}</button>)}</div></div>
        <div className="lst" id="plist" tabIndex={0} aria-label="Lista de pendientes">
          {cargandoLista ? <Mensaje>Consultando pendientes…</Mensaje> : error ? <Mensaje>{error} <button type="button" className="lnk" onClick={onRefresh}>Reintentar pendientes</button></Mensaje> : visibles.length
            ? visibles.map(fila => <button type="button" key={fila.key} className={`li pick${fila.key === activa?.key ? ' sel' : ''}`} onClick={() => setElegida(fila.key)}>
              <span className={`ico ${fila.tono}`}><PanelV29Icon name={fila.icono} /></span><span className="tx"><b>{fila.titulo}</b><small>{fila.sub}</small></span><span className="kind">{fila.tipo}</span></button>)
            : <Mensaje>No hay pendientes en esta lista.</Mensaje>}
          {!error && (hasPrevious || data?.next_cursor) ? <div className="sxacts">{hasPrevious ? <button type="button" className="lnk" onClick={onRefresh}>Volver al principio</button> : null}{data?.next_cursor ? <button type="button" className="lnk" onClick={onNext}>Siguientes pendientes</button> : null}</div> : null}
          {schedulingError ? <Mensaje>Reservas no disponibles. <button type="button" className="lnk" onClick={onRefresh}>Reintentar reservas</button></Mensaje> : null}
          {data?.source === 'memory' ? <Mensaje>Modo demo · datos ficticios.</Mensaje> : null}
        </div>
      </div>
      <div className="card">
        <div className="ch"><h2>Necesitan atención</h2><span className="meta num">{atencion.length}</span><span className="sp" /><a className="lnk" href="/crm/seguimiento" onClick={abrir('/crm/seguimiento')}>Seguimiento</a></div>
        <div className="lst" id="alist" tabIndex={0} aria-label="Pacientes que necesitan atención">
          {atencion.length ? atencion.map(fila => <button type="button" key={fila.key} className={`li pick${fila.key === activa?.key ? ' sel' : ''}`} onClick={() => setElegida(fila.key)}>
            <span className="av" style={{ background: fila.fondo }}>{fila.iniciales}</span><span className="tx"><b>{fila.nombre}</b><small>{fila.sub}</small></span>
            <span className="why" style={{ background: `var(--${fila.tono === 'r' ? 'rojo' : 'azaf'}-t)`, color: `var(--${fila.tono === 'r' ? 'rojo' : 'azaf'}-ink)` }}>{fila.motivo}</span></button>)
            : <Mensaje>Sin alertas en los datos disponibles.</Mensaje>}
        </div>
      </div>
      <TarjetaDetalle key={activa?.key ?? 'vacio'} detalle={detalle} posicion={posicion} total={lista.length} onOpen={onOpen} />
    </section>
    <section className="hoy">
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="ch"><h2>{rango === 'hoy' ? 'Consultas de hoy' : rango === 'manana' ? 'Consultas de mañana' : 'Consultas de la semana'}</h2>
          <span className="meta num">{consultas.length} {consultas.length === 1 ? 'consulta' : 'consultas'} · {porVideo} por videollamada</span><span className="sp" />
          <div className="tabs">{TABS_CONSULTAS.map(tab => <button key={tab.id} type="button" className={rango === tab.id ? 'on' : undefined} aria-pressed={rango === tab.id} onClick={() => setRango(tab.id)}>{tab.label}</button>)}</div>
          <a className="lnk" href="/crm/agenda" onClick={abrir('/crm/agenda')}>Agenda <PanelV29Icon name="chev" size={12} /></a></div>
        <table>
          <thead><tr><th>Hora</th><th>Paciente</th><th>Consulta</th><th>Modalidad</th><th>Adherencia</th><th>Cuota</th><th>Estado</th></tr></thead>
          <tbody id="rows">{consultas.length ? consultas.map(fila => <tr key={fila.key} className={fila.clase}>
            <td className="num">{fila.dia ? `${fila.dia} · ` : ''}{fila.hora}</td>
            <td><a className="rowlink" href={fila.href} onClick={abrir(fila.href)}><div className="who"><span className="av" style={{ background: fila.fondo }}>{fila.iniciales}</span><div><b>{fila.nombre}</b></div></div></a></td>
            <td>{fila.consulta}</td><td><span className="mod"><PanelV29Icon name={fila.video ? 'video' : 'door'} size={13} />{fila.modalidad}</span></td>
            <td>{fila.adherencia == null ? <span style={{ color: 'var(--ink3)' }}>Sin dato</span> : <div className="adh"><span className="tr"><i className={fila.adherencia < 70 ? 'lo' : undefined} style={{ width: `${fila.adherencia}%` }} /></span><span className="num">{fila.adherencia}%</span></div>}</td>
            <td style={{ color: fila.cuotaHoy ? 'var(--azaf-ink)' : 'var(--ink2)' }}>{fila.cuota}</td>
            <td><span className={`pill ${fila.pill}`}>{fila.estado}</span></td></tr>)
            : <tr><td colSpan={7} style={{ color: 'var(--ink3)' }}>{rango === 'hoy' ? 'No tenés consultas programadas para hoy.' : rango === 'manana' ? 'No tenés consultas programadas para mañana.' : 'No tenés consultas programadas esta semana.'}</td></tr>}</tbody>
        </table>
      </div>
    </section>
    <section className="kpis" data-mk="2">
      <div className="card kpi" style={{ '--i': 0 } as CSSProperties}><div className="lb"><PanelV29Icon name={kpis.consultas.icono} />{kpis.consultas.etiqueta}</div>
        <div className="row"><div className="v num"><Cuenta valor={kpis.consultas.valor} /><small>{kpis.consultas.unidad}</small></div><div className="kv kslots" aria-hidden="true">{kpis.consultas.puntos.map((clase, i) => <i key={i} className={clase} style={{ '--i': i } as CSSProperties} />)}</div></div>
        <div className="ft"><span className={`dl ${kpis.consultas.pie.clase}`}>{kpis.consultas.pie.destacado}</span>{kpis.consultas.pie.resto}</div></div>
      <div className="card kpi" style={{ '--i': 1 } as CSSProperties}><div className="lb"><PanelV29Icon name={kpis.pacientes.icono} />{kpis.pacientes.etiqueta}</div>
        <div className="row"><div className="v num"><Cuenta valor={kpis.pacientes.valor} /></div><div className="kv kcols" aria-hidden="true">{kpis.pacientes.columnas.map(col => <span key={col.mes}><i style={{ height: col.alto }} /><small>{col.mes}</small></span>)}</div></div>
        <div className="ft"><span className={`dl ${kpis.pacientes.pie.clase}`}>{kpis.pacientes.pie.destacado}</span>{kpis.pacientes.pie.resto}</div></div>
      <div className="card kpi" style={{ '--i': 2 } as CSSProperties}><div className="lb"><PanelV29Icon name={kpis.adherencia.icono} />{kpis.adherencia.etiqueta}</div>
        <div className="row"><div className="v num"><Cuenta valor={kpis.adherencia.valor} />{kpis.adherencia.unidad ? <small>{kpis.adherencia.unidad}</small> : null}</div>
          <div className="kv kring" aria-hidden="true"><svg viewBox="0 0 40 40"><circle className="bg" cx="20" cy="20" r="15" /><circle className="fg" cx="20" cy="20" r="15" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - kpis.adherencia.anillo} /></svg><span>{kpis.adherencia.leyenda}</span></div></div>
        <div className="ft"><span className="dl">{kpis.adherencia.pie.destacado}</span>{kpis.adherencia.pie.resto}</div></div>
      <div className="card kpi" style={{ '--i': 3 } as CSSProperties}><div className="lb"><PanelV29Icon name={kpis.cobrado.icono} />{kpis.cobrado.etiqueta}</div>
        <div className="row"><div className="v num"><Cuenta valor={kpis.cobrado.valor} />{kpis.cobrado.unidad ? <small>{kpis.cobrado.unidad}</small> : null}</div>
          <div className="kv kweek" aria-hidden="true"><small>{kpis.cobrado.leyenda}</small><div>{kpis.cobrado.semanas.map((ancho, i) => <i key={i} style={{ width: `${ancho}%` }} />)}</div></div></div>
        <div className="ft"><span className={`dl ${kpis.cobrado.pie.clase}`}>{kpis.cobrado.pie.destacado}</span>{kpis.cobrado.pie.resto}</div></div>
      <div className="card kpi" style={{ '--i': 4 } as CSSProperties}><div className="lb"><PanelV29Icon name={kpis.porCobrar.icono} />{kpis.porCobrar.etiqueta}</div>
        <div className="row"><div className="v num"><Cuenta valor={kpis.porCobrar.valor} />{kpis.porCobrar.unidad ? <small>{kpis.porCobrar.unidad}</small> : null}</div>
          <div className="kv klol" aria-hidden="true">{kpis.porCobrar.barras.map((barra, i) => <span key={i}><i style={{ height: barra.alto }} /><b /><small>{barra.dias}d</small></span>)}</div></div>
        <div className="ft"><span className={`dl ${kpis.porCobrar.pie.clase}`}>{kpis.porCobrar.pie.destacado}</span>{kpis.porCobrar.pie.resto}{kpis.porCobrar.reintentar ? <button type="button" className="lnk" onClick={onRefresh}>Reintentar cobros</button> : null}</div></div>
    </section>
  </div>;
}

export function PanelHome({ patients, now, onOpen }: { patients: Patient[]; now: Date; onOpen: Open }) {
  const state = useHomeData(homeDay(now));
  return <PanelHomeView {...state} patients={patients} now={now} onOpen={onOpen} />;
}
