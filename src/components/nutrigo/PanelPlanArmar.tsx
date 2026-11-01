import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { aiJobsApi } from '../../api/ai-jobs';
import { api } from '../../api/client';
import type { AiMonthlyUsage } from '../../types/ai-jobs';
import type { Patient } from '../../types';
import { PanelV29Icon } from './PanelV29Icon';
import { fondoAvatar } from './planes-lista';
import {
  AVISO_FICHA, AVISO_FORMATO, AVISO_META_ARMADO,
  CUIDADOS_PLAN, DIETAS_PLAN, DURACIONES_PLAN, ESTRATEGIAS_PLAN, FORMATOS_PLAN, IDEAS_ARMADO, INCLUIR_PLAN, MEDIDAS_PLAN,
  datosDeFicha, notaDuracion, periodoDesdeDuracion, preferenciasDelArmado, type DuracionArmado,
} from './planes-asistente';
import {
  AVISO_DEMASIADAS, AVISO_ERROR_DICTADO, AVISO_LIMITE_REFERENCIA, AVISO_SIN_DICTADO, MAX_REFERENCIAS,
  agregarTexto, leerReferencia, reconocimientoDelNavegador, textoDictado, type Reconocimiento, type Referencia,
} from './planes-referencia';

type Persona = Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'goal' | 'plan_b' | 'next_focus' | 'sensitive_hours'>;

