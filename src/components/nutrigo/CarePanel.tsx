import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import { careApi, careErrorMessage, notifyCareChanged } from '../../api/care';
import { CARE_LABELS, careInputSchema, describeCareRecord, dueCareReminders, type CareData, type CarePreferences, type CareSnapshot } from '../../types/care';
import { useCare } from './useCare';
import { CareRecipeEditor } from './CareRecipeEditor';
import { Icon } from '../shared/Icon';
import './care-panel.css';

const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Argentina/Buenos_Aires'}).format(new Date());
type Mode = 'progress' | 'activity' | 'menu' | 'professional';
type Kind = CareData['kind'];
const titles: Record<Mode,string> = { progress:'Tus registros personales', activity:'Tu actividad física', menu:'Alternativas para tu menú', professional:'Registros y seguimiento' };

export function CarePanel({ patientId, mode = 'progress' }: {patientId:string; mode?:Mode}) {
  // Remount por paciente: formularios y fotos nunca sobreviven al cambio de ficha.
  return <CarePanelContent key={`${patientId}:${mode}`} patientId={patientId} mode={mode} />;
}
function CarePanelContent({patientId,mode}:{patientId:string;mode:Mode}) {
  const professional = mode === 'professional';
  const {data,error,reload} = useCare(patientId,professional);
  const [form,setForm] = useState<Kind|null>(null);
  const [busy,setBusy] = useState(false); const lock = useRef(false);
  const [status,setStatus] = useState('');
  const [photo,setPhoto] = useState<string|null>(null);
  useEffect(() => { if (!photo) return; const timer = window.setTimeout(() => setPhoto(null),60000); return () => window.clearTimeout(timer); },[photo]);
  useEffect(() => { if (data && !data.consented.includes('body_progress')) setPhoto(null); },[data]);
  async function action(work: () => Promise<unknown>, success: string) {
    if (lock.current) return; lock.current=true; setBusy(true); setStatus('');
    try { await work(); setStatus(success); notifyCareChanged(); }
    catch(e) { setStatus(careErrorMessage(e)); }
    finally { lock.current=false; setBusy(false); }
  }
  const visible = data?.records.filter(r => professional || (mode==='progress' ? ['weight','waist','body_photo'].includes(r.data.kind) : mode==='activity' ? r.data.kind==='activity' : r.data.kind==='menu_request')) ?? [];
  const payments = data?.records.filter(r => r.data.kind==='payment') ?? [];
  const reminders = data ? dueCareReminders(data.records,data.preferences,today()) : [];
  return <section className="care-panel" aria-label={titles[mode]}>
    <header className="care-heading"><div><span className="care-eyebrow">{professional ? 'ACOMPAÑAMIENTO' : 'MI SEGUIMIENTO'}</span><h2>{titles[mode]}</h2><p>{professional ? 'Cargas del paciente, revisiones y pagos en una misma ficha.' : mode==='activity' ? 'Duración, intensidad y calorías que registre tu dispositivo, si las tenés.' : mode==='menu' ? 'Pedí un reemplazo de receta o ingrediente. Tu nutricionista revisa la propuesta antes de compartirla.' : 'Peso semanal, cintura mensual y fotos opcionales. Compartidos sólo con tu nutricionista.'}</p></div><Icon name={professional ? 'contact' : 'trend'} size={24}/></header>
    {error && <p className="care-error" role="alert">{error} <button type="button" onClick={reload}>Reintentar</button></p>}
    {!data && !error && <p role="status">Cargando registros…</p>}
    {data && <>
      {data.source==='memory' && <p className="care-demo">Vista demo · los registros de prueba se conservan mientras la API siga encendida.</p>}
      {(mode==='progress' || professional) && <div className="care-summary">{(['weight','waist'] as const).map(kind => { const latest=data.records.filter(r=>r.data.kind===kind).sort((a,b)=>b.recorded_on.localeCompare(a.recorded_on))[0]; return <article key={kind}><small>{CARE_LABELS[kind]}</small><strong>{latest ? describeCareRecord(latest) : 'Sin registro'}</strong><span>{latest?.recorded_on ?? 'Opcional'}</span></article>; })}<article><small>{professional ? 'Por revisar' : 'Recordatorios'}</small><strong>{professional ? data.records.filter(r=>!r.reviewed_at).length : reminders.length}</strong><span>{professional ? 'Registros nuevos' : 'Pendientes de tu preferencia'}</span></article></div>}
      {mode==='activity' && <div className="care-summary">{(() => { const entries=data.records.filter(r=>r.data.kind==='activity' && Date.parse(today())-Date.parse(r.recorded_on)<7*86400000); const activity=entries.flatMap(r=>r.data.kind==='activity'?[r.data]:[]); const calories=activity.filter(r=>r.kcal!==null); return <><article><small>Últimos 7 días</small><strong>{entries.length}</strong><span>actividades</span></article><article><small>Tiempo registrado</small><strong>{activity.reduce((s,r)=>s+r.minutes,0)} min</strong><span>duración declarada</span></article><article><small>Gasto declarado</small><strong>{calories.length ? `${calories.reduce((s,r)=>s+(r.kcal??0),0)} kcal` : 'Sin dato'}</strong><span>{calories.length} actividades con calorías</span></article></>; })()}</div>}
      {!professional && mode==='progress' && <CareConsent patientId={patientId} snapshot={data} />}
      <div className="care-actions">
        {(mode==='progress' ? ['weight','waist','body_photo'] as const : mode==='activity' ? ['activity'] as const : mode==='menu' ? ['menu_request'] as const : ['payment'] as const).map(kind=><button className="nv-button primary" type="button" key={kind} onClick={()=>{setForm(kind);setStatus('');}} disabled={busy || ((kind==='weight'||kind==='waist') && !data.consented.includes('measurement')) || (kind==='body_photo' && !data.consented.includes('body_progress'))}><Icon name="plus" size={16}/>{kind==='menu_request' ? 'Pedir un reemplazo' : kind==='body_photo' ? 'Agregar foto corporal' : `Registrar ${kind==='payment'?'pago':kind==='weight'?'peso':kind==='waist'?'cintura':'actividad'}`}</button>)}
      </div>
      {professional && <div className="care-payments"><h3>Registro de pagos</h3><p>Asientos manuales; no realizan cobros ni modifican el acceso del paciente.</p>{(['ARS','USD'] as const).map(currency => <strong key={currency}>{payments.reduce((s,r)=>s+(r.data.kind==='payment' && r.data.currency===currency?r.data.amount:0),0).toLocaleString('es-AR')} {currency} <small>registrados</small> </strong>)}</div>}
      <div className="care-records">{visible.length ? visible.map(record => <article key={record.id}><div><span className="care-eyebrow">{CARE_LABELS[record.data.kind]} · <time>{record.recorded_on}</time></span><h3>{describeCareRecord(record)}</h3>{'note' in record.data && record.data.note && <p>{record.data.note}</p>}{record.data.kind==='payment' && record.data.reference && <p>Referencia: {record.data.reference}</p>}<small>{record.reviewed_at ? 'Revisado' : 'Pendiente de revisión profesional'}</small></div><div className="care-actions">
        {record.data.kind==='body_photo' && <button className="nv-button" type="button" disabled={busy || !data.consented.includes('body_progress')} onClick={()=>void action(async()=>{const result=await careApi.openPhoto(patientId,record.id);setPhoto(result.url);},'Foto abierta durante un minuto.')}>Ver foto privada</button>}
        {!professional && record.data.kind==='body_photo' && <button className="nv-button" type="button" disabled={busy} onClick={()=>{if(window.confirm('¿Eliminar esta foto corporal de tu registro?'))void action(async()=>{await careApi.deletePhoto(patientId,record.id);setPhoto(null);},'Foto eliminada.');}}>Eliminar foto</button>}
        {professional && !record.reviewed_at && <button className="nv-button" type="button" disabled={busy} onClick={()=>void action(()=>careApi.review(patientId,record.id),'Registro revisado.')}>Marcar revisado</button>}
        {professional && record.data.kind==='menu_request' && !data.replacements.some(r=>r.request_id===record.id) && <button className="nv-button primary" type="button" disabled={busy || !data.consented.includes('ai_menu_draft')} onClick={()=>void action(()=>careApi.generate(patientId,record.id),'Propuesta preparada para tu revisión.')}>Preparar alternativa con IA</button>}
      </div></article>) : <p className="care-empty">Todavía no hay registros en esta sección.</p>}</div>
{(mode==='menu'||professional) && <section className="care-recipes" aria-label="Reemplazos de menú"><h3>{professional?'Propuestas de reemplazo':'Alternativas revisadas'}</h3>{professional && !data.consented.includes('ai_menu_draft') && <p>El paciente debe habilitar el consentimiento de IA para preparar propuestas.</p>}{data.replacements.map(entry=><article key={entry.id}><span className="care-eyebrow">{entry.source==='demo'?'EJEMPLO DEMO · ':''}{entry.published_at?'COMPARTIDA CON EL PACIENTE':'BORRADOR PRIVADO'}</span><h3>{entry.recipe.title}</h3><p>{entry.recipe.explanation}</p><h4>Ingredientes</h4><ul>{entry.recipe.ingredients.map((i,index)=><li key={index}>{i}</li>)}</ul><h4>Preparación</h4><ol>{entry.recipe.steps.map((s,index)=><li key={index}>{s}</li>)}</ol>{professional && !entry.published_at && <CareRecipeEditor recipe={entry.recipe} busy={busy} onPublish={recipe=>void action(()=>careApi.publish(patientId,entry.id,entry.recipe,recipe),'Alternativa revisada y compartida.')} />}</article>)}{!data.replacements.length && <p>Todavía no hay alternativas compartidas.</p>}</section>}
      {!professional && mode==='menu' && <CareConsent patientId={patientId} snapshot={data} onlyAI />}
      {!professional && mode==='progress' && <CareReminderSettings patientId={patientId} settings={data.preferences} />}
    </>}
    {status && <p className="care-status" role="status">{status}</p>}
    {form && <CareRecordForm patientId={patientId} kind={form} onClose={()=>setForm(null)} onSaved={()=>{setForm(null);setStatus('Registro guardado y disponible en la ficha de tu nutricionista.');notifyCareChanged();}}/>}
    {photo && <div className="care-modal" role="dialog" aria-modal="true" aria-label="Foto corporal privada"><div className="care-photo-view"><button className="nv-button" type="button" autoFocus onClick={()=>setPhoto(null)}>Cerrar foto</button><img src={photo} alt="Foto corporal cargada por el paciente" /></div></div>}
  </section>;
}

