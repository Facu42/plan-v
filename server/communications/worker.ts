import {randomBytes,createHash} from 'node:crypto';
import {privilegedDb,isSupabaseEnabled} from '../db/supabase-client.js';
import {queueDbError} from '../crm/repository.js';
import {siteUrl} from '../admin/accounts.js';
import {mailTransportConfig,sendOperationalMail,MailDeliveryError,type MailTransportConfig} from '../mail/transport.js';
import {reminderWindow} from '../mail/reminders.js';
import {appointmentReminderEmail} from '../mail/templates.js';
import {stableUuid} from '../mail/brevo.js';
import {whatsappConfig,sendApprovedTemplate,DeliveryError,type WhatsAppConfig} from './provider.js';
import {emailBroadcastContent} from './catalog.js';
type Claim={token:string;channel:'email'|'whatsapp';kind:'reminder'|'broadcast';phone:string|null;email:string|null;template:string|null;language:string|null;template_hash:string|null;appointment_id:string|null;starts_at:string|null};
export async function dispatchCommunicationDelivery(nid:string,id:string,configuration?:{mail?:MailTransportConfig|null;whatsapp?:WhatsAppConfig|null;site?:string}){
 const db=privilegedDb(),mail=configuration?.mail??mailTransportConfig(),wa=configuration?.whatsapp??whatsappConfig(),site=configuration?.site??siteUrl();
 const claim=await db.rpc('ops_claim_delivery',{p_nutritionist:nid,p_item:id});queueDbError(claim.error);const item=claim.data as Claim|null;if(!item)return {claimed:false};
 let state:'accepted'|'cancelled'|'uncertain'|'failed'='accepted',providerId:string|null=null,revoked=false,attempted=false;
 const canSend=async()=>{const r=await db.rpc('ops_check_delivery',{p_nutritionist:nid,p_item:id,p_token:item.token});queueDbError(r.error);revoked=r.data!==true;return !revoked;};
 try{
  if(item.channel==='whatsapp'){if(!wa?.enabled||!item.phone||!item.template||!item.language||!item.template_hash)throw new DeliveryError(false);attempted=true;providerId=await sendApprovedTemplate(wa,item.phone,item.template,item.language,fetch,canSend,item.template_hash);}
  else{
   if(!mail||!item.email||!site||!site.startsWith('https://'))throw new MailDeliveryError(false);
   const raw=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(raw).digest('hex'),link=new URL('/api/public/communications/email-unsubscribe',site);link.searchParams.set('token',raw);
   const bind=await db.rpc('ops_bind_email_unsubscribe',{p_item:id,p_token:item.token,p_hash:hash});queueDbError(bind.error);if(!bind.data)throw new MailDeliveryError(false);
   let content:ReturnType<typeof appointmentReminderEmail>;
   if(item.kind==='broadcast'){if(!item.template||!item.template_hash)throw new MailDeliveryError(false);content=emailBroadcastContent(item.template,item.template_hash,site,link.href);}
   else{
    const a=await db.from('appointments').select('id,patient_id,nutritionist_id,starts_at,channel,meet_url').eq('id',item.appointment_id!).eq('nutritionist_id',nid).eq('starts_at',item.starts_at!).eq('status','scheduled').single();queueDbError(a.error);if(!a.data)throw new MailDeliveryError(false);
    const [p,n]=await Promise.all([db.from('patients').select('full_name').eq('id',a.data.patient_id).eq('nutritionist_id',nid).single(),db.from('nutritionists').select('display_name').eq('id',nid).single()]);queueDbError(p.error);queueDbError(n.error);
    const original=appointmentReminderEmail({patientName:String(p.data?.full_name??''),nutritionistName:String(n.data?.display_name??''),startsAt:a.data.starts_at,channel:a.data.channel==='video'?'video':'presencial',meetUrl:a.data.meet_url,site});
    content={...original,text:`${original.text}\nPara dejar de recibir correos: ${link.href}`,html:`${original.html}<p><a href="${link.href}">Dejar de recibir correos</a></p>`};
   }
   attempted=true;const sent=await sendOperationalMail(mail,{to:{email:item.email},...content,idempotencyKey:stableUuid(`ops:${id}`),unsubscribeUrl:link.href},canSend);providerId=sent.providerId??`brevo:${id}`;
  }
 }catch(error){state=revoked?'cancelled':error instanceof MailDeliveryError||error instanceof DeliveryError?(error.uncertain?'uncertain':'failed'):attempted?'uncertain':'failed';}
 const finish=await db.rpc('ops_finish_delivery',{p_item:id,p_token:item.token,p_state:state,p_provider:providerId});queueDbError(finish.error);return {claimed:true,state:finish.data?state:'uncertain'};
}
/** Explicitly enabled transports only; queue replay never reclaims an uncertain external delivery. */
export async function tickCommunicationJobs(now=new Date(),limit=10){
 if(!isSupabaseEnabled())return {prepared:0,processed:0};const db=privilegedDb(),mail=mailTransportConfig(),wa=whatsappConfig(),site=siteUrl();
 const expired=await db.rpc('ops_expire_delivery_leases');queueDbError(expired.error);const {from,to}=reminderWindow(now);let prepared=0,processed=0;
 for(const channel of ['email','whatsapp']as const){if(channel==='email'?(!mail||!site?.startsWith('https://')):!wa?.enabled)continue;
  const enqueued=await db.rpc('ops_enqueue_reminders',{p_from:from,p_to:to,p_channel:channel});queueDbError(enqueued.error);prepared+=Number(enqueued.data??0);
  let query=db.from('ops_deliveries').select('id,nutritionist_id').eq('channel',channel).eq('state','queued');if(channel==='whatsapp')query=query.eq('kind','reminder');
  const rows=await query.order('updated_at').order('id').limit(Math.max(1,Math.min(50,limit)));queueDbError(rows.error);
  for(const row of rows.data??[]){await dispatchCommunicationDelivery(row.nutritionist_id,row.id,{mail,whatsapp:wa,site:site??undefined});processed++;}
 }
 return {prepared,processed};
}
