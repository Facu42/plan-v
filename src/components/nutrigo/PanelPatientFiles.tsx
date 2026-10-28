import {useEffect,useRef,useState} from 'react';
import {clinicalWorkspaceApi} from '../../api/clinical-workspace';
import {careApi,careErrorMessage,notifyCareChanged} from '../../api/care';
import type {ClinicalWorkspaceSnapshot} from '../../types/clinical-workspace';
import {useCare} from './useCare';
import {ClinicalPatientWorkspace} from './ClinicalPatientWorkspace';
import {useRecordDocument,RecordDocumentViewer} from './RecordDocumentViewer';
import {useUnsavedChanges,canLeaveWorkspace} from './unsaved-changes';
import {FxPanel,FxStk} from './ficha-fx';
import {PanelV29Icon} from './PanelV29Icon';
import {formatMetricDate} from './measurement-format';
type FileRow={id:string;name:string;date:string;category:'Análisis'|'Estudios'|'Fotos'|'Documentos';source:'professional'|'patient-document'|'patient-photo';reviewed:boolean|null};
const dataUrl=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('No pudimos leer el archivo.'));reader.readAsDataURL(file);});
export function assertRecordFile(file:Pick<File,'type'|'size'|'name'>){if(!['application/pdf','image/jpeg','image/png'].includes(file.type)||!/^.+\.(pdf|jpe?g|png)$/i.test(file.name))throw Error('Elegí un PDF o una foto JPG/PNG.');if(file.size===0||file.size>20*1024*1024)throw Error('El archivo debe tener contenido y pesar hasta 20 MB.');if(file.name.length>120||/[\\/]/.test(file.name))throw Error('Usá un nombre de hasta 120 caracteres sin barras.');}
export function PanelPatientFiles({patientId,patientName}:{patientId:string;patientName?:string}){
 const primerNombre=patientName?.split(' ')[0]??'la paciente';
 const {data:care,error:careError,reload}=useCare(patientId,true);
 const canDocs=!careError&&(care?.consented.includes('clinical_document')??false),canPhotos=!careError&&(care?.consented.includes('body_progress')??false);
 const canSources=canDocs&&(care?.consented.includes('care_relationship')??false);
 const scope=`${patientId}:${canDocs}:${canPhotos}:${canSources}`,document=useRecordDocument(scope);
 const [result,setResult]=useState<{scope:string;snapshot:ClinicalWorkspaceSnapshot}|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0),[filter,setFilter]=useState('Todos'),[exporting,setExporting]=useState(false),[selected,setSelected]=useState<{file:File;id:string}|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const input=useRef<HTMLInputElement>(null),lock=useRef(false),current=useRef(scope);current.current=scope;
 useUnsavedChanges(Boolean(selected),busy);
 useEffect(()=>{const changed=()=>setRevision(n=>n+1);window.addEventListener('plan-v:care-changed',changed);return()=>window.removeEventListener('plan-v:care-changed',changed);},[]);
 useEffect(()=>{setResult(null);setError('');if(!canSources)return;const controller=new AbortController();clinicalWorkspaceApi.snapshot(patientId,controller.signal).then(snapshot=>{if(!controller.signal.aborted)setResult({scope,snapshot});}).catch(caught=>{if(!controller.signal.aborted)setError(careErrorMessage(caught));});return()=>controller.abort();},[scope,revision]);
 useEffect(()=>{setSelected(null);setMessage('');},[scope]);
 const snapshot=result?.scope===scope?result.snapshot:null,labIds=new Set(snapshot?.records.flatMap(row=>row.data.kind==='laboratory'?[row.data.document_id]:[])??[]);
 const rows:FileRow[]=[...(snapshot?.documents??[]).filter(doc=>doc.patient_id===patientId).map(doc=>({id:doc.id,name:doc.filename,date:doc.created_at.slice(0,10),category:labIds.has(doc.id)?'Análisis' as const:'Documentos' as const,source:'professional' as const,reviewed:null})),...(careError?[]:care?.records??[]).filter(row=>row.patient_id===patientId).flatMap<FileRow>(row=>row.data.kind==='clinical_document'&&canDocs?[{id:row.id,name:row.data.filename,date:row.recorded_on,category:row.data.document_kind==='laboratorio'?'Análisis' as const:'Estudios' as const,source:'patient-document' as const,reviewed:Boolean(row.reviewed_at)}]:row.data.kind==='body_photo'&&canPhotos?[{id:row.id,name:'Foto corporal privada',date:row.recorded_on,category:'Fotos' as const,source:'patient-photo' as const,reviewed:Boolean(row.reviewed_at)}]:[])].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 function choose(file?:File){if(!file||lock.current||!canSources)return;try{assertRecordFile(file);if(selected&&!canLeaveWorkspace())return;setSelected({file,id:crypto.randomUUID()});setMessage('');}catch(caught){setMessage((caught as Error).message);}}
 async function upload(){if(!selected||lock.current||!canSources)return;lock.current=true;setBusy(true);setMessage('');const key=scope;try{const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await selected.file.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('');if(current.current!==key)return;await clinicalWorkspaceApi.document(patientId,{id:selected.id,filename:selected.file.name,source_sha256:hash,file:await dataUrl(selected.file)});if(current.current===key){setSelected(null);setMessage('Archivo privado guardado.');notifyCareChanged();}}catch(caught){if(current.current===key)setMessage(careErrorMessage(caught));}finally{lock.current=false;setBusy(false);}}
 const open=(row:FileRow)=>void document.open(async()=>row.source==='professional'?clinicalWorkspaceApi.openDocument(patientId,row.id):row.source==='patient-document'?careApi.openDocument(patientId,row.id):{...await careApi.openPhoto(patientId,row.id),filename:'Foto corporal privada',mime:'image/jpeg'});
  const visibles=rows.filter(row=>filter==='Todos'||row.category===filter);
  const cuenta=(category:string)=>rows.filter(row=>category==='Todos'||row.category===category).length;
  const porTipo=(['Análisis','Estudios','Documentos','Fotos'] as const).map(category=>[category,cuenta(category),category==='Análisis'?'':category==='Estudios'?'b':category==='Documentos'?'n':'o'] as const);
  const partes=porTipo.filter(([,n])=>n>0).map(([category,n,clase])=>[category,Math.round(n/Math.max(rows.length,1)*100),clase] as const);
  const tono=(row:FileRow)=>row.category==='Análisis'?'a':row.category==='Estudios'?'b':'l';
  const extension=(row:FileRow)=>row.source==='patient-photo'?'JPG':(row.name.split('.').pop()??'').toUpperCase().slice(0,4)||'—';
  const quien=(row:FileRow)=>row.source==='professional'?'subido por vos':`subido por ${primerNombre}`;
  const marcarRevisado=(row:FileRow)=>{if(lock.current)return;lock.current=true;setBusy(true);void careApi.review(patientId,row.id).then(()=>notifyCareChanged()).catch(caught=>setMessage(careErrorMessage(caught))).finally(()=>{lock.current=false;setBusy(false);});};
  const certificado=async()=>{const fecha=new Date().toLocaleDateString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'});try{await navigator.clipboard.writeText(`Certifico que ${patientName??'la paciente'} asistió a una consulta nutricional el ${fecha}.`);setMessage('Certificado copiado. Pegalo en tu papel membretado.');}catch{setMessage('No pudimos copiar el certificado.');}};
  return <section className="pn-record-files">
   {careError?<p role="alert">{careError} <button type="button" onClick={reload}>Reintentar permisos</button></p>:!care?<p role="status">Consultando permisos…</p>:<>
    {!canSources&&<p>Para cargar y consultar documentos del consultorio se necesitan los permisos de atención y estudios. Las fotos y los adjuntos de la paciente conservan sus permisos propios.</p>}
    {error&&<p role="alert">{error} <button type="button" onClick={()=>setRevision(n=>n+1)}>Reintentar documentos</button></p>}
    {canSources&&!snapshot&&!error&&<p role="status">Cargando documentos del consultorio…</p>}
    <div className="fx" style={{gridTemplateColumns:'1.6fr 1fr'}}>
     <div className="c"><FxPanel titulo="Archivos" meta={String(rows.length)} grande derecha={<><div className="tabs" aria-label="Tipos de archivo">{(['Todos','Análisis','Estudios','Documentos','Fotos'] as const).map(category=><button type="button" key={category} className={category===filter?'on':''} aria-pressed={category===filter} onClick={()=>setFilter(category)}>{category} · {cuenta(category)}</button>)}</div><button type="button" className="sbtn cbtn" disabled={!care.consented.includes('care_relationship')} aria-expanded={exporting} onClick={()=>{if(canLeaveWorkspace())setExporting(value=>!value);}}><PanelV29Icon name="dl" size={13}/>Exportar PDF</button></>}>
      <div className="fxs"><div className="fxfiles">{visibles.map(row=><div className={tono(row)} key={`${row.source}:${row.id}`}><span className={`ico ${tono(row)}`}><PanelV29Icon name={row.category==='Estudios'||row.category==='Fotos'?'img':'file'}/></span><span className="t"><b>{row.name}</b><small>{row.source==='patient-photo'?'Foto · privada, solo la ves vos':`${row.category.replace(/s$/,'')} · ${quien(row)}${row.reviewed===false?' · pendiente de revisar':''}`}</small></span><time className="num">{formatMetricDate(row.date)}</time><span className="sz num">{extension(row)}</span>{row.source!=='professional'&&row.reviewed===false&&<button type="button" className="sbtn cbtn" disabled={busy} onClick={()=>marcarRevisado(row)}><PanelV29Icon name="check" size={13}/>Revisado</button>}<button type="button" className="sbtn cbtn" disabled={document.busy} onClick={()=>open(row)}><PanelV29Icon name="eye" size={13}/>Ver</button></div>)}</div>
       {!visibles.length&&(!canSources||snapshot)&&<div className="fxhint">No hay archivos autorizados en esta categoría.</div>}</div></FxPanel></div>
     <div className="c">
      <FxPanel titulo="Por tipo" meta={`${rows.length} ${rows.length===1?'archivo':'archivos'}`}>{partes.length?<FxStk partes={partes}/>:<div className="fxhint">Todavía no hay archivos.</div>}</FxPanel>
      <FxPanel titulo="Subir archivos" grande><div className="fxdrop" onDragOver={event=>{if(canSources)event.preventDefault();}} onDrop={event=>{event.preventDefault();if(canSources)choose(event.dataTransfer.files[0]);}}><PanelV29Icon name="up" size={20}/><b>Arrastrá archivos acá</b><span>PDF o fotos JPG/PNG · hasta 20 MB. Se guardan en privado al confirmar.</span>
       <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" aria-label="Archivo privado de la paciente" hidden disabled={!canSources||busy} onChange={event=>{choose(event.target.files?.[0]);event.target.value='';}}/>
       {selected&&<span><b>{selected.file.name}</b> · {(selected.file.size/1024).toLocaleString('es-AR',{maximumFractionDigits:0})} KB</span>}
       <span style={{display:'flex',gap:8}}>{selected?<><button type="button" className="sbtn k cbtn" disabled={busy||!canSources} onClick={()=>void upload()}>{busy?'Guardando…':'Guardar archivo privado'}</button><button type="button" className="sbtn cbtn" disabled={busy} onClick={()=>setSelected(null)}>Descartar archivo</button></>:<><button type="button" className="sbtn k cbtn" disabled={!canSources||busy} onClick={()=>input.current?.click()}>Elegir archivos</button><button type="button" className="sbtn cbtn" onClick={()=>void certificado()}><PanelV29Icon name="shield" size={13}/>Hacer certificado</button></>}</span></div></FxPanel>
      <div className="fxai"><PanelV29Icon name="spark" size={14}/><span><b>Origen:</b> los análisis vinculados a valores revisados aparecen en Análisis; los demás documentos conservan su nombre original. Se abren con enlaces privados temporales.</span></div>
     </div></div></>}
   {message&&<p role="status">{message}</p>}{document.error&&<p role="alert">{document.error}</p>}{document.file&&<RecordDocumentViewer file={document.file} onClose={document.close}/>}{exporting&&care?.consented.includes('care_relationship')&&!careError&&<ClinicalPatientWorkspace patientId={patientId} mode="exportacion"/>}
  </section>;
}
