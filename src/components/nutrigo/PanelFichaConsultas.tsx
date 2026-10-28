// Solapa «Consultas y notas» de la Ficha: el mismo HTML del boceto v29 (tres columnas), con los turnos, las notas y las acciones reales.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { careErrorMessage } from '../../api/care';
import { consultationsApi } from '../../api/consultations';
import { plansApi } from '../../api/plans';
import type { Patient } from '../../types';
import type { ConsultationAppointmentCompletion, ConsultationView } from '../../types/consultations';
import { ConsultationCompletionPanel, ConsultationNotes } from './ConsultationNotes';
import { FxDk, FxKv, FxMedidor } from './ficha-fx';
import { PLANTILLA_SOAP, acuerdosDeNota, asistenciaDe, canalTexto, diaYFecha, fechaCorta, fechaCortaConCero, filasDeConsultas, horaCorta, partirNota, proximoTurno, sugerirProximoTurno, textoCertificado, tipoDeConsulta, versionParaPaciente } from './ficha-consultas';
import type { FichaData } from './use-ficha-data';
import { PanelFichaPedirRegistro } from './PanelFichaPedirRegistro';
import { AvisoBoceto } from './panel-v29-boceto';
import { PanelV29Icon } from './PanelV29Icon';
import type { PanelV29IconName } from './panel-v29-icons';
import type { RecordTab } from './patient-record-sections';
import { ShowroomConsultations } from './ShowroomConsultations';
import { canLeaveWorkspace } from './unsaved-changes';

const VACIO: ConsultationView = { sessions: [], shared: [], tasks: [] };
type VistaNota = 'nota' | 'transcripcion' | 'paciente';
type Clave = 'devolucion' | 'plan' | 'material' | 'registro' | 'formulario' | 'certificado' | 'cobro' | 'turno';

const copiar = async (texto: string) => {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
};

