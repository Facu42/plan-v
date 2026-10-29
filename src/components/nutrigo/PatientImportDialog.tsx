import { useEffect,useRef,useState,type ChangeEvent } from 'react';
import { patientImportApi } from '../../api/patient-import';
import { careApi,careErrorMessage } from '../../api/care';
import { importBatchSchema,type ImportBatch,type ImportBatchInput,type ImportContact,type ImportResult } from '../../types/patient-import';
import type {ImportPurpose} from '../../types/import-authorization';
import {ImportAuthorizationControl} from './ImportAuthorizationControl';
import { mapImportRows,suggestMapping,type ImportMapping,type LocalCandidate,type LocalDocument,type MappingField } from '../../lib/patient-import';
import { extractImportFile } from '../../lib/patient-import-files';
import { organizerInputSchema,validateOrganizerProposals,type OrganizerItem,type OrganizerReviewedItem } from '../../types/document-organizer';
import { PatientImportOrganizer } from './PatientImportOrganizer';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { NvButton } from './primitives';
import { useUnsavedChanges,canLeaveWorkspace } from './unsaved-changes';
import './patient-import.css';

const FIELDS:Record<MappingField,string>={name:'Nombre completo',email:'Email',phone:'Teléfono',date:'Fecha de medición',weight:'Peso',waist:'Cintura',hip:'Cadera',weight_unit:'Unidad del peso',length_unit:'Unidad de perímetros',history:'Antecedentes',study:'Estudios',plan:'Plan histórico'};
const LABELS={created:'Creada',appended:'Incorporada',duplicate:'Ya existe',discarded:'Descartada',error:'No guardada'};
type ReviewCandidate=LocalCandidate&{reviewed:boolean;includeClinical:boolean};
function mergeCandidates(rows:LocalCandidate[]):LocalCandidate[]{
  const groups=new Map<string,LocalCandidate>();
  for(const row of rows){const key=row.email?row.email:row.key;const old=groups.get(key);if(!old)groups.set(key,row);else{old.origins.push(...row.origins);old.history.push(...row.history);old.measurements.push(...row.measurements);old.warnings.push(...row.warnings);if(old.name!==row.name)old.warnings.push('Hay nombres diferentes con el mismo email: revisalos antes de incorporar.');}}
  if(groups.size>100)throw new Error('Dividí el lote: hasta cien pacientes por importación.');return [...groups.values()];
}
export function buildReviewedImport(id:string,rows:ReviewCandidate[]):ImportBatchInput {
  return importBatchSchema.parse({id,candidates:rows.map(({warnings:_,includeClinical,reviewed,...row})=>({...row,history:includeClinical&&row.action==='append'?row.history:[],measurements:includeClinical&&row.action==='append'?row.measurements:[],reviewed}))});
}
export function continueCreatedImport(rows:ReviewCandidate[],results:ImportResult[]):ReviewCandidate[]{
 return rows.flatMap(row=>{const saved=results.find(r=>r.key===row.key&&r.status==='created'&&r.patient_id);return saved&&row.action==='create'&&(row.history.length||row.measurements.length)?[{...structuredClone(row),key:crypto.randomUUID(),action:'append' as const,patient_id:saved.patient_id,reviewed:false,includeClinical:true}]:[];});
}
export function reviewedOrganizerSources(row:ReviewCandidate,contacts:ImportContact[],consented:string[]):OrganizerItem[]{
  if(!row.reviewed||!row.includeClinical||row.action!=='append'||!row.patient_id||!contacts.some(c=>c.patient_id===row.patient_id)||!consented.includes('care_relationship')||!consented.includes('ai_document_import'))return [];
  try{buildReviewedImport('00000000-0000-4000-8000-000000000000',[row]);}catch{return [];}
  const parsed=organizerInputSchema.safeParse({request_key:'00000000-0000-4000-8000-000000000000',items:row.history});
  return parsed.success?structuredClone(row.history):[];
}
const sameSource=(a:OrganizerItem,b:OrganizerItem)=>a.text===b.text&&a.origin.file===b.origin.file&&a.origin.fingerprint===b.origin.fingerprint&&a.origin.page===b.origin.page&&a.origin.row===b.origin.row&&a.origin.sheet===b.origin.sheet;
export function applyOrganizerReview(row:ReviewCandidate,context:{patientId:string;items:OrganizerItem[]},selected:OrganizerReviewedItem[]):ReviewCandidate{
  if(!row.reviewed||!row.includeClinical||row.action!=='append'||row.patient_id!==context.patientId||row.history.length!==context.items.length||row.history.some((item,i)=>!sameSource(item,context.items[i])||item.category!==context.items[i].category))throw new Error('La fila cambió. Volvé a revisar las fuentes antes de aplicar una propuesta.');
  const used=new Set<number>();
  const choices=selected.map(item=>{const index=context.items.findIndex((source,i)=>!used.has(i)&&sameSource(source,item));if(index<0)throw new Error('La propuesta no coincide con el texto y origen revisados.');used.add(index);return {index,category:item.category,heading:item.heading};});
  const verified=validateOrganizerProposals(choices,context.items,true);
  // Only category changes reach the strict import contract. Headings are review aids.
  return {...row,reviewed:false,history:row.history.map((item,index)=>({...item,category:verified.find(choice=>choice.index===index)?.category??item.category}))};
}
function ImportOrganizerForRow({row,contacts,onReviewed}:{row:ReviewCandidate;contacts:ImportContact[];onReviewed:(context:{patientId:string;items:OrganizerItem[]},items:OrganizerReviewedItem[])=>void}){
  const patientId=row.patient_id??'';
  const [permission,setPermission]=useState<{patientId:string;consented:string[];error:string}|null>(null);
  useEffect(()=>{const controller=new AbortController();setPermission(null);if(patientId)void careApi.snapshot(patientId,true,controller.signal).then(snapshot=>{if(!controller.signal.aborted)setPermission({patientId,consented:snapshot.consented,error:''});}).catch(caught=>{if(!controller.signal.aborted)setPermission({patientId,consented:[],error:careErrorMessage(caught)});});return()=>controller.abort();},[patientId]);
  const items=reviewedOrganizerSources(row,contacts,permission?.patientId===patientId?permission.consented:[]);
  if(!permission||permission.patientId!==patientId)return <p role="status" className="pi-hint">Comprobando el permiso para organizar documentos…</p>;
  if(!items.length)return <p className="pi-hint">{permission.error||'La organización con IA requiere el permiso específico vigente de esta paciente, fuentes válidas y la revisión de la fila. Podés continuar manualmente.'}</p>;
  return <PatientImportOrganizer patientId={patientId} items={items} onReviewed={selected=>onReviewed({patientId,items},selected)}/>;
}
export function PatientImportDialog({onClose,onImported}:{onClose:()=>void;onImported?:()=>void}){
  const [contacts,setContacts]=useState<ImportContact[]>([]);const [batches,setBatches]=useState<ImportBatch[]>([]);
  const [documents,setDocuments]=useState<LocalDocument[]>([]);const [mappings,setMappings]=useState<Record<string,ImportMapping>>({});
  const [rows,setRows]=useState<ReviewCandidate[]>([]);const [id,setId]=useState<string>(()=>crypto.randomUUID());
  const [perPage,setPerPage]=useState(false);const [busy,setBusy]=useState(false);const [progress,setProgress]=useState('');const [error,setError]=useState('');
  const [result,setResult]=useState<ImportBatch|null>(null);const [loading,setLoading]=useState(true);const lock=useRef(false);const mounted=useRef(true);
  const resumed=useRef<ImportBatch|null>(null);
  const createdPendingCount=result?rows.filter(row=>row.action==='create'&&(row.history.length||row.measurements.length)&&result.results.some(r=>r.key===row.key&&r.status==='created'&&r.patient_id)).length:0;
  useUnsavedChanges((documents.length>0||rows.length>0)&&(result?.status!=='completed'||createdPendingCount>0),busy);
  useEffect(()=>{mounted.current=true;const controller=new AbortController();Promise.all([patientImportApi.contacts(controller.signal),patientImportApi.list(controller.signal)]).then(([a,b])=>{setContacts(a.contacts);setBatches(b.batches);}).catch(caught=>{if(!controller.signal.aborted)setError(careErrorMessage(caught));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>{mounted.current=false;controller.abort();};},[]);
  const choose=async(event:ChangeEvent<HTMLInputElement>)=>{
    const files=[...(event.target.files??[])];event.target.value='';if(!files.length||lock.current)return;
    if(files.length>20){setError('Cada lote admite hasta veinte archivos.');return;}
    lock.current=true;setBusy(true);setError('');setRows([]);setResult(null);setId(resumed.current?.id??crypto.randomUUID());
    const loaded:LocalDocument[]=[];const failed:string[]=[];
    try{
      for(const file of files){setProgress(`Leyendo ${file.name} en tu computadora…`);try{loaded.push(await extractImportFile(file,text=>{if(mounted.current)setProgress(`${file.name}: ${text}`);}));}catch(caught){failed.push(`${file.name}: ${caught instanceof Error?caught.message:'No pudimos leerlo.'}`);}if(!mounted.current)return;}
      const defaults=Object.fromEntries(loaded.flatMap(doc=>doc.tables.map(table=>[`${doc.fingerprint}:${table.sheet}`,suggestMapping(table.rows[0]??[])])));
      setDocuments(loaded);setMappings(defaults);if(failed.length)setError(failed.join('\n'));
    }finally{lock.current=false;if(mounted.current){setBusy(false);setProgress('');}}
  };
  const prepareReview=()=>{
    setError('');setResult(null);const candidates:LocalCandidate[]=[];
    try{
      for(const doc of documents){
        for(const table of doc.tables)candidates.push(...mapImportRows(table.rows.slice(1),mappings[`${doc.fingerprint}:${table.sheet}`]??{},{file:doc.file,fingerprint:doc.fingerprint,sheet:table.sheet}));
        const groups=perPage?doc.pages.map(p=>[p]):doc.pages.length?[doc.pages]:[];
        for(const pages of groups){const origins=pages.map(p=>({file:doc.file,fingerprint:doc.fingerprint,page:p.page}));const text=pages.map(p=>p.text.trim()).join('\n');if(!text)continue;
          const email=text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]?.toLowerCase()??'';
          candidates.push({key:crypto.randomUUID(),name:'',email,phone:'',action:'create',patient_id:null,origins,measurements:[],history:pages.filter(p=>p.text.trim().length>=2).map(p=>({category:'history',text:p.text.trim(),origin:{file:doc.file,fingerprint:doc.fingerprint,page:p.page}})),warnings:['Asigná el nombre y revisá el texto extraído. El reconocimiento puede tener errores.']});
        }
      }
      const merged=mergeCandidates(candidates);if(!merged.length)throw new Error('No encontramos filas o texto. Revisá el mapeo o probá otro archivo.');
      const prepared=merged.map(row=>{const matches=row.email?contacts.filter(c=>c.email.toLowerCase()===row.email.toLowerCase()):[];return {...row,action:matches.length===1?'append' as const:'create' as const,patient_id:matches.length===1?matches[0].patient_id:null,reviewed:false,includeClinical:false,warnings:matches.length>1?[...row.warnings,'Más de una ficha coincide con el email. Elegí cuál corresponde.']:row.warnings};});
      if(resumed.current){
        const batch=resumed.current;setResult(batch);setRows(batch.candidates.map(original=>{
          const pending=batch.results.find(r=>r.key===original.key&&r.status==='error');
          const sameOrigin=(a:LocalCandidate['origins'],b:LocalCandidate['origins'])=>a.length===b.length&&a.every((o,i)=>o.fingerprint===b[i].fingerprint&&o.page===b[i].page&&o.row===b[i].row&&o.sheet===b[i].sheet);
          const extracted=prepared.find(row=>sameOrigin(row.origins,original.origins));
          return {...original,history:extracted?.history??[],measurements:extracted?.measurements??[],reviewed:!pending,includeClinical:Boolean(pending?.clinical_pending&&extracted),warnings:pending?.clinical_pending&&!extracted?['Releé todos los archivos originales de esta fila antes de confirmarla.']:[]};
        }));
      }else setRows(prepared);
    }catch(caught){setError(caught instanceof Error?caught.message:'No pudimos preparar la revisión.');}
  };
  const patch=(key:string,change:Partial<ReviewCandidate>)=>{setRows(current=>current.map(row=>row.key===key?{...row,...change,reviewed:change.reviewed??false}:row));setResult(null);};
  const applyOrganized=(key:string,context:{patientId:string;items:OrganizerItem[]},selected:OrganizerReviewedItem[])=>{setRows(current=>current.map(row=>{if(row.key!==key)return row;try{return applyOrganizerReview(row,context,selected);}catch(caught){setError(careErrorMessage(caught));return row;}}));setResult(null);};
  const commit=async()=>{
    if(lock.current)return;let input:ImportBatchInput;
    try{input=buildReviewedImport(id,rows);}catch{setError('Confirmá cada fila. Revisá nombres, emails, fechas, unidades, origen y textos (hasta 3.000 caracteres por página).');return;}
    lock.current=true;setBusy(true);setError('');setProgress('Guardando las fichas revisadas…');
    try{await patientImportApi.prepare(input);const saved=(await patientImportApi.commit(input)).batch;setResult(saved);setBatches(current=>[saved,...current.filter(b=>b.id!==saved.id)]);if(saved.results.some(r=>r.status==='created'||r.status==='appended')){onImported?.();try{setContacts((await patientImportApi.contacts()).contacts);}catch{setError('Se guardó la importación. Recargá para actualizar las fichas disponibles.');}}}
    catch(caught){setError(careErrorMessage(caught));}finally{lock.current=false;if(mounted.current){setBusy(false);setProgress('');}}
  };
  const resume=(batch:ImportBatch)=>{resumed.current=batch;setId(batch.id);setDocuments([]);setRows(batch.candidates.map(row=>{const pending=batch.results.some(r=>r.key===row.key&&r.status==='error'&&r.clinical_pending);return {...row,reviewed:!pending,includeClinical:false,warnings:pending?['Hay datos clínicos pendientes. Releé el archivo original para recuperar el texto antes de revisar.']:[]};}));setResult(batch);setError('');};
  const allReviewed=rows.length>0&&rows.every(row=>row.reviewed);
  return <FigmaRecordDialog title="Importar pacientes" closeLabel="Cerrar importación" onClose={()=>{if(!busy&&canLeaveWorkspace())onClose();}} className="pi-dialog">
    <p className="pi-hint">Los archivos se leen en tu computadora. Sólo se guardan los datos que revisás. No se crean cuentas, se mandan invitaciones ni se publican planes.</p>
    <label className="pi-file">Archivos (hasta 20, de 20 MB cada uno; PDF hasta 40 páginas)<input type="file" multiple accept=".xlsx,.csv,.docx,.pdf,.jpg,.jpeg,.png" disabled={busy||loading} onChange={event=>void choose(event)}/></label>
    <p className="pi-hint">El reconocimiento de fotos y escaneos corre localmente. La primera lectura descarga el motor y el idioma desde Nutridash; el contenido del archivo permanece en tu computadora hasta que confirmes los datos revisados.</p>
    {loading&&<p role="status">Cargando fichas e importaciones anteriores…</p>}
    {busy&&<p role="status" aria-live="polite">{progress}</p>}
    {error&&<p className="pi-error" role="alert">{error}</p>}
    {!!batches.length&&<details><summary>Retomar una importación guardada</summary><p className="pi-hint">Se conservan contactos y resultados. El texto clínico de una revisión no confirmada permanece sólo en tu computadora: para retomarlo, volvé a leer el archivo.</p><ul>{batches.map(batch=><li key={batch.id}>{new Date(batch.created_at).toLocaleString('es-AR')} · {batch.candidates.length} pacientes · {batch.status==='completed'?'Completada':batch.status==='partial'?'Con filas pendientes':'En revisión'} <NvButton className="nv-ghost" disabled={busy} onClick={()=>resume(batch)}>Retomar</NvButton></li>)}</ul></details>}
    {!!documents.length&&!rows.length&&<>
      {documents.map(doc=><section key={doc.fingerprint}><h3>{doc.file}</h3>{doc.tables.map(table=>{const key=`${doc.fingerprint}:${table.sheet}`;return <fieldset key={key}><legend>{table.sheet}: {Math.max(0,table.rows.length-1)} filas</legend><p className="pi-hint">La primera fila contiene los títulos. Asociá cada dato con su columna; dejá sin asociar lo que no corresponda.</p><div className="pi-mapping">{Object.entries(FIELDS).map(([field,label])=><label key={field}>{label}<select value={mappings[key]?.[field as MappingField]??''} onChange={e=>setMappings(current=>({...current,[key]:{...current[key],[field]:e.target.value===''?undefined:Number(e.target.value)}}))}><option value="">Sin asociar</option>{(table.rows[0]??[]).map((header,index)=><option key={index} value={index}>{header||`Columna ${index+1}`}</option>)}</select></label>)}</div></fieldset>;})}{!!doc.pages.length&&<details><summary>Texto reconocido: {doc.pages.length} páginas</summary>{doc.pages.map(page=><div key={page.page}><strong>Página {page.page}</strong><pre>{page.text}</pre></div>)}</details>}</section>)}
      {documents.some(d=>d.pages.length>1)&&<label><input type="checkbox" checked={perPage} onChange={e=>setPerPage(e.target.checked)}/>Una ficha por página (si el archivo contiene varias pacientes)</label>}
      <NvButton disabled={busy} onClick={prepareReview}>Preparar revisión</NvButton>
    </>}
    {!!rows.length&&<div className="pi-review">
      <p className="pi-hint">{rows.length} fichas para revisar. La coincidencia por email es una sugerencia; confirmá la persona. Para nuevas pacientes, primero guardá el contacto; el texto revisado se conserva acá para continuar con su autorización e incorporar la historia sin crear cuentas.</p>
      {rows.map(row=>{const saved=result?.results.find(r=>r.key===row.key);const frozen=saved&&saved.status!=='error';if(frozen)return <article key={row.key}><h3>{row.name||'Paciente'} · {LABELS[saved.status]}</h3><p role="status">{saved.message}</p></article>;return <fieldset key={row.key} disabled={busy}><legend>{row.name||'Asignar paciente'}{saved?` · ${LABELS[saved.status]}`:''}</legend>
        <div className="pi-mapping"><label>Nombre completo<input value={row.name} maxLength={80} onChange={e=>patch(row.key,{name:e.target.value})}/></label><label>Email (opcional)<input type="email" value={row.email} maxLength={254} onChange={e=>patch(row.key,{email:e.target.value.toLowerCase()})}/></label><label>Teléfono<input value={row.phone} maxLength={40} onChange={e=>patch(row.key,{phone:e.target.value})}/></label>
        <label>Acción<select value={row.action} onChange={e=>patch(row.key,{action:e.target.value as ReviewCandidate['action'],includeClinical:false,patient_id:null})}><option value="create">Crear ficha de contacto</option><option value="append">Incorporar a ficha existente</option><option value="discard">Descartar</option></select></label>
        {row.action==='append'&&<label>Ficha correspondiente<select value={row.patient_id??''} onChange={e=>patch(row.key,{patient_id:e.target.value||null})}><option value="">Elegí una paciente</option>{contacts.map(contact=><option key={contact.patient_id} value={contact.patient_id}>{contact.name}{contact.email?` · ${contact.email}`:''}</option>)}</select></label>}</div>
        <p className="pi-hint">Origen: {row.origins.map(o=>`${o.file}${o.sheet?` · ${o.sheet}`:''}${o.row?` · fila ${o.row}`:''}${o.page?` · página ${o.page}`:''}`).join('; ')}</p>
        {!!row.warnings.length&&<ul className="pi-hint">{[...new Set(row.warnings)].map(text=><li key={text}>{text}</li>)}</ul>}
        {(row.history.length>0||row.measurements.length>0)&&<><label><input type="checkbox" checked={row.includeClinical} disabled={row.action!=='append'||!row.patient_id} onChange={e=>patch(row.key,{includeClinical:e.target.checked})}/>Incorporar antecedentes, estudios, planes históricos y medidas revisados (requiere permiso vigente)</label><p className="pi-hint">Las unidades sugeridas son kg y cm cuando el archivo no las indica. Revisalas. Los planes históricos quedan privados y no reemplazan el plan actual.</p>
        {row.measurements.map((m,index)=><div className="pi-mapping" key={`${m.kind}:${index}`}><label>{m.kind==='weight'?'Peso':m.kind==='waist'?'Cintura':'Cadera'}<input type="number" step="any" value={m.value} onChange={e=>patch(row.key,{measurements:row.measurements.map((item,i)=>i===index?{...item,value:Number(e.target.value)}:item)})}/></label><label>Fecha<input type="date" value={m.date} onChange={e=>patch(row.key,{measurements:row.measurements.map((item,i)=>i===index?{...item,date:e.target.value}:item)})}/></label><label>Unidad<select value={m.unit} onChange={e=>patch(row.key,{measurements:row.measurements.map((item,i)=>i===index?{...item,unit:e.target.value as typeof m.unit}:item)})}>{(m.kind==='weight'?['kg','lb']:['cm','in']).map(unit=><option key={unit}>{unit}</option>)}</select></label></div>)}
        {row.history.map((h,index)=><div key={`${h.category}:${index}`}><label>Tipo de contenido<select value={h.category} onChange={e=>patch(row.key,{history:row.history.map((item,i)=>i===index?{...item,category:e.target.value as typeof h.category}:item)})}><option value="history">Antecedentes</option><option value="study">Estudio / laboratorio</option><option value="plan">Plan histórico</option></select></label><label>Texto revisado<textarea rows={4} value={h.text} onChange={e=>patch(row.key,{history:row.history.map((item,i)=>i===index?{...item,text:e.target.value}:item)})}/></label><p className="pi-hint">{h.text.length} de 3.000 caracteres; página {h.origin.page??'—'}, fila {h.origin.row??'—'}</p></div>)}</>}
        <label><input type="checkbox" checked={row.reviewed} onChange={e=>patch(row.key,{reviewed:e.target.checked})}/>Revisé esta fila y su correspondencia con la paciente</label>
        {row.action==='append'&&row.patient_id&&row.includeClinical&&<ImportAuthorizationControl key={row.patient_id} patientId={row.patient_id} required={[...new Set<ImportPurpose>([...row.history.map(h=>h.category),...(row.measurements.length?['measurement' as const]:[])])]} onChanged={()=>patch(row.key,{reviewed:false})}/>}
        {row.action==='append'&&row.patient_id&&contacts.some(c=>c.patient_id===row.patient_id)&&row.includeClinical&&row.history.length>0&&(row.reviewed?<ImportOrganizerForRow key={row.patient_id} row={row} contacts={contacts} onReviewed={(context,selected)=>applyOrganized(row.key,context,selected)}/>:<p className="pi-hint">Revisá el texto, origen y categoría de cada fuente y confirmá la fila para habilitar la organización opcional con IA. Después de aplicar una propuesta tendrás que confirmar la fila otra vez.</p>)}
        {saved&&<p role={saved.status==='error'?'alert':'status'}>{saved.message}</p>}
      </fieldset>;})}
      {createdPendingCount>0&&<p role="status">El contacto ya está guardado. Quedan datos históricos en esta revisión local: continuá antes de cerrar o conservá los archivos para volver a leerlos.</p>}
      <footer className="pi-actions"><NvButton className="nv-ghost" disabled={busy} onClick={()=>{setRows([]);setResult(null);if(!resumed.current)setId(crypto.randomUUID());}}>Volver a los archivos</NvButton>{createdPendingCount>0&&<NvButton disabled={busy||result?.status!=='completed'} onClick={()=>{setRows(continueCreatedImport(rows,result?.results??[]));setId(crypto.randomUUID());resumed.current=null;setResult(null);setError('');}}>Continuar con datos históricos de {createdPendingCount} fichas creadas</NvButton>}<NvButton disabled={busy||!allReviewed||result?.status==='completed'||rows.some(row=>result?.results.some(r=>r.key===row.key&&r.clinical_pending&&r.status==='error')&&(!row.includeClinical||!row.history.length&&!row.measurements.length))} onClick={()=>void commit()}>{busy?'Guardando…':result?.status==='partial'?'Reintentar filas pendientes':'Guardar fichas revisadas'}</NvButton></footer>
    </div>}
  </FigmaRecordDialog>;
}