export function PanelPlanArmar({
  pacientes, pacienteId, kcal, hoy, armando, onPaciente, onAviso, onCrear,
}: {
  pacientes: Persona[];
  pacienteId: string;
  kcal: number | null;
  hoy: string;
  armando: boolean;
  onPaciente: (id: string) => void;
  onAviso: (texto: string) => void;
  onCrear: (preferencias: string[], duracion: DuracionArmado) => void;
}) {
  const paciente = pacientes.find(persona => persona.id === pacienteId) ?? pacientes[0];
  const [uso, setUso] = useState<AiMonthlyUsage | null | undefined>(undefined);
  const [permisos, setPermisos] = useState<string[] | null | undefined>(undefined);
  const [iaDisponible, setIaDisponible] = useState(true);
  const [enviandoPermiso, setEnviandoPermiso] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setUso(undefined);
    setPermisos(undefined);
    setIaDisponible(true);
    if (pacienteId) aiJobsApi.list(pacienteId, controller.signal)
      .then(respuesta => {
        if (controller.signal.aborted) return;
        setUso(respuesta.usage ?? null);
        setPermisos(respuesta.consented ?? null);
        setIaDisponible(respuesta.ai_available !== false);
      })
      .catch(() => { if (!controller.signal.aborted) { setUso(null); setPermisos(null); } });
    else { setUso(null); setPermisos(null); }
    return () => controller.abort();
  }, [pacienteId, armando]);
  const [pedido, setPedido] = useState('');
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [escuchando, setEscuchando] = useState(false);
  const selector = useRef<HTMLInputElement>(null);
  const dictado = useRef<Reconocimiento | null>(null);
  useEffect(() => () => dictado.current?.stop(), []);
  const [elegir, setElegir] = useState(false);
  const [dieta, setDieta] = useState(0);
  const [estrategias, setEstrategias] = useState<string[]>([]);
  const [cuidados, setCuidados] = useState<string[]>([]);
  const [sumarCuidado, setSumarCuidado] = useState(false);
  const [formato, setFormato] = useState(0);
  const [medidas, setMedidas] = useState(1);
  const [incluir, setIncluir] = useState<boolean[]>(INCLUIR_PLAN.map(() => false));
  const [duracion, setDuracion] = useState<DuracionArmado>(1);
  const [contexto, setContexto] = useState(false);
  const [ficha, setFicha] = useState(() => datosDeFicha(paciente ?? { goal: '', plan_b: '', next_focus: '', sensitive_hours: '' }));
  const nombre = paciente?.name.split(/\s+/)[0] || 'la paciente';
  const activas = ficha.filter(item => item.usar).length;
  const recortado = useMemo(() => periodoDesdeDuracion(duracion, hoy).recortado, [duracion, hoy]);
  const nota = notaDuracion(recortado);

  function cambiarPaciente(id: string) {
    const siguiente = pacientes.find(persona => persona.id === id);
    if (!siguiente) return;
    onPaciente(id);
    setFicha(datosDeFicha(siguiente));
    setElegir(false);
  }

  function dictar() {
    if (dictado.current) { dictado.current.stop(); return; }
    const crearReconocimiento = reconocimientoDelNavegador();
    if (!crearReconocimiento) { onAviso(AVISO_SIN_DICTADO); return; }
    const reconocimiento = crearReconocimiento();
    reconocimiento.lang = 'es-AR'; reconocimiento.continuous = false; reconocimiento.interimResults = false;
    reconocimiento.onresult = evento => setPedido(actual => agregarTexto(actual, textoDictado(evento)));
    reconocimiento.onerror = evento => onAviso(AVISO_ERROR_DICTADO[evento.error ?? ''] ?? 'No se pudo dictar. Escribí el pedido.');
    reconocimiento.onend = () => { dictado.current = null; setEscuchando(false); };
    dictado.current = reconocimiento; setEscuchando(true);
    try { reconocimiento.start(); } catch { dictado.current = null; setEscuchando(false); onAviso(AVISO_SIN_DICTADO); }
  }

  async function adjuntar(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    if (referencias.length >= MAX_REFERENCIAS) { onAviso(AVISO_DEMASIADAS); return; }
    try {
      const referencia = await leerReferencia(archivo);
      setReferencias(actuales => [...actuales, referencia]);
      onAviso(AVISO_LIMITE_REFERENCIA);
    } catch (error) {
      onAviso(error instanceof Error ? error.message : 'No se pudo leer el archivo.');
    }
  }

  const faltaPermisoMenu = Array.isArray(permisos) && !permisos.includes('ai_menu_draft');

  async function pedirPermisoEnChat() {
    if (!paciente || enviandoPermiso) return;
    setEnviandoPermiso(true);
    try {
      await api.sendMessage(paciente.id, `Hola ${nombre}, para armar un borrador de tu plan con el asistente necesito que actives el permiso «Borradores de menú con IA» desde tu app en Mi ficha → Mis datos y permisos.`, 'vero');
      onAviso(`Le enviamos un mensaje a ${nombre} en el chat de la app para que active «Borradores de menú con IA».`);
    } catch {
      onAviso('No pudimos enviar el mensaje por el chat. Podés copiar las instrucciones y mandárselas.');
    } finally {
      setEnviandoPermiso(false);
    }
  }

  async function copiarInstruccionesPermiso() {
    const texto = `Hola ${nombre}, para que pueda preparar un borrador de tu plan con IA activá el permiso «Borradores de menú con IA» desde tu app en Mi ficha → Mis datos y permisos.`;
    try {
      await navigator.clipboard.writeText(texto);
      onAviso('Instrucciones copiadas para enviarle a la paciente.');
    } catch {
      onAviso(texto);
    }
  }

  function crear() {
    if (!iaDisponible) {
      onAviso('El asistente de IA no está habilitado en este entorno. Podés armar el plan manualmente en el editor.');
      return;
    }
    if (faltaPermisoMenu) {
      onAviso(`${nombre} todavía no activó el permiso «Borradores de menú con IA». Debe habilitarlo desde su app en Mi ficha → Mis datos y permisos.`);
      return;
    }
    if (!pedido.trim()) {
      onAviso('Contá qué plan necesitás antes de crear la propuesta.');
      return;
    }
    try {
      onCrear(preferenciasDelArmado({
        pedido,
        dieta: DIETAS_PLAN[dieta] ?? 'General',
        estrategias,
        cuidados,
        ficha,
        formato: FORMATOS_PLAN[formato],
        medidas: MEDIDAS_PLAN[medidas],
        incluir: INCLUIR_PLAN.filter((_, indice) => incluir[indice]),
        referencias,
      }), duracion);
    } catch (error) {
      onAviso(error instanceof Error ? error.message : 'Revisá las opciones del pedido.');
    }
  }

  if (!paciente) return <p className="mhelp">Todavía no hay pacientes para armar un plan.</p>;

  return <div className="fx">
    <div className="c">
      <section className="fxp iaask p28-ai-workspace">
        <div className="p28-ai-top">
          <div>
            <span className="iabadge"><PanelV29Icon name="spark" size={12} />Asistente de planes</span>
            <h2>Un plan pensado para {nombre}</h2>
            <p>Primero contá qué necesitás. Después revisás y ajustás la propuesta.</p>
          </div>
          <button type="button" className="iafor" onClick={() => setElegir(abierto => !abierto)}>
            <span className="av" style={{ background: fondoAvatar(paciente.tone) }}>{paciente.initials}</span>
            Cambiar paciente <PanelV29Icon name="chev" size={11} />
          </button>
        </div>
        {elegir ? <div className="fxr" role="listbox" aria-label="Elegir paciente">{pacientes.map(persona => <button type="button" key={persona.id} role="option" aria-selected={persona.id === paciente.id} onClick={() => cambiarPaciente(persona.id)}>
          <span className="av" style={{ background: fondoAvatar(persona.tone) }}>{persona.initials}</span>
          <span className="t"><b>{persona.name}</b><small>{persona.goal.trim() || 'Sin objetivo'}</small></span>
        </button>)}</div> : null}
        {!iaDisponible ? <div className="p28-context-link" role="status">
          <span><PanelV29Icon name="spark" size={14} /><b>Asistente de IA no disponible en este entorno</b><small>Podés armar el plan manualmente en el editor o usar una plantilla.</small></span>
        </div> : faltaPermisoMenu ? <div className="p28-context-link" role="status">
          <span><PanelV29Icon name="spark" size={14} /><b>Falta que {nombre} active «Borradores de menú con IA»</b><small>La paciente lo habilita desde su app en Mi ficha → Mis datos y permisos.</small></span>
          <div className="iabar">
            <button type="button" className="sbtn k" disabled={enviandoPermiso} onClick={() => void pedirPermisoEnChat()}>{enviandoPermiso ? 'Enviando…' : 'Pedirle permiso por chat'}</button>
            <button type="button" className="sbtn" onClick={() => void copiarInstruccionesPermiso()}>Copiar instrucciones</button>
          </div>
        </div> : null}
        <div className="p28-ai-grid">
          <div className="p28-compose">
            <div className="p28-section-label"><b>Tu pedido</b><span>Con tus palabras</span></div>
            <div className="iabox">
              <label className="pux-prompt-label" htmlFor="iatxt">¿Qué plan querés crear?</label>
              <textarea id="iatxt" rows={8} aria-label="Qué plan querés" placeholder={`Por ejemplo: una semana de comidas fáciles para ${nombre}. Desayunos rápidos, viandas para llevar al trabajo y cenas livianas.`} value={pedido} onChange={evento => setPedido(evento.target.value)} />
              {referencias.length ? <div className="iafiles">{referencias.map((referencia, indice) => <span key={`${referencia.nombre}${indice}`}><PanelV29Icon name="file" size={12} />{referencia.nombre}<button type="button" aria-label={`Quitar ${referencia.nombre}`} onClick={() => setReferencias(actuales => actuales.filter((_, i) => i !== indice))}><PanelV29Icon name="x" size={10} /></button></span>)}</div> : null}
              <div className="iabar">
                <button type="button" className="lnk" onClick={() => selector.current?.click()}><PanelV29Icon name="clip" size={13} />Adjuntar referencia</button>
                <button type="button" className={`lnk${escuchando ? ' on' : ''}`} aria-pressed={escuchando} onClick={dictar}><PanelV29Icon name="mic" size={13} />{escuchando ? 'Escuchando…' : 'Dictar pedido'}</button>
                <input ref={selector} type="file" hidden accept=".pdf,.txt,.csv,.md,application/pdf,text/*" aria-label="Elegir archivo de referencia" onChange={event => void adjuntar(event)} />
              </div>
            </div>
            <div className="iaideas"><span>Para empezar</span>{IDEAS_ARMADO.map(idea => <button type="button" key={idea} onClick={() => setPedido(idea)}>{idea}</button>)}</div>
            <div className="p28-context-link">
              <span><PanelV29Icon name="file" size={14} /><b>{activas} datos de la ficha</b><small>se usan como contexto</small></span>
              <button type="button" className="sbtn" aria-expanded={contexto} aria-controls="p28-context" onClick={() => setContexto(abierto => !abierto)}>{contexto ? 'Ocultar datos' : 'Ver y elegir datos'} <PanelV29Icon name="chev" size={12} /></button>
            </div>
          </div>
          <aside className="p28-config" aria-label="Opciones del plan">
            <div className="p28-section-label"><b>Definí el alcance</b><span>Podés cambiarlo después</span></div>
            <div className="pux-duration"><span>Duración del plan</span><div className="iaseg" role="radiogroup" aria-label="Duración del plan">
              {DURACIONES_PLAN.map((etiqueta, indice) => <button type="button" role="radio" key={etiqueta} aria-checked={duracion === indice} onClick={() => setDuracion(indice as DuracionArmado)}>{etiqueta}</button>)}
            </div></div>
            {nota ? <p className="mhelp">{nota}</p> : null}
            <button type="button" className="iagoal" onClick={() => onAviso(AVISO_META_ARMADO)}>
              <PanelV29Icon name="trend" size={14} />
              <span><b>{kcal ? `Meta de ${kcal.toLocaleString('es-AR')} kcal por día` : 'Meta diaria sin dato'}</b><small>Sale de la ficha o del plan guardado.</small></span>
              <em>Editar</em>
            </button>
            <div className="iaopts">
              <div className="w"><h5>Tipo de alimentación</h5><div className="iachips">{DIETAS_PLAN.map((etiqueta, indice) => <button type="button" key={etiqueta} aria-pressed={dieta === indice} onClick={() => setDieta(indice)}>{etiqueta}</button>)}</div></div>
              <div className="w"><h5>Estrategia <small>podés elegir más de una</small></h5><div className="iachips">{ESTRATEGIAS_PLAN.map(etiqueta => <button type="button" key={etiqueta} aria-pressed={estrategias.includes(etiqueta)} onClick={() => setEstrategias(lista => lista.includes(etiqueta) ? lista.filter(item => item !== etiqueta) : [...lista, etiqueta])}>{etiqueta}</button>)}</div></div>
              <div className="w"><h5>Necesidades clínicas <small>elegilas vos; no salen inventadas de la ficha</small></h5><div className="iachips">
                {cuidados.map(etiqueta => <button type="button" key={etiqueta} aria-pressed="true" onClick={() => setCuidados(lista => lista.filter(item => item !== etiqueta))}>{etiqueta}<PanelV29Icon name="x" size={10} /></button>)}
                <button type="button" className="add" onClick={() => setSumarCuidado(abierto => !abierto)}><PanelV29Icon name="plus" size={11} />Agregar</button>
              </div>
              {sumarCuidado ? <div className="iachips">{CUIDADOS_PLAN.filter(etiqueta => !cuidados.includes(etiqueta)).map(etiqueta => <button type="button" key={etiqueta} onClick={() => setCuidados(lista => [...lista, etiqueta])}>{etiqueta}</button>)}</div> : null}
              </div>
              <div className="w"><h5>Formato</h5><div className="iaseg" role="radiogroup" aria-label="Formato">{FORMATOS_PLAN.map((etiqueta, indice) => <button type="button" role="radio" key={etiqueta} aria-checked={formato === indice} onClick={() => setFormato(indice)}>{etiqueta}</button>)}</div></div>
              <div className="w"><h5>Medidas</h5><div className="iaseg" role="radiogroup" aria-label="Medidas">{MEDIDAS_PLAN.map((etiqueta, indice) => <button type="button" role="radio" key={etiqueta} aria-checked={medidas === indice} onClick={() => setMedidas(indice)}>{etiqueta}</button>)}</div></div>
              <div className="w"><h5>Incluir en el plan</h5><div className="iachips">{INCLUIR_PLAN.map((etiqueta, indice) => <button type="button" key={etiqueta} aria-pressed={incluir[indice]} onClick={() => setIncluir(lista => lista.map((activo, posicion) => posicion === indice ? !activo : activo))}>{etiqueta}</button>)}</div></div>
            </div>
            <p className="p28-config-note"><PanelV29Icon name="check" size={13} />{AVISO_FORMATO}</p>
          </aside>
        </div>
        <footer className="iago">
          <small><PanelV29Icon name="file" size={15} /><span><b>Primero, una propuesta para revisar.</b> {nombre} no recibe nada hasta que lo publiques.</span></small>
          <button type="button" className="cta" disabled={armando} onClick={crear}><PanelV29Icon name="spark" size={14} />{armando ? 'Armando propuesta…' : 'Crear propuesta del plan'}</button>
        </footer>
      </section>
    </div>
    <div className="c pux-context" id="p28-context" hidden={!contexto}>
      <section className="fxp g">
        <header><h3>Datos de {nombre}</h3><span className="m">{activas} de {ficha.length} activos</span><button type="button" className="ibtn" aria-label="Cerrar datos de la ficha" onClick={() => setContexto(false)}><PanelV29Icon name="x" size={13} /></button></header>
        <p className="mhelp">Elegí qué información debe tener en cuenta para este plan. {AVISO_FICHA}</p>
        <div className="iactx">{ficha.map((item, indice) => <div className={item.usar ? undefined : 'off'} key={item.titulo}>
          <span className="iasrc">{item.titulo}</span>
          <b>{item.texto}</b>
          <small>{item.usar ? 'Se suma al pedido' : 'Fuera de este pedido'}</small>
          <button type="button" className="lnk" onClick={() => setFicha(lista => lista.map((dato, posicion) => posicion === indice ? { ...dato, usar: !dato.usar } : dato))}>{item.usar ? 'No usar' : 'Volver a usar'}</button>
        </div>)}</div>
      </section>
      <section className="fxp">
        <header><h3>Uso de IA este mes</h3><span className="sp" /></header>
        <div className="iause" role="status"><b className="num">{uso ? dolares(uso.used_micros) : uso === undefined ? 'Cargando…' : 'Sin dato'}</b><span>{uso
          ? `de ${dolares(uso.limit_micros)} · bolsa compartida de Nutridash · ${uso.month}. Incluye reservas pendientes. ${uso.source === 'memory' ? 'Demo local; no es gasto real del proveedor.' : 'Registro del servidor; no es una factura del proveedor.'}`
          : 'No pudimos consultar el registro mensual de IA. No se informa un gasto ni un tope sin verificar.'}</span></div>
      </section>
    </div>
  </div>;
}

function dolares(micros: number) {
  return `US$ ${(micros / 1_000_000).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
}
