import { useEffect, useRef, useState } from 'react';
import { aiJobsApi } from '../../api/ai-jobs';
import { careErrorMessage } from '../../api/care';
import { plansApi } from '../../api/plans';
import type { Patient } from '../../types';
import type { AiJobView } from '../../types/ai-jobs';
import { mealPlanDraftSchema, type PlanItemView, type PlanSlot, type PlanVersionView, type ProfessionalMealPlan } from '../../types/plans';
import { emptyGuidance, type PlanGuidance } from '../../types/plan-guidance';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { PanelV29Icon } from './PanelV29Icon';
import { PlanPrintDialog } from './PlanPrintDialog';
import { fondoAvatar } from './planes-lista';
import {
  cambiarCantidad, cambiarNota, COMIDAS_EDITOR, comidaDelDia, comidasDelDia, controlEntrega,
  copiarPlan, DIAS_CORTOS, DIAS_LARGOS, duplicarDia, fechasDeSemana, filasDeVersiones, HORAS_EDITOR,
  finVisible, indiceLunes, listaDeCompras, lunesDeSemana, paraGuardar, pasaElTope, periodoDe, quitarLinea, semanaInicial, semanasDelPeriodo,
  sumarDias, sumarMacros, type GrupoCompra, type MacrosDia,
} from './planes-editor';

const AVISO_PLANTILLA = 'Próximamente. Las plantillas de Planes quedan para una pasada aparte.';
const AVISO_PLATO = 'Próximamente. Sumar o cambiar un plato queda para después. Las porciones de lo que ya está en el plan se editan acá.';

export function textoListaCompras(grupos: readonly GrupoCompra[], semana: number, nombre: string) {
  const lineas = [`Lista de compras · ${nombre} · semana ${semana}`, ''];
  for (const grupo of grupos) {
    lineas.push(grupo.nombre.toLocaleUpperCase('es-AR'));
    for (const item of grupo.items) lineas.push(`- ${item.nombre}: ${item.cantidad}`);
    lineas.push('');
  }
  return `${lineas.join('\n').trimEnd()}\n`;
}

function descargarTexto(nombre: string, texto: string) {
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 0);
}

function propuestaDe(job: AiJobView | null) {
  if (job?.status !== 'succeeded' || job.artifact?.kind !== 'menu_draft' || job.applied_at) return null;
  const parsed = mealPlanDraftSchema.safeParse(job.artifact.payload);
  return parsed.success ? parsed.data : null;
}

async function esperarPropuesta(inicial: AiJobView) {
  let job = inicial;
  for (let intento = 0; intento < 40 && (job.status === 'queued' || job.status === 'running'); intento += 1) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    job = (await aiJobsApi.get(job.id)).job;
  }
  return job;
}

type Pestana = 'semana' | 'ind' | 'compras' | 'ver' | 'entrega';
type Modo = 'dia' | 'semana';
type Resumen = 0 | 1 | 2;

function numero(valor: number) {
  return Math.round(valor).toLocaleString('es-AR');
}

function textoMacro(valor: number | null, unidad: string) {
  return valor == null ? 'Sin dato' : `${numero(valor)} ${unidad}`;
}

function Medidor({ porcentaje }: { porcentaje: number | null }) {
  const p = porcentaje == null ? 0 : Math.max(0, Math.min(100, porcentaje));
  const radio = 62;
  const cx = 80;
  const cy = 78;
  const arco = `M${cx - radio} ${cy}A${radio} ${radio} 0 0 1 ${cx + radio} ${cy}`;
  const angulo = Math.PI * (1 - p / 100);
  return <div className={`pg fxg sm${porcentaje != null && (porcentaje < 90 || porcentaje > 110) ? ' wa' : ''}`} style={{ width: 112 }}>
    <svg className="pg-g" viewBox="0 0 160 88" aria-hidden="true">
      <path className="tr" pathLength={100} d={arco} />
      <path className="pv" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - p} d={arco} />
      {p > 0 ? <circle className="end" cx={Number((cx + radio * Math.cos(angulo)).toFixed(1))} cy={Number((cy - radio * Math.sin(angulo)).toFixed(1))} r="5" /> : null}
    </svg>
    <div className="pg-v"><b className="num">{porcentaje == null ? '—' : Math.round(porcentaje)}</b><span>%</span></div>
  </div>;
}

function Barra({ porcentaje }: { porcentaje: number | null }) {
  return <span className="fxb"><i style={{ width: `${Math.max(0, Math.min(100, porcentaje ?? 0))}%` }} /></span>;
}

