import { useEffect, useMemo, useState } from 'react';
import { aiJobsApi } from '../../api/ai-jobs';
import type { AiMonthlyUsage } from '../../types/ai-jobs';
import type { Patient } from '../../types';
import { PanelV29Icon } from './PanelV29Icon';
import { fondoAvatar } from './planes-lista';
import {
  AVISO_ADJUNTAR, AVISO_DICTAR, AVISO_FICHA, AVISO_FORMATO, AVISO_META_ARMADO,
  CUIDADOS_PLAN, DIETAS_PLAN, DURACIONES_PLAN, ESTRATEGIAS_PLAN, FORMATOS_PLAN, IDEAS_ARMADO, INCLUIR_PLAN, MEDIDAS_PLAN,
  datosDeFicha, notaDuracion, periodoDesdeDuracion, preferenciasDelArmado, type DuracionArmado,
} from './planes-asistente';

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
  useEffect(() => {
    const controller = new AbortController();
    setUso(undefined);
    if (pacienteId) aiJobsApi.list(pacienteId, controller.signal)
      .then(respuesta => { if (!controller.signal.aborted) setUso(respuesta.usage ?? null); })
      .catch(() => { if (!controller.signal.aborted) setUso(null); });
    else setUso(null);
    return () => controller.abort();
  }, [pacienteId, armando]);
  const [pedido, setPedido] = useState('');
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

  function crear() {
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
        <div className="p28-ai-grid">
          <div className="p28-compose">
            <div className="p28-section-label"><b>Tu pedido</b><span>Con tus palabras</span></div>
            <div className="iabox">
              <label className="pux-prompt-label" htmlFor="iatxt">¿Qué plan querés crear?</label>
              <textarea id="iatxt" rows={8} aria-label="Qué plan querés" placeholder={`Por ejemplo: una semana de comidas fáciles para ${nombre}. Desayunos rápidos, viandas para llevar al trabajo y cenas livianas.`} value={pedido} onChange={evento => setPedido(evento.target.value)} />
              <div className="iabar">
                <button type="button" className="lnk" onClick={() => onAviso(AVISO_ADJUNTAR)}><PanelV29Icon name="clip" size={13} />Adjuntar referencia</button>
                <button type="button" className="lnk" onClick={() => onAviso(AVISO_DICTAR)}><PanelV29Icon name="mic" size={13} />Dictar pedido</button>
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
          ? `de ${dolares(uso.limit_micros)} · bolsa compartida de Plan V · ${uso.month}. Incluye reservas pendientes. ${uso.source === 'memory' ? 'Demo local; no es gasto real del proveedor.' : 'Registro del servidor; no es una factura del proveedor.'}`
          : 'No pudimos consultar el registro mensual de IA. No se informa un gasto ni un tope sin verificar.'}</span></div>
      </section>
    </div>
  </div>;
}

function dolares(micros: number) {
  return `US$ ${(micros / 1_000_000).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
}
