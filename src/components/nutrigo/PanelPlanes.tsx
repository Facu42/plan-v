import { canLeaveWorkspace } from './unsaved-changes';
import { PanelPlanRecetas } from './PanelPlanRecetas';
import { PanelPlanEquivalencias } from './PanelPlanEquivalencias';
import { PanelPlanAgregarReceta } from './PanelPlanAgregarReceta';
import type { ProfessionalRecipe } from '../../types/recipes';
import { CatalogoPlantillas } from './PanelPlanReutilizar';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { plansApi } from '../../api/plans';
import type { Patient } from '../../types';
import type { ProfessionalMealPlan } from '../../types/plans';
import type { AiJobView } from '../../types/ai-jobs';
import { PanelV29Icon } from './PanelV29Icon';
import { PanelPlanArmar } from './PanelPlanArmar';
import { PanelPlanEditor } from './PanelPlanEditor';
import { periodoDesdeDuracion, type DuracionArmado } from './planes-asistente';
import { pedirPropuesta } from './planes-parte-3';
import {
  conteoFiltro, etiquetaAlta, filaDePlan, filaProvisoria, filasVisibles, fondoAvatar, hoyArgentina,
  primerNombrePlanes, proximasAcciones, textoAccion, FILTROS_PLANES,
  type FilaPlan, type FiltroPlanes, type OrdenPlanes, type VistaPlanes,
} from './planes-lista';

function Encabezado({ titulo, meta }: { titulo: string; meta?: string }) {
  return <header><h3>{titulo}</h3>{meta ? <span className="m">{meta}</span> : null}<span className="sp" /></header>;
}

