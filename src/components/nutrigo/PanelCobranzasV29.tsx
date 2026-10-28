// Cobranzas del panel con el HTML y las clases del boceto v29 (`COB()` en design/panel-nutri/v29/panel-trabajo.html); solo se enchufan los datos reales del tablero.
import { useState, type ReactNode } from 'react';
import { formatFeeDate } from '../../fees';
import { billingMovements, billingSnapshot, filterMovements, incomeMonths, personInitials, pesos, type BillingMovement, type MovementKind } from '../../lib/panel-billing';
import { incomeIn } from '../../lib/inicio-indicators';
import type { BillingBoard } from '../../types/fees';
import { FxCurva, FxDk, FxPanel, FxStk } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';

export type PeriodoCobranzas = 'mes' | 'trimestre' | 'anio';
export type FiltroMovimientos = 'todos' | MovementKind;

const PERIODOS: ReadonlyArray<readonly [PeriodoCobranzas, string]> = [['mes', 'Mes'], ['trimestre', 'Trimestre'], ['anio', 'Año']];
const FILTROS: ReadonlyArray<readonly [FiltroMovimientos, string]> = [['todos', 'Todos'], ['cobrado', 'Cobrados'], ['pendiente', 'Pendientes'], ['vencido', 'Vencidos']];
const PILL: Record<MovementKind, string> = { cobrado: 'p-conf', pendiente: 'p-wait', vencido: 'p-bad' };
const MEDIOS = ['Transferencia', 'Mercado Pago', 'Efectivo'] as const;
const DIAS_SEMANA = 7;
const ENVOLTURA = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } as const;

