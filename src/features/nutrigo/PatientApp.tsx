import { useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { ShowroomPatient } from '../../components/nutrigo/showroom-model';
import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';
import { FigmaRecordDialog } from '../../components/nutrigo/FigmaPatientFront';
import { CarePanel } from '../../components/nutrigo/CarePanel';
import { PatientBodyDataCard, PatientNutritionTarget } from '../../components/nutrigo/ShowroomNutritionTarget';
import { ShowroomPagos } from '../../components/nutrigo/ShowroomPagos';
import { ShowroomPrivacy } from '../../components/nutrigo/ShowroomPrivacy';
import { MealLogModal } from '../../components/patient/MealLogModal';
import { suggestSlot } from '../../components/patient/meal-log-helpers';
import { FramePair } from './FramePair';
import { FeeNoticeProvider } from './fee-notice';
import { nodeName } from './SourceView';
import { NutrigoHome } from './screens/Home';
import { NutrigoMenu } from './screens/Menu';
import { NutrigoPlan } from './screens/Plan';
import { NutrigoDiary } from './screens/Diary';
import { NutrigoAgenda } from './screens/Agenda';
import { NutrigoProgress } from './screens/Progress';
import { NutrigoExercise } from './screens/Exercise';
import { NutrigoShopping } from './screens/Shopping';
import { NutrigoMessages } from './screens/Messages';
import { NutrigoResources } from './screens/Resources';
import { errorText } from './screens/shared';
import { notifyCareChanged } from '../../api/care';
import { HABIT_LIMITS, parseHabitInput } from '../../lib/habit-input';
import { PatientAiPermissions } from './PatientAiPermissions';
import { canLeaveWorkspace,useUnsavedChanges } from '../../components/nutrigo/unsaved-changes';
import { patientExtraBinding } from './patient-extra-binding';

function HabitForm({patient,kind,onClose}:{patient:ShowroomPatient;kind:'water'|'rest'|'steps';onClose:()=>void}) {
  const initial=kind==='water'?String(patient.hydration):kind==='steps'?patient.steps==null?'':String(patient.steps):patient.sleepMinutes==null?'':String(patient.sleepMinutes);
  const [value,setValue]=useState(initial);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);const add=useAppStore(s=>s.addPatient);
  useUnsavedChanges(value!==initial,busy);
  const submit=async(event:FormEvent)=>{event.preventDefault();if(lock.current)return;const number=parseHabitInput(value,kind);if(number===null){setError('Revisá el valor antes de guardar.');return;}lock.current=true;setBusy(true);setError('');try{const response=await api.updateHabits(patient.id,kind==='water'?{hydration:number}:kind==='steps'?{steps:number}:{sleep_minutes:number});add(response.patient);notifyCareChanged();onClose();}catch(e){setError(errorText(e));}finally{lock.current=false;setBusy(false);}};
  return <FigmaRecordDialog title={kind==='water'?'Registrar agua':kind==='steps'?'Registrar pasos':'Registrar descanso'} onClose={()=>{if(canLeaveWorkspace())onClose();}}><form onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}><label>{kind==='water'?'Vasos tomados hoy':kind==='steps'?'Pasos de hoy':'Minutos dormidos'}<input type="number" min="0" max={HABIT_LIMITS[kind]} step="1" required value={value} onChange={e=>setValue(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button type="submit" className="mcp-action">{busy?'Guardando…':'Guardar registro'}</button></fieldset></form></FigmaRecordDialog>;
}
export function NutrigoPatientApp({patient,page,onNavigate,onSignOut,onEditIntake,query='',now=new Date(),onConfirm,onReschedule,demoRoleSwitch}:{patient:ShowroomPatient;page:ShowroomPage;onNavigate:(page:ShowroomPage)=>void;onSignOut?:()=>void;onEditIntake:()=>void;query?:string;now?:Date;onConfirm:(reply:'attending'|'needs_change')=>Promise<void>;onReschedule:(day:string,time:string)=>Promise<void>;demoRoleSwitch?:()=>void}) {
  const fullPatient=useAppStore(state=>state.patients.find(item=>item.id===patient.id));
  const [dialog,setDialog]=useState<'records'|'water'|'rest'|'steps'|null>(null),[slot,setSlot]=useState<string|null>(null),[privacy,setPrivacy]=useState(false);
  const common={patient,onNavigate,onSignOut,query,now};
  const onRecord=()=>setDialog('records'),onHydration=()=>setDialog('water'),onRest=()=>setDialog('rest'),onSteps=()=>setDialog('steps'),onLogMeal=(mealSlot:string=suggestSlot(new Date().getHours()))=>setSlot(mealSlot);
  let screen;
  if(page==='inicio')screen=<NutrigoHome {...common} onRecord={onRecord} onHydration={onHydration} onRest={onRest} onSteps={onSteps} onLogMeal={onLogMeal}/>;
  else if(page==='recetas')screen=<NutrigoMenu {...common}/>;
  else if(page==='plan')screen=<NutrigoPlan {...common}/>;
  else if(page==='diario')screen=<NutrigoDiary {...common} onLogMeal={onLogMeal} onHydration={onHydration} onRest={onRest}/>;
  else if(page==='agenda')screen=<NutrigoAgenda {...common} onConfirm={onConfirm} onReschedule={onReschedule}/>;
  else if(page==='progreso')screen=<NutrigoProgress {...common} onRecord={onRecord} onHydration={onHydration} onRest={onRest}/>;
  else if(page==='ejercicio')screen=<NutrigoExercise {...common}/>;
  else if(page==='compras')screen=<NutrigoShopping {...common}/>;
  else if(page==='mensajes')screen=<NutrigoMessages {...common}/>;
  else if(page==='recursos')screen=<NutrigoResources {...common}/>;
  else screen=<FramePair nodes={['84:2994','470:15300']} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} resolve={node=>{
    const shell=patientExtraBinding(node,page==='pagos'?'pagos':'ficha',onNavigate);
    if(shell)return shell;
    if(!['Body','Table'].includes(nodeName(node)))return undefined;
    return {children:<section className="mcp-extra-content" aria-label={page==='pagos'?'Mis pagos':'Mi ficha y permisos'}>
      {page==='pagos'?<ShowroomPagos patientId={patient.id}/>:<>
        <div className="mcp-extra-actions">
          <button className="mcp-action" onClick={onEditIntake}>Editar mi ficha inicial</button>
          <button className="mcp-action" onClick={()=>setPrivacy(true)}>Mis datos y permisos</button>
        </div>
        <PatientNutritionTarget patientId={patient.id}/>
        <PatientBodyDataCard patientId={patient.id} forceOpen onSaved={notifyCareChanged}/>
        <div className="mcp-extra-actions">
          <button className="mcp-action" onClick={onRecord}>Peso, medidas y archivos privados</button>
          <button className="mcp-action" onClick={()=>onNavigate('pagos')}>Mis pagos</button>
        </div>
        <PatientAiPermissions key={patient.id} patientId={patient.id}/>
      </>}
    </section>};
  }}/>;
  return <FeeNoticeProvider patientId={patient.id}>{screen}{demoRoleSwitch&&<div className="mcp-nutrigo mcp-screen-state"><button className="mcp-action" onClick={demoRoleSwitch}>Ver consultorio de demostración</button></div>}
    <div className="mcp-patient-overlays">
    {dialog==='records'&&<FigmaRecordDialog title="Mis registros" onClose={()=>{if(canLeaveWorkspace())setDialog(null);}}><PatientBodyDataCard patientId={patient.id} forceOpen onSaved={notifyCareChanged}/><CarePanel patientId={patient.id}/></FigmaRecordDialog>}
    {(dialog==='water'||dialog==='rest'||dialog==='steps')&&<HabitForm patient={patient} kind={dialog} onClose={()=>setDialog(null)}/>}
    {slot&&fullPatient&&<MealLogModal patient={fullPatient} defaultSlot={slot} close={()=>setSlot(null)}/>}
    {privacy&&<ShowroomPrivacy patientId={patient.id} onClose={()=>setPrivacy(false)} onDeleted={()=>{setPrivacy(false);onSignOut?.();}}/>}
    </div>
  </FeeNoticeProvider>;
}