export function PanelPlanesVista({
  vista, nombre, filas, consulta, orden, filtro, aviso, error, tareas,
  onVista, onRecetas, onConsulta, onOrden, onFiltro, onLimpiar,   onEditor, onAsistente, onArmar, onReintentar, editor = null, armar = null, plantillas = null, recetas = null, equivalencias = null, creando = false, asistenteAbierto = false,
}: {
  editor?: ReactNode;
  recetas?: ReactNode;
  equivalencias?: ReactNode;
  plantillas?: ReactNode;
  vista: VistaPlanes;
  nombre: string;
  filas: FilaPlan[];
  consulta: string;
  orden: OrdenPlanes;
  filtro: FiltroPlanes;
  aviso: string;
  error: boolean;
  tareas: FilaPlan[];
  onVista: (vista: VistaPlanes) => void;
  onRecetas: () => void;
  onConsulta: (texto: string) => void;
  onOrden: (orden: OrdenPlanes) => void;
  onFiltro: (filtro: FiltroPlanes) => void;
  onLimpiar: () => void;
  onEditor: (id: string) => void;
  onAsistente: () => void;
  onArmar?: () => void;
  onReintentar: () => void;
  armar?: ReactNode;
  creando?: boolean;
  asistenteAbierto?: boolean;
}) {
  const visibles = filasVisibles(filas, filtro, orden, consulta);
  const vacioTotal = filas.length === 0;
  const clase = `scr${creando ? ' pux-create' : vista === 'plan' ? ' pux-plan' : ''}${asistenteAbierto ? ' pux-ai-open' : ''}`;
  return <div id="s-planes" className={clase}>
    <nav id="pview" className="tabs" role="navigation" aria-label="Secciones de Planes">
      <button type="button" className={!creando && vista === 'lista' ? 'on' : undefined} aria-current={!creando && vista === 'lista' ? 'page' : 'false'} onClick={() => onVista('lista')}>Todos los planes</button>
      <button type="button" className={!creando && vista === 'plan' ? 'on' : undefined} aria-current={!creando && vista === 'plan' ? 'page' : 'false'} onClick={() => onVista('plan')}>Plan de {nombre}</button>
      <button type="button" className={vista === 'recetas' ? 'on' : undefined} aria-current={vista === 'recetas' ? 'page' : 'false'} onClick={onRecetas}>Recetas</button>
      <button type="button" className={vista === 'plantillas' ? 'on' : undefined} aria-current={vista === 'plantillas' ? 'page' : 'false'} onClick={() => onVista('plantillas')}>Plantillas</button>
      <button type="button" className={vista === 'equivalencias' ? 'on' : undefined} aria-current={vista === 'equivalencias' ? 'page' : 'false'} onClick={() => onVista('equivalencias')}>Equivalencias</button>
    </nav>
    <div id="pwrap" className={creando ? 'pv5' : vista === 'plan' ? 'pe-dia' : vista === 'recetas' ? 'pv2' : vista === 'equivalencias' ? 'pv4' : undefined}>
      {aviso ? <p className="mhelp" role="status">{aviso}</p> : null}
      {creando ? armar : vista === 'plan' ? editor : null}
      {vista === 'plantillas' ? plantillas : null}
      {vista === 'recetas' ? recetas : null}
      {vista === 'equivalencias' ? equivalencias : null}
      {vista === 'lista' && !creando ? <div className="fx">
        <div className="c">
          <section className="fxp g">
            <Encabezado titulo="Planes de tus pacientes" meta={`${filas.length} pacientes`} />
            {error ? <p className="mhelp">No se pudo leer el estado de los planes. <button type="button" className="sbtn" onClick={onReintentar}>Reintentar</button></p> : null}
            <div className="r29-list-filters">
              <label className="r29-search">
                <PanelV29Icon name="search" size={15} />
                <input id="r29-search" type="search" aria-label="Buscar por paciente, plan u objetivo" placeholder="Buscar paciente, plan u objetivo…" value={consulta} onChange={evento => onConsulta(evento.target.value)} />
              </label>
              <select id="r29-sort" aria-label="Ordenar planes" value={orden} onChange={evento => onOrden(evento.target.value === 'atencion' ? 'atencion' : 'nombre')}>
                <option value="nombre">Nombre A–Z</option>
                <option value="atencion">Necesitan atención primero</option>
              </select>
              {onArmar ? <button className="chip" type="button" onClick={onArmar}><PanelV29Icon name="spark" size={13} />Armar con IA</button> : null}
              <div className="tabs">
                {FILTROS_PLANES.map(item => <button type="button" key={item.id} className={filtro === item.id ? 'on' : undefined} aria-pressed={filtro === item.id} onClick={() => onFiltro(item.id)}>{item.etiqueta} <span className="num">{conteoFiltro(filas, item.id)}</span></button>)}
              </div>
            </div>
            <div className="fxs fxtb tall r29-table">
              <table>
                <thead><tr><th scope="col">Paciente</th><th scope="col">Plan y objetivo</th><th scope="col">Estado</th><th scope="col">Semana</th><th scope="col">Acción</th></tr></thead>
                <tbody id="r29-rows">
                  {visibles.length ? visibles.map(fila => <tr key={fila.id}>
                    <td><div className="who"><span className="av" style={{ background: fondoAvatar(fila.tono) }}>{fila.iniciales}</span><b>{fila.nombre}</b></div></td>
                    <td><div className="fxwhen"><b>{fila.titulo}</b><small>{fila.objetivo}</small></div></td>
                    <td><span className={`pill ${fila.clase}`}>{fila.estado}</span></td>
                    <td className="num">{fila.semana}</td>
                    <td><button type="button" className="sbtn" aria-label={`${fila.accion} ${fila.estado === 'Sin plan' ? 'para' : 'de'} ${fila.nombre}`} onClick={() => onEditor(fila.id)}>{fila.accion}<PanelV29Icon name="chev" size={12} /></button></td>
                  </tr>) : <tr><td colSpan={5}><div className="r29-empty">
                    {vacioTotal ? <><b>Todavía no hay pacientes</b><span>Cuando des de alta a alguien, el plan aparece acá.</span></> : <><b>No hay planes con esta búsqueda</b><span>Probá otro nombre o quitá los filtros.</span><button type="button" className="sbtn" onClick={onLimpiar}>Limpiar búsqueda y filtros</button></>}
                  </div></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div className="c">
          <section className="fxp">
            <Encabezado titulo="Tu próxima acción" meta={`${tareas.length} pendientes`} />
            {tareas.length ? <div className="fxr">{tareas.map(fila => <button type="button" key={fila.id} onClick={() => onEditor(fila.id)}>
              <span className="av" style={{ background: fondoAvatar(fila.tono) }}>{fila.iniciales}</span>
              <span className="t"><b>{fila.nombre}</b><small>{textoAccion(fila)}</small></span>
              <PanelV29Icon name="chev" size={13} />
            </button>)}</div> : <p className="mhelp">No hay pendientes.</p>}
          </section>
          <section className="fxp" id="planes-pedidos">
            <Encabezado titulo="Pedidos de cambio" meta="0 pendientes" />
            <p className="mhelp">No hay pedidos pendientes.</p>
          </section>
          <section className="fxp">
            <Encabezado titulo="Crear con el asistente" />
            <p className="mhelp">Usá la ficha, las preferencias y tus recetas como punto de partida.</p>
            <button type="button" className="sbtn k" onClick={onAsistente}><PanelV29Icon name="plus" size={13} />Elegir paciente y empezar</button>
          </section>
        </div>
      </div> : null}
    </div>
  </div>;
}

export function PanelPlanes({ patients, selectedId = '', initialVista, enfocarPedidos = false, onOpen, onHeader }: {
  patients: Patient[];
  selectedId?: string;
  initialVista?: string;
  enfocarPedidos?: boolean;
  onOpen: (href: string) => void;
  onHeader?: (actions: ReactNode) => void;
}) {
  const [vista, setVista] = useState<VistaPlanes>(initialVista === 'recetas' || initialVista === 'equivalencias' ? initialVista : 'lista');
  const [recetasHeader, setRecetasHeader] = useState<ReactNode>(null);
  const [recetaParaPlan, setRecetaParaPlan] = useState<ProfessionalRecipe | null>(null);
  useEffect(() => { setVista(initialVista === 'recetas' || initialVista === 'equivalencias' ? initialVista : 'lista'); setCreando(false); setAsistenteAbierto(false); }, [initialVista]);
  const [editorId, setEditorId] = useState(selectedId);
  const [consulta, setConsulta] = useState('');
  const [orden, setOrden] = useState<OrdenPlanes>('nombre');
  const [filtro, setFiltro] = useState<FiltroPlanes>('todos');
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState(false);
  const [reintento, setReintento] = useState(0);
  const [cargados, setCargados] = useState<Record<string, ProfessionalMealPlan | null>>({});
  const [demo, setDemo] = useState(false);
  const [asistentePedido, setAsistentePedido] = useState(0);
  const [publicarPedido, setPublicarPedido] = useState(0);
  const [creando, setCreando] = useState(false);
  const [pacienteArmar, setPacienteArmar] = useState('');
  const [armando, setArmando] = useState(false);
  const [propuestaLista, setPropuestaLista] = useState<AiJobView | null>(null);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const pacientesRef = useRef(patients);
  pacientesRef.current = patients;
  const clave = patients.map(persona => persona.id).join('|');
  const hoy = hoyArgentina();

  useEffect(() => {
    const control = new AbortController();
    const lista = pacientesRef.current;
    setCargados({});
    setError(false);
    let fallo = false;
    const leer = async () => {
      for (let inicio = 0; inicio < lista.length; inicio += 6) {
        if (control.signal.aborted) return;
        const grupo = lista.slice(inicio, inicio + 6);
        const siguientes: Record<string, ProfessionalMealPlan | null> = {};
        let memoria = false;
        const resultados = await Promise.all(grupo.map(async persona => {
          try {
            const { plan, source } = await plansApi.professional(persona.id, control.signal);
            if (source === 'memory') memoria = true;
            return [persona.id, plan] as const;
          } catch (razon) {
            if (control.signal.aborted) throw razon;
            fallo = true;
            return [persona.id, undefined] as const;
          }
        }));
        for (const [id, plan] of resultados) {
          if (plan !== undefined) siguientes[id] = plan;
        }
        if (control.signal.aborted) return;
        if (memoria) setDemo(true);
        setCargados(previo => ({ ...previo, ...siguientes }));
      }
      if (!control.signal.aborted) setError(fallo);
    };
    void leer().catch(() => undefined);
    return () => control.abort();
  }, [clave, reintento]);

  useEffect(() => {
    if (!enfocarPedidos) return;
    setVista('lista');
    document.getElementById('planes-pedidos')?.scrollIntoView({ block: 'nearest' });
  }, [enfocarPedidos]);

  const pacienteDe = useCallback((id?: string) => {
    if (id && patients.some(persona => persona.id === id)) return id;
    const sinPlan = patients.find(persona => persona.id in cargados && !cargados[persona.id]);
    return sinPlan?.id || patients.find(persona => persona.id === selectedId)?.id || [...patients].sort((a, b) => a.name.localeCompare(b.name, 'es'))[0]?.id || '';
  }, [patients, cargados, selectedId]);
  const abrirEditor = useCallback((id?: string) => {
    const elegido = pacienteDe(id);
    if (!elegido) return;
    setEditorId(elegido);
    setVista('plan');
    setAviso('');
  }, [pacienteDe]);
  const abrirNuevo = useCallback(() => {
    const sinPlan = patients.find(persona => persona.id in cargados && !cargados[persona.id]);
    if (!sinPlan && patients.length && Object.keys(cargados).length >= patients.length) {
      setAviso('Todas tus pacientes ya tienen un plan. Abrí el de cada una para seguir editándolo.');
      setVista('lista');
      return;
    }
    abrirEditor(sinPlan?.id);
  }, [patients, cargados, abrirEditor]);
  const abrirAsistente = useCallback(() => {
    const sinPlan = patients.find(persona => persona.id in cargados && !cargados[persona.id]);
    setCreando(false);
    abrirEditor(sinPlan?.id);
    setAsistentePedido(valor => valor + 1);
  }, [patients, cargados, abrirEditor]);
  const abrirArmar = useCallback((id?: string) => {
    const elegido = pacienteDe(id || editorId);
    if (!elegido) {
      setAviso('Todavía no hay pacientes para armar un plan.');
      return;
    }
    setPacienteArmar(elegido);
    setCreando(true);
    setAviso('');
  }, [pacienteDe, editorId]);
  const volverAlPlan = useCallback(() => {
    setCreando(false);
    abrirEditor(pacienteArmar || editorId);
  }, [abrirEditor, pacienteArmar, editorId]);
  const crearPropuesta = useCallback(async (preferencias: string[], duracion: DuracionArmado) => {
    const id = pacienteArmar || editorId || pacienteDe();
    if (!id || armando) return;
    setArmando(true);
    setAviso('El asistente está armando una propuesta. Queda como borrador privado hasta que la revises.');
    const periodo = periodoDesdeDuracion(duracion, hoy);
    const resultado = await pedirPropuesta({
      patientId: id,
      desde: periodo.desde,
      hasta: periodo.hasta,
      preferencias,
    });
    setArmando(false);
    if (resultado.ok) {
      setEditorId(id);
      setPropuestaLista(resultado.job);
      setCreando(false);
      setVista('plan');
    }
    if (resultado.aviso) setAviso(resultado.aviso);
  }, [pacienteArmar, editorId, pacienteDe, armando, hoy]);
  const alta = etiquetaAlta(vista);
  const planAbierto = editorId ? cargados[editorId] : undefined;
  const enEditor = vista === 'plan' && Boolean(planAbierto);
  const estadoPlanAbierto = planAbierto?.current.status;
  const accionesHeader = useRef({ abrirNuevo, abrirArmar, abrirEditor, volverAlPlan });
  accionesHeader.current = { abrirNuevo, abrirArmar, abrirEditor, volverAlPlan };
  useEffect(() => {
    if (vista === 'recetas') { onHeader?.(recetasHeader); return; }
    if (vista === 'equivalencias') { onHeader?.(null); return; }
    if (creando) {
      onHeader?.(<button className="chip" type="button" onClick={() => accionesHeader.current.volverAlPlan()}>Volver al plan</button>);
      return;
    }
    if (vista === 'plantillas') {
      onHeader?.(<button className="cta" type="button" onClick={() => { accionesHeader.current.abrirEditor(); setAviso('Abrí un plan y elegí Guardar como plantilla.'); }}><PanelV29Icon name="plus" size={13} />{alta}</button>);
      return;
    }
    if (enEditor) {
      const etiqueta = estadoPlanAbierto === 'published' ? 'Ver entrega' : 'Revisar y publicar';
      onHeader?.(<>
        <button className="chip" type="button" onClick={() => accionesHeader.current.abrirNuevo()}><PanelV29Icon name="plus" size={13} />Nuevo plan</button>
        <button className="cta" type="button" onClick={() => setPublicarPedido(valor => valor + 1)}><PanelV29Icon name="check" size={13} />{etiqueta}</button>
      </>);
      return;
    }
    onHeader?.(<>
      <button className="chip" type="button" onClick={() => accionesHeader.current.abrirArmar()}><PanelV29Icon name="spark" size={13} />Armar con IA</button>
      <button className="cta" type="button" onClick={() => accionesHeader.current.abrirNuevo()}><PanelV29Icon name="plus" size={13} />{alta}</button>
    </>);
  }, [onHeader, alta, enEditor, estadoPlanAbierto, vista, creando, recetasHeader]);
  useEffect(() => () => onHeader?.(null), [onHeader]);

  const filas = patients.map(persona => (persona.id in cargados)
    ? filaDePlan(persona, cargados[persona.id] ?? null, hoy)
    : filaProvisoria(persona, hoy));

  const idEditor = editorId || pacienteDe();
  const personaEditor = patients.find(persona => persona.id === idEditor);
  const personaArmar = patients.find(persona => persona.id === (pacienteArmar || idEditor));
  return <><PanelPlanesVista
    vista={vista} nombre={primerNombrePlanes(patients, idEditor || selectedId)} filas={filas} consulta={consulta} orden={orden} filtro={filtro}
    aviso={aviso} error={error} tareas={proximasAcciones(filas)}
    onVista={siguiente => {
      if (!canLeaveWorkspace()) return;
      setAviso('');
      setCreando(false);
      setAsistenteAbierto(false);
      if (siguiente === 'plan') abrirEditor(idEditor);
      else setVista(siguiente);
    }}
    onRecetas={() => { if (!canLeaveWorkspace()) return; setCreando(false); setAsistenteAbierto(false); setVista('recetas'); }}
    recetas={<PanelPlanRecetas pacienteId={idEditor} pacientes={patients} onHeader={setRecetasHeader} onAgregarAlPlan={setRecetaParaPlan} />}
    equivalencias={<PanelPlanEquivalencias pacienteId={idEditor} onOpenPlan={() => abrirEditor(idEditor)} />}
    onConsulta={setConsulta} onOrden={setOrden} onFiltro={setFiltro}
    onLimpiar={() => { setConsulta(''); setFiltro('todos'); }}
    onEditor={abrirEditor} onAsistente={abrirAsistente} onArmar={() => abrirArmar()} onReintentar={() => setReintento(valor => valor + 1)}
    creando={creando}
    asistenteAbierto={asistenteAbierto}
    armar={personaArmar ? <PanelPlanArmar
      key={personaArmar.id}
      pacientes={patients}
      pacienteId={personaArmar.id}
      kcal={cargados[personaArmar.id]?.current.nutrition_target?.kcal ?? null}
      hoy={hoy}
      armando={armando}
      onPaciente={id => {
        const siguiente = patients.find(persona => persona.id === id);
        if (siguiente) setPacienteArmar(siguiente.id);
      }}
      onAviso={setAviso}
      onCrear={(preferencias, duracion) => void crearPropuesta(preferencias, duracion)}
    /> : null}
    plantillas={<CatalogoPlantillas pacientes={patients} hoy={hoy} onAviso={setAviso} onPlan={guardado => {
      setCargados(previo => ({ ...previo, [guardado.patient_id]: guardado }));
      abrirEditor(guardado.patient_id);
    }} />}
    editor={personaEditor && !creando ? <PanelPlanEditor
      paciente={personaEditor}
      pacientes={patients}
      planes={cargados}
      plan={cargados[personaEditor.id] ?? null}
      cargando={!(personaEditor.id in cargados)}
      hoy={hoy}
      onElegir={abrirEditor}
      onPlan={guardado => setCargados(previo => ({ ...previo, [personaEditor.id]: guardado }))}
      onAviso={setAviso}
      onPlanCopiado={guardado => setCargados(previo => ({ ...previo, [guardado.patient_id]: guardado }))}
      asistentePedido={asistentePedido}
      publicarPedido={publicarPedido}
      demo={demo}
      onNuevo={abrirNuevo}
      onAsistenteAbierto={setAsistenteAbierto}
      propuestaLista={propuestaLista}
      onPropuestaTomada={() => setPropuestaLista(null)}
    /> : null}
  />{recetaParaPlan && <PanelPlanAgregarReceta receta={recetaParaPlan} pacientes={patients} pacienteId={idEditor} hoy={hoy} onClose={() => setRecetaParaPlan(null)} onSaved={plan => { setCargados(prev => ({ ...prev, [plan.patient_id]: plan })); setRecetaParaPlan(null); abrirEditor(plan.patient_id); setAviso('Receta agregada al borrador. Revisá antes de publicar.'); }} />}</>;
}