export function PanelPlanEditor({
  paciente, pacientes, planes, plan, cargando, hoy, onElegir, onPlan, onAviso,
  asistentePedido = 0, publicarPedido = 0, demo = false,
}: {
  paciente: Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'goal' | 'plan_b' | 'next_focus' | 'sensitive_hours'>;
  pacientes: Array<Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'goal'>>;
  planes: Record<string, ProfessionalMealPlan | null | undefined>;
  plan: ProfessionalMealPlan | null;
  cargando: boolean;
  hoy: string;
  onElegir: (id: string) => void;
  onPlan: (plan: ProfessionalMealPlan) => void;
  onAviso: (texto: string) => void;
  asistentePedido?: number;
  publicarPedido?: number;
  demo?: boolean;
}) {
  const version = plan?.current ?? null;
  const [pestana, setPestana] = useState<Pestana>('semana');
  const [modo, setModo] = useState<Modo>('dia');
  const [semana, setSemana] = useState(0);
  const [dia, setDia] = useState(0);
  const [items, setItems] = useState<PlanItemView[]>(version?.items ?? []);
  const [horas, setHoras] = useState<Partial<Record<PlanSlot, string>>>(version?.meal_times ?? {});
  const [guidance, setGuidance] = useState<PlanGuidance>(version?.guidance ?? emptyGuidance());
  const [fotos, setFotos] = useState(false);
  const [resumen, setResumen] = useState<Resumen>(0);
  const [menu, setMenu] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [copiando, setCopiando] = useState(false);
  const [destino, setDestino] = useState(false);
  const [comidaAbierta, setComidaAbierta] = useState(0);
  const [todasAbiertas, setTodasAbiertas] = useState(false);
  const [nota, setNota] = useState<string | null>(null);
  const [historial, setHistorial] = useState<PlanVersionView[]>([]);
  const [revisado, setRevisado] = useState(false);
  const [meta, setMeta] = useState(false);
  const [kcal, setKcal] = useState(version?.nutrition_target?.kcal?.toString() ?? '');
  const [deshacer, setDeshacer] = useState<PlanItemView[][]>([]);
  const [rehacer, setRehacer] = useState<PlanItemView[][]>([]);
  const [guardando, setGuardando] = useState<'listo' | 'guardando' | 'error'>('listo');
  const [vacio, setVacio] = useState(false);
  const [publicando, setPublicando] = useState<'listo' | 'publicando' | 'error'>('listo');
  const [propuesta, setPropuesta] = useState<AiJobView | null>(null);
  const [armando, setArmando] = useState(false);
  const [vistaPaciente, setVistaPaciente] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const asistenteVisto = useRef(asistentePedido);
  const publicarVisto = useRef(publicarPedido);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    setPestana('semana');
    setModo('dia');
    setItems(version?.items ?? []);
    setHoras(version?.meal_times ?? {});
    setGuidance(version?.guidance ?? emptyGuidance());
    setKcal(version?.nutrition_target?.kcal?.toString() ?? '');
    setDeshacer([]);
    setRehacer([]);
    setDestino(false);
    setComidaAbierta(0);
    setTodasAbiertas(false);
    setNota(null);
    setCopiando(false);
    setVacio(false);
    setRevisado(false);
    setGuardando('listo');
    setPublicando('listo');
    setPropuesta(null);
    setArmando(false);
    setVistaPaciente(false);
    setImprimiendo(false);
    if (version) {
      const indice = semanaInicial(version.period_start, version.period_end, hoy);
      setSemana(indice);
      const fechas = fechasDeSemana(version.period_start, version.period_end, indice);
      const hoyEnSemana = fechas.indexOf(hoy);
      setDia(hoyEnSemana >= 0 ? hoyEnSemana : 0);
    } else {
      setSemana(0);
      setDia(indiceLunes(hoy));
    }
  }, [paciente.id, version?.id, version?.revision, hoy]);

  useEffect(() => {
    if (pestana !== 'ver' || !paciente.id) return;
    const control = new AbortController();
    plansApi.history(paciente.id, control.signal).then(respuesta => {
      if (!control.signal.aborted) setHistorial(respuesta.versions);
    }).catch(() => {
      if (!control.signal.aborted) setHistorial(version ? [version] : []);
    });
    return () => control.abort();
  }, [pestana, paciente.id, version]);

  useEffect(() => {
    if (asistentePedido > 0 && asistenteVisto.current !== asistentePedido && !cargando) {
      asistenteVisto.current = asistentePedido;
      void armarConAsistente();
    }
  }, [asistentePedido, cargando]);

  useEffect(() => {
    if (publicarPedido > 0 && publicarVisto.current !== publicarPedido) {
      publicarVisto.current = publicarPedido;
      setPestana('entrega');
      onAviso('Revisá la entrega y confirmá la publicación cuando esté todo listo.');
    }
  }, [publicarPedido, onAviso]);

  const lunes = lunesDeSemana(hoy);
  const inicio = vacio ? lunes : version?.period_start ?? lunes;
  const finPeriodo = vacio ? sumarDias(inicio, 6) : version?.period_end ?? sumarDias(inicio, 6);
  const fin = finVisible(inicio, finPeriodo, vacio);
  const fechas = fechasDeSemana(inicio, fin, semana);
  const fecha = fechas[dia] ?? fechas[0] ?? hoy;
  const metaKcal = version?.nutrition_target?.kcal ?? (kcal.trim() ? Number(kcal) : null);
  const comidas = comidasDelDia(items, fecha, horas);
  const delDia = sumarMacros(comidas.flatMap(comida => comida.lineas.map(linea => linea.macros)));
  const nombreDia = DIAS_LARGOS[indiceLunes(fecha)];
  const tituloDia = nombreDia.charAt(0).toLocaleUpperCase('es-AR') + nombreDia.slice(1);
  const primer = paciente.name.split(/\s+/)[0] || 'la paciente';
  const publicado = Boolean(plan?.published && plan.published.status !== 'archived');
  const tituloPlan = version?.nutrition_target?.kcal
    ? `${version.nutrition_target.kcal.toLocaleString('es-AR')} kcal por día`
    : plan ? 'Plan en borrador' : 'Sin plan todavía';
  const control = controlEntrega(inicio, fin, items, metaKcal && Number.isFinite(metaKcal) ? metaKcal : null);
  const hayBorradorNuevo = version?.status === 'draft';
  const puedePublicar = Boolean(plan && hayBorradorNuevo && revisado && !control.vacias && items.length > 0);

  function recordar(siguiente: PlanItemView[]) {
    setDeshacer(pila => [...pila, items].slice(-30));
    setRehacer([]);
    setItems(siguiente);
  }

  async function guardar(siguiente: PlanItemView[], extras: { guidance?: PlanGuidance; horas?: Partial<Record<PlanSlot, string>>; kcal?: number } = {}) {
    if (!siguiente.length) {
      onAviso('El borrador necesita al menos una comida para guardarse.');
      return;
    }
    if (siguiente.some(item => pasaElTope(inicio, item.for_date))) {
      onAviso('Esas comidas quedan después de las tres semanas que se pueden guardar. El plan publicado no cambió.');
      setGuardando('error');
      return;
    }
    const periodo = periodoDe(siguiente, inicio, finPeriodo);
    const horasNuevas = extras.horas ?? horas;
    const guia = extras.guidance ?? guidance;
    const objetivo = version?.nutrition_target;
    const kcalNueva = extras.kcal ?? objetivo?.kcal;
    const parsed = mealPlanDraftSchema.safeParse({
      id: plan?.id ?? crypto.randomUUID(),
      expected_revision: plan?.current.revision ?? null,
      period_start: periodo.inicio,
      period_end: periodo.fin,
      timezone: 'America/Argentina/Buenos_Aires',
      ...(guia.recommendations.length || guia.avoid.length ? { guidance: guia } : {}),
      ...(Object.keys(horasNuevas).length ? { meal_times: horasNuevas } : {}),
      ...(objetivo && kcalNueva ? { nutrition_target: { ...objetivo, kcal: kcalNueva } } : {}),
      items: siguiente.map(paraGuardar),
    });
    if (!parsed.success) {
      onAviso('Revisá las cantidades antes de guardar. El plan publicado no cambió.');
      setGuardando('error');
      return;
    }
    setGuardando('guardando');
    try {
      const respuesta = await plansApi.save(paciente.id, parsed.data);
      onPlan(respuesta.plan);
      setGuardando('listo');
      onAviso('');
    } catch {
      setGuardando('error');
      onAviso('No se pudo guardar. El plan publicado no cambió.');
    }
  }

  async function publicar() {
    if (!plan || !version) { onAviso('Primero guardá un borrador para publicar.'); return; }
    if (!hayBorradorNuevo) { onAviso('No hay cambios nuevos para publicar. La versión publicada se conserva.'); return; }
    if (publicando === 'publicando') return;
    if (!items.length) { onAviso('El borrador necesita al menos una comida para publicarse.'); return; }
    if (control.vacias) { onAviso('Hay comidas sin alimentos. Completalas antes de publicar.'); return; }
    if (!revisado) { onAviso('Marcá que revisaste el plan completo antes de publicar.'); return; }
    setPublicando('publicando');
    try {
      const respuesta = await plansApi.publish(plan.id, version.version, version);
      onPlan(respuesta.plan);
      setRevisado(false);
      setPublicando('listo');
      onAviso('Plan publicado. La paciente ya puede ver la versión revisada.');
    } catch (razon) {
      setPublicando('error');
      onAviso(careErrorMessage(razon));
    }
  }

  async function armarConAsistente() {
    if (armando) return;
    setArmando(true);
    setPropuesta(null);
    onAviso('El asistente está armando una propuesta. Queda como borrador privado hasta que la revises.');
    const desde = version?.period_start ?? lunes;
    const hasta = version?.period_end ?? sumarDias(desde, 6);
    try {
      const respuesta = await aiJobsApi.enqueue({
        patient_id: paciente.id,
        job_type: 'menu_draft',
        period_start: desde,
        period_end: hasta,
        slots: [...COMIDAS_EDITOR],
      });
      const job = await esperarPropuesta(respuesta.job);
      if (job.status === 'succeeded' && propuestaDe(job)) {
        setPropuesta(job);
        onAviso('La propuesta está lista para revisar. Todavía no se publicó.');
      } else {
        onAviso('El asistente no pudo armar la propuesta. El plan no cambió.');
      }
    } catch (razon) {
      onAviso(`El asistente no pudo armar la propuesta. ${careErrorMessage(razon)}`);
    } finally {
      setArmando(false);
    }
  }

  async function aplicarPropuesta() {
    if (!propuesta || armando) return;
    setArmando(true);
    try {
      await aiJobsApi.apply(propuesta.id);
      const { plan: actualizado } = await plansApi.professional(paciente.id);
      if (!actualizado) throw new Error('No encontramos el borrador actualizado.');
      onPlan(actualizado);
      setPropuesta(null);
      onAviso('La propuesta quedó como borrador privado. Revisala y publicala cuando quieras.');
    } catch (razon) {
      onAviso(`No se pudo usar la propuesta. ${careErrorMessage(razon)}`);
    } finally {
      setArmando(false);
    }
  }

  async function descartarPropuesta() {
    if (!propuesta) return;
    try { await aiJobsApi.reject(propuesta.id); } catch { /* el descarte local alcanza */ }
    setPropuesta(null);
    onAviso('Propuesta descartada. El plan no cambió.');
  }

  function descargarCompras() {
    const grupos = listaDeCompras(items, fechasDeSemana(inicio, fin, semana));
    if (!grupos.length) { onAviso('Esta semana no tiene alimentos para armar la lista.'); return; }
    descargarTexto(`lista-compras-${paciente.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-semana-${semana + 1}.txt`, textoListaCompras(grupos, semana + 1, paciente.name));
    onAviso('Lista de compras descargada.');
  }

  function abrirImpresion() {
    if (!plan) { onAviso('Primero guardá el plan para preparar el PDF.'); return; }
    setImprimiendo(true);
  }

  function aplicar(siguiente: PlanItemView[] | null) {
    if (!siguiente || siguiente === items) return;
    recordar(siguiente);
    void guardar(siguiente);
  }

  function elegirDestino(hacia: string) {
    const copia = duplicarDia(items, fecha, hacia);
    setDestino(false);
    if (copia === items) {
      onAviso('Ese día no tiene comidas para copiar.');
      return;
    }
    aplicar(copia);
    onAviso(`Se copió el ${DIAS_LARGOS[indiceLunes(fecha)]} al ${DIAS_LARGOS[indiceLunes(hacia)]}. Quedó en el borrador.`);
  }

  function empezarVacio() {
    setVacio(true);
    setItems([]);
    setPestana('semana');
    setModo('dia');
    setSemana(0);
    setDia(indiceLunes(hoy));
    setComidaAbierta(0);
    setTodasAbiertas(false);
    onAviso('');
  }

  function copiarDe(id: string) {
    const origen = planes[id]?.current.items ?? [];
    const copia = copiarPlan(origen, hoy);
    setCopiando(false);
    if (!copia.length) {
      onAviso('Ese plan no tiene comidas para copiar.');
      return;
    }
    setVacio(true);
    recordar(copia);
    onAviso('Se copiaron las comidas. Los datos de la otra paciente no se copiaron. Quedó en borrador.');
    void guardar(copia);
  }

  const otros = pacientes.filter(persona => persona.id !== paciente.id && (planes[persona.id]?.current.items.length ?? 0) > 0);
  const textoGuardado = guardando === 'guardando' ? 'Guardando…' : guardando === 'error' ? 'Sin guardar' : 'Guardado';

  return <>
    <div className="pspan r29-patient">
      <div className="ppick">
        <button type="button" className="ppsel" aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu(abierto => !abierto)}>
          <span className="av" style={{ background: fondoAvatar(paciente.tone) }}>{paciente.initials}</span>
          <span><b>{paciente.name}</b><small>{tituloPlan}</small></span>
          <PanelV29Icon name="chev" size={13} />
        </button>
        <div className="ppm" hidden={!menu} role="listbox" aria-label="Elegir paciente">
          <input type="search" placeholder="Buscar paciente" aria-label="Buscar paciente" value={buscar} onChange={evento => setBuscar(evento.target.value)} />
          <div className="ppl">
            {pacientes.filter(persona => persona.name.toLocaleLowerCase('es').includes(buscar.trim().toLocaleLowerCase('es'))).map(persona => <button type="button" role="option" aria-selected={persona.id === paciente.id} key={persona.id} onClick={() => { setMenu(false); onElegir(persona.id); }}>
              <span className="av" style={{ background: fondoAvatar(persona.tone) }}>{persona.initials}</span>
              <span><b>{persona.name}</b><small>{persona.goal || 'Sin plan'}</small></span>
            </button>)}
          </div>
        </div>
      </div>
      {(plan || vacio) ? <div className="r29-context">
        <div><small>Meta diaria</small><b className="num">{meta && version?.nutrition_target ? <input aria-label="Calorías por día" inputMode="numeric" value={kcal} onChange={evento => setKcal(evento.target.value)} /> : metaKcal ? `${metaKcal.toLocaleString('es-AR')} kcal` : 'Sin dato'}</b></div>
        <div><small>Estado de trabajo</small><b>{vacio || version?.status === 'draft' ? 'Borrador' : publicado ? 'Publicado' : 'Borrador'}</b></div>
        <span className="r29-care"><span>Sin cuidados cargados</span></span>
        <button type="button" className="sbtn" onClick={() => {
          if (!version?.nutrition_target) { onAviso('La meta diaria no está cargada en este plan.'); return; }
          if (!meta) { setMeta(true); return; }
          const valor = Number(kcal);
          if (!Number.isFinite(valor) || valor <= 0) { onAviso('Revisá las calorías por día.'); return; }
          setMeta(false);
          void guardar(items, { kcal: valor });
        }}>{meta ? 'Guardar metas' : 'Editar metas'}</button>
      </div> : null}
    </div>
    {cargando ? <p className="mhelp">Leyendo el plan…</p> : null}
    {!cargando && !plan && !vacio ? <div className="fx">
      <div className="c"><section className="fxp g">
        <header><h3>{primer} todavía no tiene plan</h3><span className="m">elegí cómo empezar; queda en borrador hasta que lo publiques</span><span className="sp" /></header>
        <div className="pstart">
          <div><PanelV29Icon name="spark" size={16} /><b>Con el asistente</b><p>Arma una primera semana con lo que cargaste en la ficha de {primer}.</p><button type="button" className="sbtn k" disabled={armando} onClick={() => void armarConAsistente()}>{armando ? 'Armando propuesta…' : 'Armar con el asistente'}</button></div>
          <div><PanelV29Icon name="clip" size={16} /><b>Desde una plantilla</b><p>Por ejemplo «Descenso 1.600 kcal» o «Sin gluten 1.800 kcal».</p><button type="button" className="sbtn" onClick={() => onAviso(AVISO_PLANTILLA)}>Elegir plantilla</button></div>
          <div><PanelV29Icon name="copy" size={16} /><b>Copiar de otra paciente</b><p>Partí del plan de una paciente parecida. Sus datos no se copian.</p><button type="button" className="sbtn" onClick={() => setCopiando(true)}>Elegir paciente</button></div>
          <div><PanelV29Icon name="pen" size={16} /><b>Desde cero</b><p>Semana vacía con las cinco comidas para completar.</p><button type="button" className="sbtn" onClick={empezarVacio}>Empezar vacío</button></div>
        </div>
        {copiando ? <div className="fxr" aria-label="Elegir paciente para copiar">{otros.length ? otros.map(persona => <button type="button" key={persona.id} onClick={() => copiarDe(persona.id)}><span className="av" style={{ background: fondoAvatar(persona.tone) }}>{persona.initials}</span><span className="t"><b>{persona.name}</b><small>{persona.goal || 'Sin objetivo'}</small></span></button>) : <p className="mhelp">Todavía no hay otro plan para copiar.</p>}</div> : null}
      </section></div>
      <div className="c"><section className="fxp">
        <header><h3>Lo que ya sabés de {primer}</h3><span className="sp" /></header>
        <div className="fxkv">
          <div><span>Objetivo</span><b>{paciente.goal.trim() || 'Sin dato'}</b></div>
          <div><span>Plan B</span><b>{paciente.plan_b.trim() || 'Sin dato'}</b></div>
          <div><span>Foco</span><b>{paciente.next_focus.trim() || 'Sin dato'}</b></div>
          <div><span>Horario sensible</span><b>{paciente.sensitive_hours.trim() || 'Sin dato'}</b></div>
        </div>
      </section></div>
    </div> : null}
    {!cargando && (plan || vacio) ? <>
      <div className="pspan prow2">
        <div className="tabs" id="ptabs" role="tablist" aria-label="Contenido del plan">
          {([['semana', 'Comidas'], ['ind', 'Indicaciones'], ['compras', 'Compras'], ['ver', 'Versiones'], ['entrega', 'Entrega']] as const).map(([id, etiqueta]) => <button type="button" role="tab" key={id} aria-selected={pestana === id} className={pestana === id ? 'on' : undefined} onClick={() => setPestana(id)}>{etiqueta}</button>)}
        </div>
        <div className="r29-tools">
          <span className="pesaved" role="status"><PanelV29Icon name="check" size={12} />{textoGuardado}</span>
          <button type="button" className="ibtn" aria-label="Deshacer" disabled={!deshacer.length} onClick={() => {
            const previo = deshacer[deshacer.length - 1];
            if (!previo) return;
            setRehacer(pila => [...pila, items]);
            setDeshacer(pila => pila.slice(0, -1));
            setItems(previo);
            void guardar(previo);
          }}><PanelV29Icon name="undo" size={14} /></button>
          <button type="button" className="ibtn" aria-label="Rehacer" disabled={!rehacer.length} onClick={() => {
            const siguiente = rehacer[rehacer.length - 1];
            if (!siguiente) return;
            setDeshacer(pila => [...pila, items]);
            setRehacer(pila => pila.slice(0, -1));
            setItems(siguiente);
            void guardar(siguiente);
          }}><PanelV29Icon name="redo" size={14} /></button>
          <button type="button" className="sbtn" disabled={armando} onClick={() => void armarConAsistente()}><PanelV29Icon name="spark" size={13} />{armando ? 'Armando…' : 'Asistente IA'}</button>
          <button type="button" className="sbtn" onClick={() => onAviso(AVISO_PLANTILLA)}><PanelV29Icon name="copy" size={13} />Guardar como plantilla</button>
          <button type="button" className="sbtn" onClick={() => onAviso('Próximamente. Copiar este plan a otra paciente queda para después.')}><PanelV29Icon name="users" size={13} />Copiar a otra paciente</button>
          <button type="button" className="sbtn" onClick={() => { if (version?.nutrition_target) setMeta(true); else onAviso('La meta diaria no está cargada en este plan.'); }}><PanelV29Icon name="trend" size={13} />Ajustar metas</button>
        </div>
      </div>
      {pestana === 'semana' && modo === 'dia' ? <div className="fx">
        <div className="c pel"><section className="fxp g pedit">
          <header>
            <div className="pux-editor-title"><h4>Comidas del día</h4><small>Editá las porciones y revisá el total al instante.</small></div>
            <span className="sp" />
            <div className="pewk" aria-label="Elegir semana"><span>Semana</span>{Array.from({ length: semanasDelPeriodo(inicio, fin) }, (_, indice) => <button type="button" key={indice} className={indice === semana ? 'on' : undefined} aria-pressed={indice === semana} onClick={() => { setSemana(indice); setDia(0); }}>{indice + 1}</button>)}</div>
            <div className="iaseg" role="radiogroup" aria-label="Vista de las comidas">
              <button type="button" role="radio" aria-checked="true" onClick={() => setModo('dia')}>Día</button>
              <button type="button" role="radio" aria-checked="false" onClick={() => setModo('semana')}>Semana</button>
            </div>
          </header>
          <div className="pux-calendar">
            <div className="pedays" aria-label="Elegir día">
              {fechas.map((iso, indice) => <button type="button" key={iso} className={indice === dia ? 'on' : undefined} aria-pressed={indice === dia} onClick={() => setDia(indice)}>
                <small>{DIAS_CORTOS[indiceLunes(iso)]}</small><b className="num">{Number(iso.slice(8, 10))}</b>
                {items.some(item => item.for_date === iso) ? <i /> : null}
              </button>)}
            </div>
          </div>
          <div className="petot">
            <div><small>{tituloDia}</small><b className="num">{delDia.kcal == null ? '—' : <>{numero(delDia.kcal)}<span> kcal</span></>}</b><span>{metaKcal ? `meta ${metaKcal.toLocaleString('es-AR')}` : 'sin meta cargada'}</span>{metaKcal && delDia.kcal != null ? <span className={`pill ${Math.abs(delDia.kcal / metaKcal - 1) > 0.04 ? 'p-wait' : 'p-conf'}`}>{Math.abs(delDia.kcal / metaKcal - 1) > 0.04 ? `${delDia.kcal > metaKcal ? '+' : ''}${Math.round(delDia.kcal / metaKcal * 100 - 100)}%` : 'En la meta'}</span> : null}</div>
            <div className="pemc">
              <span><i className="pux-carb" />Carb. {textoMacro(delDia.carbs, 'g')}</span>
              <span><i className="pux-protein" />Prot. {textoMacro(delDia.protein, 'g')}</span>
              <span><i className="pux-fat" />Grasas {textoMacro(delDia.fat, 'g')}</span>
              <span>Fibra {textoMacro(delDia.fiber, 'g')}</span>
            </div>
            <div className="pemb2" aria-hidden="true">
              <i style={{ width: `${parte(delDia, 'carbs')}%`, background: 'var(--azaf)' }} />
              <i style={{ width: `${parte(delDia, 'protein')}%`, background: 'var(--rojo-ink)' }} />
              <i style={{ width: `${parte(delDia, 'fat')}%`, background: 'var(--azul-ink)' }} />
            </div>
          </div>
          <div className="petool">
            <button type="button" className="lnk" aria-pressed={todasAbiertas} onClick={() => setTodasAbiertas(valor => !valor)}><PanelV29Icon name="chev" size={12} />{todasAbiertas ? 'Contraer comidas' : 'Expandir todas'}</button>
            <span className="sp" />
            <button type="button" className="lnk" onClick={() => setDestino(abierto => !abierto)}><PanelV29Icon name="copy" size={13} />Duplicar día</button>
            <label className="pefot"><span>Fotos</span><button type="button" className="sw" role="switch" aria-checked={fotos} aria-label="Mostrar fotos" onClick={() => { setFotos(valor => !valor); onAviso(fotos ? '' : 'Estas comidas no tienen foto.'); }} /></label>
          </div>
          {destino ? <div className="petool" aria-label="Copiar a">{fechas.filter(iso => iso !== fecha).map(iso => <button type="button" className="sbtn" key={iso} onClick={() => elegirDestino(iso)}>{DIAS_CORTOS[indiceLunes(iso)]}</button>)}</div> : null}
          <div className="pemeals">
            {comidas.map((comida, indice) => {
              const abierta = todasAbiertas || comidaAbierta === indice;
              return <section className={`pemeal${comida.lineas.length ? ' ch' : ''}${abierta ? ' pux-open' : ''}`} key={comida.slot}>
                <div className="pemh">
                  <button type="button" className="pux-meal-toggle" aria-expanded={abierta} aria-controls={`pux-ingredients-${indice}`} onClick={() => { setTodasAbiertas(false); setComidaAbierta(abierta && !todasAbiertas ? -1 : indice); }}>
                    <span><b>{comida.slot}</b><small>{comida.titulo}</small></span>
                    <PanelV29Icon name="chev" size={13} />
                  </button>
                  <input className="pux-hour" type="text" inputMode="numeric" maxLength={5} data-peh={indice} value={horas[comida.slot] || comida.hora} aria-label={`Hora de ${comida.slot}`} onChange={evento => setHoras(previo => ({ ...previo, [comida.slot]: evento.target.value }))} onBlur={() => { if (items.length) void guardar(items); }} />
                  <span className="pux-meal-kcal num">{comida.macros.kcal == null ? 'Sin dato' : <>{numero(comida.macros.kcal)}<small>kcal</small></>}</span>
                  <div className="pema">
                    <button type="button" className="ibtn" aria-label={`Cambiar plato de ${comida.slot}`} title="Cambiar plato" onClick={() => onAviso(AVISO_PLATO)}><PanelV29Icon name="swap" size={14} /></button>
                    <button type="button" className="ibtn" aria-label={`Agregar alimento a ${comida.slot}`} title="Agregar alimento" onClick={() => onAviso(AVISO_PLATO)}><PanelV29Icon name="plus" size={14} /></button>
                  </div>
                </div>
                {comida.lineas.length ? <div className="peis" id={`pux-ingredients-${indice}`} hidden={!abierta}>
                  <div className="pux-ingredient-head" aria-hidden="true"><span /><span>Alimento · medida casera</span><span>Cantidad</span><span>Unidad</span><span>kcal</span><span /><span /></div>
                  {comida.lineas.map(linea => <div className="pei" key={linea.clave}>
                    <i className="peg" style={{ background: 'var(--ink3)' }} />
                    <span className="pen"><b>{linea.nombre}</b><small>{linea.detalle}{linea.nota ? ` · ${linea.nota}` : ''}</small></span>
                    <input className="num" type="number" min={linea.unidad === 'porción' ? 0.25 : 1} step={linea.unidad === 'porción' ? 0.25 : 1} value={linea.cantidad ?? ''} aria-label={`Cantidad de ${linea.nombre}`} disabled={linea.cantidad == null} onFocus={() => setDeshacer(pila => [...pila, itemsRef.current].slice(-30))} onChange={evento => {
                      const siguiente = cambiarCantidad(itemsRef.current, linea.clave, Number(evento.target.value));
                      if (siguiente) setItems(siguiente);
                    }} onBlur={() => void guardar(itemsRef.current)} />
                    <span className="num">{linea.unidad}</span>
                    <em className="num">{linea.macros.kcal == null ? 'Sin dato' : `${numero(linea.macros.kcal)} kcal`}</em>
                    <button type="button" className="ibtn" aria-label={`Nota de preparación de ${linea.nombre}`} onClick={() => setNota(linea.clave)}><PanelV29Icon name="pen" size={12} /></button>
                    <button type="button" className="ibtn" aria-label={`Quitar ${linea.nombre}`} onClick={() => aplicar(quitarLinea(items, linea.clave))}><PanelV29Icon name="x" size={12} /></button>
                    {nota === linea.clave ? <input aria-label={`Nota de ${linea.nombre}`} defaultValue={linea.nota} onBlur={evento => { const siguiente = cambiarNota(items, linea.clave, evento.target.value); setNota(null); aplicar(siguiente); }} /> : null}
                  </div>)}
                </div> : null}
              </section>;
            })}
          </div>
        </section></div>
        <div className="c per"><section className="fxp pux-analysis">
          <header><h3>Resumen de {DIAS_LARGOS[indiceLunes(fecha)]}</h3><span className="sp" /></header>
          <div className="iaseg" role="radiogroup" aria-label="Vista del resumen">
            {(['Análisis', 'App', 'PDF'] as const).map((etiqueta, indice) => <button type="button" role="radio" key={etiqueta} aria-label={etiqueta} aria-checked={resumen === indice} onClick={() => setResumen(indice as Resumen)}>{etiqueta}</button>)}
          </div>
          {resumen === 0 ? <>
            <div className="p28-energy">
              <div><small>Energía del día</small><div className="pd-v"><b className="num">{delDia.kcal == null ? '—' : numero(delDia.kcal)}</b><span>kcal</span></div><span className="p28-energy-note">{metaKcal ? `de ${metaKcal.toLocaleString('es-AR')} kcal planificadas` : 'Sin meta cargada'}</span></div>
              <div className="p28-gauge"><Medidor porcentaje={metaKcal && delDia.kcal != null ? Math.round(delDia.kcal / metaKcal * 100) : null} /></div>
            </div>
            <div className="p28-macros">
              {([['Carbohidratos', delDia.carbs, metaKcal ? metaKcal * 0.45 / 4 : null], ['Proteínas', delDia.protein, metaKcal ? metaKcal * 0.25 / 4 : null], ['Grasas', delDia.fat, metaKcal ? metaKcal * 0.3 / 9 : null]] as const).map(([nombre, valor, techo]) => <div key={nombre}><span>{nombre}</span><b className="num">{textoMacro(valor, 'g')}</b><Barra porcentaje={valor != null && techo ? valor / techo * 100 : null} /></div>)}
            </div>
            <div className="p28-week-head"><b>Equilibrio de la semana</b><small>Energía de cada día</small></div>
            <div className="p28-week pa7" aria-label="Energía de los siete días respecto de la meta">
              {fechas.map((iso, indice) => {
                const kcalDia = sumarMacros(comidasDelDia(items, iso, horas).flatMap(comida => comida.lineas.map(linea => linea.macros))).kcal;
                const porcentaje = metaKcal && kcalDia != null ? Math.round(kcalDia / metaKcal * 100) : 0;
                return <div key={iso} className={indice === dia ? 'td' : undefined} title={`${DIAS_LARGOS[indiceLunes(iso)]}: ${kcalDia == null ? 'sin dato' : `${numero(kcalDia)} kcal`}`}><i className={porcentaje && (porcentaje < 95 || porcentaje > 105) ? 'lo' : undefined} style={{ height: `${Math.max(8, Math.min(100, porcentaje / 1.25))}%` }} /><small>{DIAS_CORTOS[indiceLunes(iso)].slice(0, 1)}</small></div>;
              })}
            </div>
          </> : resumen === 1 ? <div className="r29-patient-preview">
            <div className="r29-note"><PanelV29Icon name="eye" size={15} /><span><b>Así lo ve {primer} en la app.</b><br />Vista previa del borrador. No se envió ninguna notificación.</span></div>
            {comidas.map(comida => <div key={comida.slot} className="fxr">
              <span className="t"><b>{comida.slot} · {comida.hora}</b><small>{comida.titulo}{comida.lineas.length ? ` · ${comida.lineas.map(linea => linea.nombre).join(', ')}` : ' · Sin alimentos cargados'}</small></span>
              <small className="num">{comida.macros.kcal == null ? 'Sin dato' : `${numero(comida.macros.kcal)} kcal`}</small>
            </div>)}
            {guidance.recommendations.length ? <div><b>Recomendaciones</b><p className="mhelp">{guidance.recommendations.join(' · ')}</p></div> : null}
            {guidance.avoid.length ? <div><b>Alimentos a evitar</b><p className="mhelp">{guidance.avoid.join(' · ')}</p></div> : null}
          </div> : <div className="r29-print-preview">
            <div className="r29-note"><PanelV29Icon name="file" size={15} /><span><b>Versión para imprimir.</b><br />El PDF usa el documento del consultorio y no se envía a la paciente.</span></div>
            <div className="r29-document">
              <h4>{primer} · {tituloDia}</h4>
              <p className="mhelp">{metaKcal ? `Meta: ${metaKcal.toLocaleString('es-AR')} kcal por día` : 'Sin meta cargada'}</p>
              {comidas.map(comida => <section key={comida.slot}>
                <b>{comida.slot} · {comida.hora}</b>
                <p>{comida.titulo}</p>
                {comida.lineas.map(linea => <small key={linea.clave}>{linea.nombre} · {linea.cantidad ?? '—'} {linea.unidad}</small>)}
              </section>)}
              {guidance.recommendations.length ? <section><b>Recomendaciones</b><p>{guidance.recommendations.join(' · ')}</p></section> : null}
              {guidance.avoid.length ? <section><b>Alimentos a evitar</b><p>{guidance.avoid.join(' · ')}</p></section> : null}
            </div>
            <div className="macts"><button type="button" className="sbtn k" onClick={abrirImpresion}><PanelV29Icon name="dl" size={13} />Abrir PDF / imprimir</button></div>
          </div>}
        </section>
        <div className="r29-note"><PanelV29Icon name="file" size={15} /><span><b>{publicado ? 'La paciente conserva su plan publicado.' : 'Este plan todavía no se entregó.'}</b><br />Los cambios se preparan en borrador hasta que los revises y publiques.</span></div>
        </div>
      </div> : null}
      {pestana === 'semana' && modo === 'semana' ? <Semana items={items} fechas={fechas} horas={horas} metaKcal={metaKcal} dia={dia} onDia={indice => { setDia(indice); setModo('dia'); }} onAviso={onAviso} onImprimir={abrirImpresion} /> : null}
      {pestana === 'ind' ? <Indicaciones guidance={guidance} onChange={siguiente => { setGuidance(siguiente); if (items.length) void guardar(items, { guidance: siguiente }); else onAviso('El borrador necesita al menos una comida para guardar las indicaciones.'); }} /> : null}
      {pestana === 'compras' ? <Compras items={items} fechas={fechasDeSemana(inicio, fin, semana)} semana={semana + 1} onEntrega={() => setPestana('entrega')} onAviso={onAviso} onDescargar={descargarCompras} /> : null}
      {pestana === 'ver' ? <Versiones nombre={primer} filas={filasDeVersiones(version, historial)} historial={historial.length ? historial : version ? [version] : []} borrador={version?.status === 'draft' ? 'Pendientes de publicar' : 'Sin cambios nuevos'} titulo={tituloPlan} onRestaurar={id => {
        const elegida = (historial.length ? historial : version ? [version] : []).find(item => item.id === id);
        if (!elegida?.items.length) { onAviso('Esa versión no tiene comidas para restaurar.'); return; }
        aplicar(elegida.items.map(item => ({ ...item, id: crypto.randomUUID(), components: item.components?.map(pieza => ({ ...pieza, id: crypto.randomUUID() })) })));
        onAviso('Se armó un borrador con esa versión. No se publicó.');
      }} onEntrega={() => setPestana('entrega')} /> : null}
      {pestana === 'entrega' ? <Entrega nombre={primer} publicado={publicado} control={control} incluidas={guidance.recommendations.length + guidance.avoid.length} revisado={revisado} onRevisado={setRevisado} onComidas={() => setPestana('semana')} onIndicaciones={() => setPestana('ind')} onAviso={onAviso}
        hayBorradorNuevo={hayBorradorNuevo} publicando={publicando} puedePublicar={puedePublicar}
        onPublicar={() => void publicar()} onVistaPaciente={() => setVistaPaciente(true)} onImprimir={abrirImpresion} onDescargarCompras={descargarCompras}
        onProgramar={() => onAviso('Programar una fecha y hora manual todavía no está disponible. Al publicar, la entrega se activa según el inicio del período del plan.')} /> : null}
    </> : null}
    {propuesta && propuestaDe(propuesta) ? <PropuestaIA job={propuesta} propuesta={propuestaDe(propuesta)!} armando={armando} onAplicar={() => void aplicarPropuesta()} onDescartar={() => void descartarPropuesta()} /> : null}
    {vistaPaciente ? <VistaPacienteDialog paciente={paciente.name} fecha={fecha} tituloDia={tituloDia} comidas={comidas} guidance={guidance} metaKcal={metaKcal} onClose={() => setVistaPaciente(false)} /> : null}
    {imprimiendo && plan ? <PlanPrintDialog plan={plan} patientName={paciente.name} demo={demo} currentAllowed onClose={() => setImprimiendo(false)} /> : null}
  </>;
}

