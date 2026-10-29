import { useEffect,useState,type FormEvent } from 'react';
import { clinicalWorkspaceApi } from '../../api/clinical-workspace';
import { careErrorMessage,notifyCareChanged } from '../../api/care';
import { clinicalWorkspaceInputSchema,type ClinicalWorkspaceSnapshot } from '../../types/clinical-workspace';
import { parseImportNumber } from '../../lib/patient-import';
import {useRecordDocument,RecordDocumentViewer} from './RecordDocumentViewer';
import { LaboratoryEditor } from './ClinicalPatientWorkspace';
import { CarePanel } from './CarePanel';
import { useCare } from './useCare';
import { useUnsavedChanges,canLeaveWorkspace } from './unsaved-changes';
import { recordLabSeries,recordLaboratoryText } from './panel-record-data';
import { PanelV29Icon } from './PanelV29Icon';
import { FxCurva, FxFilas, FxPanel } from './ficha-fx';
import { COLUMNAS_LAB, analisisDeFecha, analisisPorFecha, estadoDe, fechaCorta, fechasDeLaboratorio, graficoDeValor, historialDeValor, metaDeAnalisis, pedidosDeEstudios, valoresPorFecha, type GraficoLab } from './ficha-laboratorio';
import { LabLectura } from './LabLectura';
import { armarLectura, pedidoParaIA } from './lab-lectura';
import { valoresAlterados, type SolapaFicha } from './ficha-presentacion';

