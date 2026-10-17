import type {ConsultationSession,ConsultationView,ConsultationCommand} from '../../types/consultations';
export type ConsultationPage<T>={value:T;ids:string[];count:number;hasMore:boolean};
export type NoteRevisionBase={id:string;revision:number};
export type PrivateNoteEditor={draft:string;transcript:string;dirty:boolean;base:NoteRevisionBase|null;transcriptEdited:boolean};
export function privateEditorAfterAction(editor:PrivateNoteEditor,session:ConsultationSession,privateSaved:boolean):PrivateNoteEditor{if(editor.dirty&&editor.base?.id===session.id&&!privateSaved)return editor;return {draft:session.draft,transcript:session.transcript,dirty:false,base:{id:session.id,revision:session.revision},transcriptEdited:false};}
export function consultationDraftUpdate(session:ConsultationSession,base:NoteRevisionBase|null,draft:string,transcript:string,edited:boolean):ConsultationCommand{return {action:'draft',id:session.id,expected_revision:base?.id===session.id?base.revision:session.revision,draft,...(edited?{transcript}:{})};}
export function consultationPublishUpdate(session:ConsultationSession,base:NoteRevisionBase|null,summary:string):ConsultationCommand{return {action:'publish',id:session.id,expected_revision:base?.id===session.id?base.revision:session.revision,summary};}
export function noteRevisionBase(base:NoteRevisionBase|null,session:ConsultationSession,dirty:boolean):NoteRevisionBase{return dirty&&base?.id===session.id?base:{id:session.id,revision:session.revision};}
type RetainedView=ConsultationView&{retained_session_ids?:string[]};
export function mergeConsultationViews(previous:RetainedView,next:ConsultationView,offset:number,selected:string|null):RetainedView{
 if(!offset){const retained=previous.sessions.find(s=>s.id===selected&&!next.sessions.some(n=>n.id===s.id));return {...next,sessions:retained?[...next.sessions,retained]:next.sessions,retained_session_ids:retained?[retained.id]:[]};}
 const retained=new Set(previous.retained_session_ids??[]);
 if(next.sessions.some(s=>previous.sessions.some(p=>p.id===s.id)&&!retained.has(s.id))||next.shared.some(s=>previous.shared.some(p=>p.id===s.id)))throw new Error('Recibimos registros repetidos. Actualizá las consultas.');
 return {sessions:[...previous.sessions.filter(p=>!retained.has(p.id)||!next.sessions.some(s=>s.id===p.id)),...next.sessions],shared:[...previous.shared,...next.shared],tasks:next.tasks,retained_session_ids:[...retained].filter(id=>!next.sessions.some(s=>s.id===id))};
}
export function commandSession(result:unknown,patientId:string):ConsultationSession|null{const value=result&&typeof result==='object'&&'session'in result?result.session:result;if(!value||typeof value!=='object'||!('id'in value)||typeof value.id!=='string'||!('patient_id'in value)||value.patient_id!==patientId||!('revision'in value)||typeof value.revision!=='number'||!('draft'in value)||typeof value.draft!=='string'||!('transcript'in value)||typeof value.transcript!=='string')return null;return value as ConsultationSession;}
/** One read/commit per page; patient generations fence late replies without touching writes. */
export class ConsultationPageGate<T>{
 offset=0;
 private owner='';private generation=0;private seen=new Set<string>();
 private pending:{offset:number;generation:number;promise:Promise<boolean>}|null=null;
 get busy(){return this.pending!==null;}
 reset(owner:string){this.owner=owner;this.generation++;this.offset=0;this.seen.clear();this.pending=null;}
 load(owner:string,offset:number,read:()=>Promise<ConsultationPage<T>>,apply:(value:T)=>void,fresh=false):Promise<boolean>{
  if(owner!==this.owner)return Promise.resolve(false);
  if(this.pending){if(this.pending.offset===offset&&!fresh)return this.pending.promise;if(offset===0)return this.pending.promise.then(()=>this.load(owner,0,read,apply),()=>this.load(owner,0,read,apply));return Promise.resolve(false);}
  if(!Number.isInteger(offset)||offset<0||(offset!==0&&offset!==this.offset))return Promise.reject(new Error('La página cambió. Actualizá las consultas antes de continuar.'));
  const generation=this.generation;
  const run=(async()=>{
   const next=await read();if(this.owner!==owner||this.generation!==generation)return false;
   if(!next||!Number.isInteger(next.count)||next.count<0||next.count>50||typeof next.hasMore!=='boolean'||!Array.isArray(next.ids)||next.ids.length<next.count||next.ids.length>next.count*2||next.hasMore&&next.count===0)throw new Error('La página de consultas está incompleta. Reintentá sin saltar registros.');
   const ids=new Set<string>();for(const id of next.ids){if(typeof id!=='string'||!id.trim()||ids.has(id)||offset!==0&&this.seen.has(id))throw new Error('Recibimos una página repetida o inválida. Actualizá las consultas antes de continuar.');ids.add(id);}
   const previousOffset=this.offset,previousSeen=this.seen;this.offset=offset+50;this.seen=offset===0?ids:new Set([...this.seen,...ids]);
   try{apply(next.value);}catch(error){this.offset=previousOffset;this.seen=previousSeen;throw error;}return true;
  })();
  const promise=run.finally(()=>{if(this.pending?.generation===generation&&this.pending.offset===offset)this.pending=null;});this.pending={offset,generation,promise};return promise;
 }
}
