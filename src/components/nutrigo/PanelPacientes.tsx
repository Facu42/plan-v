import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Patient } from '../../types';
import type { BillingBoard } from '../../types/fees';
import type { PatientQuickPreview, PatientRowPreview } from '../../types/patient-preview';
import { careApi } from '../../api/care';
import { crmWorkApi } from '../../api/crm-work';
import { homeDay, patientHref, patientMessageHref } from '../../lib/panel-home';
import { PanelV29Icon } from './PanelV29Icon';
import { Cuenta } from './PanelHome';
import { fondoAvatar, inicialesDe } from './seguimiento-presentacion';
import { SALIDA_DETALLE_MS, movimientoReducido } from './panel-v29-motion';
import {
  avanceDe, barrasDeLaSemana, estadoDe, graficoDeAvance, graficoDePeso, hechosRecientes, pacienteDesde, proximaConsulta,
  serieDePeso, turnoDetalle, ultimoRegistro, type Previews, type PuntoPeso, type BarraDia,
} from './pacientes-presentacion';

const LOTE_DE_RESUMENES = 50;
const TEXTO_SIN_PATOLOGIAS = ['Sin patologías declaradas', 'se completa en la historia clínica'] as const;

/** Plan y último peso de cada paciente, de a 50. Se refresca al volver a la pestaña y cuando cambia la atención. */
export function usePreviews(patients: readonly Patient[]) {
  const [previews, setPreviews] = useState<Record<string, PatientRowPreview>>({});
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const ids = patients.filter(p => !p.archived_at).map(p => p.id).join('\n');
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    const lista = ids.split('\n').filter(Boolean);
    void (async () => {
      for (let i = 0; i < lista.length; i += LOTE_DE_RESUMENES) {
        const lote = lista.slice(i, i + LOTE_DE_RESUMENES);
        const resultado = await crmWorkApi.patientRows(lote, controller.signal);
        if (controller.signal.aborted) return;
        if (resultado.patients.length !== lote.length || resultado.patients.some(p => !lote.includes(p.patient_id))) throw Error('Resumen inválido');
        setPreviews(actual => ({ ...actual, ...Object.fromEntries(resultado.patients.map(p => [p.patient_id, p])) }));
      }
    })().catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [ids, revision]);
  useEffect(() => {
    const refrescar = () => { setPreviews({}); setRevision(n => n + 1); };
    window.addEventListener('focus', refrescar); window.addEventListener('plan-v:care-changed', refrescar);
    return () => { window.removeEventListener('focus', refrescar); window.removeEventListener('plan-v:care-changed', refrescar); };
  }, []);
  return { previews, error, reintentar: () => setRevision(n => n + 1) };
}

export type AccionesPaciente = {
  onFollow: (id: string) => void; onRecord?: (id: string) => void; onPlan?: (id: string) => void; onMessage?: (id: string) => void;
  onAgenda: () => void; onEdit: (p: Patient) => void; onInvite: (p: Patient) => void; onArchive: (p: Patient, archived: boolean) => void;
  archiveConfirmation: string | null; busyId: string | null;
};

type DatosDetalle = { serie: PuntoPeso[]; comidas: Array<{ logged_at: string }>; vista: PatientQuickPreview | null; estado: 'cargando' | 'listo' | 'error' };
const VACIO: DatosDetalle = { serie: [], comidas: [], vista: null, estado: 'cargando' };

/** Peso, comidas de la semana y última consulta de quien se despliega. Cada fuente falla por su cuenta. */
function useDetalle(paciente: Patient, ahora: Date): DatosDetalle {
  const [datos, setDatos] = useState<DatosDetalle>(VACIO);
  useEffect(() => {
    if (paciente.archived_at) { setDatos({ ...VACIO, estado: 'listo' }); return undefined; }
    const controller = new AbortController();
    setDatos(VACIO);
    const hoy = homeDay(ahora);
    void Promise.allSettled([
      careApi.snapshot(paciente.id, true, controller.signal), crmWorkApi.patientMeals(paciente.id, { days: 7, limit: 100 }, controller.signal), crmWorkApi.patientPreview(paciente.id, controller.signal),
    ]).then(([cuidado, comidas, vista]) => {
      if (controller.signal.aborted) return;
      setDatos({
        serie: cuidado.status === 'fulfilled' ? serieDePeso(cuidado.value.measurements, hoy) : [],
        comidas: comidas.status === 'fulfilled' ? comidas.value.logs : [], vista: vista.status === 'fulfilled' ? vista.value : null,
        estado: [cuidado, comidas, vista].every(r => r.status === 'rejected') ? 'error' : 'listo',
      });
    });
    return () => controller.abort();
  }, [paciente.id, paciente.archived_at, homeDay(ahora)]); // eslint-disable-line react-hooks/exhaustive-deps
  return datos;
}

