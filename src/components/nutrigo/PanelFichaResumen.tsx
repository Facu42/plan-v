// Resumen de la Ficha v29: tres columnas del boceto (`fx`), con los datos reales de la paciente.
import type { ReactNode } from 'react';
import type { Patient } from '../../types';
import { homeDay } from '../../lib/panel-home';
import { lastVisit } from './directory-last-visit';
import { recordMetric } from './panel-record-data';
import { pendientesDeFicha } from './ficha-pendientes';
import { intakeMissingItems, intakeStatusLabel, healthFactLabel } from './intake-review';
import { metaEnKg, pacienteDesde, planPorVencer, proximaConsulta, serieDePeso, turnoDetalle, UMBRAL_ADHERENCIA_BAJA } from './pacientes-presentacion';
import { avanceDeIngreso, avanceEnKilos, diaMes, mosaicosDeMedidas, numero, plural } from './ficha-presentacion';
import type { SolapaFicha } from './ficha-presentacion';
import { FxBar, FxDk, FxFilas, FxIr, FxKv, FxMedidor, FxMosaico, FxPanel, FxCurva, type FilaFx, type Ir } from './ficha-fx';
import type { FichaData } from './use-ficha-data';

const PLAN_ESTADO = { none: 'Todavía sin plan', draft: 'Plan en borrador', published: 'Plan publicado', scheduled: 'Plan programado' } as const;
const PUNTOS_DE_CURVA = 6;
const sbtn = (texto: string, ir: Ir, a: SolapaFicha): ReactNode => <button type="button" className="sbtn" onClick={() => ir(a)}>{texto}</button>;