export function CareConsent({patientId,snapshot,onlyAI=false,meals=false}:{patientId:string;snapshot:CareSnapshot;onlyAI?:boolean;meals?:boolean}) {
  const [catalog,setCatalog]=useState<Awaited<ReturnType<typeof api.getConsentCatalog>>['consents']>([]);
  const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);const lock=useRef(false);
  useEffect(()=>{const c=new AbortController();api.getConsentCatalog({signal:c.signal}).then(r=>setCatalog(r.consents)).catch(e=>{if(!c.signal.aborted)setStatus(careErrorMessage(e));});return()=>c.abort();},[]);
  async function toggle(purpose:string, granted:boolean) {
    if(lock.current)return; const text=catalog.find(c=>c.purpose===purpose);if(!text)return;
    lock.current=true;setBusy(true);setStatus('');
    try{await api.recordConsent(patientId,{purpose,text_version:text.text_version,text_hash:text.text_hash,decision:granted?'withdrawn':'granted'});notifyCareChanged();}
    catch(e){setStatus(careErrorMessage(e));}finally{lock.current=false;setBusy(false);}
  }
  return <details className="care-consent" open={meals || (!onlyAI && !snapshot.consented.includes('measurement'))}><summary>Permisos opcionales · vos elegís qué compartir</summary>{catalog.filter(c=>(meals?['meal_photo','ai_meal_analysis']:onlyAI?['ai_menu_draft']:['measurement','body_progress']).includes(c.purpose)).map(c=><label key={c.purpose}><input type="checkbox" disabled={busy} checked={snapshot.consented.includes(c.purpose)} onChange={()=>void toggle(c.purpose,snapshot.consented.includes(c.purpose))}/><span>{c.text}</span></label>)}{status&&<p role="alert">{status}</p>}</details>;
}

