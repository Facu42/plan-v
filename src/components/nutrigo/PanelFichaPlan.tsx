// Solapa Plan de la Ficha v29: mismas piezas y clases del boceto, con el plan publicado real y cada botón conectado.
import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../api/client';
import { careApi, careErrorMessage, notifyCareChanged } from '../../api/care';
import { nutritionTargetApi, type NutritionTarget } from '../../api/nutrition-target';
import { plansApi } from '../../api/plans';
import { shoppingApi } from '../../api/shopping';
import type { Patient } from '../../types';
import type { CareRecord } from '../../types/care';
import { buildPublishedPlanDays, planWeekIndex, eachIsoDate, type PatientMealPlan, type ProfessionalMealPlan } from '../../types/plans';
import { FORMULA_LABELS } from '../../types/nutrition-capabilities';
import type { ShoppingListView } from '../../types/shopping';
import { CarePanel } from './CarePanel';
import { FxCols, FxKv, FxMedidor, FxPanel } from './ficha-fx';
import { comidasDelDia, kcalDelDia, kcalPorMomento, textoListaDeCompras } from './ficha-plan';
import { MealPlanEditor } from './MealPlanVersions';
import { formatMetricDate } from './measurement-format';
import { AvisoBoceto } from './panel-v29-boceto';
import { PanelV29Icon } from './PanelV29Icon';
import { PlanSafetySummary } from './PlanSafetySummary';
import { PublishedRecordPlan } from './PanelPatientPlan';
import type { RecordTab } from './patient-record-sections';
import { canLeaveWorkspace } from './unsaved-changes';

type Vista = 'hoy' | 'semana' | 'paciente';
type Pedido = Extract<CareRecord['data'], { kind: 'menu_request' }>;
// Los mismos degradados por momento que dibuja el boceto en cada comida.
const FONDOS: Record<string, string> = { Desayuno: 'linear-gradient(135deg,#E9F3C9,#C9DD8F)', Colación: 'linear-gradient(135deg,#E9F3C9,#C9DD8F)', Almuerzo: 'linear-gradient(135deg,#DDEBDF,#A9CDB1)', Merienda: 'linear-gradient(135deg,#FBE7BE,#F2C77A)', Cena: 'linear-gradient(135deg,#F6DCCF,#E6B39C)', Extra: 'linear-gradient(135deg,#E9F3C9,#C9DD8F)' };
const numero = (valor: number) => Math.round(valor).toLocaleString('es-AR');
const corto = (iso: string) => { const [, mes, dia] = iso.split('-'); return `${Number(dia)}/${Number(mes)}`; };

