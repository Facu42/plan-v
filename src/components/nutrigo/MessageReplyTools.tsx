import {useState} from 'react';
import type {MessageSettings,SavedReply} from '../../types/message-settings';
import {saveMessageSettingsSchema} from '../../types/message-settings';
import type {MessageToolsState} from './use-message-tools';
import {useUnsavedChanges} from './unsaved-changes';
import {friendlyError} from '../../lib/error-messages';
import {FigmaRecordDialog} from './FigmaPatientFront';

export function appendSavedReply(current:string,reply:string){const next=current.trim()?current+'\n\n'+reply:reply;if(next.length>2000)throw new Error('La respuesta supera los 2.000 caracteres junto a tu borrador. Acortá el texto antes de insertarla.');return next;}

function ReplyEditor({settings,onSave,onClose}:{settings:MessageSettings;onSave:MessageToolsState['save'];onClose:()=>void}){
 const [replies,setReplies]=useState<SavedReply[]>(()=>structuredClone(settings.replies)),[selected,setSelected]=useState(settings.replies[0]?.id??''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dirty=JSON.stringify(replies)!==JSON.stringify(settings.replies);useUnsavedChanges(dirty,busy);
 const input={expected_revision:settings.revision,replies,starred_patient_ids:settings.starred_patient_ids},valid=saveMessageSettingsSchema.safeParse(input).success,reply=replies.find(r=>r.id===selected);
 const change=(key:'title'|'body',value:string)=>setReplies(old=>old.map(r=>r.id===selected?{...r,[key]:value}:r));
 const close=()=>{if(!busy&&(!dirty||window.confirm('¿Descartar los cambios de estas respuestas?')))onClose();};
 return <FigmaRecordDialog title="Editar respuestas guardadas" closeLabel="Cerrar edición de respuestas" onClose={close}><form className="pn-message-reply-editor" aria-label="Editar respuestas guardadas" aria-busy={busy} onSubmit={async event=>{event.preventDefault();if(busy||!valid)return;setBusy(true);setError('');try{await onSave(input);onClose();}catch(error){setError(friendlyError(error));}finally{setBusy(false);}}}>
  <label>Respuesta<select value={selected} disabled={busy} onChange={event=>setSelected(event.target.value)}><option value="">Elegí una respuesta</option>{replies.map(r=><option key={r.id} value={r.id}>{r.title||'Nueva respuesta'}</option>)}</select></label>
  <button type="button" disabled={busy||replies.length>=50} onClick={()=>{const next={id:crypto.randomUUID(),title:'',body:''};setReplies(old=>[...old,next]);setSelected(next.id);}}>Nueva respuesta</button>
  {reply&&<><label>Título<input maxLength={100} required value={reply.title} disabled={busy} onChange={event=>change('title',event.target.value)}/></label><label>Texto para insertar<textarea maxLength={2000} required rows={5} value={reply.body} disabled={busy} onChange={event=>change('body',event.target.value)}/></label><button type="button" disabled={busy} onClick={()=>{setReplies(old=>old.filter(r=>r.id!==selected));setSelected('');}}>Quitar respuesta</button></>}
  <small>Hasta 50 respuestas. Se guardan para tu consultorio; usarlas sólo inserta el texto.</small>
  <div className="pn-ac-actions"><button type="submit" disabled={busy||!dirty||!valid}>{busy?'Guardando…':'Guardar respuestas'}</button><button type="button" disabled={busy} onClick={close}>Cerrar edición</button></div>
  {error&&<p role="alert">{error}</p>}
 </form></FigmaRecordDialog>;
}

export function MessageReplyTools({tools,onUse}:{tools:MessageToolsState;onUse:(body:string)=>void}){
 const [editing,setEditing]=useState(false),[base,setBase]=useState<MessageSettings|null>(null);
 return <section className="pn-message-replies" aria-label="Respuestas guardadas"><header><h4>Respuestas guardadas</h4><button type="button" disabled={!tools.data||tools.busy||tools.loading} onClick={()=>{setBase(tools.data);setEditing(true);}}>Editar respuestas</button></header>
  {tools.loading?<p role="status">Consultando respuestas…</p>:tools.data?.replies.length?<div className="pn-message-reply-list">{tools.data.replies.map(r=><button type="button" key={r.id} aria-label={`Usar respuesta ${r.title}`} onClick={()=>onUse(r.body)}>{r.title}</button>)}</div>:!tools.error?<p>Todavía no guardaste respuestas. Creá una para usarla en tus conversaciones.</p>:null}
  {tools.error&&<p role="alert">{tools.error} <button type="button" disabled={tools.busy} onClick={tools.reload}>Reintentar respuestas</button></p>}
  {editing&&base&&<ReplyEditor settings={base} onSave={tools.save} onClose={()=>{setEditing(false);setBase(null);}}/>}
 </section>;
}