export function PanelFichaConsultas({ patient, now, professionalName, datos, onSection, onOpenHref, onChanged }: { patient: Patient; now: Date; professionalName?: string; datos: FichaData; onSection: (tab: RecordTab) => void; onOpenHref: (href: string) => void; onChanged: () => void }) {
  const [vista, setVista] = useState<ConsultationView>(VACIO);
  const [registrados, setTurnos] = useState<ConsultationAppointmentCompletion[]>([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [elegida, setElegida] = useState<string | null>(null);
  const [pestana, setPestana] = useState<VistaNota>('nota');
  const [marcados, setMarcados] = useState<string[]>([]);
  const [hechos, setHechos] = useState<Clave[]>([]);
  const [vence, setVence] = useState<string | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [detalle, setDetalle] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ n: number; texto: string } | null>(null);
  const abajo = useRef<HTMLDetailsElement>(null);
  const primerNombre = patient.name.split(' ')[0] ?? patient.name;

  useEffect(() => {
    const control = new AbortController();
    setCargado(false); setError('');
    Promise.all([consultationsApi.list(patient.id, true, 0, control.signal), consultationsApi.completions(patient.id, 0, 50, control.signal)])
      .then(([lista, cierres]) => { if (!control.signal.aborted) { setVista(lista); setTurnos(cierres.appointments); setCargado(true); } })
      .catch(fallo => { if (!control.signal.aborted) { setError(careErrorMessage(fallo)); setCargado(true); } });
    plansApi.published(patient.id, control.signal).then(res => { if (!control.signal.aborted) setVence(res.plan?.period_end ?? null); }).catch(() => { if (!control.signal.aborted) setVence(null); });
    return () => control.abort();
  }, [patient.id, revision]);

  useEffect(() => {
    const refrescar = () => setRevision(n => n + 1);
    window.addEventListener('plan-v:consultation-completion-changed', refrescar);
    return () => window.removeEventListener('plan-v:consultation-completion-changed', refrescar);
  }, []);

  // El turno que la paciente tiene agendado puede no figurar todavía entre los registrados: se suma para no perder la próxima consulta.
  const turnos = useMemo(() => {
    const cita = patient.appointment;
    if (!cita?.starts_at || !cita.id || registrados.some(t => t.appointment_id === cita.id)) return registrados;
    return [...registrados, { appointment_id: cita.id, starts_at: cita.starts_at, duration_min: cita.duration, channel: cita.channel, status: 'scheduled', completed: false, revision: 0, marked_at: null, marked_by: null, appointment_starts_at: null }];
  }, [registrados, patient.appointment]);
  const filas = useMemo(() => filasDeConsultas(turnos, vista.sessions, vista.shared, now), [turnos, vista, now]);
  const asistencia = useMemo(() => asistenciaDe(turnos, now), [turnos, now]);
  const proximo = useMemo(() => proximoTurno(turnos, now), [turnos, now]);
  const sesiones = useMemo(() => [...vista.sessions].sort((a, b) => b.started_at.localeCompare(a.started_at)), [vista.sessions]);
  const porAprobar = sesiones.find(s => !vista.shared.some(p => p.session_id === s.id));
  const sesion = sesiones.find(s => s.id === elegida) ?? porAprobar ?? sesiones[0] ?? null;
  const publicada = sesion ? vista.shared.filter(p => p.session_id === sesion.id).sort((a, b) => b.version - a.version)[0] ?? null : null;
  const turnoDeHoy = proximo && fechaCorta(proximo.starts_at) === fechaCorta(now.toISOString()) ? proximo : null;
  const hoy = fechaCorta(now.toISOString());
  const deHoy = turnos.find(t => t.status !== 'cancelled' && fechaCorta(t.starts_at) === hoy);
  const sinConfirmar = [...turnos].filter(t => t.status !== 'cancelled' && !t.completed && Date.parse(t.starts_at) <= now.getTime()).sort((x, y) => y.starts_at.localeCompare(x.starts_at))[0];
  const turnoFirma = deHoy ?? sinConfirmar ?? null;
  const firmada = Boolean(turnoFirma?.completed);
  const realizadas = asistencia.realizadas;
  const bloques = partirNota(sesion?.draft ?? '');
  const acuerdos = useMemo(() => acuerdosDeNota(sesion?.draft ?? ''), [sesion?.draft]);
  const fechaNota = sesion ? fechaCorta(sesion.started_at) : null;
  const intake = datos.current?.intake?.intake;
  const sugerido = proximo ? `${diaYFecha(proximo.starts_at)}, ${horaCorta(proximo.starts_at)}` : sugerirProximoTurno(turnos, now);
  const avisar = (texto: string) => setAviso(previo => ({ n: (previo?.n ?? 0) + 1, texto }));

  const abrirAbajo = useCallback(() => {
    setDetalle(true);
    requestAnimationFrame(() => abajo.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }, []);
  const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
    setOcupado(true);
    try { await accion(); setRevision(n => n + 1); onChanged(); if (exito) avisar(exito); } catch (fallo) { avisar(careErrorMessage(fallo)); } finally { setOcupado(false); }
  };

  const iniciar = () => {
    if (!canLeaveWorkspace()) return;
    const turno = turnoDeHoy ?? proximo;
    const existente = turno ? vista.sessions.find(s => s.appointment_id === turno.appointment_id) : null;
    if (existente) { setElegida(existente.id); abrirAbajo(); return; }
    void ejecutar(async () => {
      const res = await consultationsApi.command(patient.id, { action: 'start', id: crypto.randomUUID(), source: 'manual', ...(turno ? { appointment_id: turno.appointment_id } : {}) });
      setElegida(res.session.id); abrirAbajo();
    }, 'Consulta iniciada. Escribí la nota o pegá la transcripción.');
  };
  const plantilla = () => {
    if (!sesion) { avisar('Primero iniciá la consulta.'); return; }
    if (sesion.draft.trim()) { avisar('La nota ya tiene texto: se queda como está.'); return; }
    void ejecutar(() => consultationsApi.command(patient.id, { action: 'draft', id: sesion.id, expected_revision: sesion.revision, draft: PLANTILLA_SOAP }), 'Plantilla SOAP puesta en la nota.');
  };
  const texto = sesion ? versionParaPaciente(sesion.draft, acuerdos.filter(a => marcados.includes(a))) : '';
  const publicar = () => {
    if (!sesion || !sesion.draft.trim()) { avisar('Escribí la nota antes de publicarla.'); return; }
    void ejecutar(() => consultationsApi.command(patient.id, { action: 'publish', id: sesion.id, expected_revision: sesion.revision, summary: texto }), `Publicada. ${primerNombre} la ve en su app.`);
  };
  const copiarVersion = async () => {
    if (!sesion?.draft.trim()) { avisar('Todavía no hay nota para copiar.'); return; }
    avisar(await copiar(texto) ? `Copiamos la versión para ${primerNombre}.` : 'No pudimos copiar. Seleccioná el texto en «Para ' + primerNombre + '».');
  };
  const certificado = async () => {
    const fecha = turnoFirma ? fechaCortaConCero(turnoFirma.starts_at) : fechaCortaConCero(now.toISOString());
    const ok = await copiar(textoCertificado(patient.name, fecha, professionalName ?? 'Tu nutricionista'));
    setHechos(h => h.includes('certificado') ? h : [...h, 'certificado']);
    avisar(ok ? 'Certificado copiado. Pegalo en tu papel membretado.' : 'No pudimos copiar el certificado.');
  };
  const firmar = () => {
    if (!turnoFirma) { avisar('No hay una consulta para firmar.'); return; }
    if (firmada) return;
    void ejecutar(() => consultationsApi.completeAppointment(patient.id, { appointment_id: turnoFirma.appointment_id, expected_revision: turnoFirma.revision, completed: true, confirmed: true }), 'Consulta firmada y registrada como realizada.');
  };

  const hecho = (clave: Clave) => hechos.includes(clave);
  const devolucionLista = Boolean(publicada);
  const pasos: Array<[string, PanelV29IconName, string, string, React.ReactNode]> = [
    ['b', 'chat', 'Devolución', `Resumen para ${primerNombre}, sin tus notas internas`, devolucionLista ? <span className="pill p-conf">Publicada</span> : <button type="button" className="sbtn cbtn" onClick={() => { setPestana('paciente'); }}>Revisar</button>],
    ['l', 'clip', 'Plan', vence ? `El vigente vence el ${fechaCorta(`${vence}T12:00:00Z`)}` : 'Todavía no hay un plan vigente', <button type="button" className="sbtn cbtn" onClick={() => onSection('plan')}>Renovar</button>],
    ['l', 'file', 'Material', 'Elegí un recurso de la Biblioteca', <button type="button" className="sbtn cbtn" onClick={() => onOpenHref('/crm/biblioteca')}>Asignar</button>],
    ['a', 'flame', 'Registro alimentario', `Pedile a ${primerNombre} 7 días de registro`, hecho('registro') ? <span className="pill p-conf">Pedido</span> : <button type="button" className="sbtn cbtn" onClick={() => setPidiendo(true)}>Pedir</button>],
    ['b', 'file', 'Formulario', 'Preferencias y rechazos', intake?.submitted_at ? <span className="pill p-conf">Respondido</span> : <span className="pill p-wait">{intake ? 'Sin responder' : 'Sin enviar'}</span>],
    ['b', 'shield', 'Certificado', 'Asistencia a la consulta', hecho('certificado') ? <span className="pill p-conf">Generado</span> : <button type="button" className="sbtn cbtn" onClick={() => void certificado()}>Generar</button>],
    ['a', 'coin', 'Cobro', 'Registrá el cobro de esta consulta', <button type="button" className="sbtn cbtn" onClick={() => onSection('cobros')}>Cobrar</button>],
    ['l', 'cal', 'Próximo turno', sugerido ? `${proximo ? 'Agendado' : 'Sugerido'}: ${sugerido}` : 'Sin turnos anteriores', <button type="button" className="sbtn cbtn" onClick={() => onOpenHref('/crm/agenda')}>Agendar</button>],
  ];
  const listos = [devolucionLista, hecho('registro'), hecho('certificado'), Boolean(intake?.submitted_at)].filter(Boolean).length;

  const tipo = proximo ? tipoDeConsulta(proximo, turnos) : realizadas ? 'Seguimiento' : 'Primera consulta';
  const claveDk = proximo ? turnoDeHoy ? `Consulta de hoy · ${horaCorta(proximo.starts_at)} · ${canalTexto(proximo.channel)}` : `Próxima consulta · ${diaYFecha(proximo.starts_at)} ${horaCorta(proximo.starts_at)}` : 'Sin turno próximo';
  const tabs: Array<[VistaNota, string]> = [['nota', 'Nota'], ['transcripcion', 'Transcripción'], ['paciente', `Para ${primerNombre}`]];
  const estadoNota = !sesion ? 'Sin nota' : publicada ? 'Publicada' : sesion.source === 'manual' ? 'Borrador' : 'Borrador de la IA';
  const cuerpoNota = pestana === 'nota'
    ? <div className="fxsoap">{bloques.map(({ l, t, d }) => <div key={l}><span className="sl">{l}</span><div><b>{t}</b><p>{d}</p></div></div>)}</div>
    : pestana === 'transcripcion'
      ? <div className="fxsoap"><div><span className="sl">T</span><div><b>Transcripción</b><p style={{ whiteSpace: 'pre-wrap' }}>{sesion?.transcript.trim() || 'Sin transcripción. Grabá la consulta o pegá el texto.'}</p></div></div></div>
      : <div className="fxsoap"><div><span className="sl">{primerNombre.charAt(0).toUpperCase()}</span><div><b>{publicada ? `Lo que ve ${primerNombre} (versión ${publicada.version})` : `Así lo va a ver ${primerNombre}`}</b><p style={{ whiteSpace: 'pre-wrap' }}>{publicada?.summary ?? (texto || 'Todavía no hay nota para compartir.')}</p></div></div></div>;

  if (!cargado) return <div className="fx" role="status" style={{ gridTemplateColumns: '1fr' }}><div className="c"><section className="fxp"><header><h3>Consultas y notas</h3></header><div className="fxhint">Consultando turnos y notas…</div></section></div></div>;

  return <div className="pn-record-consultas">
    <div className="fx" style={{ gridTemplateColumns: '290px 1fr 300px' }}>
      <div className="c">
        <FxDk clave={claveDk} titulo={`${tipo === 'Primera consulta' ? tipo : `Seguimiento n.º ${realizadas + 1}`}`} sub="Nota en formato SOAP" extra={<div className="fxdkb"><button type="button" onClick={() => { avisar('Usá «Grabar videollamada» en la sección de abajo.'); abrirAbajo(); }}>Grabar</button><button type="button" className="go" disabled={ocupado} onClick={iniciar}>Iniciar consulta</button></div>} />
        <section className="fxp"><header><h3>Asistencia</h3>{asistencia.desde ? <span className="m">desde {asistencia.desde}</span> : null}<span className="sp" /></header>
          <div className="fxsplit"><FxMedidor pct={asistencia.pct} texto={String(asistencia.pct)} sub="%" ancho={120} chico /><FxKv filas={[['Realizadas', String(asistencia.realizadas)], ['Canceladas', String(asistencia.canceladas)], ['Próxima', asistencia.proxima ?? '—']]} /></div></section>
        <section className="fxp g"><header><h3>Consultas</h3><span className="m">{filas.length}</span><span className="sp" /></header>
          <div className="fxs"><ol className="fxtl">{filas.map(f => <li key={f.id} className={f.estado.tono} onClick={f.sesionId ? () => { setElegida(f.sesionId); setPestana('nota'); } : undefined} style={f.sesionId ? { cursor: 'pointer' } : undefined}><i /><span><b>{f.fecha}</b><small>{f.sub}</small></span><time><span className={`pill ${f.estado.clase}`}>{f.estado.texto}</span></time></li>)}</ol></div></section>
      </div>
      <div className="c">
        <section className="fxp g"><header><h3>{fechaNota ? `Nota del ${fechaNota}` : 'Nota de la consulta'}</h3><span className="m"><span className={`pill ${publicada ? 'p-conf' : 'p-wait'}`}>{estadoNota}</span></span><span className="sp" />
          <div className="tabs">{tabs.map(([id, nombre]) => <button key={id} type="button" className={pestana === id ? 'on' : ''} onClick={() => setPestana(id)}>{nombre}</button>)}</div>
          <button className="chip" type="button" style={{ padding: '5px 10px' }} onClick={plantilla}>SOAP</button></header>
          <div className="fxs">{cuerpoNota}
            <div className="fxclose"><small>Acuerdos de hoy · {primerNombre} los ve en su app</small>
              <div className="fxck">{(acuerdos.length ? acuerdos : []).map(a => <div key={a} role="checkbox" aria-checked={marcados.includes(a)} tabIndex={0} onClick={() => setMarcados(m => m.includes(a) ? m.filter(x => x !== a) : [...m, a])} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMarcados(m => m.includes(a) ? m.filter(x => x !== a) : [...m, a]); } }}><i className={marcados.includes(a) ? 'on' : ''} /><span>{a}</span></div>)}</div>
              {acuerdos.length ? null : <div className="fxhint">Los acuerdos salen del apartado «P» de la nota.</div>}</div></div>
          <div className="fxfoot"><button type="button" className="sbtn cbtn" onClick={abrirAbajo}><PanelV29Icon name="pen" size={13} />Editar</button><button type="button" className="sbtn cbtn" onClick={() => void copiarVersion()}><PanelV29Icon name="copy" size={13} />Copiar versión para {primerNombre}</button><span style={{ flex: 1 }} /><button type="button" className="sbtn k cbtn" disabled={ocupado || !sesion || Boolean(publicada && publicada.summary === texto)} onClick={publicar}><PanelV29Icon name="send" size={13} />Aprobar y publicar</button></div></section>
      </div>
      <div className="c">
        <section className="fxp g ntpsw"><header><h3>Para {primerNombre} al terminar</h3><span className="m">{listos} de {pasos.length}</span><span className="sp" /></header>
          <div className="fxs"><div className="ntps">{pasos.map(([color, icono, titulo, sub, derecha]) => <div key={titulo}><span className={`ico ${color}`}><PanelV29Icon name={icono} size={13} /></span><span className="t"><b>{titulo}</b><small>{sub}</small></span>{derecha}</div>)}</div>
            <div className="fxai"><PanelV29Icon name="spark" size={14} /><span><b>Al firmar,</b> {primerNombre} ve en su app todo lo que le publicaste hoy.</span></div></div>
          <div className="fxfoot">{firmada ? <span className="ntsig"><PanelV29Icon name="check" size={13} />Firmada · {professionalName ?? 'tu firma'}</span> : <span className="ntsig n">Sin firmar</span>}<span style={{ flex: 1 }} />{firmada ? <button type="button" className="sbtn cbtn" onClick={abrirAbajo}><PanelV29Icon name="plus" size={13} />Agregar nota</button> : <button type="button" className="sbtn k cbtn" disabled={ocupado || !turnoFirma} onClick={firmar}><PanelV29Icon name="check" size={13} />Terminar y firmar</button>}</div></section>
      </div>
    </div>
    {error ? <p role="alert">{error} <button type="button" onClick={() => setRevision(n => n + 1)}>Reintentar consultas</button></p> : null}
    <details ref={abajo} className="pn-record-card" open={detalle} onToggle={e => setDetalle(e.currentTarget.open)}><summary>Grabar, escribir la nota completa y confirmar consultas</summary>
      {detalle ? <><ConsultationNotes patientId={patient.id} showCompletions={false} /><ShowroomConsultations embedded patient={patient} now={now} onSelect={() => undefined} onChanged={() => onChanged()} /><ConsultationCompletionPanel patientId={patient.id} /></> : null}
    </details>
    {pidiendo && <PanelFichaPedirRegistro patient={patient} onClose={() => setPidiendo(false)} onSent={t => { setPidiendo(false); setHechos(h => h.includes('registro') ? h : [...h, 'registro']); avisar(t); }} />}
    {aviso && <AvisoBoceto key={aviso.n} texto={aviso.texto} />}
  </div>;
}
