// Solapa Historia clínica de la Ficha v29: el HTML de `FT.historia` del boceto (temas, datos con fecha y origen, «Antes», por fecha y «ver cómo estaba»), con datos reales.
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Patient } from '../../types';
import type { HistoryTopic } from '../../api/patient-history';
import { PanelV29Icon } from './PanelV29Icon';
import { FxPanel } from './ficha-fx';
import { usePatientHistory } from './use-patient-history';
import { ORIGEN, TEMAS_HISTORIA, anteriores, cambiosPorFecha, datosQueCambianElPlan, fechaLarga, fechasDeCambio, metaDelEncabezado, resumenDeTemas, subtituloDelTema, tituloDelTema, vigentes } from './ficha-historia';
import { homeDay } from '../../lib/panel-home';
import type { FichaData } from './use-ficha-data';

const SIN_PERMISO = 'Permiso de atención pendiente.';

function abrirRespuestas() {
  const detalle = document.getElementById('hc-respuestas') as HTMLDetailsElement | null;
  if (!detalle) return;
  detalle.open = true;
  detalle.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

export function PanelFichaHistoria({ patient, now, datos, children }: { patient: Patient; now: Date; datos: FichaData; children?: ReactNode }) {
  const hoy = homeDay(now);
  const nombre = patient.name.split(' ')[0] ?? patient.name;
  const permitido = Boolean(datos.care?.consented.includes('care_relationship'));
  const { entries, error, reintentar, agregar, editar, darDeBaja } = usePatientHistory(patient.id, permitido);
  const [tema, setTema] = useState<HistoryTopic>('med');
  const [vista, setVista] = useState<'tema' | 'fecha'>('tema');
  const [fecha, setFecha] = useState<string | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [borrador, setBorrador] = useState(false);
  const [aviso, setAviso] = useState('');
  const lista = entries ?? [];
  const a = fecha ?? hoy;
  const soloLectura = fecha !== null;
  const temas = resumenDeTemas(lista, a);
  const hechos = temas.filter(t => t.completo).length;
  const vivos = vigentes(lista, tema, a);
  const antes = anteriores(lista, tema, a);
  const estado = !datos.care ? (datos.careError ? 'No pudimos consultar los permisos.' : 'Consultando permisos…') : !permitido ? SIN_PERMISO : error ? error : entries === null ? 'Consultando historia clínica…' : '';

  const cambiarTema = (clave: HistoryTopic) => { setTema(clave); setBorrador(false); setAviso(''); };
  const guardar = async (accion: Promise<string>, exito = '') => { const mensaje = await accion; setAviso(mensaje || exito); return !mensaje; };
  const alSalir = (id: string, textoAnterior: string, texto: string) => {
    const limpio = texto.trim();
    if (!limpio || limpio === textoAnterior) return;
    void guardar(editar(id, limpio), 'Guardado. El cambio queda en «Por fecha» con la fecha de hoy.');
  };
  const alSalirNuevo = (texto: string) => {
    setBorrador(false);
    const limpio = texto.trim();
    if (limpio) void guardar(agregar(tema, limpio), `Dato agregado a ${tituloDelTema(tema)} con la fecha de hoy.`);
  };
  const conEnter = (evento: KeyboardEvent<HTMLDivElement>) => { if (evento.key === 'Enter' && !evento.shiftKey) { evento.preventDefault(); evento.currentTarget.blur(); } };
  const baja = (id: string, texto: string) => void guardar(darDeBaja(id), `«${texto.slice(0, 40)}» pasó a «Antes» con la fecha de hoy.`);

  const indice = <nav className="hcidx" aria-label="Temas">{temas.map(t => <button key={t.clave} type="button" className={t.clave === tema ? 'on' : undefined} aria-pressed={t.clave === tema} onClick={() => cambiarTema(t.clave)}><i className={`st ${t.completo ? 'ok' : 'miss'}`} /><span><b>{t.titulo}</b><small>{subtituloDelTema(t)}</small></span></button>)}
    <div className="hcidxf"><button type="button" className="lnk" onClick={abrirRespuestas}>Ver respuestas</button></div></nav>;

  const entrada = (e: (typeof vivos)[number]) => <div key={`${e.id}${e.text}`} className={`hce${e.source === 'recording' ? ' g' : ''}`}>
    <div className="hcin" contentEditable={!soloLectura} suppressContentEditableWarning spellCheck={false} role="textbox" aria-label={tituloDelTema(e.topic)} onKeyDown={conEnter} onBlur={ev => alSalir(e.id, e.text, ev.currentTarget.textContent ?? '')}>{e.text}</div>
    <div className="hcm">{e.since ? <span className="hcde"><PanelV29Icon name="cal" size={12} />{e.since}</span> : null}<span className={`hcsrc ${ORIGEN[e.source].clase}`}>{ORIGEN[e.source].texto(nombre)} · {fechaLarga(e.recorded_on)}</span>{e.edited_on ? <span className="hcsrc">editado {fechaLarga(e.edited_on)}</span> : null}<span className="sp" />
      {soloLectura ? null : <button type="button" className="lnk" onClick={() => baja(e.id, e.text)}>Dar de baja</button>}</div></div>;

  const editor = <div className="hced"><header><div><h4>{tituloDelTema(tema)}</h4><small>{metaDelEncabezado(lista, tema, a)}</small></div><span className="sp" />
    {soloLectura ? null : <button type="button" className="sbtn cbtn" onClick={() => { setBorrador(true); setAviso(''); }}><PanelV29Icon name="plus" size={13} />Agregar dato</button>}</header>
    <div className="hcel">{aviso ? <small className="fxhint" role="status">{aviso}</small> : null}
      {vivos.map(entrada)}
      {borrador ? <div className="hce"><div className="hcin" ref={nodo => nodo?.focus()} contentEditable suppressContentEditableWarning spellCheck={false} role="textbox" aria-label={`Nuevo dato de ${tituloDelTema(tema)}`} data-ph="Escribí el dato" onKeyDown={conEnter} onBlur={ev => alSalirNuevo(ev.currentTarget.textContent ?? '')} /></div> : null}
      {!vivos.length && !borrador ? <div className="hcemp"><b>Todavía no hay datos</b><span>Cargalo vos en la consulta: queda con la fecha de hoy.</span>{soloLectura ? null : <div className="hcemb"><button type="button" className="sbtn k" onClick={() => setBorrador(true)}>Cargar yo</button></div>}</div> : null}
      {antes.length ? <div className="hcpast"><span className="sect">Antes</span>{antes.map(e => <div key={e.id}><s>{e.text}</s><small>{fechaLarga(e.recorded_on)} → {fechaLarga(e.ended_on!)}{e.ended_reason ? ` · ${e.ended_reason}` : ''}</small></div>)}</div> : null}</div></div>;

  const porFecha = cambiosPorFecha(lista, a, nombre);
  const dias = <div className="fxs hcbd">{porFecha.length ? porFecha.map(dia => <div key={dia.fecha} className="hcday"><div className="hcdh"><b>{fechaLarga(dia.fecha)}</b>{dia.fecha === hoy ? <span>Hoy</span> : null}<span className="sp" /><button type="button" className="lnk" onClick={() => { setFecha(dia.fecha); setVista('tema'); }}>Ver cómo estaba</button></div>
    {dia.cambios.map((c, i) => <div key={`${c.tema}${i}`} className={`hcdi ${c.tipo}`}><span className="hctag">{c.tema}</span><span>{c.tipo === 'b' ? <><s>{c.texto}</s> <small>se dio de baja{c.detalle ? ` · ${c.detalle}` : ''}</small></> : c.tipo === 'e' ? <>{c.texto} <small>editado</small></> : c.texto}</span></div>)}</div>) : <div className="fxhint">Todavía no hay cambios en la historia.</div>}</div>;

  const banda = soloLectura ? <div className="hcsnap"><PanelV29Icon name="clock" size={14} /><span>Así estaba la historia el <b>{fechaLarga(fecha)}</b>. Solo para leer.</span><button type="button" className="sbtn" onClick={() => setFecha(null)}>Volver a hoy</button></div> : null;
  const selector = eligiendo ? <div className="hcsnap" role="group" aria-label="Ver cómo estaba"><PanelV29Icon name="clock" size={14} /><span><label>Fecha <select value={fecha ?? ''} onChange={ev => { setFecha(ev.target.value || null); setVista('tema'); setEligiendo(false); }}><option value="">Hoy</option>{fechasDeCambio(lista).map(f => <option key={f} value={f}>{fechaLarga(f)}</option>)}</select></label> Solo para leer; para cambiar algo, volvé a hoy.</span><button type="button" className="sbtn" onClick={() => setEligiendo(false)}>Cerrar</button></div> : null;

  const propuestas = <FxPanel titulo="De la consulta grabada"><div className="fxhint hcnote"><PanelV29Icon name="spark" size={13} />Sin propuestas por ahora. Cuando una consulta grabada mencione un cambio, aparece acá y no entra a la historia hasta que lo aceptes.</div></FxPanel>;
  const del = datosQueCambianElPlan(lista, a);
  const plan = <FxPanel titulo="Datos que cambian el plan" meta={String(del.length)}>{del.length ? <div className="fxchips">{del.map(t => <span key={t}>{t}</span>)}</div> : <div className="fxhint">Sin datos cargados en alergias, diagnósticos, medicación ni preferencias.</div>}</FxPanel>;

  return <>
    <div className="fx hcx" data-mk="1" style={{ gridTemplateColumns: '1.62fr 1fr' }}>
      <div className="c">
        <FxPanel titulo="Historia clínica" grande meta={entries ? undefined : estado}
          derecha={<>{entries ? <span className="pill p-conf">{hechos} de {TEMAS_HISTORIA.length} temas</span> : null}<div className="tabs hcv"><button type="button" className={vista === 'tema' ? 'on' : undefined} aria-pressed={vista === 'tema'} onClick={() => setVista('tema')}>Por tema</button><button type="button" className={vista === 'fecha' ? 'on' : undefined} aria-pressed={vista === 'fecha'} onClick={() => setVista('fecha')}>Por fecha</button></div>
            <button type="button" className="sbtn cbtn" disabled={!entries} onClick={() => setEligiendo(v => !v)}><PanelV29Icon name="clock" size={13} />{fecha ? fechaLarga(fecha) : 'Hoy'}</button><button type="button" className="sbtn cbtn" onClick={abrirRespuestas}><PanelV29Icon name="send" size={13} />Formularios</button></>}>
          {entries ? <>{selector}{banda}{vista === 'fecha' ? dias : <div className="hcdoc">{indice}{editor}</div>}</>
            : <div className="fxhint" role={error ? 'alert' : 'status'}>{estado}{error ? <> <button type="button" className="lnk" onClick={reintentar}>Reintentar</button></> : null}</div>}
        </FxPanel>
      </div>
      <div className="c">{propuestas}{plan}</div>
    </div>
    {children}
  </>;
}
