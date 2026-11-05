// Estadísticas del consultorio. El boceto v29 no tiene esta pantalla: se arma con las mismas piezas y clases
// de Cobranzas del boceto (`COB()`: fx 1.6fr/1fr, fxtiles cob4, FxPanel, tabla fxtb, fxdk, fxr, FxStk y FxCols).
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { consultorioApi } from '../../api/consultorio';
import { friendlyError } from '../../lib/error-messages';
import { personInitials, pesos } from '../../lib/panel-billing';
import type { EstadisticasConsultorio, MesEstadistico } from '../../types/estadisticas';
import { FxBar, FxCols, FxDk, FxPanel, FxStk } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';

export type PeriodoEstadisticas = 6 | 12;
const ENVOLTURA = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } as const;
const NOMBRE_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const nombreDelMes = (mes: string) => NOMBRE_MES[Number(mes.slice(5, 7)) - 1] ?? mes;
export const porcentaje = (parte: number, total: number) => total > 0 ? Math.round(parte / total * 100) : 0;

/** Tasa de ausencias: turnos marcados «no vino» sobre los turnos que ya pasaron (realizados + ausencias). */
export const tasaAusencias = (m: Pick<MesEstadistico, 'consultas' | 'ausencias'>) => porcentaje(m.ausencias, m.consultas + m.ausencias);

/** Cambio contra el mes anterior, en palabras cortas. */
export function comparado(actual: number, anterior: number, unidad = ''): string {
  if (actual === anterior) return 'igual que el mes pasado';
  const diferencia = actual - anterior;
  return `${diferencia > 0 ? '+' : '−'}${Math.abs(diferencia)}${unidad} contra el mes pasado`;
}

