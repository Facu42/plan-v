import { useRef, useState } from 'react';
import { CajonV29, Campo } from './CajonV29';
import { plansApi } from '../../api/plans';
import { careErrorMessage } from '../../api/care';
import type { ProfessionalRecipe } from '../../types/recipes';
import { PLAN_SLOTS, type PlanSlot, type ProfessionalMealPlan } from '../../types/plans';
import { recetaEnBorrador } from './planes-receta-borrador';

export function PanelPlanAgregarReceta({ receta, pacientes, pacienteId, hoy, onClose, onSaved }: { receta: ProfessionalRecipe; pacientes: {id:string;name:string}[]; pacienteId: string; hoy:string; onClose:()=>void; onSaved:(plan:ProfessionalMealPlan)=>void }) {
 const [id,setId]=useState(pacienteId || pacientes[0]?.id || '');
 const [fecha,setFecha]=useState(hoy),[slot,setSlot]=useState<PlanSlot>('Almuerzo'),[porciones,setPorciones]=useState(1),[reemplazar,setReemplazar]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 async function guardar(){
  if(lock.current || !id)return;
  lock.current=true;setBusy(true);setError('');
  try { const {plan}=await plansApi.professional(id);const input=recetaEnBorrador(plan,receta,fecha,slot,porciones,reemplazar);const result=await plansApi.save(id,input);onSaved(result.plan); }
  catch(e){setError(careErrorMessage(e));}finally{lock.current=false;setBusy(false);}
 }
 return <CajonV29 titulo="Agregar receta al plan" sub={receta.title} ok={false} antesDeCerrar={() => !lock.current} onClose={()=>{if(!lock.current)onClose();}}>
  <p className="mhelp">Se guarda en el borrador. Revisá el plan y publicalo cuando esté listo; el plan que ve la paciente se conserva.</p>
  <form onSubmit={e=>{e.preventDefault();void guardar();}}><fieldset disabled={busy} style={{border:0,padding:0,margin:0}}>
   <Campo etiqueta="Paciente"><select aria-label="Paciente" className="ai" required value={id} onChange={e=>{setId(e.target.value);setReemplazar(false);}}>{pacientes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Campo>
   <Campo etiqueta="Día"><input className="ai" required type="date" value={fecha} onChange={e=>{setFecha(e.target.value);setReemplazar(false);}}/></Campo>
   <Campo etiqueta="Comida"><select aria-label="Comida" className="ai" value={slot} onChange={e=>{setSlot(e.target.value as PlanSlot);setReemplazar(false);}}>{PLAN_SLOTS.map(s=><option key={s}>{s}</option>)}</select></Campo>
   <Campo etiqueta="Porciones"><input className="ai" type="number" min="0.01" max="50" step="0.01" required value={porciones} onChange={e=>setPorciones(Number(e.target.value))}/></Campo>
   <label className="af"><span><input type="checkbox" checked={reemplazar} onChange={e=>setReemplazar(e.target.checked)}/> Reemplazar la comida existente, si ya hay una en ese día y momento</span></label>
   {error && <p role="alert">{error}</p>}
   <button className="cta" disabled={busy || !id} type="submit">{busy?'Guardando…':'Agregar al borrador'}</button>
  </fieldset></form>
 </CajonV29>;
}
