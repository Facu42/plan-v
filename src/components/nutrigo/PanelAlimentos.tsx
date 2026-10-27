import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { foodApi } from '../../api/foods';
import { foodQuantityUnit, type Food } from '../../types/foods';
import { AvisoBoceto, usePanelBoceto } from './panel-v29-boceto';
import { TOAST_DESMONTE_MS } from './panel-v29-motion';
import { PanelV29Icon } from './PanelV29Icon';
import {
  anchoEnergia, borradorEdicion, borradorNuevo, etiquetaTarjeta, filtrosDe, grupoDe, nutrientesDePorcion,
  origenCorto, porcionesDe, repartoMacros, seEdita, sigueEnVista, textoCantidad, textoNumero,
  type AlcanceAlimento, type AltaAlimento,
} from './alimentos-presentacion';

const ALCANCES: Array<[AlcanceAlimento, string]> = [['todos', 'Todos'], ['sara', 'SARA 2'], ['prop', 'Propios']];

export function AccionesAlimentos({
  consulta, alcance, onConsulta, onBuscar, onAlcance, onNuevo,
}: {
  consulta: string;
  alcance: AlcanceAlimento;
  onConsulta: (texto: string) => void;
  onBuscar: () => void;
  onAlcance: (alcance: AlcanceAlimento) => void;
  onNuevo: () => void;
}) {
  return <>
    <label className="sxin">
      <PanelV29Icon name="search" size={14} />
      <input aria-label="Buscar alimento" placeholder="Buscar alimento" value={consulta} onChange={evento => onConsulta(evento.target.value)} onKeyDown={evento => { if (evento.key === 'Enter') { evento.preventDefault(); onBuscar(); } }} />
    </label>
    <button className="chip" type="button" onClick={onBuscar}>Buscar</button>
    <div className="tabs" aria-label="Origen">
      {ALCANCES.map(([id, etiqueta]) => <button type="button" key={id} className={alcance === id ? 'on' : undefined} aria-pressed={alcance === id} onClick={() => onAlcance(id)}>{etiqueta}</button>)}
    </div>
    <button className="cta" type="button" onClick={onNuevo}>Nuevo alimento</button>
  </>;
}

function Aviso({ texto }: { texto: string }) {
  return <AvisoBoceto texto={texto} />;
}

function Barra({ porcentaje, clase }: { porcentaje: number; clase?: string }) {
  return <span className={clase ? `fxb ${clase}` : 'fxb'}><i style={{ width: `${Math.min(100, porcentaje)}%` }} /></span>;
}

type Dialogo = null | { kind: 'nuevo' } | { kind: 'editar'; food: Food };