/** Primer día del período que termina hoy: el mes en curso, los últimos tres meses o el año en curso. */
export function desdeDelPeriodo(hoy: string, periodo: PeriodoCobranzas): string {
  const [anio, mes] = hoy.split('-').map(Number);
  if (periodo === 'anio') return `${anio}-01-01`;
  const atras = periodo === 'trimestre' ? 2 : 0;
  const total = anio * 12 + (mes - 1) - atras;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-01`;
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const nombreMes = (hoy: string) => new Date(`${hoy}T15:00:00Z`).toLocaleDateString('es-AR', { month: 'long', timeZone: 'UTC' });
const corto = (fecha: string) => formatFeeDate(fecha).slice(0, 5);

function Avatar({ nombre, tono }: { nombre: string; tono: 'lima' | 'rojo' | 'azul' | 'azaf' }) {
  return <span className="av" style={{ background: `var(--${tono}-t)`, color: `var(--${tono}-ink)`, width: 28, height: 28, fontSize: 10.5 }}>{personInitials(nombre)}</span>;
}

const tonoDe = (kind: MovementKind): 'lima' | 'rojo' | 'azaf' => (kind === 'vencido' ? 'rojo' : kind === 'pendiente' ? 'azaf' : 'lima');

export function CobranzasEncabezado({ periodo, onPeriodo, onExport, onRegistrar, deshabilitado, extra }: {
  periodo: PeriodoCobranzas; onPeriodo: (periodo: PeriodoCobranzas) => void; onExport: () => void; onRegistrar: () => void; deshabilitado: boolean; extra?: ReactNode;
}) {
  return <>
    <div className="tabs" role="group" aria-label="Período de Cobranzas">{PERIODOS.map(([id, texto]) => <button type="button" key={id} className={periodo === id ? 'on' : undefined} aria-pressed={periodo === id} onClick={() => onPeriodo(id)}>{texto}</button>)}</div>
    {extra}
    <button className="chip" type="button" id="cexp" onClick={onExport} disabled={deshabilitado}><PanelV29Icon name="dl" />Exportar</button>
    <button className="cta" type="button" onClick={onRegistrar} disabled={deshabilitado}><PanelV29Icon name="plus" />Registrar cobro</button>
  </>;
}

export function PanelCobranzasV29({ board, today, periodo, filtro, error, cargando, debito, programasExtra = [], onFiltro, onAbrir, onRecordar, onReintentar, onCobrar, cobroBloqueado = [] }: {
  board: BillingBoard | null; today: string; periodo: PeriodoCobranzas; filtro: FiltroMovimientos; error: string; cargando: boolean;
  debito?: ReactNode; programasExtra?: string[];
  onFiltro: (filtro: FiltroMovimientos) => void; onAbrir: (pacienteId: string) => void; onRecordar: (pacienteId: string) => void; onReintentar: () => void;
  onCobrar?: (pacienteId: string, vence?: string) => void; cobroBloqueado?: readonly string[];
}) {
  const [meses, setMeses] = useState<6 | 12>(6);
  if (!board) return <div id="s-cobranzas" className="sxw">{error ? <p className="sxsub" role="alert">{error} <button type="button" className="chip" onClick={onReintentar}>Reintentar</button></p> : cargando ? <p className="sxsub">Cargando cobranzas…</p> : null}</div>;
  const foto = billingSnapshot(board, today);
  const desde = desdeDelPeriodo(today, periodo);
  const todos = billingMovements(board, today);
  const delPeriodo = todos.filter(fila => fila.date >= desde || fila.kind === 'vencido');
  const filas = filterMovements(delPeriodo, filtro);
  const cobrado = incomeIn(board, { from: desde, to: today }).amount;
  const esperado = cobrado + foto.toCollect;
  const ratio = esperado > 0 ? Math.round((cobrado / esperado) * 100) : 0;
  const barras = incomeMonths(board, today, meses);
  const hasta = sumarDias(today, DIAS_SEMANA);
  const semana = todos.filter(fila => fila.kind === 'pendiente' && fila.id.startsWith('charge:') && fila.date >= today && fila.date <= hasta).sort((a, b) => a.date.localeCompare(b.date));
  const porMedio = MEDIOS.map(medio => [medio, delPeriodo.filter(fila => fila.kind === 'cobrado' && fila.method === medio).reduce((suma, fila) => suma + fila.amount, 0)] as const);
  const totalMedios = porMedio.reduce((suma, [, monto]) => suma + monto, 0);
  const partesMedios = totalMedios > 0 ? porMedio.filter(([, monto]) => monto > 0).map(([medio, monto], i) => [`${medio} ${Math.round(monto / totalMedios * 100)}%`, Math.round(monto / totalMedios * 100), ['', 'b', 'o'][i] ?? ''] as const) : [];
  const programas = foto.programs.length ? foto.programs : [];
  const activos = foto.activePrograms + programasExtra.length;
  const partesProgramas = programas.slice(0, 3).map(({ name, count }, i) => [name, Math.round(count / Math.max(1, foto.activePrograms) * 100), ['', 'k', 'o'][i] ?? ''] as const);
  const nombres = foto.overduePatients.slice(0, 3).map(paciente => paciente.full_name.split(' ')[0]);
  const aPagar = foto.toCollectCount === 1 ? '1 cuota' : `${foto.toCollectCount} cuotas`;
  const accion = (fila: BillingMovement) => <>
    {onCobrar && fila.id.startsWith('charge:') && !cobroBloqueado.includes(fila.patientId) ? <button type="button" className="sbtn" onClick={() => onCobrar(fila.patientId, fila.date)}>Cobrar este mes</button> : null}
    <button type="button" className="sbtn" aria-label={`Ver cobranzas de ${fila.patientName}`} onClick={() => onAbrir(fila.patientId)}>Ver</button>
  </>;
  return <div id="s-cobranzas" className="sxw"><div id="cwrap" style={ENVOLTURA}>
    {error ? <p className="sxsub" role="alert">{error} <button type="button" className="chip" onClick={onReintentar}>Reintentar</button></p> : null}
    <div className="fx" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
      <div className="c">
        <div className="fxtiles cob4">
          <div className="fxp fxtile"><small>Por cobrar este mes</small><div className="fxv"><b className="num">{pesos(foto.toCollect)}</b></div><span>{foto.toCollectCount ? `${aPagar} hasta fin de mes` : 'Sin cuotas por cobrar'}</span><span className="fxb a"><i style={{ width: `${esperado > 0 ? Math.round(foto.toCollect / esperado * 100) : 0}%` }} /></span></div>
          <div className="fxp fxtile cwa"><small>Vencido</small><div className="fxv"><b className="num">{pesos(foto.overdue)}</b>{foto.overduePatients.length ? <em className="bad">{foto.overduePatients.length}</em> : null}</div><span>{nombres.length ? nombres.join(', ') : 'Nadie debe'}</span><span className="fxb r"><i style={{ width: `${foto.overdue > 0 ? Math.min(100, Math.round(foto.overdue / Math.max(1, foto.overdue + foto.toCollect) * 100)) : 0}%` }} /></span></div>
          <div className="fxp fxtile"><small>Programas activos</small><div className="fxv"><b className="num">{activos}</b><span>de {board.patients.length} {board.patients.length === 1 ? 'paciente' : 'pacientes'}</span></div>{partesProgramas.length ? <FxStk partes={partesProgramas} /> : <span>{programasExtra.slice(0, 2).join(' · ') || 'Sin programas'}</span>}</div>
        </div>
        <FxPanel titulo="Ingresos por mes" meta="lo cobrado mes a mes, en miles de pesos" derecha={<div className="tabs" role="group" aria-label="Período de ingresos">{([6, 12] as const).map(n => <button type="button" key={n} className={meses === n ? 'on' : undefined} aria-pressed={meses === n} onClick={() => setMeses(n)}>{n} meses</button>)}</div>}>
          <FxCurva valores={barras.map(barra => Math.round(barra.amount / 1000))} rotulos={barras.map(barra => barra.label)} ancho={620} alto={150} />
        </FxPanel>
        <FxPanel titulo="Movimientos" meta={nombreMes(today)} grande derecha={<div className="tabs" role="group" aria-label="Filtrar movimientos">{FILTROS.map(([id, texto]) => <button type="button" key={id} className={filtro === id ? 'on' : undefined} aria-pressed={filtro === id} onClick={() => onFiltro(id)}>{texto}{id === 'vencido' && foto.overduePatients.length ? ` · ${foto.overduePatients.length}` : ''}</button>)}</div>}>
          {filas.length ? <div className="fxs fxtb tall"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Concepto</th><th style={{ textAlign: 'right' }}>Monto</th><th>Estado</th><th><span className="sr">Acción</span></th></tr></thead><tbody>
            {filas.map(fila => <tr key={fila.id}>
              <td className="num" style={{ color: 'var(--ink2)' }}>{corto(fila.date)}</td>
              <td><div className="who"><Avatar nombre={fila.patientName} tono={tonoDe(fila.kind)} /><b>{fila.patientName}</b></div></td>
              <td><div className="fxwhen"><b style={{ fontWeight: 400 }}>{fila.concept}</b><small>{fila.kind === 'cobrado' ? fila.method : 'sin pagar'}</small></div></td>
              <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{pesos(fila.amount)}</td>
              <td><span className={`pill ${PILL[fila.kind]}`}>{fila.status}</span></td>
              <td>{accion(fila)}</td>
            </tr>)}
          </tbody></table></div> : <p className="sxsub">Todavía no hay movimientos en este período.</p>}
        </FxPanel>
      </div>
      <div className="c">
        <FxDk clave={`Cobrado en ${periodo === 'mes' ? nombreMes(today) : periodo === 'trimestre' ? 'el trimestre' : 'el año'}`} titulo={pesos(cobrado)} sub={esperado > 0 ? `${ratio}% de lo esperado${foto.toCollect > 0 ? ` · faltan ${pesos(foto.toCollect)}` : ''}` : 'Sin cuotas en este período'} extra={<div className="fxdkp"><i style={{ width: `${ratio}%` }} /></div>} />
        {debito}
        <FxPanel titulo="Cuotas vencidas" meta={String(foto.overduePatients.length)}>
          <div className="fxr">
            {foto.overduePatients.length ? foto.overduePatients.map(paciente => {
              const debe = billingSnapshot({ ...board, patients: [paciente] }, today);
              const vencida = todos.filter(fila => fila.patientId === paciente.patient_id && fila.kind === 'vencido').sort((a, b) => a.date.localeCompare(b.date))[0];
              return <div className="r" key={paciente.patient_id}>
                <Avatar nombre={paciente.full_name} tono="rojo" />
                <span className="t"><b>{paciente.full_name}</b><small>{paciente.fee?.program_name || 'Cuota'}{vencida ? ` · venció el ${corto(vencida.date)}` : ''}</small></span>
                <b className="num cm">{pesos(debe.overdue)}</b>
                {onCobrar && !cobroBloqueado.includes(paciente.patient_id) ? <button type="button" className="sbtn cbtn" onClick={() => onCobrar(paciente.patient_id, vencida?.date)}>Cobrar</button> : null}
                <button type="button" className="sbtn cbtn" onClick={() => onRecordar(paciente.patient_id)}><PanelV29Icon name="chat" size={13} />Recordar</button>
              </div>;
            }) : <p className="sxsub">No hay cuotas vencidas.</p>}
          </div>
          {foto.overduePatients.length ? <p className="sxsub">La paciente sigue usando la app y ve un aviso para ponerse al día.</p> : null}
        </FxPanel>
        <FxPanel titulo="Vencen esta semana" meta={String(semana.length)} grande>
          <div className="fxs">{semana.length ? <ol className="fxtl">{semana.map(fila => <li key={fila.id}><i /><span><b>{fila.patientName}</b><small>{fila.concept}</small></span><time><b className="num">{pesos(fila.amount)}</b> · {corto(fila.date)}</time></li>)}</ol> : <p className="sxsub">No vence ninguna cuota en los próximos 7 días.</p>}</div>
        </FxPanel>
        <FxPanel titulo="Cómo te pagan" meta={periodo === 'mes' ? nombreMes(today) : periodo === 'trimestre' ? 'últimos 3 meses' : 'este año'}>
          {partesMedios.length ? <FxStk partes={partesMedios} /> : <p className="sxsub">Todavía no hay cobros en este período.</p>}
        </FxPanel>
      </div>
    </div>
  </div></div>;
}