export function PanelFichaPlan({ patient, professionalName, now, onChanged, onSection }: { patient: Patient; professionalName?: string; now: Date; onChanged: () => void; onSection: (tab: RecordTab) => void }) {
  const [plan, setPlan] = useState<{ id: string; publicado: PatientMealPlan | null; profesional: ProfessionalMealPlan | null } | null>(null);
  const [meta, setMeta] = useState<NutritionTarget | null>(null);
  const [pedidos, setPedidos] = useState<CareRecord[]>([]);
  const [consentidos, setConsentidos] = useState<string[]>([]);
  const [compras, setCompras] = useState<ShoppingListView | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState(false);
  const [vista, setVista] = useState<Vista>('hoy');
  const [elegido, setElegido] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [pedidosAbiertos, setPedidosAbiertos] = useState(false);
  const primerNombre = patient.name.split(' ')[0] ?? patient.name;
  useEffect(() => {
    const control = new AbortController();
    setPlan(null); setError('');
    Promise.all([plansApi.published(patient.id, control.signal), plansApi.professional(patient.id, control.signal)])
      .then(([pub, pro]) => { if (!control.signal.aborted) setPlan({ id: patient.id, publicado: pub.plan, profesional: pro.plan }); })
      .catch(fallo => { if (!control.signal.aborted) setError(careErrorMessage(fallo)); });
    // Lo que acompaña al plan: si falla, la solapa sigue y ese bloque lo dice.
    nutritionTargetApi.get(patient.id, true, control.signal).then(res => { if (!control.signal.aborted) setMeta(res.published ?? res.target ?? null); }).catch(() => { if (!control.signal.aborted) setMeta(null); });
    careApi.snapshot(patient.id, true, control.signal).then(res => { if (!control.signal.aborted) { setPedidos(res.records.filter(registro => registro.data.kind === 'menu_request' && !registro.reviewed_at)); setConsentidos(res.consented); } }).catch(() => { if (!control.signal.aborted) setPedidos([]); });
    shoppingApi.get(patient.id, control.signal).then(res => { if (!control.signal.aborted) setCompras(res.list); }).catch(() => { if (!control.signal.aborted) setCompras(null); });
    return () => control.abort();
  }, [patient.id, revision]);
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(now);
  const publicado = plan?.id === patient.id ? plan.publicado : null;
  const dias = publicado ? buildPublishedPlanDays(publicado) : [];
  const fecha = dias.some(dia => dia.isoDate === elegido) ? elegido : dias.some(dia => dia.isoDate === hoy) ? hoy : dias[0]?.isoDate ?? '';
  const comidas = publicado ? comidasDelDia(publicado, fecha) : [];
  const totalDia = kcalDelDia(comidas);
  const porMomento = kcalPorMomento(comidas);
  const objetivo = publicado?.nutrition_target;
  const calculo = meta?.result;
  const kcalMeta = objetivo?.kcal ?? calculo?.kcal ?? null;
  const cambiado = () => { setRevision(n => n + 1); onChanged(); };
  const abrirEditor = () => { if (canLeaveWorkspace()) setEditor(valor => !valor); };
  const pedido = pedidos[0]?.data as Pedido | undefined;
  const semanaActual = publicado ? planWeekIndex(publicado.period_start, publicado.period_end, hoy) + 1 : 0;
  const semanas = publicado ? Math.max(1, Math.ceil(eachIsoDate(publicado.period_start, publicado.period_end).length / 7)) : 0;

  const aprobar = async () => {
    if (!pedidos[0]) return;
    setOcupado(true);
    try { await careApi.review(patient.id, pedidos[0].id); notifyCareChanged(); setRevision(n => n + 1); setAviso(`Pedido de ${primerNombre} aprobado. Aplicalo en el editor.`); setEditor(true); }
    catch (fallo) { setAviso(careErrorMessage(fallo)); }
    finally { setOcupado(false); }
  };
  const proponerOtra = async () => {
    if (!pedidos[0]) return;
    if (!consentidos.includes('ai_menu_draft')) { setPedidosAbiertos(true); setAviso(`${primerNombre} todavía no autorizó alternativas con IA. Armala a mano en el editor.`); return; }
    setOcupado(true);
    try { await careApi.generate(patient.id, pedidos[0].id); notifyCareChanged(); setRevision(n => n + 1); setPedidosAbiertos(true); setAviso('Propuesta preparada para tu revisión.'); }
    catch (fallo) { setAviso(careErrorMessage(fallo)); }
    finally { setOcupado(false); }
  };
  const enviarCompras = async () => {
    const texto = compras ? textoListaDeCompras(primerNombre, compras) : null;
    if (!texto) { setAviso('No hay nada para comprar en la lista.'); return; }
    setOcupado(true);
    try { await api.sendMessage(patient.id, texto, 'vero', false, crypto.randomUUID()); setAviso(patient.has_account === false ? `La lista queda en el chat hasta que ${primerNombre} vincule la app.` : `Lista de compras enviada a ${primerNombre} por la app.`); }
    catch (fallo) { setAviso(careErrorMessage(fallo)); }
    finally { setOcupado(false); }
  };

  if (editor) return <section className="pn-record-plan" aria-label="Plan de la paciente">
    <header className="pn-record-diary-tools"><p>Editor del plan · borrador privado</p><button type="button" className="pn-record-primary" onClick={abrirEditor}>Volver al plan actual</button></header>
    <PlanSafetySummary patientId={patient.id} /><MealPlanEditor patientId={patient.id} patientName={patient.name} professionalName={professionalName} onChanged={cambiado} />
    {aviso && <AvisoBoceto key={aviso} texto={aviso} />}
  </section>;

  const botonEditar = <button type="button" className="sbtn k cbtn" onClick={abrirEditor}><PanelV29Icon name="pen" size={13} />Abrir en el editor</button>;
  const solapas = <div className="tabs" aria-label="Vista del plan">{([['hoy', 'Hoy'], ['semana', 'Semana'], ['paciente', `Vista de ${primerNombre}`]] as const).map(([valor, texto]) => <button type="button" key={valor} className={vista === valor ? 'on' : undefined} aria-pressed={vista === valor} onClick={() => setVista(valor)}>{texto}</button>)}</div>;
  const metaPlan = publicado ? `${kcalMeta !== null ? `${numero(kcalMeta)} kcal · ` : ''}semana ${semanaActual} de ${semanas} · vence ${corto(publicado.period_end)}` : undefined;
  const macros = (calculo ? [['Proteínas', calculo.protein_g, calculo.protein_pct, 'k', `${String(meta!.inputs.protein_g_per_kg).replace('.', ',')} g/kg`], ['Carbohidratos', calculo.carbs_g, calculo.carbs_pct, '', ''], ['Grasas', calculo.fat_g, calculo.fat_pct, 'o', '']] : objetivo ? [['Proteínas', objetivo.protein_g, null, 'k', ''], ['Carbohidratos', objetivo.carbs_g, null, '', ''], ['Grasas', objetivo.fat_g, null, 'o', '']] : []) as Array<[string, number, number | null, string, string]>;
  const gramosTotales = macros.reduce((suma, [, g]) => suma + g, 0) || 1;

  return <section className="pn-record-plan" aria-label="Plan de la paciente">
    {error && <p role="alert">{error} <button type="button" onClick={() => setRevision(n => n + 1)}>Reintentar plan</button></p>}
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
      <div className="c">
        <FxPanel titulo="Plan vigente" meta={metaPlan} grande derecha={<>{solapas}{botonEditar}</>}>
          {pedido && <div className="fxask"><PanelV29Icon name="swap" size={14} /><span><b>Pedido de cambio:</b> {pedido.target}, «{pedido.reason}».</span><span className="sp" /><button type="button" className="sbtn k cbtn" disabled={ocupado} onClick={() => void aprobar()}>Aprobar</button><button type="button" className="sbtn cbtn" disabled={ocupado} onClick={() => void proponerOtra()}>Proponer otra</button></div>}
          {!plan && !error ? <p role="status" className="fxhint">Consultando el plan vigente…</p>
            : !publicado ? <p className="fxhint">{plan?.profesional?.scheduled ? 'Hay una versión programada; la paciente la verá desde su fecha de inicio.' : plan?.profesional ? 'Hay un borrador privado para revisar en el editor.' : `Todavía no hay un plan publicado para ${primerNombre}. Abrí el editor para preparar el primero.`}</p>
              : vista === 'paciente' ? <><label className="fxsel">Fecha del plan<select aria-label="Fecha del plan actual" value={fecha} onChange={event => setElegido(event.target.value)}>{dias.map(dia => <option key={dia.isoDate} value={dia.isoDate}>{dia.weekday} · {formatMetricDate(dia.isoDate)}</option>)}</select></label><PublishedRecordPlan plan={publicado} date={fecha} /></>
                : vista === 'semana' ? <div className="fxs fxtb tall"><table><thead><tr><th>Día</th><th>Comidas</th><th>Calorías</th><th></th></tr></thead><tbody>{dias.map(dia => { const delDia = comidasDelDia(publicado, dia.isoDate), total = kcalDelDia(delDia); return <tr key={dia.isoDate} className={dia.isoDate === fecha ? 'on' : undefined}><td><div className="fxwhen"><b>{dia.weekday}</b><small className="num">{corto(dia.isoDate)}</small></div></td><td>{delDia.length ? delDia.map(comida => comida.titulo).join(' · ') : 'Sin comidas indicadas'}</td><td className="num">{total === null ? '—' : `${numero(total)} kcal`}</td><td><button type="button" className="sbtn cbtn" onClick={() => { setElegido(dia.isoDate); setVista('hoy'); }}>Ver el día</button></td></tr>; })}</tbody></table></div>
                  : <div className="fxs">{fecha !== hoy && <p className="fxhint">Mostrando el {formatMetricDate(fecha)}.{dias.some(dia => dia.isoDate === hoy) && <> <button type="button" className="lnk" onClick={() => setElegido(hoy)}>Volver a hoy</button></>}</p>}
                    {comidas.length ? <ol className="fxmeals">{comidas.map(comida => <li key={comida.id}><time className="num">{comida.hora ?? '—'}</time><i /><span className="photo" style={{ '--g': FONDOS[comida.slot] ?? FONDOS.Extra } as CSSProperties}><PanelV29Icon name="fork" size={14} /></span><div className="tx"><small>{comida.etiqueta}</small><b>{comida.titulo}</b>{comida.nota && <span>{comida.nota}</span>}</div><div className="kc">{comida.kcal === null ? <small>Sin calorías</small> : <><b className="num">{numero(comida.kcal)}</b><small>kcal</small><span className="fxb"><i style={{ width: `${Math.min(100, comida.kcal / Math.max(...comidas.map(otra => otra.kcal ?? 0), 1) * 100)}%` }} /></span></>}</div></li>)}</ol> : <p className="fxhint">Sin comidas indicadas para esta fecha.</p>}</div>}
        </FxPanel>
        <details className="pn-record-card" onToggle={event => setPedidosAbiertos(event.currentTarget.open)} open={pedidosAbiertos}><summary>Pedidos de cambio y alternativas de la paciente</summary>{pedidosAbiertos && <CarePanel patientId={patient.id} mode="professional-menu" />}</details>
      </div>
      <div className="c">
        <FxPanel titulo="Requerimiento" meta={meta?.inputs.formula ? FORMULA_LABELS[meta.inputs.formula] : meta ? FORMULA_LABELS.mifflin : undefined} derecha={<button type="button" className="sbtn cbtn" onClick={() => onSection('planificacion')}><PanelV29Icon name="pen" size={13} />Editar</button>}>
          {kcalMeta === null ? <div className="fxhint">Todavía no hay requerimiento publicado. Se calcula en Objetivos y hábitos.</div> : <>
            <div className="fxsplit"><FxMedidor pct={calculo ? Math.min(100, Math.round(kcalMeta / Math.max(calculo.tdee, kcalMeta) * 100)) : 100} texto={numero(kcalMeta)} sub="kcal" ancho={164} />
              <FxKv filas={[['Gasto', calculo ? `${numero(calculo.tdee)} kcal` : 'Sin dato'], ['Plan', `${numero(kcalMeta)} kcal`], ['Diferencia', calculo && calculo.tdee ? `${Math.round((kcalMeta / calculo.tdee - 1) * 100)}%`.replace('-', '−') : 'Sin dato']]} /></div>
            <div className="fxmacros">{macros.map(([nombre, g, pct, clase, extra]) => <div key={nombre}><span><b>{nombre}</b><small className="num">{pct !== null ? `${Math.round(pct)}% · ` : ''}{numero(g)} g{extra ? ` · ${extra}` : ''}</small></span><span className="fxb"><i className={clase || undefined} style={{ width: `${Math.round(g / gramosTotales * 100)}%` }} /></span></div>)}</div></>}
        </FxPanel>
        <FxPanel titulo="Calorías por comida" meta={totalDia === null ? undefined : `${numero(totalDia)} en el día`} grande>
          {porMomento.length ? <FxCols valores={porMomento.map(m => m.kcal)} rotulos={porMomento.map(m => m.etiqueta)} max={Math.max(...porMomento.map(m => m.kcal)) * 1.15} alto={120} /> : <div className="fxhint">{publicado ? 'Las comidas de este día no traen calorías.' : 'Sin plan publicado.'}</div>}
        </FxPanel>
        <FxPanel titulo="Lista de compras" meta={publicado ? `semana ${semanaActual}` : undefined} derecha={<button className="lnk" type="button" disabled={ocupado} onClick={() => void enviarCompras()}>Enviar a {primerNombre}</button>}>
          {!compras ? <div className="fxhint">Consultando la lista…</div> : compras.items.length ? <><FxKv filas={compras.items.slice(0, 6).map(linea => [linea.name, linea.quantity !== null ? `${String(linea.quantity).replace('.', ',')}${linea.unit ? ` ${linea.unit}` : ''}` : 'Sin cantidad'] as const)} />{compras.items.length > 6 && <button type="button" className="lnk" onClick={() => onSection('compras')}>Ver las {compras.items.length} líneas</button>}</> : <div className="fxhint">La lista está vacía: se arma con las recetas del plan publicado.</div>}
        </FxPanel>
      </div>
    </div>
    {aviso && <AvisoBoceto key={aviso} texto={aviso} />}
  </section>;
}