function CareReminderSettings({patientId,settings}:{patientId:string;settings:CarePreferences}) {
  const [draft,setDraft]=useState(settings);const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);const lock=useRef(false);
  async function save(e:FormEvent){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);try{await careApi.preferences(patientId,draft);setStatus('Preferencias guardadas.');notifyCareChanged();}catch(e){setStatus(careErrorMessage(e));}finally{lock.current=false;setBusy(false);}}
  return <details className="care-preferences"><summary>Mis recordatorios</summary><p>Se muestran en la campana mientras la app está abierta. Podés activar avisos del navegador desde allí.</p><form onSubmit={save}><div className="care-preference-grid">{([['weight','Peso semanal'],['waist','Cintura mensual'],['activity','Actividad diaria'],['water','Tomar agua'],['rest','Descanso']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.checked})}/>{label}</label>)}</div><div className="care-form-row"><label>Agua: intervalo<select value={draft.water_interval} onChange={e=>setDraft({...draft,water_interval:Number(e.target.value)})}>{[30,60,90,120,180,240].map(n=><option key={n} value={n}>Cada {n} minutos</option>)}</select></label><label>Hora de descanso<input type="time" value={draft.rest_time} onChange={e=>setDraft({...draft,rest_time:e.target.value})}/></label></div><button className="nv-button" type="submit" disabled={busy}>Guardar recordatorios</button>{status&&<p role="status">{status}</p>}</form></details>;
}

