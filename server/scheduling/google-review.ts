import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {CareError} from '../care/errors.js';
import {privilegedDb} from '../db/supabase-client.js';
import {schedulingDbError,getConnection} from './repository.js';
import {accessToken} from './providers.js';
export type GoogleReviewKind='booking'|'appointment';
export type GoogleReviewContext={job:string;kind:GoogleReviewKind;target:string;nid:string;revision:number;profile_revision:number;starts_at:string;duration_min:number;status:string;want_meet:boolean;write_account:string;write_calendar:string;calendar:string};
export const googleReviewConfirmSchema=z.object({expected_revision:z.number().int().positive(),proof:z.string().min(40).max(4000),action:z.enum(['accept_match','requeue']),confirmed:z.literal(true)}).strict();
export type GoogleReviewConfirm=z.infer<typeof googleReviewConfirmSchema>;
type Remote={event:unknown;accountId:string;epoch:string};
type Review={matched:boolean;found:boolean;remote_start:string|null;remote_duration:number|null;remote_revision:number|null;can_requeue:boolean};
type Options={load:(nid:string,kind:GoogleReviewKind,target:string)=>Promise<GoogleReviewContext>;read:(context:GoogleReviewContext)=>Promise<Remote>;resolve:(context:GoogleReviewContext,epoch:string,action:GoogleReviewConfirm['action'],meet:string|null)=>Promise<boolean>;secret:string;now?:()=>number};
const eventSchema=z.object({etag:z.string().min(1),status:z.string().optional(),start:z.object({dateTime:z.string()}).optional(),end:z.object({dateTime:z.string()}).optional(),hangoutLink:z.string().optional(),extendedProperties:z.object({private:z.record(z.string(),z.string())})});
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function createGoogleReviewer(options:Options){
 const now=options.now??Date.now;
 const mac=(payload:string)=>createHmac('sha256',options.secret).update(payload).digest();
 function sign(value:unknown){if(options.secret.length<32)throw new CareError(501,'Completá la configuración segura de las reservas.');const data=Buffer.from(JSON.stringify(value)).toString('base64url');return `${data}.${mac(data).toString('base64url')}`;}
 function verify(proof:string):Record<string,unknown>{const [data,sig,...rest]=proof.split('.');if(!data||!sig||rest.length||options.secret.length<32)throw new CareError(403,'La revisión no es válida.');const actual=Buffer.from(sig,'base64url'),expected=mac(data);if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new CareError(403,'La revisión no es válida.');try{return JSON.parse(Buffer.from(data,'base64url').toString()) as Record<string,unknown>;}catch{throw new CareError(403,'La revisión no es válida.');}}
 async function inspectCurrent(nid:string,kind:GoogleReviewKind,target:string,expectedRevision:number|undefined){
  const context=await options.load(nid,kind,target);
  const revision=expectedRevision??context.revision;
  if(context.nid!==nid||context.kind!==kind||context.target!==target||context.revision!==revision||!context.write_account||!context.write_calendar||context.calendar!==context.write_calendar)throw new CareError(409,'La reserva, la cuenta o el calendario cambiaron. Revisá la conexión original antes de conciliar.');
  const remote=await options.read(context);
  if(remote.accountId!==context.write_account)throw new CareError(409,'Conectá la cuenta original para comprobar el envío incierto.');
  const parsed=remote.event==null?null:eventSchema.safeParse(remote.event);
  if(parsed&&!parsed.success)throw new CareError(503,'No se pudo verificar el evento de Google.');
  const event=parsed?.success?parsed.data:null,marker=event?.extendedProperties.private;
  if(event&&marker?.planv_booking!==target)throw new CareError(403,'El evento corresponde a otro origen. No se modifica.');
  const remoteRevision=marker?.planv_revision==null?null:Number(marker.planv_revision);
  if(remoteRevision!==null&&(!Number.isSafeInteger(remoteRevision)||remoteRevision<1||remoteRevision>revision))throw new CareError(409,'Google contiene una revisión incompatible. Conservá el evento para revisarlo.');
  const found=Boolean(event&&event.status!=='cancelled'),start=found&&event?.start?.dateTime?Date.parse(event.start.dateTime):NaN,end=found&&event?.end?.dateTime?Date.parse(event.end.dateTime):NaN;
  if(found&&(!Number.isFinite(start)||!Number.isFinite(end)||end<=start))throw new CareError(503,'No se pudo verificar la duración del evento.');
  const meet=event?.hangoutLink&&/^https:\/\/meet\.google\.com\/[a-z-]+$/.test(event.hangoutLink)?event.hangoutLink:null;
  const matched=context.status==='cancelled'?!found:found&&start===Date.parse(context.starts_at)&&end-start===context.duration_min*60000&&remoteRevision===revision&&(!context.want_meet||Boolean(meet));
  const review:Review={matched,found,remote_start:found?new Date(start).toISOString():null,remote_duration:found?(end-start)/60000:null,remote_revision:remoteRevision,can_requeue:!matched};
  const evidence=hash({context,epoch:remote.epoch,event: event?{etag:event.etag,status:event.status??'confirmed',start:event.start,end:event.end,revision:remoteRevision,meet}:null});
  return{context,epoch:remote.epoch,review,evidence,meet};
 }
 return{
  async inspect(nid:string,kind:GoogleReviewKind,target:string,revision?:number){const current=await inspectCurrent(nid,kind,target,revision);return{revision:current.context.revision,review:current.review,proof:sign({nid,kind,target,revision:current.context.revision,evidence:current.evidence,expires:now()+300000})};},
  async confirm(nid:string,kind:GoogleReviewKind,target:string,input:GoogleReviewConfirm){
   googleReviewConfirmSchema.parse(input);const proof=verify(input.proof);
   if(proof.nid!==nid||proof.kind!==kind||proof.target!==target||proof.revision!==input.expected_revision||typeof proof.expires!=='number'||proof.expires<=now())throw new CareError(403,'La revisión venció o corresponde a otro consultorio.');
   const current=await inspectCurrent(nid,kind,target,input.expected_revision);
   if(proof.evidence!==current.evidence||(input.action==='accept_match'?!current.review.matched:!current.review.can_requeue))throw new CareError(409,'Google cambió desde la revisión. Volvé a comprobar el evento.');
   if(!await options.resolve(current.context,current.epoch,input.action,current.meet))throw new CareError(409,'El trabajo o la conexión cambió. Volvé a revisar.');
   return{resolved:true,queued:input.action==='requeue'};
  }
 };
}
function reviewer(requestedBy?:string){return createGoogleReviewer({secret:process.env.SCHEDULING_BOOKING_SECRET??'',
 load:async(nid,kind,target)=>{const r=await privilegedDb().rpc('scheduling_google_review_context',{nid,kind,target});schedulingDbError(r.error);if(!r.data)throw new CareError(409,'No hay un envío incierto para revisar.');return r.data as GoogleReviewContext;},
 read:async(context)=>{const {token,accountId,epoch}=await accessToken(context.nid,'google',true);let response:Response;try{response=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(context.write_calendar)}/events/${context.target.replace(/-/g,'')}`,{headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new CareError(503,'Google no respondió. La sincronización sigue incierta.');}if(!response.ok&&![404,410].includes(response.status))throw new CareError(503,'No se pudo comprobar el evento.');const event=response.ok?await response.json():null;if((await getConnection(context.nid,'google',true))?.epoch!==epoch)throw new CareError(409,'La conexión cambió durante la revisión.');return{event,accountId,epoch};},
 resolve:async(context,epoch,action,meet)=>{const r=await privilegedDb().rpc('scheduling_resolve_google_review',{nid:context.nid,kind:context.kind,target:context.target,job:context.job,expected_revision:context.revision,expected_profile_revision:context.profile_revision,expected_epoch:epoch,mode:action,meet,requested_by:requestedBy??null});schedulingDbError(r.error);return r.data===true;}
 });}
export const inspectGoogleReview=(nid:string,kind:GoogleReviewKind,target:string,revision?:number)=>reviewer().inspect(nid,kind,target,revision);
export const confirmGoogleReview=(nid:string,kind:GoogleReviewKind,target:string,input:GoogleReviewConfirm,requestedBy?:string)=>reviewer(requestedBy).confirm(nid,kind,target,input);
