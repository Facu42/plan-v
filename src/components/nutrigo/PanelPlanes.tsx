import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { plansApi } from '../../api/plans';
import type { Patient } from '../../types';
import type { ProfessionalMealPlan } from '../../types/plans';
import { PanelV29Icon } from './PanelV29Icon';
import {
  conteoFiltro, etiquetaAlta, filaDePlan, filaProvisoria, filasVisibles, fondoAvatar, hoyArgentina,
  primerNombrePlanes, proximasAcciones, textoAccion, FILTROS_PLANES,
  type FilaPlan, type FiltroPlanes, type OrdenPlanes, type VistaPlanes,
} from './planes-lista';

const AVISO_EDITOR = 'Próximamente. El editor del plan llega en la parte 2.';
const AVISO_IA = 'Próximamente. El armado con el asistente llega en la parte 3. Nada le llega a la paciente hasta que se publique.';

function Encabezado({ titulo, meta }: { titulo: string; meta?: string }) {
  return <header><h3>{titulo}</h3>{meta ? <span className="m">{meta}</span> : null}<span className="sp" /></header>;
}

export function PanelPlanesVista({
  vista, nombre, filas, consulta, orden, filtro, aviso, error, tareas,
  onVista, onRecetas, onConsulta, onOrden, onFiltro, onLimpiar, onEditor, onAsistente, onReintentar,
}: {
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
  onEditor: () => void;
  onAsistente: () => void;
  onReintentar: () => void;
}) {
  const visibles = filasVisibles(filas, filtro, orden, consulta);
  const vacioTotal = filas.length === 0;
  return <div id="s-planes" className="scr">
    <nav id="pview" className="tabs" role="navigation" aria-label="Secciones de Planes">
      <button type="button" className={vista === 'lista' ? 'on' : undefined} aria-current={vista === 'lista' ? 'page' : 'false'} onClick={() => onVista('lista')}>Todos los planes</button>
      <button type="button" className={vista === 'plan' ? 'on' : undefined} aria-current={vista === 'plan' ? 'page' : 'false'} onClick={() => onVista('plan')}>Plan de {nombre}</button>
      <button type="button" onClick={onRecetas}>Recetas</button>
      <button type="button" className={vista === 'plantillas' ? 'on' : undefined} aria-current={vista === 'plantillas' ? 'page' : 'false'} onClick={() => onVista('plantillas')}>Plantillas</button>
      <button type="button" className={vista === 'equivalencias' ? 'on' : undefined} aria-current={vista === 'equivalencias' ? 'page' : 'false'} onClick={() => onVista('equivalencias')}>Equivalencias</button>
    </nav>
    <div id="pwrap">
      {aviso ? <p className="mhelp" role="status">{aviso}</p> : null}
      {vista === 'plan' ? <section className="fxp"><Encabezado titulo={`Plan de ${nombre}`} /><p className="mhelp">Próximamente. El editor de la semana llega en la parte 2.</p></section> : null}
      {vista === 'plantillas' ? <section className="fxp"><Encabezado titulo="Plantillas" /><p className="mhelp">Próximamente. Las plantillas llegan con el editor del plan.</p></section> : null}
      {vista === 'equivalencias' ? <section className="fxp"><Encabezado titulo="Equivalencias" /><p className="mhelp">Próximamente. La calculadora de esta pantalla llega con el editor del plan.</p></section> : null}
      {vista === 'lista' ? <div className="fx">
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
                    <td><button type="button" className="sbtn" aria-label={`${fila.accion} ${fila.estado === 'Sin plan' ? 'para' : 'de'} ${fila.nombre}`} onClick={onEditor}>{fila.accion}<PanelV29Icon name="chev" size={12} /></button></td>
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
            {tareas.length ? <div className="fxr">{tareas.map(fila => <button type="button" key={fila.id} onClick={onEditor}>
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

export function PanelPlanes({ patients, selectedId = '', enfocarPedidos = false, onOpen, onHeader }: {
  patients: Patient[];
  selectedId?: string;
  enfocarPedidos?: boolean;
  onOpen: (href: string) => void;
  onHeader?: (actions: ReactNode) => void;
}) {
  const [vista, setVista] = useState<VistaPlanes>('lista');
  const [consulta, setConsulta] = useState('');
  const [orden, setOrden] = useState<OrdenPlanes>('nombre');
  const [filtro, setFiltro] = useState<FiltroPlanes>('todos');
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState(false);
  const [reintento, setReintento] = useState(0);
  const [cargados, setCargados] = useState<Record<string, ProfessionalMealPlan | null>>({});
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
        const resultados = await Promise.all(grupo.map(async persona => {
          try {
            const { plan } = await plansApi.professional(persona.id, control.signal);
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

  const abrirEditor = useCallback(() => setAviso(AVISO_EDITOR), []);
  const abrirAsistente = useCallback(() => setAviso(AVISO_IA), []);
  const alta = etiquetaAlta(vista);
  useEffect(() => {
    onHeader?.(<button className="cta" type="button" onClick={abrirEditor}><PanelV29Icon name="plus" size={13} />{alta}</button>);
  }, [onHeader, alta, abrirEditor]);
  useEffect(() => () => onHeader?.(null), [onHeader]);

  const filas = patients.map(persona => (persona.id in cargados)
    ? filaDePlan(persona, cargados[persona.id] ?? null, hoy)
    : filaProvisoria(persona, hoy));

  return <PanelPlanesVista
    vista={vista} nombre={primerNombrePlanes(patients, selectedId)} filas={filas} consulta={consulta} orden={orden} filtro={filtro}
    aviso={aviso} error={error} tareas={proximasAcciones(filas)}
    onVista={siguiente => { setVista(siguiente); setAviso(''); }}
    onRecetas={() => onOpen('/crm/biblioteca?biblioteca=recetas')}
    onConsulta={setConsulta} onOrden={setOrden} onFiltro={setFiltro}
    onLimpiar={() => { setConsulta(''); setFiltro('todos'); }}
    onEditor={abrirEditor} onAsistente={abrirAsistente} onReintentar={() => setReintento(valor => valor + 1)}
  />;
}
