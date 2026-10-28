import {useEffect,useState} from 'react';
import {api} from '../../api/client';
import type {BillingBoard,PatientLedger} from '../../types/fees';
import {formatPesos,formatFeeDate,PAYMENT_METHOD_LABELS,summarizeLedger} from '../../fees';
import {PatientPanel} from './ShowroomCobranzas';
import {PAYMENT_STATUS_LABELS} from './cobranzas-shared';
import {feeErrorMessage,replaceLedger} from './cobranzas-utils';
import {canLeaveWorkspace} from './unsaved-changes';
import {localBillingDate} from '../../billing';
import {FxCols,FxDk,FxKv,FxMedidor,FxPanel,FxStk} from './ficha-fx';
import {PanelV29Icon} from './PanelV29Icon';
import {diaYMes,montoCorto,pagosPorMes,rangoDeMeses,repartoPorMedio} from './ficha-cobros';
export function PanelPatientBilling({patientId,onOpen}:{patientId:string;onOpen:()=>void}){
 const [result,setResult]=useState<{id:string;board:BillingBoard}|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0),[manage,setManage]=useState(false);
 useEffect(()=>{let active=true;setResult(null);setError('');api.getBillingBoard().then(({board})=>{if(active)setResult({id:patientId,board});}).catch(caught=>{if(active)setError(feeErrorMessage(caught));});return()=>{active=false;};},[patientId,revision]);
 const board=result?.id===patientId?result.board:null,ledger=board?.patients.find(row=>row.patient_id===patientId),summary=ledger?summarizeLedger(ledger):null;
 if(error)return <p role="alert">{error} <button type="button" onClick={()=>setRevision(n=>n+1)}>Reintentar cobros</button></p>;
 if(!board)return <p role="status">Consultando los cobros…</p>;
 if(!ledger||!summary)return <p>No encontramos los cobros de esta ficha. <button type="button" onClick={onOpen}>Abrir Cobranzas</button></p>;
 const next=summary.charges.filter(charge=>charge.status==='open'&&charge.paid<charge.amount).sort((a,b)=>a.due_on.localeCompare(b.due_on))[0],total=ledger.payments.filter(row=>row.status==='confirmed').reduce((sum,row)=>sum+row.amount,0);
 const updated=(value:PatientLedger)=>setResult({id:patientId,board:replaceLedger(board,value)});
 const meses=pagosPorMes(ledger.payments,localBillingDate()),pico=Math.max(0,...meses.map(m=>m.total)),ultimo=meses[meses.length-1],primero=[...ledger.payments].filter(row=>row.status==='confirmed').sort((a,b)=>a.paid_on.localeCompare(b.paid_on))[0];
 const pagadas=summary.charges.filter(charge=>charge.status==='open'&&charge.paid>=charge.amount).length,vencidas=summary.charges.filter(charge=>charge.status==='open'&&charge.paid<charge.amount&&charge.due).length,totalCuotas=summary.charges.filter(charge=>charge.status==='open').length;
 const medios=repartoPorMedio(ledger.payments),claseMedio:Record<string,string>={transferencia:'',mercado_pago:'b',efectivo:'o'},programa=ledger.fee?.program_name||(ledger.fee?'Cuota mensual':'Sin programa');
 const estado=summary.owed?`Debe ${formatPesos(summary.owed)}`:summary.pending_reports?'Por confirmar':ledger.fee?'Al día':'Sin cuota';
 const movimientos=[...ledger.payments].sort((a,b)=>b.paid_on.localeCompare(a.paid_on)||b.created_at.localeCompare(a.created_at));
 return <section className="pn-record-billing"><div className="fx" style={{gridTemplateColumns:'1.6fr 1fr'}}>
  <div className="c"><div className="fxtiles fx3">
   <div className="fxp fxtile"><small>Programa</small><div className="fxv"><b className="num">{programa}</b></div><span>{ledger.fee?formatPesos(ledger.fee.amount):'Sin cuota definida'}</span></div>
   <div className="fxp fxtile"><small>Estado</small><div className="fxv"><b className={`num${summary.owed||summary.pending_reports||!ledger.fee?'':' ok'}`}>{estado}</b></div><span>{summary.owed&&summary.debt_since?`desde el ${diaYMes(summary.debt_since)}`:next?`pagó hasta el ${diaYMes(next.due_on)}`:'sin cobros pendientes'}</span></div>
   <div className="fxp fxtile"><small>Pagó en total</small><div className="fxv"><b className="num">{formatPesos(total)}</b></div><span>{primero?`desde ${meses.find(m=>primero.paid_on.startsWith(m.clave))?.rotulo??formatFeeDate(primero.paid_on)}`:'sin pagos todavía'}</span></div>
  </div>
  <FxPanel titulo="Pagos por mes" meta={rangoDeMeses(meses)}><FxCols valores={meses.map(m=>m.total)} rotulos={meses.map(m=>m.rotulo)} max={pico?pico*1.1111:1} alto={120} tope={ultimo.total?montoCorto(ultimo.total):undefined}/></FxPanel>
  <FxPanel titulo="Movimientos" grande derecha={<button type="button" className="sbtn k cbtn" onClick={()=>setManage(true)}><PanelV29Icon name="plus" size={13}/>Registrar cobro</button>}>
   <div className="fxs"><ol className="fxtl">{movimientos.map(payment=><li key={payment.id}><i/><span><b>{payment.note||'Pago registrado'}</b><small>{PAYMENT_METHOD_LABELS[payment.method]}{payment.status!=='confirmed'?` · ${PAYMENT_STATUS_LABELS[payment.status]}`:''}</small></span><time><b className="num">{formatPesos(payment.amount)}</b> · {diaYMes(payment.paid_on)}</time>{payment.status==='reported'&&<button type="button" className="sbtn cbtn" onClick={()=>setManage(true)}>Revisar aviso</button>}</li>)}</ol>{!movimientos.length&&<p>Todavía no hay pagos registrados.</p>}</div>
  </FxPanel></div>
  <div className="c">
   <FxDk clave="Próximo vencimiento" titulo={next?`${diaYMes(next.due_on)} · ${formatPesos(next.amount-next.paid)}`:'Sin cobros pendientes'} sub="Los cobros no bloquean el acceso de la paciente a la app"/>
   <FxPanel titulo="Cuotas al día"><div className="fxsplit"><FxMedidor pct={totalCuotas?Math.round(pagadas/totalCuotas*100):0} texto={String(pagadas)} sub={`de ${totalCuotas}`} ancho={140}/><FxKv filas={[['Pagadas',String(pagadas)],['Vencidas',String(vencidas)],['Medio más usado',medios[0]?PAYMENT_METHOD_LABELS[medios[0].medio as keyof typeof PAYMENT_METHOD_LABELS]:'Sin pagos']]}/></div></FxPanel>
   <FxPanel titulo="Medios de pago">{medios.length?<FxStk partes={medios.map(m=>[PAYMENT_METHOD_LABELS[m.medio as keyof typeof PAYMENT_METHOD_LABELS],m.porcentaje,claseMedio[m.medio]??''] as const)}/>:<p>Sin pagos confirmados todavía.</p>}</FxPanel>
   <FxPanel titulo="Acceso a la app" grande meta={<span className="pill p-conf">Sin bloqueo</span>}><FxKv filas={[['Incluido en',programa],['Si se vence','Los cobros no bloquean el acceso']]}/><div><button type="button" className="sbtn cbtn" onClick={()=>setManage(true)}>Cambiar programa</button></div></FxPanel>
  </div></div><details className="pn-record-card" open={manage} onToggle={event=>setManage(event.currentTarget.open)}><summary onClick={event=>{if(manage&&!canLeaveWorkspace())event.preventDefault();}}>Gestionar programa, cuotas y pagos</summary>{manage&&<PatientPanel patient={ledger} settings={board.settings} programs={board.programs??[]} onPrograms={programs=>setResult({id:patientId,board:{...board,programs}})} onLedger={updated} onBack={onOpen}/>}</details></section>;
}