function ManualLaboratoryValue({patientId,snapshot,today,onSaved,onUpload}:{patientId:string;snapshot:ClinicalWorkspaceSnapshot;today:string;onSaved:()=>void;onUpload:()=>void}){
  const [document,setDocument]=useState(''),[name,setName]=useState(''),[raw,setRaw]=useState(''),[unit,setUnit]=useState(''),[reference,setReference]=useState(''),[source,setSource]=useState(''),[page,setPage]=useState(1),[date,setDate]=useState(today),[operator,setOperator]=useState<''|'<'|'>'|'<='|'>='>(''),[reviewed,setReviewed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [id]=useState(()=>crypto.randomUUID()),[valueId]=useState(()=>crypto.randomUUID());
  useUnsavedChanges(Boolean(document||name||raw||source||unit||reference||operator||reviewed||page!==1||date!==today),busy);
  async function save(event:FormEvent){event.preventDefault();if(busy)return;setError('');const parsed=clinicalWorkspaceInputSchema.safeParse({id,recorded_on:date,reviewed,note:'',data:{kind:'laboratory',document_id:document,values:[{id:valueId,name,value:parseImportNumber(raw),operator,unit,range_text:reference,raw_value:raw,source_line:source,page,reviewed}]}});
    if(!parsed.success){setError('Revisá el informe de origen, los datos y la confirmación profesional.');return;}
    setBusy(true);try{await clinicalWorkspaceApi.save(patientId,parsed.data);notifyCareChanged();onSaved();}catch(caught){setError(careErrorMessage(caught));}finally{setBusy(false);}}
  if(!snapshot.documents.length)return <section className="pn-record-card"><h3>Agregar valor a mano</h3><p>Primero cargá el informe para conservar el origen del valor y su rango.</p><button type="button" onClick={onUpload}>Cargar informe</button></section>;
  return <form className="pn-record-card pn-record-lab-manual" onSubmit={event=>void save(event)}><header><h3>Agregar valor a mano</h3></header><fieldset disabled={busy}><div className="pn-record-form-grid"><label>Informe de origen<select required value={document} onChange={event=>setDocument(event.target.value)}><option value="">Elegí un informe privado</option>{snapshot.documents.map(doc=><option key={doc.id} value={doc.id}>{doc.filename}</option>)}</select></label><label>Fecha del estudio<input type="date" required max={today} value={date} onChange={event=>setDate(event.target.value)}/></label><label>Valor o analito<input required maxLength={120} value={name} onChange={event=>setName(event.target.value)}/></label><label>Resultado original<input required maxLength={100} value={raw} onChange={event=>setRaw(event.target.value)}/></label><label>Comparador<select value={operator} onChange={event=>setOperator(event.target.value as typeof operator)}>{['','<','>','<=','>='].map(value=><option key={value} value={value}>{value||'Valor exacto'}</option>)}</select></label><label>Unidad del informe<input maxLength={40} value={unit} onChange={event=>setUnit(event.target.value)}/></label><label>Rango del informe<input maxLength={200} value={reference} onChange={event=>setReference(event.target.value)}/></label><label>Página<input type="number" required min={1} max={40} value={page} onChange={event=>setPage(Number(event.target.value))}/></label></div><label>Texto original o ubicación del valor<textarea required maxLength={500} value={source} onChange={event=>setSource(event.target.value)}/></label><label className="pn-record-form-check"><input type="checkbox" checked={reviewed} onChange={event=>setReviewed(event.target.checked)}/>Revisé el valor y la referencia contra el informe original</label><button type="submit" disabled={!reviewed||busy}>{busy?'Guardando…':'Guardar valor revisado'}</button></fieldset>{error&&<p role="alert">{error}</p>}</form>;
}

const DETALLE_VACIO='Elegí un valor con resultados numéricos exactos para ver su evolución.';

function GraficoValor({grafico}:{grafico:GraficoLab}){
  const {ancho,alto,banda}=grafico;
  return <svg className="lbchart" viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true">
    {banda&&<><rect className="lbband" x={banda.x} width={banda.ancho} y={banda.y.toFixed(1)} height={banda.alto.toFixed(1)}/><text className="lbbt" x={ancho-44+6} y={banda.textoY.toFixed(1)}>{banda.texto}</text></>}
    <path className="lbln" d={grafico.linea}/>
    {grafico.puntos.map(punto=><g key={punto.x}><circle className={`lbpt${punto.fuera?' out':''}`} cx={punto.x.toFixed(1)} cy={punto.y.toFixed(1)} r={4}/><text className="lbpv" x={punto.x.toFixed(1)} y={(punto.y-9).toFixed(1)} textAnchor="middle">{punto.texto}</text></g>)}
    {grafico.anios.map(anio=><text key={anio.texto} className="lbx" x={anio.x.toFixed(1)} y={alto-6} textAnchor="middle">{anio.texto}</text>)}
  </svg>;
}

async function pedirLecturaIA(patientId:string,series:Parameters<typeof pedidoParaIA>[0]):Promise<string>{
  const pedido=pedidoParaIA(series);if(!pedido)throw new Error('No hay valores para leer.');
  try{return (await clinicalWorkspaceApi.labReading(patientId,pedido,crypto.randomUUID())).text;}
  catch(caught){throw new Error(careErrorMessage(caught));}
}

export function PanelPatientLaboratory({patientId,now,ir}:{patientId:string;now:Date;ir:(solapa:SolapaFicha)=>void}){
  const {data:care,error:careError}=useCare(patientId,true);
  const allowed=!careError&&(care?.consented.includes('clinical_document')??false)&&(care?.consented.includes('care_relationship')??false);
  const [lecturaAbierta,setLecturaAbierta]=useState(false),[result,setResult]=useState<{key:string;snapshot:ClinicalWorkspaceSnapshot}|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0),[selected,setSelected]=useState(''),[column,setColumn]=useState<string|null>(null),[view,setView]=useState<'valores'|'fecha'>('valores'),[mode,setMode]=useState<'none'|'manual'|'upload'>('none'),[files,setFiles]=useState(false);
  const document=useRecordDocument(`${patientId}:${allowed}`);
  const key=`${patientId}:${allowed}:${revision}`;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now);
  useEffect(()=>{const changed=()=>setRevision(n=>n+1);window.addEventListener('plan-v:care-changed',changed);return()=>window.removeEventListener('plan-v:care-changed',changed);},[]);
  useEffect(()=>{setResult(null);setError('');if(!allowed)return;const controller=new AbortController();clinicalWorkspaceApi.snapshot(patientId,controller.signal).then(snapshot=>{if(!controller.signal.aborted)setResult({key,snapshot});}).catch(caught=>{if(!controller.signal.aborted)setError(careErrorMessage(caught));});return()=>controller.abort();},[key]);
  const snapshot=result?.key===key?result.snapshot:null;
  const groups=recordLabSeries(snapshot?.records??[],patientId,today);
  const dates=fechasDeLaboratorio(groups,COLUMNAS_LAB);
  const current=groups.find(group=>group.key===selected)??groups[0];
  const estado=current?estadoDe(current.latest):null;
  const grafico=current?graficoDeValor(current):null;
  const pedidos=pedidosDeEstudios(snapshot?.records??[],patientId);
  const porFecha=snapshot?analisisPorFecha(snapshot,patientId,today):[];
  const comparado=column?analisisDeFecha(groups,column):[];
  const changeMode=(next:typeof mode)=>{if(canLeaveWorkspace())setMode(next===mode?'none':next);};
  const saved=()=>{setMode('none');setRevision(n=>n+1);};
  const aviso=careError?careError:!care?'Consultando permisos…':!allowed?'Permisos de atención y estudios pendientes.':error?error:!snapshot?'Consultando laboratorio…':'';
  const verFecha=(date:string)=>{setColumn(date);setView('valores');};
  const verValor=(clave:string)=>{setSelected(clave);setColumn(null);};
  const tabla=<div className="fxs fxtb tall lbt"><table><thead><tr><th>Valor</th><th>Referencia</th>{dates.map(date=><th key={date} className={column===date?'colsel':''}><button type="button" className="lbch" onClick={()=>verFecha(date)}><b className="num">{fechaCorta(date)}</b><small>{groups.filter(g=>g.values.some(v=>v.date===date)).length} valores</small></button></th>)}<th>Tendencia</th><th>Estado</th></tr></thead><tbody>
    {groups.length?groups.map(group=>{const st=estadoDe(group.latest);const celdas=valoresPorFecha(group,dates);return <tr key={group.key} data-lbr={group.key} className={!column&&current?.key===group.key?'sel':undefined} onClick={()=>verValor(group.key)}>
      <td><b>{group.name}</b> <span className="u">{group.unit}</span></td>
      <td className="num u">{group.latest.range_text||'Sin informar'}</td>
      {celdas.map((celda,k)=><td key={dates[k]} className={`num${k===celdas.length-1?' last':''}${celda.fuera?' out':''}${column===dates[k]?' colsel':''}`}>{celda.texto}</td>)}
      <td style={{width:78}}>{group.points.length>1?<FxCurva valores={group.points.map(p=>p.value)} ancho={70} alto={22} mini alerta={st?.fuera}/>:null}</td>
      <td>{st?<span className={`pill ${st.clase}`}>{st.texto}</span>:<span className="pill p-wait">Sin rango</span>}</td></tr>;})
      :<tr><td colSpan={dates.length+4} style={{color:'var(--ink3)'}}>{aviso||'Todavía no hay valores revisados. Cargá un informe para comparar resultados.'}{error&&allowed?<> <button type="button" className="lnk" onClick={()=>setRevision(n=>n+1)}>Reintentar laboratorio</button></>:null}</td></tr>}
  </tbody></table></div>;
  const lista=porFecha.length?<div className="fxs"><div className="fxr lbbd">{porFecha.map(fila=><div key={`${fila.fecha}${fila.archivo}`} className="b"><time className="num">{fechaCorta(fila.fecha)}</time><span className="t"><b>{fila.archivo}</b><small>Laboratorio · {fila.valores} valores · {fila.fuera} fuera de rango</small></span><button type="button" className="sbtn" onClick={()=>verFecha(fila.fecha)}>Valores</button>{fila.documentoId?<button type="button" className="sbtn" disabled={document.busy} onClick={()=>void document.open(()=>clinicalWorkspaceApi.openDocument(patientId,fila.documentoId!))}><PanelV29Icon name="eye" size={13}/>Ver</button>:null}</div>)}</div></div>
    :<div className="fxhint">{aviso||'Todavía no hay informes cargados.'}</div>;
  const detalle=column?<FxPanel titulo={`Análisis del ${fechaCorta(column)}`} meta={`${comparado.length} valores · ${comparado.filter(f=>f.fuera).length} fuera de rango`} derecha={<button type="button" className="lnk" onClick={()=>setColumn(null)}>Ver por valor</button>} grande>
      <div className="fxs"><div className="lbcmp">{comparado.map(fila=><div key={fila.nombre} className={fila.fuera?'out':undefined}><span>{fila.nombre}</span><b className="num">{fila.valor} <small>{fila.unidad}</small></b><em className="num">{fila.antes}</em></div>)}</div></div></FxPanel>
    :<FxPanel titulo={current?.name||'Evolución del valor'} derecha={estado?<span className={`pill ${estado.clase}`}>{estado.texto}</span>:null} grande>
      {current&&snapshot?<>{grafico?<GraficoValor grafico={grafico}/>:<div className="fxhint">{DETALLE_VACIO}</div>}
        <small className="fxhint">Referencia del último informe: {current.latest.range_text||'sin informar'}. Los resultados con comparador se conservan en la tabla sin dibujarlos como un valor exacto.</small>
        <div className="fxs lbhist">{historialDeValor(current,snapshot,patientId).map(h=><div key={`${h.fecha}${h.archivo}`} className={h.fuera?'out':undefined}><time className="num">{fechaCorta(h.fecha)}</time><b className="num">{h.valor} <small>{h.unidad}</small></b><span>{h.archivo}</span></div>)}</div>
        {estado?.fuera?<div className="fxai"><PanelV29Icon name="spark" size={14}/><span><b>Para revisar:</b> {current.name} {estado.texto==='Bajo'?'por debajo':'por encima'} del rango del informe ({current.latest.range_text}). Evaluá si cambia el plan.</span></div>:null}</>
        :<div className="fxhint">{snapshot?DETALLE_VACIO:aviso||'Consultando…'}</div>}
    </FxPanel>;
  return <section aria-label="Laboratorio de la paciente">
    {mode==='manual'&&snapshot&&<ManualLaboratoryValue key={patientId} patientId={patientId} snapshot={snapshot} today={today} onSaved={saved} onUpload={()=>changeMode('upload')}/>}
    {mode==='upload'&&<section className="pn-record-card"><LaboratoryEditor patientId={patientId} onChanged={saved}/></section>}
    <div className="fx hcx" data-mk="1" style={{gridTemplateColumns:'1.62fr 1fr'}}>
      <div className="c">
        <FxPanel titulo="Laboratorio y estudios" grande derecha={<><div className="tabs lbv"><button type="button" className={view==='valores'?'on':''} aria-pressed={view==='valores'} onClick={()=>setView('valores')}>Valores</button><button type="button" className={view==='fecha'?'on':''} aria-pressed={view==='fecha'} onClick={()=>setView('fecha')}>Por fecha</button></div><button type="button" className="sbtn cbtn" disabled={!allowed||!snapshot} onClick={()=>changeMode('manual')}><PanelV29Icon name="plus" size={13}/>Agregar valor</button><button type="button" className="sbtn cbtn" disabled={!allowed||!snapshot||!groups.length} onClick={()=>setLecturaAbierta(true)}><PanelV29Icon name="spark" size={13}/>Analizar valores</button><button type="button" className="sbtn k cbtn" disabled={!allowed} onClick={()=>changeMode('upload')}><PanelV29Icon name="up" size={13}/>Cargar análisis</button></>}>
          {view==='fecha'?lista:<>{tabla}<small className="fxhint">{snapshot&&groups.length?`${metaDeAnalisis(groups)}. `:''}Tocá una fecha para ver ese análisis entero, o un valor para ver cómo cambió.</small></>}
        </FxPanel>
        <FxPanel titulo="De la consulta grabada" meta="lo que la paciente cuenta de sus análisis">
          <div className="fxhint">Sin propuestas por ahora. Cuando la consulta grabada mencione un análisis, aparece acá para que lo agregues o lo descartes.</div>
        </FxPanel>
      </div>
      <div className="c">
        {detalle}
        <FxPanel titulo="Pedidos de estudios" derecha={<button type="button" className="sbtn k cbtn" onClick={()=>ir('archivos')}><PanelV29Icon name="plus" size={13}/>Nuevo pedido</button>}>
          {pedidos.length?<FxFilas ir={ir} filas={pedidos.slice(0,4).map(p=>({tono:'l' as const,titulo:p.titulo,sub:p.sub}))}/>:<div className="fxhint">{snapshot?'Sin pedidos de estudios. Se arman en Archivos.':aviso||'Consultando…'}</div>}
        </FxPanel>
      </div>
    </div>
    {lecturaAbierta&&<LabLectura lectura={armarLectura(groups)} onClose={()=>setLecturaAbierta(false)} pedirIA={care?.consented.includes('ai_lab_reading')&&pedidoParaIA(groups)?()=>pedirLecturaIA(patientId,groups):undefined}/>}
    {document.error&&<p role="alert">{document.error}</p>}{document.file&&<RecordDocumentViewer file={document.file} onClose={document.close}/>}
    <details className="pn-record-card" onToggle={event=>setFiles(event.currentTarget.open)}><summary>Estudios adjuntos y revisión de archivos</summary>{files&&<CarePanel patientId={patientId} mode="laboratory"/>}</details>
  </section>;
}