function GraficoPeso({ serie, objetivo, uid }: { serie: PuntoPeso[]; objetivo: string; uid: string }) {
  const g = graficoDePeso(serie, objetivo);
  return <svg className="pw-g" viewBox={`0 0 ${g.ancho} ${g.alto}`} aria-hidden="true">
    <defs><linearGradient id={`pwg${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="s1" /><stop offset="1" className="s2" /></linearGradient></defs>
    {g.meta ? <><line className="goal" x1={4} x2={g.meta.xFin} y1={g.meta.y.toFixed(1)} y2={g.meta.y.toFixed(1)} /><text className="gt" x={g.meta.xFin + 3} y={(g.meta.y + 3).toFixed(1)}>{g.meta.kg}</text></> : null}
    {g.ultimo ? <><path className="ar" d={g.area} style={{ fill: `url(#pwg${uid})` }} /><path className="ln" pathLength={1} d={g.curva} /></> : null}
    {g.puntos.map(([x, y], k) => <circle key={k} className="dt" cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.8" style={{ '--i': k } as CSSProperties} />)}
    {g.ultimo ? <><circle className="now" cx={g.ultimo[0].toFixed(1)} cy={g.ultimo[1].toFixed(1)} r="4" /><text className="nt" x={g.ultimo[0].toFixed(1)} y={(g.ultimo[1] - 8).toFixed(1)} textAnchor="middle">{g.actual}</text></> : null}
  </svg>;
}

/** En celular la tabla muestra tres columnas (flecha, paciente, estado): el resumen ocupa solo esas. */
const COLUMNAS_ESCRITORIO = 7;
const COLUMNAS_CELULAR = 3;
const columnasVisibles = () => (typeof document !== 'undefined' && document.querySelector('#pv-panel-v29.mob') ? COLUMNAS_CELULAR : COLUMNAS_ESCRITORIO);

function Detalle({ paciente, ahora, previews, acciones, onOpen, saliendo }: { paciente: Patient; ahora: Date; previews: Previews; acciones: AccionesPaciente; onOpen: (href: string) => void; saliendo: boolean }) {
  const datos = useDetalle(paciente, ahora);
  const preview = previews[paciente.id];
  const abrir = (href: string) => (evento: MouseEvent) => { evento.stopPropagation(); onOpen(href); };
  const peso = graficoDePeso(datos.serie, paciente.goal);
  const ultimoPeso = datos.serie[datos.serie.length - 1]?.valor ?? preview?.latest_weight?.value ?? null;
  const avance = avanceDe(paciente, preview)?.pct ?? 0;
  const anillo = graficoDeAvance(avance, paciente.goal, ultimoPeso);
  const semana = barrasDeLaSemana(datos.comidas, ahora);
  const registro = ultimoRegistro(paciente, ahora);
  const conRegistros = (paciente.weekly_registration?.recorded_days ?? 0) > 0 || paciente.adherence_score > 0;
  const turno = turnoDetalle(paciente, ahora);
  const hechos = hechosRecientes(paciente, preview ?? datos.vista ?? undefined, ahora);
  const nota = datos.vista?.last_consultation;
  const archivada = Boolean(paciente.archived_at);
  const nombre = paciente.name;
  return <tr className="det"><td colSpan={columnasVisibles()}><div className={`pd${saliendo ? ' out' : ''}`}><div className="pdin" data-mk="1">
    <section className="pd-who">
      <div className="pd-goal"><small>Objetivo</small><b>{paciente.goal || 'Por definir'}</b></div>
      <div className="pd-goal"><small>Paciente desde</small><b>{pacienteDesde(paciente.created_at, ahora)}</b></div>
      <div className="pd-pl"><div className="p0"><b>{TEXTO_SIN_PATOLOGIAS[0]}</b><small>{TEXTO_SIN_PATOLOGIAS[1]}</small></div></div>
      {!archivada ? <div className="pd-acts">
        <button type="button" className="go" data-go="ficha" aria-label={`Abrir ficha de ${nombre}`} onClick={() => acciones.onRecord ? acciones.onRecord(paciente.id) : onOpen(patientHref(paciente))}><PanelV29Icon name="file" size={14} />Abrir ficha</button>
        <button type="button" aria-label={`Abrir plan de ${nombre}`} onClick={() => acciones.onPlan ? acciones.onPlan(paciente.id) : onOpen(patientHref(paciente, 'plan'))}><PanelV29Icon name="clip" size={14} />Plan</button>
        {paciente.has_account !== false ? <button type="button" aria-label={`Escribirle a ${nombre}`} onClick={() => acciones.onMessage ? acciones.onMessage(paciente.id) : onOpen(patientMessageHref(paciente))}><PanelV29Icon name="chat" size={14} />Mensaje</button> : <button type="button" aria-label={`Invitar a ${nombre}`} disabled={acciones.busyId === paciente.id} onClick={() => acciones.onInvite(paciente)}><PanelV29Icon name="chat" size={14} />Invitar</button>}
        <button type="button" aria-label={`Agendar a ${nombre}`} onClick={() => acciones.onAgenda()}><PanelV29Icon name="cal" size={14} />Agendar</button>
      </div> : null}
      <div className="pd-more">
        {!archivada ? <><button type="button" className="lnk" aria-label={`Ver seguimiento de ${nombre}`} onClick={() => acciones.onFollow(paciente.id)}>Seguimiento</button>
          <button type="button" className="lnk" aria-label={`Editar ficha de ${nombre}`} onClick={() => acciones.onEdit(paciente)}>Editar</button></> : null}
        <button type="button" className={`lnk${acciones.archiveConfirmation === paciente.id ? ' warn' : ''}`} disabled={acciones.busyId === paciente.id}
          aria-label={paciente.archived_at ? `Restaurar ${nombre}` : acciones.archiveConfirmation === paciente.id ? `Confirmar archivo de ${nombre}` : `Archivar ${nombre}`}
          onClick={() => acciones.onArchive(paciente, !paciente.archived_at)}>
          {acciones.busyId === paciente.id ? 'Guardando…' : paciente.archived_at ? 'Restaurar' : acciones.archiveConfirmation === paciente.id ? 'Confirmar archivo' : 'Archivar'}</button>
      </div>
    </section>
    <section className="pd-nums" data-mk="1">
      <div className="pd-t"><small>Peso actual</small>
        <div className="pd-v"><b className="num">{peso.ultimo ? <Cuenta valor={peso.actual} /> : '—'}</b><span>{peso.ultimo ? 'kg' : ''}</span>{peso.variacion ? <em className={peso.variacion.sube ? 'bad' : undefined}>{peso.variacion.texto}</em> : null}</div>
        <GraficoPeso serie={datos.serie} objetivo={paciente.goal} uid={paciente.id} /><small className="ft">{datos.estado === 'cargando' ? 'consultando mediciones…' : peso.pie}</small></div>
      <div className="pd-t"><small>Avance al objetivo</small>
        <div className="pg"><svg className="pg-g" viewBox="0 0 160 88" aria-hidden="true"><path className="tr" pathLength={100} d={anillo.arco} />
          {anillo.marcas.map(([x1, y1, x2, y2], k) => <line key={k} className="tk" x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} style={{ '--i': k } as CSSProperties} />)}
          <path className="pv" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - avance} d={anillo.arco} />
          {anillo.fin ? <circle className="end" cx={anillo.fin[0].toFixed(1)} cy={anillo.fin[1].toFixed(1)} r="5" /> : null}</svg>
          <div className="pg-v"><b className="num"><Cuenta valor={String(avance)} /></b><span>%</span></div></div>
        <small className="ft">{anillo.pie}</small></div>
      <div className="pd-t"><small>Adherencia, 7 días</small>
        <div className="pd-v"><b className="num">{conRegistros ? <Cuenta valor={String(Math.round(paciente.adherence_score))} /> : '—'}</b><span>{conRegistros ? '%' : ''}</span></div>
        <div className="pa7">{conRegistros && semana.total ? <span className="avg" style={{ bottom: `calc(${semana.promedio}% * .78 + 18px)` }}><em>prom. {semana.promedio}</em></span> : null}
          {semana.barras.map((barra: BarraDia, k) => <div key={k} className={barra.hoy ? 'td' : undefined}>{barra.hoy && barra.comidas ? <u className="num">{barra.alto}</u> : null}<i className={barra.nivel || undefined} style={{ height: `${barra.comidas ? Math.max(barra.alto * .78, 6) : 4}%`, '--i': k } as CSSProperties} /><small>{barra.letra}</small></div>)}</div>
        <small className="ft">{semana.total ? `${semana.total} ${semana.total === 1 ? 'comida registrada' : 'comidas registradas'} en 7 días` : conRegistros || registro.texto !== 'sin registros' ? 'sin comidas en los últimos 7 días' : 'sin registros todavía'}</small></div>
    </section>
    <section className="pd-act">
      <div className="pd-next"><small>Próximo turno</small><b className="num">{turno.cuando}</b><span>{turno.sub}</span></div>
      <ol className="pd-tl">{hechos.map((hecho, k) => <li key={k} style={{ '--i': k } as CSSProperties}><i /><span>{hecho.texto}</span><time>{hecho.cuando}</time></li>)}</ol>
      <blockquote className="pd-note">{nota?.summary ? `«${nota.summary}»` : datos.estado === 'cargando' ? 'Consultando la última nota…' : 'Todavía no hay un resumen publicado de la consulta.'}
        {nota ? <cite>Última consulta · {nota.date.slice(0, 10).split('-').reverse().join('/')}</cite> : null}</blockquote>
    </section>
  </div></div></td></tr>;
}

export function PanelPacientes({ pacientes, ahora, board, billingError, previews, acciones, onOpen, abierta, onAbrir }: {
  pacientes: readonly Patient[]; ahora: Date; board: BillingBoard | null; billingError: boolean; previews: Previews; acciones: AccionesPaciente;
  onOpen: (href: string) => void; abierta?: string | null; onAbrir?: (id: string | null) => void;
}) {
  const [propia, setPropia] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState<string | null>(null);
  const reloj = useRef<number | undefined>(undefined);
  const elegida = abierta === undefined ? propia : abierta;
  const hoy = homeDay(ahora);
  useEffect(() => () => window.clearTimeout(reloj.current), []);
  useEffect(() => { if (elegida && !pacientes.some(p => p.id === elegida)) (onAbrir ?? setPropia)(null); }, [pacientes, elegida, onAbrir]);
  const alternar = (id: string) => {
    const poner = onAbrir ?? setPropia;
    window.clearTimeout(reloj.current);
    if (elegida && !movimientoReducido()) { setSaliendo(elegida); reloj.current = window.setTimeout(() => setSaliendo(null), SALIDA_DETALLE_MS); } else setSaliendo(null);
    poner(elegida === id ? null : id);
  };
  const filas = pacientes.flatMap((p, i) => {
    const preview = previews[p.id], estado = estadoDe(p, preview, board, hoy), avance = avanceDe(p, preview), registro = ultimoRegistro(p, ahora);
    const abierto = elegida === p.id, conAdherencia = (p.weekly_registration?.recorded_days ?? 0) > 0 || p.adherence_score > 0;
    const fila = <tr key={p.id} data-i={i} className={abierto ? 'open' : undefined} tabIndex={0} aria-expanded={abierto} aria-label={`Ver resumen de ${p.name}`}
      onClick={() => alternar(p.id)} onKeyDown={evento => { if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); alternar(p.id); } }}>
      <td><PanelV29Icon name="chev" className="i chev" size={14} /></td>
      <td><div className="who"><span className="av" style={{ background: fondoAvatar(p.tone) }}>{inicialesDe(p.name, p.initials)}</span><div><b>{p.name}</b><small>{p.goal || 'Objetivo por definir'}</small></div></div></td>
      <td><div className="pats"><span className="pat p0">Sin declarar</span></div></td>
      <td>{avance ? <div className="goal"><span className="tr"><i style={{ width: `${avance.pct}%` }} /></span><small className="num">{avance.texto}</small></div> : <span style={{ color: 'var(--ink3)' }}>Sin medir</span>}</td>
      <td>{conAdherencia ? <div className="adh"><span className="tr"><i className={p.adherence_score < 70 ? 'lo' : undefined} style={{ width: `${Math.max(0, Math.min(100, p.adherence_score))}%` }} /></span><span className="num">{Math.round(p.adherence_score)} %</span></div> : <span style={{ color: 'var(--ink3)' }}>—</span>}</td>
      <td><div className="nx"><b className="num">{proximaConsulta(p, ahora)}</b><small style={{ color: registro.viejo ? 'var(--azaf-ink)' : 'var(--ink3)' }}>último registro: {registro.texto}</small></div></td>
      <td><span className={`pill ${estado.pill}`}>{estado.texto}</span>{estado.cuota ? <small className="cuo">{estado.cuota}</small> : billingError ? <small className="cuo">Cuota sin consultar</small> : null}</td>
    </tr>;
    return abierto || saliendo === p.id ? [fila, <Detalle key={`${p.id}-det`} paciente={p} ahora={ahora} previews={previews} acciones={acciones} onOpen={onOpen} saliendo={saliendo === p.id && !abierto} />] : [fila];
  });
  return <table>
    <thead><tr><th style={{ width: 44 }} /><th>Paciente</th><th>Patologías</th><th>Avance</th><th>Adherencia</th><th>Próxima consulta</th><th>Estado</th></tr></thead>
    <tbody id="prows">{filas}</tbody>
  </table>;
}
