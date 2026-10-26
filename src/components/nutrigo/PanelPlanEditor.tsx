import { useEffect, useRef, useState } from 'react';
import { plansApi } from '../../api/plans';
import type { Patient } from '../../types';
import { mealPlanDraftSchema, type PlanItemView, type PlanSlot, type PlanVersionView, type ProfessionalMealPlan } from '../../types/plans';
import { emptyGuidance, type PlanGuidance } from '../../types/plan-guidance';
import { PanelV29Icon } from './PanelV29Icon';
import { fondoAvatar } from './planes-lista';
import {
  cambiarCantidad, cambiarNota, COMIDAS_EDITOR, comidaDelDia, comidasDelDia, controlEntrega,
  copiarPlan, DIAS_CORTOS, DIAS_LARGOS, duplicarDia, fechasDeSemana, filasDeVersiones, HORAS_EDITOR,
  indiceLunes, listaDeCompras, lunesDeSemana, paraGuardar, periodoDe, quitarLinea, semanaInicial, semanasDelPeriodo,
  sumarDias, sumarMacros, type MacrosDia,
} from './planes-editor';

const AVISO_PARTE_3 = 'Próximamente. Publicar, el PDF, la vista de la paciente y programar la entrega llegan en la parte 3. Nada le llega a la paciente desde acá.';
const AVISO_IA = 'Próximamente. El armado con el asistente llega en la parte 3. Nada le llega a la paciente hasta que se publique.';
const AVISO_PLANTILLA = 'Próximamente. Las plantillas de Planes quedan para una pasada aparte.';
const AVISO_PLATO = 'Próximamente. Sumar o cambiar un plato queda para después. Las porciones de lo que ya está en el plan se editan acá.';

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

  const lunes = lunesDeSemana(hoy);
  const inicio = vacio ? lunes : version?.period_start ?? lunes;
  const fin = vacio ? sumarDias(lunes, 6) : version?.period_end ?? sumarDias(lunes, 6);
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
    const periodo = periodoDe(siguiente, inicio, fin);
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
          <div><PanelV29Icon name="spark" size={16} /><b>Con el asistente</b><p>Arma una primera semana con lo que cargaste en la ficha de {primer}.</p><button type="button" className="sbtn k" onClick={() => onAviso(AVISO_IA)}>Armar con el asistente</button></div>
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
          <button type="button" className="sbtn" onClick={() => onAviso(AVISO_IA)}><PanelV29Icon name="spark" size={13} />Asistente IA</button>
          <details>
            <summary aria-label="Más herramientas del plan">Más ···</summary>
            <div className="r29-menu">
              <button type="button" onClick={() => onAviso(AVISO_PLANTILLA)}><PanelV29Icon name="copy" size={14} />Guardar como plantilla</button>
              <button type="button" onClick={() => onAviso('Próximamente. Copiar este plan a otra paciente queda para después.')}><PanelV29Icon name="users" size={14} />Copiar a otra paciente</button>
              <button type="button" onClick={() => { if (version?.nutrition_target) setMeta(true); else onAviso('La meta diaria no está cargada en este plan.'); }}><PanelV29Icon name="trend" size={14} />Ajustar metas</button>
            </div>
          </details>
        </div>
      </div>
      {pestana === 'semana' && modo === 'dia' ? <div className="fx">
        <div className="c pel"><section className="fxp g pedit">
          <header>
            <div className="pux-editor-title"><h4>Comidas del día</h4><small>Editá las porciones y revisá el total al instante.</small></div>
            <span className="sp" />
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
            <div className="pewk" aria-label="Elegir semana"><span>Semana</span>{Array.from({ length: semanasDelPeriodo(inicio, fin) }, (_, indice) => <button type="button" key={indice} className={indice === semana ? 'on' : undefined} aria-pressed={indice === semana} onClick={() => { setSemana(indice); setDia(0); }}>{indice + 1}</button>)}</div>
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
          </> : <p className="mhelp">{AVISO_PARTE_3}</p>}
        </section>
        <div className="r29-note"><PanelV29Icon name="file" size={15} /><span><b>{publicado ? 'La paciente conserva su plan publicado.' : 'Este plan todavía no se entregó.'}</b><br />Los cambios se preparan en borrador hasta que los revises y publiques.</span></div>
        </div>
      </div> : null}
      {pestana === 'semana' && modo === 'semana' ? <Semana items={items} fechas={fechas} horas={horas} metaKcal={metaKcal} dia={dia} onDia={indice => { setDia(indice); setModo('dia'); }} onAviso={onAviso} /> : null}
      {pestana === 'ind' ? <Indicaciones guidance={guidance} onChange={siguiente => { setGuidance(siguiente); if (items.length) void guardar(items, { guidance: siguiente }); else onAviso('El borrador necesita al menos una comida para guardar las indicaciones.'); }} /> : null}
      {pestana === 'compras' ? <Compras items={items} fechas={fechasDeSemana(inicio, fin, semana)} semana={semana + 1} onEntrega={() => setPestana('entrega')} onAviso={onAviso} /> : null}
      {pestana === 'ver' ? <Versiones nombre={primer} filas={filasDeVersiones(version, historial)} historial={historial.length ? historial : version ? [version] : []} borrador={version?.status === 'draft' ? 'Pendientes de publicar' : 'Sin cambios nuevos'} titulo={tituloPlan} onRestaurar={id => {
        const elegida = (historial.length ? historial : version ? [version] : []).find(item => item.id === id);
        if (!elegida?.items.length) { onAviso('Esa versión no tiene comidas para restaurar.'); return; }
        aplicar(elegida.items.map(item => ({ ...item, id: crypto.randomUUID(), components: item.components?.map(pieza => ({ ...pieza, id: crypto.randomUUID() })) })));
        onAviso('Se armó un borrador con esa versión. No se publicó.');
      }} onEntrega={() => setPestana('entrega')} /> : null}
      {pestana === 'entrega' ? <Entrega nombre={primer} publicado={publicado} control={controlEntrega(inicio, fin, items, metaKcal && Number.isFinite(metaKcal) ? metaKcal : null)} incluidas={guidance.recommendations.length + guidance.avoid.length} revisado={revisado} onRevisado={setRevisado} onComidas={() => setPestana('semana')} onIndicaciones={() => setPestana('ind')} onAviso={onAviso} /> : null}
    </> : null}
  </>;
}