function parte(macros: MacrosDia, clave: 'carbs' | 'protein' | 'fat') {
  const total = (macros.carbs ?? 0) + (macros.protein ?? 0) + (macros.fat ?? 0);
  if (!total || macros[clave] == null) return 0;
  return Math.round((macros[clave] ?? 0) / total * 100);
}

function Semana({ items, fechas, horas, metaKcal, dia, onDia, onAviso, onImprimir }: {
  items: PlanItemView[];
  fechas: string[];
  horas: Partial<Record<PlanSlot, string>>;
  metaKcal: number | null;
  dia: number;
  onDia: (indice: number) => void;
  onAviso: (texto: string) => void;
  onImprimir: () => void;
}) {
  return <div className="fx"><div className="c"><section className="fxp g">
    <header><h3>Semana</h3><span className="m">tocá un día o una comida</span><span className="sp" /></header>
    <div className="pgrid">
      <span />
      {fechas.map((iso, indice) => <button type="button" key={iso} className={`pdh${indice === dia ? ' on' : ''}`} onClick={() => onDia(indice)}>{DIAS_CORTOS[indiceLunes(iso)]} <b className="num">{Number(iso.slice(8, 10))}</b></button>)}
      {COMIDAS_EDITOR.map(slot => <span key={slot} style={{ display: 'contents' }}><span className="pml">{slot}</span>{fechas.map(iso => {
        const comida = comidaDelDia(items, iso, slot, horas[slot] || HORAS_EDITOR[slot]);
        return <button type="button" className="pc" key={`${iso}-${slot}`} aria-label={`${slot} del ${DIAS_LARGOS[indiceLunes(iso)]}: ${comida.titulo}`} onClick={() => onDia(fechas.indexOf(iso))}><b>{comida.titulo}</b><em className="num">{comida.macros.kcal == null ? 'Sin dato' : `${numero(comida.macros.kcal)} kcal`}</em></button>;
      })}</span>)}
      <span className="pml">Total</span>
      {fechas.map(iso => {
        const kcalDia = sumarMacros(comidasDelDia(items, iso, horas).flatMap(comida => comida.lineas.map(linea => linea.macros))).kcal;
        const lejos = metaKcal && kcalDia != null && Math.abs(kcalDia - metaKcal) / metaKcal > 0.05;
        return <span key={iso} className={`ptot num${lejos ? ' off' : ''}`}>{kcalDia == null ? '—' : numero(kcalDia)}</span>;
      })}
    </div>
    <div className="pfoot">
      <button type="button" className="sbtn" onClick={() => onAviso(AVISO_PLATO)}>Agregar colación</button>
      <button type="button" className="sbtn" onClick={() => onAviso('Próximamente. Duplicar la semana completa queda para después. Duplicar un día ya está en la vista Día.')}>Duplicar semana</button>
      <button type="button" className="sbtn" onClick={onImprimir}><PanelV29Icon name="dl" size={13} />Descargar PDF</button>
    </div>
  </section></div></div>;
}