export function PanelAlimentosVista({
  lista, total, estado, elegido, porcion,   grupo, grupoEstado, grupoHayMas, dialog, toast, errorForm, guardando,
  onVer, onPorcion, onGrupo, onEditar, onCerrar, onGuardarNuevo, onGuardarEdicion, onReintentar,
}: {
  lista: Food[];
  total: number;
  estado: 'cargando' | 'lista' | 'error';
  elegido: Food | null;
  porcion: string;
  grupo: Food[];
  grupoEstado: 'oculto' | 'cargando' | 'lista' | 'error';
  grupoHayMas: boolean;
  dialog: Dialogo;
  toast: string;
  errorForm: string;
  guardando: boolean;
  onVer: (food: Food) => void;
  onPorcion: (clave: string) => void;
  onGrupo: (food: Food) => void;
  onEditar: () => void;
  onCerrar: () => void;
  onGuardarNuevo: (alta: AltaAlimento) => void;
  onGuardarEdicion: (nombre: string, kcal: string) => void;
  onReintentar: () => void;
}) {
  const filas = estado === 'cargando'
    ? <p className="sxsub">Cargando el catálogo…</p>
    : estado === 'error'
      ? <p className="sxsub">No se pudo cargar el catálogo. <button type="button" className="chip" onClick={onReintentar}>Reintentar</button></p>
      : lista.length
        ? lista.map(food => <div className={elegido?.id === food.id ? 'l on' : 'l'} key={food.id}>
          <span className="sxwho"><b>{food.name}</b><small>{origenCorto(food)} · {grupoDe(food) || 'Sin grupo'}</small></span>
          <button type="button" className="chip" onClick={() => onVer(food)}>Ver</button>
        </div>)
        : <p className="sxsub">Ningún alimento con ese texto.</p>;
  const unidad = elegido ? foodQuantityUnit(elegido) : 'g';
  const porciones = elegido ? porcionesDe(elegido) : [];
  const actual = porciones.find(item => item.clave === porcion) ?? porciones[0];
  const macros = elegido ? repartoMacros(elegido) : null;
  const valores = elegido && actual ? nutrientesDePorcion(elegido, actual.cantidad) : null;
  const grupoNombre = elegido ? grupoDe(elegido) : '';
  return <div id="s-alimentos" className="sxw">
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '.78fr 1.28fr' }}>
      <div className="c">
        <section className="fxp g">
          <header>
            <h3>Catálogo</h3>
            <span className="m">{estado === 'lista' ? `${lista.length} en esta lista` : '—'}</span>
            <span className="sp" />
          </header>
          <div className="fxs">
            <div className="fxr">{filas}</div>
            <p className="sxsub">SARA 2 se consulta. Para otro valor, creá un alimento propio.</p>
            {estado === 'lista' && total > lista.length ? <p className="sxsub">Hay más. Escribí para afinar.</p> : null}
          </div>
        </section>
      </div>
      <div className="c">
        {elegido && actual && macros && valores ? <>
          <div className="fxdk">
            <small>{etiquetaTarjeta(elegido)}</small>
            <b className="num">{elegido.nutrients.kcal == null ? 'Sin dato' : `${textoNumero(elegido.nutrients.kcal)} kcal`}</b>
            <span>{elegido.name} · por 100 {unidad} · {origenCorto(elegido)}</span>
            <div className="fxdkp" aria-hidden="true"><i style={{ width: `${anchoEnergia(elegido.nutrients.kcal)}%` }} /></div>
            <div className="fxdk2"><span>Grupo</span><b>{grupoNombre || 'Sin grupo'}</b></div>
          </div>
          <section className="fxp">
            <header>
              <h3>Esta porción</h3>
              <span className="m">{textoCantidad(actual.cantidad, unidad)}</span>
              <span className="sp" />
              <button type="button" className="chip" onClick={onEditar}>{seEdita(elegido) ? 'Editar' : 'No se edita'}</button>
            </header>
            <div className="tabs" aria-label="Porción">
              {porciones.map(item => <button type="button" key={item.clave} className={item.clave === actual.clave ? 'on' : undefined} aria-pressed={item.clave === actual.clave} onClick={() => onPorcion(item.clave)}>{item.etiqueta}</button>)}
            </div>
            <p className="sxsub">{valores.kcal == null ? `Sin dato de energía en ${textoCantidad(actual.cantidad, unidad)}.` : `${textoNumero(valores.kcal)} kcal en ${textoCantidad(actual.cantidad, unidad)}.`} Lo que no está cargado no se inventa.</p>
            {unidad === 'ml' ? <p className="sxsub">Esta base es en mililitros. No se convierte a una medida en gramos.</p> : null}
            <div className="sxmac">
              <div><b>Proteínas</b><small>{macros.protein == null || valores.protein == null ? 'Sin dato' : `${textoNumero(valores.protein)} g`}</small></div>
              <Barra porcentaje={macros.barras[0]} clase="k" />
              <div><b>Carbohidratos</b><small>{macros.carbs == null || valores.carbs == null ? 'Sin dato' : `${textoNumero(valores.carbs)} g`}</small></div>
              <Barra porcentaje={macros.barras[1]} />
              <div><b>Grasas</b><small>{macros.fat == null || valores.fat == null ? 'Sin dato' : `${textoNumero(valores.fat)} g`}</small></div>
              <Barra porcentaje={macros.barras[2]} clase="o" />
            </div>
          </section>
          <section className="fxp g">
            <header>
              <h3>{grupoNombre ? `Mismo grupo · ${grupoNombre}` : 'Grupos'}</h3>
              <span className="m">{!grupoNombre ? 'Sin grupo' : grupoEstado === 'lista' ? `${grupo.length} ${grupo.length === 1 ? 'alimento' : 'alimentos'}` : '—'}</span>
              <span className="sp" />
            </header>
            <div className="fxs">
              <div className="fxr">
                {!grupoNombre ? <p className="sxsub">Este alimento no tiene grupo.</p> : grupoEstado === 'cargando' ? <p className="sxsub">Cargando el grupo…</p> : grupoEstado === 'error' ? <p className="sxsub">No se pudo cargar el grupo.</p> : grupo.length ? grupo.map(food => <button type="button" className={food.id === elegido.id ? 'l on' : 'l'} key={food.id} onClick={() => onGrupo(food)}>
                  <span className="sxwho"><b>{food.name}</b><small>{food.nutrients.kcal == null ? 'Sin dato' : `${textoNumero(food.nutrients.kcal)} kcal`} / 100 {foodQuantityUnit(food)} · {origenCorto(food)}</small></span>
                </button>) : <p className="sxsub">No hay alimentos en este grupo.</p>}
              </div>
              {grupoHayMas ? <p className="sxsub">Hay más en este grupo. Escribí el nombre en el buscador.</p> : null}
            </div>
          </section>
        </> : <div className="fxdk"><small>Catálogo</small><b className="num">Sin elección</b><span>Elegí un alimento de la lista.</span></div>}
      </div>
    </div>
    {dialog ? <PanelAlimento dialog={dialog} error={errorForm} guardando={guardando} onCerrar={onCerrar} onGuardarNuevo={onGuardarNuevo} onGuardarEdicion={onGuardarEdicion} /> : null}
    {toast ? <Aviso texto={toast} /> : null}
  </div>;
}