/** Planilla CSV mes a mes, para «Exportar». */
export function estadisticasCsv(datos: EstadisticasConsultorio): string {
  const filas = [['Mes', 'Consultas', 'Ausencias', 'Ausencias %', 'Canceladas', 'Pacientes nuevas', 'Ingresos'],
    ...datos.meses.map(m => [`${nombreDelMes(m.mes)} ${m.mes.slice(0, 4)}`, m.consultas, m.ausencias, tasaAusencias(m), m.canceladas, m.nuevas, m.ingresos].map(String))];
  return filas.map(f => f.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function Avatar({ nombre }: { nombre: string }) {
  return <span className="av" style={{ background: 'var(--rojo-t)', color: 'var(--rojo-ink)', width: 28, height: 28, fontSize: 10.5 }}>{personInitials(nombre)}</span>;
}

export function EstadisticasEncabezado({ periodo, onPeriodo, onExport, deshabilitado }: { periodo: PeriodoEstadisticas; onPeriodo: (p: PeriodoEstadisticas) => void; onExport: () => void; deshabilitado: boolean }) {
  return <>
    <div className="tabs" role="group" aria-label="Período de las estadísticas">{([6, 12] as const).map(n => <button type="button" key={n} className={periodo === n ? 'on' : undefined} aria-pressed={periodo === n} onClick={() => onPeriodo(n)}>{n} meses</button>)}</div>
    <button className="chip" type="button" onClick={onExport} disabled={deshabilitado}><PanelV29Icon name="dl" />Exportar</button>
  </>;
}

export function PanelEstadisticasVista({ datos, error, cargando, onReintentar, onAbrir, onSedes }: {
  datos: EstadisticasConsultorio | null; error: string; cargando: boolean; onReintentar: () => void; onAbrir: (pacienteId: string) => void; onSedes: () => void;
}) {
  if (!datos) return <div id="s-estadisticas" className="sxw">{error ? <p className="sxsub" role="alert">{error} <button type="button" className="chip" onClick={onReintentar}>Reintentar</button></p> : cargando ? <p className="sxsub">Cargando estadísticas…</p> : null}</div>;
  const actual = datos.meses[datos.meses.length - 1];
  const anterior = datos.meses[datos.meses.length - 2] ?? { ...actual, consultas: 0, ausencias: 0, nuevas: 0, ingresos: 0 };
  const t = datos.total;
  const maxConsultas = Math.max(1, ...datos.meses.map(m => m.consultas + m.ausencias));
  const atendidas = t.primeraVez + t.seguimiento;
  const modalidad = t.presencial + t.online;
  const sedes = datos.porSede;
  const maxSede = Math.max(1, ...sedes.map(s => s.consultas));
  const periodo = `últimos ${datos.meses.length} meses`;
  return <div id="s-estadisticas" className="sxw"><div id="ewrap" style={ENVOLTURA}>
    {error ? <p className="sxsub" role="alert">{error} <button type="button" className="chip" onClick={onReintentar}>Reintentar</button></p> : null}
    <div className="fx" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
      <div className="c">
        <div className="fxtiles cob4">
          <div className="fxp fxtile"><small>Consultas en {nombreDelMes(actual.mes)}</small><div className="fxv"><b className="num">{actual.consultas}</b></div><span>{comparado(actual.consultas, anterior.consultas)}</span><span className="fxb"><i style={{ width: `${porcentaje(actual.consultas, maxConsultas)}%` }} /></span></div>
          <div className={`fxp fxtile${actual.ausencias ? ' cwa' : ''}`}><small>Ausencias</small><div className="fxv"><b className="num">{tasaAusencias(actual)}%</b>{actual.ausencias ? <em className="bad">{actual.ausencias}</em> : null}</div><span>{actual.ausencias ? `${actual.ausencias === 1 ? '1 paciente no vino' : `${actual.ausencias} turnos sin venir`} · ${actual.canceladas} cancelados` : `Nadie faltó · ${actual.canceladas} cancelados`}</span><span className="fxb r"><i style={{ width: `${tasaAusencias(actual)}%` }} /></span></div>
          <div className="fxp fxtile"><small>Pacientes nuevas</small><div className="fxv"><b className="num">{actual.nuevas}</b><span>en {nombreDelMes(actual.mes)}</span></div><span>{comparado(actual.nuevas, anterior.nuevas)} · {t.nuevas} en el período</span></div>
        </div>
        <FxPanel titulo="Consultas por mes" meta={`${t.consultas} consultas y ${t.ausencias} ausencias en los ${periodo}`}>
          <FxCols valores={datos.meses.map(m => m.consultas)} rotulos={datos.meses.map(m => m.rotulo)} max={maxConsultas} alto={130} promedio={datos.meses.length ? t.consultas / datos.meses.length : null} tope={String(actual.consultas)} />
        </FxPanel>
        <FxPanel titulo="Mes a mes" meta={periodo} grande>
          <div className="fxs fxtb tall"><table><thead><tr><th>Mes</th><th style={{ textAlign: 'right' }}>Consultas</th><th style={{ textAlign: 'right' }}>Ausencias</th><th style={{ textAlign: 'right' }}>Canceladas</th><th style={{ textAlign: 'right' }}>Nuevas</th><th style={{ textAlign: 'right' }}>Ingresos</th></tr></thead><tbody>
            {[...datos.meses].reverse().map(m => <tr key={m.mes}>
              <td><div className="fxwhen"><b style={{ fontWeight: 400, textTransform: 'capitalize' }}>{nombreDelMes(m.mes)}</b><small>{m.mes.slice(0, 4)}</small></div></td>
              <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{m.consultas}</td>
              <td className="num" style={{ textAlign: 'right' }}>{m.ausencias ? <span className="pill p-bad">{m.ausencias} · {tasaAusencias(m)}%</span> : '0'}</td>
              <td className="num" style={{ textAlign: 'right' }}>{m.canceladas}</td>
              <td className="num" style={{ textAlign: 'right' }}>{m.nuevas}</td>
              <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{pesos(m.ingresos)}</td>
            </tr>)}
          </tbody></table></div>
        </FxPanel>
      </div>
      <div className="c">
        <FxDk clave={`Ingresos de los ${periodo}`} titulo={pesos(t.ingresos)} sub={`${pesos(actual.ingresos)} en ${nombreDelMes(actual.mes)} · ${t.pacientesAtendidas} ${t.pacientesAtendidas === 1 ? 'paciente atendida' : 'pacientes atendidas'}`} extra={<div className="fxdkp"><i style={{ width: `${porcentaje(actual.ingresos, Math.max(actual.ingresos, anterior.ingresos))}%` }} /></div>} />
        <FxPanel titulo="Por sede" meta={sedes.length === 1 ? '1 sede' : `${sedes.length} sedes`} derecha={<button className="lnk" type="button" onClick={onSedes}>Sedes <PanelV29Icon name="chev" size={11} /></button>}>
          <div className="fxr">{sedes.map(s => <div className="l" key={s.id}>
            <span className="t"><b>{s.nombre}</b><small>{s.detalle || `${s.presencial} presenciales · ${s.online} online`}</small><FxBar pct={porcentaje(s.consultas, maxSede)} /></span>
            <b className="num cm">{s.consultas}</b>{s.ausencias ? <span className="pill p-bad">{s.ausencias} sin venir</span> : null}
          </div>)}</div>
          {!datos.sedesInstaladas ? <p className="sxsub">Los turnos que cargás vos se suman a su sede cuando se instale la tabla nueva; hoy cuentan en la primera sede.</p> : null}
        </FxPanel>
        <FxPanel titulo="Primera vez y seguimiento" meta={`${atendidas} consultas`}>
          {atendidas ? <FxStk partes={[[`Primera vez ${porcentaje(t.primeraVez, atendidas)}%`, porcentaje(t.primeraVez, atendidas), ''], [`Seguimiento ${porcentaje(t.seguimiento, atendidas)}%`, porcentaje(t.seguimiento, atendidas), 'b']]} /> : <p className="sxsub">Todavía no hay consultas en este período.</p>}
        </FxPanel>
        <FxPanel titulo="Presencial y online" meta={periodo}>
          {modalidad ? <FxStk partes={[[`Presencial ${porcentaje(t.presencial, modalidad)}%`, porcentaje(t.presencial, modalidad), 'k'], [`Online ${porcentaje(t.online, modalidad)}%`, porcentaje(t.online, modalidad), 'o']]} /> : <p className="sxsub">Todavía no hay consultas en este período.</p>}
        </FxPanel>
        <FxPanel titulo="Las que más faltaron" meta={String(datos.masAusencias.length)} grande>
          <div className="fxr">{datos.masAusencias.length ? datos.masAusencias.map(p => <div className="r" key={p.id}>
            <Avatar nombre={p.nombre} />
            <span className="t"><b>{p.nombre}</b><small>Última ausencia el {p.ultima.split('-').reverse().slice(0, 2).join('/')}</small></span>
            <b className="num cm">{p.ausencias}</b>
            <button type="button" className="sbtn cbtn" onClick={() => onAbrir(p.id)}>Ver ficha</button>
          </div>) : <p className="sxsub">Nadie faltó en este período. Las ausencias se marcan en la ficha, en Consultas: «No se realizó».</p>}</div>
        </FxPanel>
      </div>
    </div>
  </div></div>;
}

/** Pantalla con los datos reales: pide las estadísticas y arma el encabezado del panel. */
export function PanelEstadisticas({ onHeader, onAbrir, onSedes }: { onHeader?: (acciones: ReactNode) => void; onAbrir: (pacienteId: string) => void; onSedes: () => void }) {
  const [periodo, setPeriodo] = useState<PeriodoEstadisticas>(6);
  const [datos, setDatos] = useState<EstadisticasConsultorio | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    const control = new AbortController();
    setCargando(true); setError('');
    consultorioApi.estadisticas(periodo, control.signal)
      .then(r => { if (!control.signal.aborted) setDatos(r); })
      .catch(e => { if (!control.signal.aborted) setError(friendlyError(e)); })
      .finally(() => { if (!control.signal.aborted) setCargando(false); });
    return () => control.abort();
  }, [periodo, vuelta]);
  const exportar = useCallback(() => {
    if (!datos) return;
    const url = URL.createObjectURL(new Blob([`﻿${estadisticasCsv(datos)}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `estadisticas-${datos.hoy}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [datos]);
  useEffect(() => { onHeader?.(<EstadisticasEncabezado periodo={periodo} onPeriodo={setPeriodo} onExport={exportar} deshabilitado={!datos || cargando} />); }, [onHeader, periodo, exportar, datos, cargando]);
  useEffect(() => () => onHeader?.(null), [onHeader]);
  return <PanelEstadisticasVista datos={datos} error={error} cargando={cargando} onReintentar={() => setVuelta(v => v + 1)} onAbrir={onAbrir} onSedes={onSedes} />;
}