function Indicaciones({ guidance, onChange }: { guidance: PlanGuidance; onChange: (guidance: PlanGuidance) => void }) {
  const tarjetas = [
    ['Recomendaciones', guidance.recommendations.join('\n'), 'recommendations'],
    ['Alimentos a evitar', guidance.avoid.join('\n'), 'avoid'],
  ] as const;
  return <div className="r29-instructions">{tarjetas.map(([titulo, texto, clave]) => <section className="fxp" key={clave}>
    <header><h3>{titulo}</h3><span className="sw" aria-checked="true" aria-label={`Incluir ${titulo} en la entrega`} /></header>
    <label className="r29-instruction-field">
      <textarea aria-label={titulo} defaultValue={texto} key={texto} onBlur={evento => onChange({ ...guidance, [clave]: evento.target.value.split('\n').map(linea => linea.trim()).filter(Boolean) })} />
      <small>Incluida en la entrega</small>
    </label>
  </section>)}</div>;
}

function Compras({ items, fechas, semana, onEntrega, onAviso, onDescargar }: {
  items: PlanItemView[];
  fechas: string[];
  semana: number;
  onEntrega: () => void;
  onAviso: (texto: string) => void;
  onDescargar: () => void;
}) {
  const grupos = listaDeCompras(items, fechas);
  return <div className="fx">
    <div className="c"><section className="fxp g">
      <header><h3>Compras · semana {semana}</h3><span className="m">del borrador actual</span><span className="sp" /><button type="button" className="sbtn" onClick={onDescargar}><PanelV29Icon name="dl" size={13} />Descargar lista</button></header>
      {grupos.length ? <div className="r29-shopping">{grupos.map(grupo => <section key={grupo.nombre}><h4>{grupo.nombre}</h4>{grupo.items.map(item => <p key={`${grupo.nombre}-${item.nombre}`}><span>{item.nombre}</span><span className="num">{item.cantidad}</span></p>)}</section>)}</div> : <p className="mhelp">Esta semana no tiene alimentos para armar la lista.</p>}
    </section></div>
    <div className="c"><section className="fxp">
      <header><h3>Alcance de la lista</h3><span className="sp" /></header>
      <p className="mhelp">Para una persona. Las cantidades salen de los alimentos y las porciones de esta semana.</p>
      <div className="r29-note warn">No se convierten entre crudo, cocido y cantidades de compra.</div>
    </section><section className="fxp">
      <header><h3>Entrega de la lista</h3><span className="sp" /></header>
      <p className="mhelp">Revisá la lista junto con las comidas antes de entregar el plan.</p>
      <button type="button" className="sbtn" onClick={onEntrega}>Ir a Entrega</button>
    </section></div>
  </div>;
}