function PanelAlimento({ dialog, error, guardando, onCerrar, onGuardarNuevo, onGuardarEdicion }: {
  dialog: Exclude<Dialogo, null>;
  error: string;
  guardando: boolean;
  onCerrar: () => void;
  onGuardarNuevo: (alta: AltaAlimento) => void;
  onGuardarEdicion: (nombre: string, kcal: string) => void;
}) {
  const [alta, setAlta] = useState<AltaAlimento>({ nombre: '', fuente: '', kcal: '', proteina: '', medida: '', gramos: '' });
  const [nombre, setNombre] = useState(dialog.kind === 'editar' ? dialog.food.name : '');
  const [kcal, setKcal] = useState(dialog.kind === 'editar' && dialog.food.nutrients.kcal != null ? String(dialog.food.nutrients.kcal) : '');
  const { clase, cerrar } = usePanelBoceto(onCerrar);
  const nodo = <div id="actw" className={clase || undefined}>
    <div className="ascrim" onClick={cerrar} />
    <aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt">
      <header>
        <div>
          <h2 id="actt">{dialog.kind === 'nuevo' ? 'Nuevo alimento' : 'Editar alimento'}</h2>
          <p id="acts">{dialog.kind === 'nuevo' ? 'Queda entre los tuyos. SARA 2 no se toca.' : dialog.food.name}</p>
        </div>
        <button type="button" className="ibtn" aria-label="Cerrar" onClick={cerrar}><PanelV29Icon name="x" size={13} /></button>
      </header>
      <div className="abody" id="actb">
        {dialog.kind === 'nuevo' ? <>
          <label className="af"><span>Nombre</span><input className="ai" value={alta.nombre} placeholder="Ej.: Tarta de verdura" onChange={evento => setAlta({ ...alta, nombre: evento.target.value })} /></label>
          <label className="af"><span>Fuente</span><input className="ai" value={alta.fuente} placeholder="Rótulo del envase" onChange={evento => setAlta({ ...alta, fuente: evento.target.value })} /></label>
          <div className="arow">
            <label className="af"><span>kcal / 100 g</span><input className="ai" inputMode="decimal" value={alta.kcal} onChange={evento => setAlta({ ...alta, kcal: evento.target.value })} /></label>
            <label className="af"><span>Proteínas g</span><input className="ai" inputMode="decimal" value={alta.proteina} onChange={evento => setAlta({ ...alta, proteina: evento.target.value })} /></label>
          </div>
          <div className="arow">
            <label className="af"><span>Medida casera</span><input className="ai" value={alta.medida} placeholder="1 porción" onChange={evento => setAlta({ ...alta, medida: evento.target.value })} /></label>
            <label className="af"><span>Gramos</span><input className="ai" inputMode="decimal" value={alta.gramos} onChange={evento => setAlta({ ...alta, gramos: evento.target.value })} /></label>
          </div>
          <p className="sxsub">Si no cargás una medida, el alimento queda por 100 g. Los gramos vacíos no se inventan.</p>
        </> : <>
          <label className="af"><span>Nombre</span><input className="ai" value={nombre} onChange={evento => setNombre(evento.target.value)} /></label>
          <label className="af"><span>kcal / 100 g</span><input className="ai" inputMode="decimal" value={kcal} onChange={evento => setKcal(evento.target.value)} /></label>
          <p className="sxsub">Se guarda el nombre y la energía. El resto del alimento queda como estaba.</p>
        </>}
        {error ? <p className="sxsub" role="alert">{error}</p> : null}
      </div>
      <footer id="actf">
        <button type="button" className="chip" onClick={cerrar}>Cancelar</button>
        <span style={{ flex: 1 }} />
        <button type="button" className="cta" disabled={guardando} onClick={() => dialog.kind === 'nuevo' ? onGuardarNuevo(alta) : onGuardarEdicion(nombre, kcal)}>{guardando ? 'Guardando…' : dialog.kind === 'nuevo' ? 'Guardar alimento' : 'Guardar'}</button>
      </footer>
    </aside>
  </div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}

