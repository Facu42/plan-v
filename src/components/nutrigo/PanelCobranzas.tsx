import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { formatFeeDate } from '../../fees';
import { billingMovements, billingSnapshot, filterMovements, incomeMonths, movementsCsv, personInitials, pesos, shortPesos, type MovementKind } from '../../lib/panel-billing';
import { localBillingDate } from '../../billing';
import type { BillingBoard } from '../../types/fees';
import { Icon } from '../shared/Icon';
import { feeErrorMessage, replaceLedger } from './cobranzas-utils';
import { PatientPanel } from './ShowroomCobranzas';
import './panel-fase5.css';

type Filter = 'todos' | MovementKind;

export function PanelCobranzasView({ board, today, filter, reminders, onFilter, onExport, onOpen, onRemind, onRetry, error, loading }: {
  board: BillingBoard | null; today: string; filter: Filter; reminders: boolean; onFilter: (filter: Filter) => void;
  onExport: () => void; onOpen: (patientId: string) => void; onRemind: (patientId: string) => void; onRetry: () => void; error: string; loading: boolean;
}) {
  const [span, setSpan] = useState<6 | 12>(6);
  const snap = board ? billingSnapshot(board, today) : null;
  const rows = board ? filterMovements(billingMovements(board, today), filter) : [];
  const bars = board ? incomeMonths(board, today, span) : [];
  const max = Math.max(...bars.map(bar => bar.amount), 1);
  const month = new Date(`${today}T15:00:00Z`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return <section className="p5" aria-label="Cobranzas">
    <header className="p5-head"><div><h2>Cobranzas</h2><p>{month.charAt(0).toLocaleUpperCase('es-AR') + month.slice(1)} · la plata va directo a tu cuenta</p></div>
      <button type="button" className="p5-btn" onClick={onExport} disabled={!board}><Icon name="download" size={15} />Exportar</button>
      <button type="button" className="p5-btn p5-pri" onClick={() => onOpen('')} disabled={!board}><Icon name="plus" size={15} />Registrar cobro</button>
    </header>
    {error && <p className="p5-alert" role="alert">{error} <button type="button" onClick={onRetry}>Reintentar</button></p>}
    {loading && <p className="p5-empty">Cargando cobranzas…</p>}
    {snap && <>
      <div className="p5-kpis">
        <article className="p5-kpi p5-kpi-dark"><small>Cobrado en {month.split(' ')[0]}</small><b>{pesos(snap.collected)}</b><span>{snap.expectedRatio == null ? 'Sin cuotas de este mes' : `${snap.expectedRatio}% de lo esperado`}</span>{snap.expectedRatio != null && <i style={{ width: `${snap.expectedRatio}%` }} />}</article>
        <article className="p5-kpi"><small>Por cobrar este mes</small><b>{pesos(snap.toCollect)}</b><span>{snap.toCollectCount === 1 ? '1 cuota hasta fin de mes' : `${snap.toCollectCount} cuotas hasta fin de mes`}</span></article>
        <article className="p5-kpi p5-kpi-hot"><small>Vencido</small><b>{pesos(snap.overdue)}</b><span>{snap.overduePatients.length ? snap.overduePatients.slice(0, 2).map(patient => patient.full_name.split(' ')[0]).join(' y ') : 'Nadie debe'}</span></article>
        <article className="p5-kpi"><small>Programas activos</small><b>{snap.activePrograms}</b><span>{snap.programs.slice(0, 2).map(program => `${program.count} ${program.name.toLocaleLowerCase('es-AR')}`).join(' · ') || 'Sin programas'}</span></article>
      </div>
      <div className="p5-pair">
        <section className="p5-card"><header><h3>Ingresos por mes</h3><div className="p5-seg" role="group" aria-label="Período de ingresos">{([6, 12] as const).map(item => <button type="button" key={item} aria-pressed={span === item} onClick={() => setSpan(item)}>{item} meses</button>)}</div></header>
          <div className="p5-bars" aria-label={`Ingresos de los últimos ${span} meses`}>{bars.map(bar => <div key={bar.key}><em>{shortPesos(bar.amount)}</em><i className={bar.current ? 'is-now' : ''} style={{ height: `${Math.max(4, Math.round(bar.amount / max * 100))}%` }} /><small>{bar.label}</small></div>)}</div>
        </section>
        <section className="p5-card"><header><h3>Cuotas vencidas</h3></header>
          {!snap.overduePatients.length && <p className="p5-empty">No hay cuotas vencidas.</p>}
          {snap.overduePatients.map(patient => {
            const owed = billingSnapshot({ ...board!, patients: [patient] }, today).overdue;
            return <div className="p5-li" key={patient.patient_id}><span className="p5-av">{personInitials(patient.full_name)}</span><div className="p5-tx"><b>{patient.full_name}</b><span>{patient.fee?.program_name || 'Cuota'} · venció el {patient.charges.filter(charge => charge.status === 'open' && charge.due_on <= today).sort((a, b) => a.due_on.localeCompare(b.due_on))[0] ? formatFeeDate(patient.charges.filter(charge => charge.status === 'open' && charge.due_on <= today).sort((a, b) => a.due_on.localeCompare(b.due_on))[0].due_on) : '—'}</span></div><span className="p5-num">{pesos(owed)}</span><button type="button" className="p5-btn p5-ink" onClick={() => onRemind(patient.patient_id)}><Icon name="message" size={14} />Recordar</button></div>;
          })}
          {snap.overduePatients.length > 0 && <p className="p5-note">La paciente sigue usando la app y ve un aviso para ponerse al día.</p>}
          {reminders && <p className="p5-status" role="status">Elegí Recordar para escribirle por el chat de la app.</p>}
        </section>
      </div>
      <section className="p5-card"><header><h3>Movimientos</h3><div className="p5-seg" role="group" aria-label="Filtrar movimientos">{([['todos', 'Todos'], ['cobrado', 'Cobrados'], ['pendiente', 'Pendientes'], ['vencido', 'Vencidos']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => onFilter(id)}>{label}</button>)}</div></header>
        {!rows.length ? <p className="p5-empty">Todavía no hay movimientos.</p> : <div className="p5-table-wrap"><table className="p5-table"><thead><tr><th>Fecha</th><th>Paciente</th><th>Concepto</th><th>Medio</th><th>Monto</th><th>Estado</th><th><span className="p5-sr">Acción</span></th></tr></thead><tbody>
          {rows.map(row => <tr key={row.id}><td>{formatFeeDate(row.date)}</td><td><span className="p5-who"><span className="p5-av">{personInitials(row.patientName)}</span><b>{row.patientName}</b></span></td><td>{row.concept}</td><td>{row.method}</td><td className="p5-num">{pesos(row.amount)}</td><td><span className={`p5-state p5-${row.kind}`}>{row.status}</span></td><td><button type="button" className="p5-btn" onClick={() => onOpen(row.patientId)}>Ver</button></td></tr>)}
        </tbody></table></div>}
      </section>
    </>}
  </section>;
}

export function PanelCobranzas({ filter = 'todas', reminders = false, selectedId, onRemind }: { filter?: 'deben' | 'todas'; reminders?: boolean; selectedId?: string; onRemind?: (patientId: string) => void }) {
  const [board, setBoard] = useState<BillingBoard | null>(null);
  const [error, setError] = useState('');
  const [movement, setMovement] = useState<Filter>(filter === 'deben' ? 'vencido' : 'todos');
  const [openId, setOpenId] = useState<string | null>(selectedId || null);
  const [picking, setPicking] = useState(false);
  const today = localBillingDate();
  const load = useCallback(() => {
    setError(''); setBoard(null);
    api.getBillingBoard().then(result => setBoard(result.board)).catch(reason => setError(feeErrorMessage(reason, 'No pudimos cargar las cobranzas.')));
  }, []);
  useEffect(load, [load]);
  const selected = useMemo(() => board?.patients.find(patient => patient.patient_id === openId) ?? null, [board, openId]);
  useEffect(() => {
    if (!selected && !picking) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpenId(null); setPicking(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, picking]);
  const download = () => {
    if (!board) return;
    const csv = movementsCsv(billingMovements(board, today));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `cobranzas-${today}.csv`; link.click();
    URL.revokeObjectURL(url);
  };
  return <>
    <PanelCobranzasView board={board} today={today} filter={movement} reminders={reminders} onFilter={setMovement} onExport={download} onOpen={id => { if (!id) { setPicking(true); return; } setOpenId(id); }} onRemind={id => { setOpenId(null); onRemind?.(id); }} onRetry={load} error={error} loading={!board && !error} />
    {(selected || picking) && board && <div className="p5-dialog p5-dialog-wide" role="dialog" aria-modal="true" aria-label={selected ? `Cobranzas de ${selected.full_name}` : 'Registrar cobro'}>
      {selected ? <PatientPanel patient={selected} settings={board.settings} programs={board.programs ?? []} onPrograms={programs => setBoard({ ...board, programs })} today={today} onBack={() => setOpenId(null)} onLedger={ledger => setBoard(replaceLedger(board, ledger))} />
        : <form className="p5-card" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const id = String(data.get('paciente') ?? ''); if (id) { setOpenId(id); setPicking(false); } }}><h3>Registrar cobro</h3><label>Paciente<select name="paciente" required defaultValue="">{board.patients.map(patient => <option key={patient.patient_id} value={patient.patient_id}>{patient.full_name}</option>)}{!board.patients.length && <option value="">Todavía no hay pacientes</option>}</select></label><div className="p5-row"><button type="button" className="p5-btn" onClick={() => setPicking(false)}>Volver</button><button className="p5-btn p5-pri" disabled={!board.patients.length}>Continuar</button></div></form>}
    </div>}
  </>;
}