function Versiones({ nombre, filas, historial, borrador, titulo, onRestaurar, onEntrega }: {
  nombre: string;
  filas: ReturnType<typeof filasDeVersiones>;
  historial: PlanVersionView[];
  borrador: string;
  titulo: string;
  onRestaurar: (id: string) => void;
  onEntrega: () => void;
}) {
  const publicada = historial.some(version => version.status === 'published');
  return <div className="fx">
    <div className="c"><section className="fxp g">
      <header><h3>Versiones de {nombre}</h3><span className="m">{filas.length} en el consultorio</span><span className="sp" /></header>
      <div className="r29-note"><PanelV29Icon name="file" size={16} /><span>{publicada ? 'La paciente ve la última versión publicada.' : 'Todavía no hay un plan entregado.'} Restaurar una versión crea un borrador para revisar.</span></div>
      <div className="fxr">{filas.map(fila => <div key={fila.id}><span className="t"><b>{fila.titulo}</b><small>{fila.detalle}</small></span>{fila.restaurar ? <button type="button" className="sbtn" onClick={() => onRestaurar(fila.id)}>Restaurar</button> : null}</div>)}</div>
    </section></div>
    <div className="c"><section className="fxp">
      <header><h3>Tu borrador actual</h3><span className="sp" /></header>
      <div className="fxkv"><div><span>Plan</span><b>{titulo}</b></div><div><span>Estado</span><b>{borrador}</b></div></div>
      <button type="button" className="sbtn" onClick={onEntrega}>Revisar entrega</button>
    </section></div>
  </div>;
}