export function PanelAlimentos({ onHeader }: { onHeader?: (actions: ReactNode) => void }) {
  const [borrador, setBorrador] = useState('');
  const [consulta, setConsulta] = useState('');
  const [alcance, setAlcance] = useState<AlcanceAlimento>('todos');
  const [marca, setMarca] = useState(0);
  const [lista, setLista] = useState<Food[]>([]);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando');
  const [elegido, setElegido] = useState<Food | null>(null);
  const [porcion, setPorcion] = useState('100');
  const [grupo, setGrupo] = useState<Food[]>([]);
  const [grupoTotal, setGrupoTotal] = useState(0);
  const [grupoEstado, setGrupoEstado] = useState<'oculto' | 'cargando' | 'lista' | 'error'>('oculto');
  const [dialog, setDialog] = useState<Dialogo>(null);
  const [toast, setToast] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const avisar = useCallback((texto: string) => {
    setToast(texto);
    window.setTimeout(() => setToast(actual => actual === texto ? '' : actual), TOAST_DESMONTE_MS);
  }, []);
  const buscar = useCallback(() => {
    setConsulta(borrador.trim());
    setMarca(valor => valor + 1);
    avisar(borrador.trim() ? `Buscaste «${borrador.trim()}».` : 'Mostrando el catálogo.');
  }, [avisar, borrador]);
  const nuevo = useCallback(() => { setErrorForm(''); setDialog({ kind: 'nuevo' }); }, []);
  const cambiarAlcance = useCallback((siguiente: AlcanceAlimento) => {
    if (siguiente === alcance) { avisar(`Ya estás viendo ${ALCANCES.find(([id]) => id === siguiente)?.[1] ?? 'esta lista'}.`); return; }
    setAlcance(siguiente);
  }, [alcance, avisar]);

  useEffect(() => () => onHeader?.(null), [onHeader]);
  useEffect(() => {
    onHeader?.(<AccionesAlimentos consulta={borrador} alcance={alcance} onConsulta={setBorrador} onBuscar={buscar} onAlcance={cambiarAlcance} onNuevo={nuevo} />);
  }, [onHeader, borrador, alcance, buscar, cambiarAlcance, nuevo]);

  useEffect(() => {
    const ac = new AbortController();
    setEstado('cargando');
    void foodApi.search(filtrosDe(alcance, consulta), ac.signal)
      .then(resultado => {
        if (ac.signal.aborted) return;
        setLista(resultado.foods);
        setTotal(resultado.total);
        setEstado('lista');
        setElegido(actual => {
          if (actual && (resultado.foods.some(food => food.id === actual.id) || sigueEnVista(actual, alcance, consulta))) {
            return resultado.foods.find(food => food.id === actual.id) ?? actual;
          }
          return resultado.foods[0] ?? null;
        });
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (!ac.signal.aborted) setEstado('error');
      });
    return () => ac.abort();
  }, [alcance, consulta, marca]);

  useEffect(() => {
    const categoria = elegido ? grupoDe(elegido) : '';
    if (!categoria) { setGrupo([]); setGrupoTotal(0); setGrupoEstado('oculto'); return undefined; }
    const ac = new AbortController();
    setGrupo([]);
    setGrupoTotal(0);
    setGrupoEstado('cargando');
    void foodApi.search({ q: '', kind: 'food', scope: 'all', source: '', category: categoria, order: 'name-asc', page: 0, page_size: 50 }, ac.signal)
      .then(resultado => {
        if (ac.signal.aborted) return;
        setGrupo(resultado.foods);
        setGrupoTotal(resultado.total);
        setGrupoEstado('lista');
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (!ac.signal.aborted) setGrupoEstado('error');
      });
    return () => ac.abort();
  }, [elegido]);

  useEffect(() => {
    if (!dialog) return undefined;
    const cerrar = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setDialog(null); };
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [dialog]);

  const ver = (food: Food) => {
    if (food.id === elegido?.id) { avisar('Ya estás viendo este alimento.'); return; }
    setElegido(food);
    setPorcion('100');
  };
  const editar = () => {
    if (!elegido) return;
    if (!seEdita(elegido)) { avisar('SARA 2 no se edita. Creá un alimento propio.'); return; }
    setErrorForm('');
    setDialog({ kind: 'editar', food: elegido });
  };
  const guardarNuevo = async (alta: AltaAlimento) => {
    const armado = borradorNuevo(alta);
    if (!armado.ok) { setErrorForm(armado.error); return; }
    setGuardando(true);
    setErrorForm('');
    try {
      const { food } = await foodApi.save(armado.input);
      setDialog(null);
      setAlcance('prop');
      setBorrador('');
      setConsulta('');
      setElegido(food);
      setPorcion('100');
      setMarca(valor => valor + 1);
      avisar('Alimento guardado. Quedó entre los tuyos.');
    } catch (error) {
      setErrorForm(error instanceof Error ? error.message : 'No pudimos guardar. Tus cambios siguen acá.');
    } finally { setGuardando(false); }
  };
  const guardarEdicion = async (nombre: string, kcal: string) => {
    if (dialog?.kind !== 'editar') return;
    const armado = borradorEdicion(dialog.food, nombre, kcal);
    if (!armado.ok) { setErrorForm(armado.error); return; }
    setGuardando(true);
    setErrorForm('');
    try {
      const { food } = await foodApi.save(armado.input);
      setDialog(null);
      setElegido(food);
      setLista(actual => actual.map(item => item.id === food.id ? food : item));
      setGrupo(actual => actual.map(item => item.id === food.id ? food : item));
      avisar('Alimento actualizado.');
    } catch (error) {
      setErrorForm(error instanceof Error ? error.message : 'No pudimos guardar. Tus cambios siguen acá.');
    } finally { setGuardando(false); }
  };

  const porciones = elegido ? porcionesDe(elegido) : [];
  const elegirPorcion = (clave: string) => {
    if (clave === (porciones.some(item => item.clave === porcion) ? porcion : '100')) {
      avisar(`Ya estás viendo ${porciones.find(item => item.clave === clave)?.etiqueta ?? 'esta porción'}.`);
      return;
    }
    setPorcion(clave);
  };

  return <PanelAlimentosVista
    lista={lista} total={total} estado={estado}
    elegido={elegido} porcion={porciones.some(item => item.clave === porcion) ? porcion : '100'}
    grupo={grupo} grupoEstado={grupoEstado} grupoHayMas={grupoTotal > grupo.length} dialog={dialog} toast={toast} errorForm={errorForm} guardando={guardando}
    onVer={ver} onPorcion={elegirPorcion} onGrupo={ver} onEditar={editar} onCerrar={() => { if (!guardando) setDialog(null); }}
    onGuardarNuevo={alta => void guardarNuevo(alta)} onGuardarEdicion={(nombre, kcal) => void guardarEdicion(nombre, kcal)}
    onReintentar={() => setMarca(valor => valor + 1)}
  />;
}
