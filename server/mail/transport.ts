import {brevoConfig,sendBrevoEmail,type BrevoConfig,type BrevoMessage} from './brevo.js';
export type MailTransportConfig={provider:'gmail';user:string;password:string;senderName:string;host:'smtp.gmail.com';port:465;secure:true}|{provider:'brevo';config:BrevoConfig};
export class MailDeliveryError extends Error{constructor(public uncertain:boolean){super(uncertain?'El envío requiere revisión; no se reintentará automáticamente.':'No se autorizó o no se pudo preparar el envío.');}}
type Message=BrevoMessage&{unsubscribeUrl?:string};
type Mailer={sendMail(message:Record<string,unknown>):Promise<{messageId?:string;accepted?:Array<string|{address:string}>;rejected?:unknown[]}>;close():void};
type TransportModule={createTransport(options:Record<string,unknown>):Mailer};
export function mailTransportConfig(env:Record<string,string|undefined>=process.env):MailTransportConfig|null{
 if(env.MAIL_ENABLED!=='true')return null;
 const provider=env.MAIL_PROVIDER??env.SMTP_PROVIDER;
 if(provider==='gmail'){const user=env.SMTP_USER?.trim(),password=env.SMTP_PASSWORD?.replace(/\s/g,'');if(!user||!/^[^\s@]+@(?:gmail\.com|googlemail\.com)$/i.test(user)||!password||!/^[a-z]{16}$/i.test(password))return null;return {provider:'gmail',user,password,senderName:env.SMTP_SENDER_NAME?.trim()||'Nutridash',host:'smtp.gmail.com',port:465,secure:true};}
 if(provider==='brevo'){const config=brevoConfig(env);if(config)return {provider:'brevo',config};}return null;
}
async function mailerModule():Promise<TransportModule>{const name='nodemailer';const mod=await import(name) as TransportModule&{default?:TransportModule};const value=typeof mod.createTransport==='function'?mod:mod.default;if(!value||typeof value.createTransport!=='function')throw new MailDeliveryError(false);return value;}
/** Exactly one recipient and one transport call; acceptance is not proof of inbox delivery. */
export async function sendOperationalMail(config:MailTransportConfig,message:Message,canSend:()=>Promise<boolean>,module?:TransportModule,fetcher:typeof fetch=fetch):Promise<{providerId:string|null}>{
 const mailOk=(email:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 if(!mailOk(message.to.email)||/[\r\n]/.test(message.subject)||/[\r\n]/.test(message.senderName??'')||(message.replyTo&&(!mailOk(message.replyTo.email)||/[\r\n]/.test(message.replyTo.name??'')))||!await canSend())throw new MailDeliveryError(false);
 if(config.provider==='brevo'){try{await sendBrevoEmail(config.config,message,(url,init)=>fetcher(url,{...init,signal:AbortSignal.timeout(15000),redirect:'error'}));return {providerId:null};}catch{throw new MailDeliveryError(true);}}
 let transport:Mailer;try{const factory=module??await mailerModule();transport=factory.createTransport({host:config.host,port:config.port,secure:true,pool:false,auth:{user:config.user,pass:config.password},tls:{rejectUnauthorized:true},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});}catch{throw new MailDeliveryError(false);}
 try{if(!await canSend())throw new MailDeliveryError(false);const result=await transport.sendMail({from:{name:message.senderName??config.senderName,address:config.user},...(message.replyTo?{replyTo:{name:message.replyTo.name??'',address:message.replyTo.email}}:{}),to:[{address:message.to.email,name:message.to.name}],subject:message.subject,text:message.text,html:message.html,...(message.idempotencyKey?{messageId:`<${message.idempotencyKey}@${config.user.split('@')[1]}>`}:{}),...(message.unsubscribeUrl?{headers:{'List-Unsubscribe':`<${message.unsubscribeUrl}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}}:{})});if(result.rejected?.length||!result.accepted?.some(a=>(typeof a==='string'?a:a.address).toLowerCase()===message.to.email.toLowerCase()))throw new MailDeliveryError(true);return {providerId:result.messageId??null};}
 catch(error){if(error instanceof MailDeliveryError)throw error;const e=error as {code?:string;responseCode?:number};throw new MailDeliveryError(!(e.responseCode&&e.responseCode>=400)&&!['EAUTH','EENVELOPE','EMESSAGE','ETLS'].includes(e.code??''));}
 finally{try{transport.close();}catch{/* Cleanup cannot replace a known SMTP acceptance or the original delivery error. */}}
}