function Entrega({
  nombre, publicado, control, incluidas, revisado, onRevisado, onComidas, onIndicaciones,
  hayBorradorNuevo, publicando, puedePublicar, onPublicar, onVistaPaciente, onImprimir,
  onDescargarCompras, onProgramar,
}: {
  nombre: string;
  publicado: boolean;
  control: ReturnType<typeof controlEntrega>;
  incluidas: number;
  revisado: boolean;
  onRevisado: (valor: boolean) => void;
  onComidas: () => void;
  onIndicaciones: () => void;
  onAviso: (texto: string) => void;
  hayBorradorNuevo: boolean;
  publicando: 'listo' | 'publicando' | 'error';
  puedePublicar: boolean;
  onPublicar: () => void;
  onVistaPaciente: () => void;
  onImprimir: () => void;
  onDescargarCompras: () => void;
  onProgramar: () => void;
}) {
  return <div className="fx">
    <div className="c"><section className="fxp g">
      <header><h3>Revisión antes de entregar</h3><span className="sp" /></header>
      <div className="r29-note"><PanelV29Icon name="eye" size={16} /><span><b>{publicado ? 'Hay una versión publicada.' : 'La paciente todavía no tiene una versión publicada.'}</b><br />El borrador se publica solo cuando confirmás la entrega.</span></div>
      <div className="r29-checks">
        <button type="button" className={control.vacias ? 'warn' : undefined} onClick={onComidas}><PanelV29Icon name={control.vacias ? 'alert' : 'check'} size={16} /><span><b>{control.vacias ? `${control.vacias} comidas sin alimentos` : `${control.conAlimentos} comidas con alimentos`}</b><small>Revisá alimentos, porciones y distribución en la duración del plan.</small></span><PanelV29Icon name="chev" size={13} /></button>
        <button type="button" className={control.diasFuera.length ? 'warn' : undefined} onClick={onComidas}><PanelV29Icon name={control.diasFuera.length ? 'alert' : 'check'} size={16} /><span><b>{control.diasFuera.length ? `${control.diasFuera.length} días con diferencia mayor al 10%` : 'Energía dentro del margen de revisión'}</b><small>Comparado con la meta diaria, cuando hay calorías cargadas.</small></span><PanelV29Icon name="chev" size={13} /></button>
        <button type="button" onClick={onIndicaciones}><PanelV29Icon name="file" size={16} /><span><b>Indicaciones y acuerdos</b><small>{incluidas} secciones con texto.</small></span><PanelV29Icon name="chev" size={13} /></button>
      </div>
      <p className="mhelp">Estos controles ayudan a recorrer el plan. Las alergias, la tolerancia y las metas requieren tu revisión.</p>
      <label className="r29-note"><input type="checkbox" checked={revisado} onChange={evento => onRevisado(evento.target.checked)} />Revisé el plan completo, las porciones y los cuidados de {nombre}.</label>
    </section>
    <section className="fxp">
      <header><h3>Publicación</h3><span className="sp" /></header>
      <p className="mhelp">{hayBorradorNuevo ? 'La nueva versión reemplaza a la publicada cuando confirmás. Si hay cambios de versión o alergias, el servidor lo frena y te avisa.' : 'No hay cambios nuevos para publicar. La versión publicada se conserva.'}</p>
      <button type="button" className="sbtn k" disabled={!puedePublicar || publicando === 'publicando'} onClick={onPublicar}><PanelV29Icon name="send" size={13} />{publicando === 'publicando' ? 'Publicando…' : 'Publicar plan revisado'}</button>
      {!revisado && hayBorradorNuevo ? <p className="mhelp">Marcá la revisión completa para habilitar la publicación.</p> : null}
      {control.vacias ? <p className="mhelp">Completá las comidas sin alimentos antes de publicar.</p> : null}
    </section></div>
    <div className="c"><section className="fxp">
      <header><h3>Así lo recibe {nombre}</h3><span className="m">vista del borrador</span><span className="sp" /></header>
      <div className="fxr">
        <button type="button" onClick={onVistaPaciente}><PanelV29Icon name="eye" size={15} /><span className="t"><b>Vista de la paciente</b><small>Revisá las comidas antes de publicar.</small></span><PanelV29Icon name="chev" size={13} /></button>
        <button type="button" onClick={onImprimir}><PanelV29Icon name="file" size={15} /><span className="t"><b>Imprimir / guardar PDF</b><small>Semana seleccionada e indicaciones.</small></span><PanelV29Icon name="chev" size={13} /></button>
        <button type="button" onClick={onDescargarCompras}><PanelV29Icon name="dl" size={15} /><span className="t"><b>Lista de compras</b><small>Descargar cantidades de la semana.</small></span><PanelV29Icon name="chev" size={13} /></button>
      </div>
      <p><button type="button" className="sbtn" onClick={onProgramar}><PanelV29Icon name="cal" size={13} />Programar entrega</button></p>
    </section></div>
  </div>;
}