function parte(macros: MacrosDia, clave: 'carbs' | 'protein' | 'fat') {
  const total = (macros.carbs ?? 0) + (macros.protein ?? 0) + (macros.fat ?? 0);
  if (!total || macros[clave] == null) return 0;
  return Math.round((macros[clave] ?? 0) / total * 100);
}

function Semana({ items, fechas, horas, metaKcal, dia, onDia, onAviso }: {
  items: PlanItemView[];
  fechas: string[];
  horas: Partial<Record<PlanSlot, string>>;
  metaKcal: number | null;
  dia: number;
  onDia: (indice: number) => void;
  onAviso: (texto: string) => void;
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
      <button type="button" className="sbtn" onClick={() => onAviso(AVISO_PARTE_3)}>Descargar PDF</button>
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

function Compras({ items, fechas, semana, onEntrega, onAviso }: {
  items: PlanItemView[];
  fechas: string[];
  semana: number;
  onEntrega: () => void;
  onAviso: (texto: string) => void;
}) {
  const grupos = listaDeCompras(items, fechas);
  return <div className="fx">
    <div className="c"><section className="fxp g">
      <header><h3>Compras · semana {semana}</h3><span className="m">del borrador actual</span><span className="sp" /><button type="button" className="sbtn" onClick={() => onAviso(AVISO_PARTE_3)}><PanelV29Icon name="dl" size={13} />Descargar lista</button></header>
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

function Entrega({ nombre, publicado, control, incluidas, revisado, onRevisado, onComidas, onIndicaciones, onAviso }: {
  nombre: string;
  publicado: boolean;
  control: ReturnType<typeof controlEntrega>;
  incluidas: number;
  revisado: boolean;
  onRevisado: (valor: boolean) => void;
  onComidas: () => void;
  onIndicaciones: () => void;
  onAviso: (texto: string) => void;
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
    </section></div>
    <div className="c"><section className="fxp">
      <header><h3>Así lo recibe {nombre}</h3><span className="m">vista del borrador</span><span className="sp" /></header>
      <div className="fxr">
        <button type="button" onClick={() => onAviso(AVISO_PARTE_3)}><PanelV29Icon name="eye" size={15} /><span className="t"><b>Vista de la paciente</b><small>Revisá las comidas antes de publicar.</small></span><PanelV29Icon name="chev" size={13} /></button>
        <button type="button" onClick={() => onAviso(AVISO_PARTE_3)}><PanelV29Icon name="file" size={15} /><span className="t"><b>Imprimir / guardar PDF</b><small>Semana seleccionada e indicaciones.</small></span><PanelV29Icon name="chev" size={13} /></button>
        <button type="button" onClick={() => onAviso(AVISO_PARTE_3)}><PanelV29Icon name="dl" size={15} /><span className="t"><b>Lista de compras</b><small>La descarga llega en la parte 3.</small></span><PanelV29Icon name="chev" size={13} /></button>
      </div>
      <p><button type="button" className="sbtn" onClick={() => onAviso(AVISO_PARTE_3)}><PanelV29Icon name="cal" size={13} />Programar entrega</button></p>
    </section></div>
  </div>;
}
