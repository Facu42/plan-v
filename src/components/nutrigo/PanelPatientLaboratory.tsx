import { useEffect,useState,type FormEvent } from 'react';
import { clinicalWorkspaceApi } from '../../api/clinical-workspace';
import { careErrorMessage,notifyCareChanged } from '../../api/care';
import { clinicalWorkspaceInputSchema,type ClinicalWorkspaceSnapshot } from '../../types/clinical-workspace';
import { parseImportNumber } from '../../lib/patient-import';
import { LaboratoryEditor } from './ClinicalPatientWorkspace';
import { CarePanel } from './CarePanel';
import { useCare } from './useCare';
import { useUnsavedChanges,canLeaveWorkspace } from './unsaved-changes';
import { recordLabSeries } from './panel-record-data';
import { formatMetricDate } from './measurement-format';
import { MetricChart } from './MetricChart';
import { Icon } from '../shared/Icon';

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

export function PanelPatientLaboratory({patientId,now}:{patientId:string;now:Date}){
  const {data:care,error:careError}=useCare(patientId,true);
  const allowed=!careError&&(care?.consented.includes('clinical_document')??false);
  const [result,setResult]=useState<{key:string;snapshot:ClinicalWorkspaceSnapshot}|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0),[selected,setSelected]=useState(''),[mode,setMode]=useState<'none'|'manual'|'upload'>('none'),[files,setFiles]=useState(false);
  const [docError,setDocError]=useState(''),[docLink,setDocLink]=useState<{url:string;name:string}|null>(null);
  const key=`${patientId}:${allowed}:${revision}`;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now);
  useEffect(()=>{const changed=()=>setRevision(n=>n+1);window.addEventListener('plan-v:care-changed',changed);return()=>window.removeEventListener('plan-v:care-changed',changed);},[]);
  useEffect(()=>{setDocLink(null);setDocError('');setResult(null);setError('');if(!allowed)return;const controller=new AbortController();clinicalWorkspaceApi.snapshot(patientId,controller.signal).then(snapshot=>{if(!controller.signal.aborted)setResult({key,snapshot});}).catch(caught=>{if(!controller.signal.aborted)setError(careErrorMessage(caught));});return()=>controller.abort();},[key]);
  useEffect(()=>{if(!docLink)return;const timer=window.setTimeout(()=>setDocLink(null),60000);return()=>window.clearTimeout(timer);},[docLink]);
  const snapshot=result?.key===key?result.snapshot:null;
  const groups=recordLabSeries(snapshot?.records??[],patientId,today);
  const dates=[...new Set(groups.flatMap(group=>group.values.map(row=>row.date)))].sort().reverse().slice(0,3).reverse();
  const current=groups.find(group=>group.key===selected)??groups[0];
  async function openDocument(id:string){
    const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;setDocError('');setDocLink(null);
    try{const view=await clinicalWorkspaceApi.openDocument(patientId,id),url=new URL(view.url,location.href);
      if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('Enlace inválido');
      if(popup&&!popup.closed)popup.location.replace(url.href);else setDocLink({url:url.href,name:view.filename});
    }catch(caught){popup?.close();setDocError(careErrorMessage(caught));}
  }
  const changeMode=(next:typeof mode)=>{if(canLeaveWorkspace())setMode(next===mode?'none':next);};
  const saved=()=>{setMode('none');setRevision(n=>n+1);};
  return <section className="pn-record-laboratory" aria-label="Laboratorio de la paciente"><header className="pn-record-diary-tools"><p>{dates.length?`${dates.length} fechas comparadas · última: ${formatMetricDate(dates[dates.length-1])}`:'Valores revisados del laboratorio'}</p><div className="pn-record-actions"><button type="button" disabled={!allowed||!snapshot} onClick={()=>changeMode('manual')}><Icon name="plus" size={14}/>Agregar valor a mano</button><button type="button" className="pn-record-primary" disabled={!allowed} onClick={()=>changeMode('upload')}><Icon name="download" size={14}/>Cargar análisis</button></div></header>
    {careError&&<p role="alert">{careError}</p>}{!care?<p role="status">Consultando permisos…</p>:!allowed?<p>Permiso de estudios pendiente.</p>:error?<p role="alert">{error} <button type="button" onClick={()=>setRevision(n=>n+1)}>Reintentar laboratorio</button></p>:!snapshot?<p role="status">Consultando laboratorio…</p>:<>
      {mode==='manual'&&<ManualLaboratoryValue key={patientId} patientId={patientId} snapshot={snapshot} today={today} onSaved={saved} onUpload={()=>changeMode('upload')}/>}
      {mode==='upload'&&<section className="pn-record-card"><LaboratoryEditor patientId={patientId} onChanged={saved}/></section>}
      <div className="pn-record-diary-grid"><section className="pn-record-card"><div className="pn-record-table-scroll"><table><thead><tr><th>Valor</th><th>Referencia original</th>{dates.map(date=><th key={date}>{formatMetricDate(date)}</th>)}<th>Revisión</th></tr></thead><tbody>{groups.map(group=><tr key={group.key} className={current?.key===group.key?'pn-lab-selected':''}><td><button type="button" aria-pressed={current?.key===group.key} onClick={()=>setSelected(group.key)}>{group.name}</button><small>{group.unit||'Sin unidad informada'}</small></td><td>{group.latest.range_text||'Sin informar'}</td>{dates.map(date=><td key={date}>{group.values.find(row=>row.date===date)?.value.raw_value??'—'}</td>)}<td><span className="pn-record-chip">Revisado</span></td></tr>)}</tbody></table></div>{groups.length===0&&<p>Todavía no hay valores revisados. Cargá un informe para comparar resultados.</p>}</section>
      <aside className="pn-record-side-column"><section className="pn-record-card pn-record-weight"><header><h3>{current?.name||'Evolución del valor'}</h3><span>{current?.unit}</span></header>{current?.points.length?<><MetricChart points={current.points} unit={current.unit} label={`Evolución de ${current.name}`}/><p>Referencia del último informe: {current.latest.range_text||'Sin informar'}</p><small>Los resultados con comparador se conservan en la tabla sin dibujarlos como un valor exacto.</small></>:<p>Elegí un valor con resultados numéricos exactos para ver su evolución.</p>}</section><section className="pn-record-card"><header><h3>Archivos del análisis</h3></header>{snapshot.documents.length?snapshot.documents.map(doc=><button type="button" className="pn-record-lab-document" key={doc.id} onClick={()=>void openDocument(doc.id)}><Icon name="list" size={16}/>{doc.filename}</button>):<p>No hay informes cargados.</p>}</section></aside></div>
    </>}
    {allowed&&docError&&<p role="alert">{docError}</p>}{allowed&&docLink&&<p><a href={docLink.url} target="_blank" rel="noopener noreferrer">Abrir {docLink.name}</a></p>}
    <details className="pn-record-card" onToggle={event=>setFiles(event.currentTarget.open)}><summary>Estudios adjuntos y revisión de archivos</summary>{files&&<CarePanel patientId={patientId} mode="laboratory"/>}</details>
  </section>;
}