function CareRecordForm({patientId,kind,onClose,onSaved}:{patientId:string;kind:Kind;onClose:()=>void;onSaved:()=>void}) {
  const id=useRef(crypto.randomUUID()); const lock=useRef(false);
  const [date,setDate]=useState(today());const [value,setValue]=useState('');const [note,setNote]=useState('');
  const [activity,setActivity]=useState('');const [minutes,setMinutes]=useState('30');const [kcal,setKcal]=useState('');const [intensity,setIntensity]=useState<'suave'|'moderada'|'intensa'>('moderada');
  const [currency,setCurrency]=useState<'ARS'|'USD'>('ARS');const [method,setMethod]=useState<'transferencia'|'efectivo'|'tarjeta'|'otro'>('transferencia');const [reference,setReference]=useState('');
  const [target,setTarget]=useState('');const [reason,setReason]=useState('');const [replacement,setReplacement]=useState<'recipe'|'ingredient'>('recipe');
  const [image,setImage]=useState('');const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
  // Mantener UUID y payload tras un error incierto permite reintentar sin duplicar.
  const pending=useRef<{id:string;recorded_on:string;data:CareData}|null>(null);
  async function submit(e:FormEvent){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setStatus('');
    try{
      if(kind==='body_photo'){if(!image)throw new Error('Elegí una foto.');await careApi.photo(patientId,{id:id.current,recorded_on:date,image,note});}
      else{
        const data:CareData=kind==='weight'||kind==='waist'?{kind,value:Number(value),note}:kind==='activity'?{kind,activity,minutes:Number(minutes),intensity,kcal:kcal===''?null:Number(kcal),note}:kind==='payment'?{kind,amount:Number(value),currency,method,reference,note}:{kind:'menu_request',target,reason,replacement};
        if(!pending.current){const parsed=careInputSchema.safeParse({id:id.current,recorded_on:date,data});if(!parsed.success)throw new Error('Revisá la fecha y los valores ingresados.');pending.current=parsed.data;}
        await careApi.save(patientId,pending.current);
      }
      onSaved();
    }catch(e){if(e instanceof ApiError && (e.status===400||e.status===403))pending.current=null;setStatus(careErrorMessage(e));}finally{lock.current=false;setBusy(false);}}
  async function selectPhoto(file?:File){if(!file)return;if(file.size>5*1024*1024){setStatus('La foto debe pesar menos de 5 MB.');return;}if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setStatus('Elegí JPG, PNG o WebP.');return;}const reader=new FileReader();reader.onload=()=>{setImage(String(reader.result));setStatus('');};reader.onerror=()=>setStatus('No se pudo leer la foto.');reader.readAsDataURL(file);}
  return <div className="care-modal" role="dialog" aria-modal="true" aria-labelledby="care-form-title"><form className="care-form" onSubmit={submit}><header><h2 id="care-form-title">{CARE_LABELS[kind]}</h2><button type="button" aria-label="Cerrar formulario" disabled={busy} onClick={onClose}>×</button></header><fieldset disabled={busy || Boolean(pending.current)}><label>Fecha<input type="date" max={today()} value={date} onChange={e=>setDate(e.target.value)} required autoFocus/></label>
    {(kind==='weight'||kind==='waist'||kind==='payment')&&<label>{kind==='weight'?'Peso (kg)':kind==='waist'?'Cintura (cm)':'Importe'}<input type="number" step="0.01" min={kind==='waist'?10:kind==='weight'?1:0.01} max={kind==='waist'?300:kind==='weight'?500:100000000} value={value} onChange={e=>setValue(e.target.value)} required/></label>}
    {kind==='activity'&&<><label>Actividad<input value={activity} onChange={e=>setActivity(e.target.value)} maxLength={80} minLength={2} required placeholder="Ej. Caminata"/></label><div className="care-form-row"><label>Duración (min)<input type="number" min="1" max="600" value={minutes} onChange={e=>setMinutes(e.target.value)} required/></label><label>Intensidad<select value={intensity} onChange={e=>setIntensity(e.target.value as typeof intensity)}><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></label></div><label>Calorías quemadas (opcional)<input type="number" min="0" max="10000" value={kcal} onChange={e=>setKcal(e.target.value)} placeholder="Dato de tu reloj o dispositivo"/></label><small>Si no tenés el dato, dejalo vacío. No se descuenta del plan de comidas.</small></>}
    {kind==='payment'&&<><div className="care-form-row"><label>Moneda<select value={currency} onChange={e=>setCurrency(e.target.value as typeof currency)}><option>ARS</option><option>USD</option></select></label><label>Medio<select value={method} onChange={e=>setMethod(e.target.value as typeof method)}>{['transferencia','efectivo','tarjeta','otro'].map(v=><option key={v}>{v}</option>)}</select></label></div><label>Referencia opcional<input value={reference} onChange={e=>setReference(e.target.value)} maxLength={120}/></label></>}
    {kind==='menu_request'&&<><label>Quiero reemplazar<select value={replacement} onChange={e=>setReplacement(e.target.value as typeof replacement)}><option value="recipe">Una receta</option><option value="ingredient">Un ingrediente</option></select></label><label>Receta o ingrediente<input value={target} onChange={e=>setTarget(e.target.value)} maxLength={200} minLength={2} required/></label><label>Motivo o preferencia<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} minLength={2} required placeholder="Ej. No consigo este ingrediente"/></label></>}
    {kind==='body_photo'&&<><label>Foto privada<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void selectPhoto(e.target.files?.[0])} required/></label><p>Opcional. Sólo vos y tu nutricionista pueden verla. No se analiza con IA.</p>{image&&<img className="care-upload-preview" src={image} alt="Vista previa privada"/>}</>}
    {kind!=='menu_request'&&<label>Nota opcional<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500}/></label>}</fieldset>{status&&<p role="alert" className="care-error">{status}</p>}{pending.current && !busy && <p>Conservamos el registro enviado para reintentar sin duplicarlo.</p>}<footer><button className="nv-button" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="nv-button primary" type="submit" disabled={busy}>{busy?'Guardando…':pending.current?'Reintentar guardado':'Guardar registro'}</button></footer></form></div>;
}