function PropuestaIA({ job, propuesta, armando, onAplicar, onDescartar }: {
  job: AiJobView;
  propuesta: NonNullable<ReturnType<typeof propuestaDe>>;
  armando: boolean;
  onAplicar: () => void;
  onDescartar: () => void;
}) {
  return <FigmaRecordDialog title="Propuesta del asistente" onClose={onDescartar} closeLabel="Cerrar propuesta del asistente">
    <p>Del {propuesta.period_start} al {propuesta.period_end}. La propuesta queda como borrador privado: no se publica ni se envía a la paciente.</p>
    {job.warnings.map(warning => <p role="status" key={warning}>{warning}</p>)}
    <div className="fxr">
      {propuesta.items.slice(0, 12).map((item, indice) => <div key={`${item.for_date}-${item.slot}-${indice}`}>
        <span className="t"><b>{item.for_date} · {item.slot}</b><small>{item.free_text || item.recipe_proposal?.title || 'Receta del catálogo'}</small></span>
        {item.portions != null ? <small className="num">{item.portions} porciones</small> : null}
      </div>)}
    </div>
    {propuesta.items.length > 12 ? <p className="mhelp">Y {propuesta.items.length - 12} comidas más.</p> : null}
    <p className="mhelp">Revisá alergias, restricciones, porciones y alimentos antes de publicar.</p>
    <footer>
      <button type="button" className="sbtn k" disabled={armando} onClick={onAplicar}>{armando ? 'Guardando…' : 'Usar como borrador'}</button>
      <button type="button" className="sbtn" disabled={armando} onClick={onDescartar}>Descartar</button>
    </footer>
  </FigmaRecordDialog>;
}

