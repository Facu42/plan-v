import { useEffect, useRef, useState } from 'react';
import { request } from '../../api/client';
import type { CommunicationBoard } from '../../types/communications';
import { friendlyError } from '../../lib/error-messages';
import { NvButton,NvCard } from './primitives';
import {EmailCommunicationPanel} from './EmailCommunicationPanel';
const labels:Record<string,string>={queued:'Pendiente',sending:'En procesamiento',accepted:'Aceptado por Meta',failed:'Falló',uncertain:'Entrega incierta: revisar',skipped:'Sin consentimiento',cancelled:'Cancelado por baja',sent:'Enviado',delivered:'Entregado',read:'Leído'};
export function CommunicationPanel() {
 const [board,setBoard]=useState<CommunicationBoard|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState<string[]>([]),[template,setTemplate]=useState(''),[language,setLanguage]=useState('es_AR'),[review,setReview]=useState(false),[visible,setVisible]=useState(50);
 const requestKey=useRef<string|null>(null),lock=useRef(false),abort=useRef<AbortController|null>(null);
 const [preview,setPreview]=useState<{text:string;hash:string}|null>(null);
 async function prepareTemplate(){setBusy(true);setError('');try{setPreview(await request(`/api/portfolio/communications/template?name=${encodeURIComponent(template)}&language=${encodeURIComponent(language)}`));}catch(e){setPreview(null);setError(friendlyError(e));}finally{setBusy(false);}}
 async function load(signal?:AbortSignal){const next=await request<CommunicationBoard>('/api/portfolio/communications',{signal});if(!signal?.aborted)setBoard(next);return next;}
 useEffect(()=>{const control=new AbortController();abort.current=control;load(control.signal).catch(e=>{if(!control.signal.aborted)setError(friendlyError(e));});return()=>control.abort();},[]);
 function change(){setReview(false);setPreview(null);requestKey.current=null;}
 async function confirm(){if(lock.current||!preview)return;lock.current=true;setBusy(true);setError('');try{requestKey.current??=crypto.randomUUID();await request('/api/portfolio/communications',{method:'POST',body:JSON.stringify({request_key:requestKey.current,template,language,template_hash:preview.hash,patient_ids:selected})});await load();setReview(false);setSelected([]);requestKey.current=null;}catch(e){setError(friendlyError(e));}finally{setBusy(false);lock.current=false;}}
 async function dispatch(id:string){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await request(`/api/portfolio/communications/${encodeURIComponent(id)}/dispatch`,{method:'POST'});await load();}catch(e){setError(friendlyError(e));}finally{setBusy(false);lock.current=false;}}
 const names=new Map(board?.patients.map(p=>[p.id,p.name])??[]);
 return <><NvCard title="Difusiones por WhatsApp" className="care-panel ops-panel">
  <p>Seleccioná pacientes y revisá una plantilla estática aprobada en tu cuenta de WhatsApp Business. No se envían notas clínicas ni textos libres. Cada destinatario conserva su resultado individual.</p>
  {!board&&!error&&<p role="status">Cargando canales y preferencias…</p>}
  {board&&<><p role="status">{board.mode==='demo'?'Demo: no se envían mensajes externos.':board.enabled?'Integración activada. Los envíos pueden tener costo.':'WhatsApp sin activar. Configurá la cuenta oficial antes de enviar.'}</p>
  <div className="care-form-row"><label>Nombre exacto de plantilla aprobada<input disabled={busy} value={template} onChange={e=>{setTemplate(e.target.value);change();}} maxLength={100}/></label><label>Idioma aprobado<input disabled={busy} value={language} onChange={e=>{setLanguage(e.target.value);change();}} maxLength={10}/></label></div>
  <p>La plantilla debe incluir instrucciones de baja (BAJA o STOP), sin parámetros ni imágenes. Plan V vuelve a comprobar su aprobación antes de enviar.</p>
  <NvButton disabled={busy||!template||board.mode==='demo'} onClick={()=>void prepareTemplate()}>Cargar plantilla aprobada</NvButton>{preview&&<section><h3>Mensaje aprobado</h3><p>{preview.text}</p></section>}
  <fieldset disabled={busy}><legend>Destinatarios ({selected.length}/100)</legend>{board.patients.slice(0,visible).map(p=><label className="care-consent" key={p.id}><input type="checkbox" checked={selected.includes(p.id)} disabled={!p.broadcasts||(!selected.includes(p.id)&&selected.length>=100)} onChange={e=>{setSelected(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id));change();}}/>{p.name} · {p.broadcasts?'Autoriza difusiones':'Sin consentimiento de difusión'}</label>)}{visible<board.patients.length&&<NvButton className="nv-soft" onClick={()=>setVisible(v=>v+50)}>Ver más pacientes</NvButton>}</fieldset>
  {!review?<NvButton disabled={busy||!board.enabled||!preview||!selected.length||!/^\w{1,100}$/.test(template)||!/^\w{2,10}$/.test(language)} onClick={()=>setReview(true)}>Revisar difusión</NvButton>:<section><h3>Revisá antes de confirmar</h3><p>Plantilla: {template} ({language}). Destinatarios: {selected.map(id=>names.get(id)).join(', ')}.</p><p>La confirmación prepara los envíos; cada envío se procesa desde la lista de resultados. Las bajas se vuelven a verificar al reservarlo.</p><NvButton disabled={busy} onClick={()=>void confirm()}>{busy?'Guardando…':'Confirmar destinatarios'}</NvButton><NvButton className="nv-ghost" disabled={busy} onClick={()=>setReview(false)}>Volver a editar</NvButton></section>}
  <h3>Resultados individuales</h3><NvButton className="nv-soft" disabled={busy} onClick={()=>void load().catch(e=>setError(friendlyError(e)))}>Actualizar resultados</NvButton>
  {!board.deliveries.length&&<p>No hay difusiones preparadas.</p>}
  <ul>{board.deliveries.slice(0,visible).map(d=><li key={d.id}>{names.get(d.patient_id)??'Paciente no disponible'} · {labels[d.state]}{d.delivery_status&&` · ${labels[d.delivery_status]}`}{d.state==='queued'&&<NvButton disabled={busy||!board.enabled} onClick={()=>void dispatch(d.id)}>Procesar envío</NvButton>}{d.state==='sending'&&<NvButton disabled={busy||!board.enabled} onClick={()=>void dispatch(d.id)}>Revisar reserva</NvButton>}</li>)}</ul>{visible<board.deliveries.length&&<NvButton onClick={()=>setVisible(v=>v+50)}>Ver más resultados</NvButton>}
  <p>Un envío incierto no se repite automáticamente. «Aceptado por Meta» requiere un evento verificado para mostrar «Entregado» o «Leído».</p></>}
  {error&&<p role="alert">{error}</p>}
 </NvCard><EmailCommunicationPanel/></>;
}