export function PanelFichaResumen({ patient, now, datos, ir, children }: { patient: Patient; now: Date; datos: FichaData; ir: Ir; children?: ReactNode }) {
  const { care, careError, reload, canCare, canDocs, current, refetch } = datos;
  const hoy = homeDay(now);
  const medidas = (careError ? [] : care?.measurements ?? []).filter(m => m.patient_id === patient.id && m.captured_on <= hoy);
  const permisoMedidas = !care || careError ? null : care.consented.includes('measurement');
  const mosaicos = mosaicosDeMedidas(medidas, hoy, patient.goal);
  const serie = serieDePeso(medidas, hoy).slice(-PUNTOS_DE_CURVA);
  const peso = recordMetric(medidas, patient.id, 'weight', hoy);
  const metaKg = metaEnKg(patient.goal);
  const avance = avanceEnKilos(peso?.first.value ?? null, peso?.last.value ?? null, patient.goal);
  const pctAvance = avance?.pct ?? (patient.goal && patient.goal_progress != null ? Math.max(0, Math.min(100, Math.round(patient.goal_progress))) : null);
  const { alterados, ultimoLab, comidas, masComidas: masPendientes, ultimaNota, compartida, notaPorAprobar } = pendientesDeFicha(patient, datos, hoy);
  const plan = current?.vista?.plan;
  const venceEl = plan?.period_end ? diaMes(plan.period_end) : null;
  const porVencer = planPorVencer(current?.vista ? { patient_id: patient.id, can_open: current.vista.can_open, latest_weight: current.vista.latest_weight, plan: current.vista.plan } : undefined, hoy);
  const pendientes = comidas ?? 0;
  const semana = patient.weekly_registration;
  const visita = lastVisit(patient.appointment_history, hoy);
  const turno = turnoDetalle(patient, now);
  const ingreso = current?.intake ?? null;
  const faltantes = ingreso ? intakeMissingItems(ingreso) : [];
  const ingresoAvance = ingreso ? avanceDeIngreso(faltantes.length) : null;
  const adherencia = semana ? patient.adherence_score : null;

  const cambios: FilaFx[] = [
    pctAvance !== null
      ? { tono: 'l', titulo: `Objetivo al ${pctAvance}%`, sub: `${avance ? `faltan ${numero(avance.faltan)} kg · ` : ''}adherencia ${adherencia !== null ? `${adherencia}%` : 'sin dato'}`, ir: 'objetivos' }
      : { tono: 'n', titulo: 'Objetivo sin avance medido', sub: patient.goal || 'Todavía sin definir', ir: 'objetivos' },
    semana
      ? { tono: 'l', titulo: `Registró comidas ${plural(semana.recorded_days, 'día', 'días')} de 7`, sub: semana.recorded_days === 0 ? 'sin registros esta semana' : 'últimos siete días', ir: 'alimentario' }
      : { tono: 'n', titulo: 'Registros de la semana sin dato', sub: 'no pudimos consultarlos', ir: 'alimentario' },
    !current ? { tono: 'n', titulo: 'Consultando comidas…', ir: 'alimentario' }
      : !current.meals ? { tono: 'a', titulo: 'No pudimos consultar las comidas', sub: 'reintentá desde las alertas', ir: 'alimentario' }
      : pendientes ? { tono: 'a', titulo: `${masPendientes ? 'Más de ' : ''}${plural(pendientes, 'comida por revisar', 'comidas por revisar')}`, sub: 'esperan tu devolución', ir: 'alimentario' }
      : { tono: 'l', titulo: 'Sin comidas por revisar', sub: 'todo lo registrado ya tiene revisión', ir: 'alimentario' },
    !canDocs ? { tono: 'n', titulo: 'Permiso de estudios pendiente', ir: 'laboratorio' }
      : !current ? { tono: 'n', titulo: 'Consultando laboratorio…', ir: 'laboratorio' }
      : ultimoLab ? { tono: alterados.length ? 'r' : 'b', titulo: `Laboratorio del ${diaMes(ultimoLab)}`, sub: alterados.length ? `${plural(alterados.length, 'valor alterado', 'valores alterados')}: ${alterados.map(v => v.nombre).slice(0, 3).join(', ')}` : 'ningún valor fuera del rango del informe', ir: 'laboratorio' }
      : { tono: 'n', titulo: 'Sin laboratorio cargado', sub: 'subí un informe desde Laboratorio y estudios', ir: 'laboratorio' },
    { tono: 'b', titulo: plan ? PLAN_ESTADO[plan.status] : 'Plan sin consultar', sub: venceEl ? `vence el ${venceEl}` : plan ? 'sin fecha de fin' : 'consultando…', ir: 'plan' },
  ];

  const alertas: FilaFx[] = [
    ...alterados.map((v): FilaFx => ({ tono: 'r', titulo: `${v.nombre} ${v.sentido}`, sub: `${v.valor}, rango del informe ${v.rango}`, ir: 'laboratorio' })),
    ...(porVencer && venceEl ? [{ tono: 'a', titulo: `El plan vence el ${venceEl}`, sub: 'renovarlo en esta consulta', ir: 'plan' } as FilaFx] : []),
    ...(pendientes ? [{ tono: 'a', titulo: plural(pendientes, 'comida por revisar', 'comidas por revisar'), sub: 'esperan tu devolución', ir: 'alimentario' } as FilaFx] : []),
    ...(semana && semana.recorded_days === 0 ? [{ tono: 'a', titulo: 'Sin registros esta semana', sub: 'la falta de registros no es un incumplimiento', ir: 'alimentario' } as FilaFx] : []),
    ...(semana && adherencia !== null && adherencia > 0 && adherencia < UMBRAL_ADHERENCIA_BAJA ? [{ tono: 'a', titulo: `Adherencia baja: ${adherencia}%`, sub: 'revisá qué se le complica', ir: 'objetivos' } as FilaFx] : []),
  ];
  const fuentesConError = current?.errors ?? [];
  if (fuentesConError.length) alertas.push({ tono: 'a', titulo: `No pudimos actualizar ${fuentesConError.join(', ')}`, derecha: <button type="button" className="sbtn" onClick={refetch}>Reintentar</button> });
  if (!alertas.length) alertas.push({ tono: 'l', titulo: 'Sin alertas', sub: current ? 'nada pide tu atención ahora' : 'consultando…' });

  const tareas: FilaFx[] = [
    ...(notaPorAprobar ? [{ tono: 'n', titulo: 'Aprobar la nota de la última consulta', derecha: sbtn('Revisar', ir, 'consultas') } as FilaFx] : []),
    ...(pendientes ? [{ tono: 'n', titulo: `Revisar ${plural(pendientes, 'comida', 'comidas')}${masPendientes ? ' y más' : ''}`, derecha: sbtn('Revisar', ir, 'alimentario') } as FilaFx] : []),
    ...(plan && (plan.status === 'none' || plan.status === 'draft') ? [{ tono: 'n', titulo: plan.status === 'draft' ? 'Terminar y publicar el plan' : 'Armar el primer plan', derecha: sbtn('Abrir', ir, 'plan') } as FilaFx] : []),
    ...(porVencer ? [{ tono: 'n', titulo: 'Renovar el plan', derecha: sbtn('Renovar', ir, 'plan') } as FilaFx] : []),
    ...(alterados.length ? [{ tono: 'n', titulo: 'Revisar los valores alterados', derecha: sbtn('Ver', ir, 'laboratorio') } as FilaFx] : []),
  ];
  if (!tareas.length) tareas.push({ tono: 'l', titulo: 'Nada pendiente por hacer', sub: current ? 'la ficha está al día' : 'consultando…' });

  return <><div className="fx" data-mk="1" style={{ gridTemplateColumns: '1.3fr 1fr .95fr' }}>
    <div className="c">
      <div className="fxtiles fx3">{mosaicos.map(m => <FxMosaico key={m.clave} etiqueta={m.etiqueta} valor={m.valor} unidad={m.unidad} cambio={m.cambio} bueno={m.bueno} serie={m.serie} ir={() => ir('mediciones')} />)}</div>
      <FxPanel titulo="Evolución del peso" meta={`desde ${pacienteDesde(patient.created_at, now)}`} derecha={<FxIr a="mediciones" ir={ir} texto="Mediciones" />}>
        {careError ? <FxFilas ir={ir} filas={[{ tono: 'a', titulo: 'No pudimos consultar las mediciones', derecha: <button type="button" className="sbtn" onClick={reload}>Reintentar</button> }]} />
          : !care ? <FxFilas ir={ir} filas={[{ tono: 'n', titulo: 'Consultando mediciones…' }]} />
          : permisoMedidas === false ? <FxFilas ir={ir} filas={[{ tono: 'n', titulo: 'Permiso de medidas pendiente', sub: 'la paciente lo habilita desde su app' }]} />
          : serie.length ? <FxCurva valores={serie.map(p => p.valor)} rotulos={serie.map(p => diaMes(p.fecha))} ancho={460} alto={150} meta={metaKg} />
          : <FxFilas ir={ir} filas={[{ tono: 'n', titulo: 'Sin mediciones de peso', sub: 'cargá la primera desde Mediciones', ir: 'mediciones' }]} />}
      </FxPanel>
      <FxPanel titulo="Qué cambió desde la última consulta" meta={visita ? `${diaMes(visita.dateId)} · hace ${plural(visita.daysAgo, 'día', 'días')}` : 'sin consultas hechas'} grande>
        <div className="fxs"><FxFilas filas={cambios} ir={ir} /></div>
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo="Avance al objetivo" meta={patient.goal || 'Objetivo sin definir'}>
        <div className="fxsplit">
          <FxMedidor pct={pctAvance ?? 0} texto={pctAvance !== null ? String(pctAvance) : '—'} sub={pctAvance !== null ? '%' : undefined} />
          <FxKv filas={[['Inicio', peso ? `${numero(peso.first.value)} ${peso.unit}` : 'Sin medir'], ['Hoy', peso ? `${numero(peso.last.value)} ${peso.unit}` : 'Sin medir'], ['Faltan', avance ? `${numero(avance.faltan)} kg` : 'Sin dato'], ['Adherencia', adherencia !== null ? `${adherencia}%` : 'Sin dato']]} />
        </div>
      </FxPanel>
      <FxPanel titulo="Alertas" meta={alertas[0]?.tono === 'l' && alertas.length === 1 ? '0' : String(alertas.length)}><FxFilas filas={alertas} ir={ir} /></FxPanel>
      <FxPanel titulo="Para hacer hoy" meta={tareas[0]?.tono === 'l' && tareas.length === 1 ? '0' : String(tareas.length)} grande><div className="fxs"><FxFilas filas={tareas} ir={ir} /></div></FxPanel>
    </div>
    <div className="c">
      <FxDk clave="Próximo turno" titulo={proximaConsulta(patient, now)} sub={turno.sub} />
      <FxPanel titulo="Plan vigente" meta={plan?.period_start && plan.period_end ? `${diaMes(plan.period_start)} al ${diaMes(plan.period_end)}` : plan ? PLAN_ESTADO[plan.status] : 'consultando…'} derecha={<FxIr a="plan" ir={ir} texto="Abrir" />}>
        <div className="fxbig"><b className="num">{plan ? PLAN_ESTADO[plan.status].replace('Plan ', '').replace(/^./, c => c.toUpperCase()) : '…'}</b><span>{plan ? (patient.todayPlan.length ? `${plural(patient.todayPlan.length, 'momento configurado', 'momentos configurados')} hoy` : 'sin comidas cargadas para hoy') : 'consultando el plan'}</span></div>
      </FxPanel>
      <FxPanel titulo="Anamnesis" meta={ingresoAvance ? `${ingresoAvance.completos} de ${ingresoAvance.total}` : current ? 'Sin dato' : '…'} derecha={<FxIr a="historia" ir={ir} texto="Abrir" />}>
        <FxBar pct={ingresoAvance?.pct ?? 0} />
        <FxKv filas={[['Estado', ingreso ? intakeStatusLabel(ingreso.intake.status) : 'Sin dato'], ['Alergias', ingreso ? healthFactLabel(ingreso.intake.payload.allergies, 'alergias') : 'Sin dato'], ['Falta', ingreso ? faltantes[0] ?? 'Nada pendiente' : 'Sin dato']]} />
      </FxPanel>
      <FxPanel titulo="Acuerdos de la última consulta" grande>
        <FxFilas ir={ir} filas={[ultimaNota || compartida
          ? { tono: 'l', titulo: notaPorAprobar ? 'Nota en borrador' : 'Resumen de la última consulta', sub: (notaPorAprobar ? ultimaNota?.draft : compartida?.summary ?? ultimaNota?.draft) || undefined, ir: 'consultas' }
          : { tono: 'n', titulo: 'Sin acuerdos cargados', sub: !canCare && care ? 'permiso de atención pendiente' : 'se arman con la nota de cada consulta', ir: 'consultas' }]} />
      </FxPanel>
    </div>
  </div>{children}</>;
}