function VistaPacienteDialog({ paciente, fecha, tituloDia, comidas, guidance, metaKcal, onClose }: {
  paciente: string;
  fecha: string;
  tituloDia: string;
  comidas: ReturnType<typeof comidasDelDia>;
  guidance: PlanGuidance;
  metaKcal: number | null;
  onClose: () => void;
}) {
  return <FigmaRecordDialog title="Vista de la paciente" onClose={onClose} closeLabel="Cerrar vista de la paciente">
    <p className="mhelp">Vista previa del borrador. No se notificó ni se envió nada a {paciente}.</p>
    <div className="r29-patient-preview">
      <header><h3>{paciente} · {tituloDia}</h3><span className="m">{fecha}</span><span className="sp" /></header>
      <p className="mhelp">{metaKcal ? `Meta: ${metaKcal.toLocaleString('es-AR')} kcal por día` : 'Sin meta cargada'}</p>
      {comidas.map(comida => <section key={comida.slot} className="fxp">
        <header><h3>{comida.slot} · {comida.hora}</h3><span className="m">{comida.macros.kcal == null ? 'Sin dato' : `${numero(comida.macros.kcal)} kcal`}</span><span className="sp" /></header>
        <p><b>{comida.titulo}</b></p>
        {comida.lineas.length ? comida.lineas.map(linea => <p className="mhelp" key={linea.clave}>{linea.nombre} · {linea.cantidad ?? '—'} {linea.unidad}{linea.nota ? ` · ${linea.nota}` : ''}</p>) : <p className="mhelp">Sin alimentos cargados.</p>}
      </section>)}
      {guidance.recommendations.length ? <section className="fxp"><header><h3>Recomendaciones</h3><span className="sp" /></header><p className="mhelp">{guidance.recommendations.join(' · ')}</p></section> : null}
      {guidance.avoid.length ? <section className="fxp"><header><h3>Alimentos a evitar</h3><span className="sp" /></header><p className="mhelp">{guidance.avoid.join(' · ')}</p></section> : null}
    </div>
    <footer><button type="button" className="sbtn" onClick={onClose}>Cerrar</button></footer>
  </FigmaRecordDialog>;
}
