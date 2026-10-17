import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const templateHash=(text:string)=>createHash('sha256').update(text).digest('hex');
export type WhatsAppConfig={token:string;phoneId:string;businessId:string;version:string;enabled:boolean};
export class DeliveryError extends Error { constructor(public uncertain:boolean){super(uncertain?'Entrega incierta: no se reintenta automáticamente.':'No se pudo enviar la plantilla aprobada.');} }
export const normalPhone=(value:string)=>/^\+[1-9][0-9]{7,14}$/.test(value)?value:null;
export const isOptOut=(value:string)=>/^(baja|stop|cancelar|unsubscribe)$/i.test(value.trim());
export function verifyWhatsAppSignature(raw:string,signature:string|undefined,secret:string) {
  if(!secret||!signature||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;
  return timingSafeEqual(Buffer.from(signature.slice(7),'hex'),createHmac('sha256',secret).update(raw).digest());
}
export function whatsappConfig(env:NodeJS.ProcessEnv=process.env):WhatsAppConfig|null {
  if(!env.WHATSAPP_ACCESS_TOKEN||!env.WHATSAPP_PHONE_ID||!env.WHATSAPP_BUSINESS_ID)return null;
  const optOutConfigured=Boolean(env.WHATSAPP_APP_SECRET?.trim()&&env.WHATSAPP_VERIFY_TOKEN?.trim());
  return {token:env.WHATSAPP_ACCESS_TOKEN,phoneId:env.WHATSAPP_PHONE_ID,businessId:env.WHATSAPP_BUSINESS_ID,version:env.WHATSAPP_GRAPH_VERSION??'v22.0',enabled:env.WHATSAPP_ENABLED==='true'&&optOutConfigured};
}
export async function readApprovedTemplate(config:WhatsAppConfig,name:string,language:string,fetcher:typeof fetch=fetch):Promise<string> {
  if(!/^\d+$/.test(config.phoneId)||!/^\d+$/.test(config.businessId)||!/^v\d+\.\d+$/.test(config.version)||!/^\w{1,100}$/.test(name)||!/^\w{2,10}$/.test(language))throw new DeliveryError(false);
  const base=`https://graph.facebook.com/${config.version}`;
  const headers={Authorization:`Bearer ${config.token}`,'Content-Type':'application/json'};
  try {
    // Exact name filter avoids truncated template listings. Parameters are deliberately unsupported.
    const result=await fetcher(`${base}/${config.businessId}/message_templates?name=${encodeURIComponent(name)}&fields=name,language,status,components`,{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!result.ok)throw new DeliveryError(false);
    const body=await result.json() as {data?:Array<{name:string;language:string;status:string;components?:Array<{type?:string;format?:string;text?:string}>}>};
    const template=body.data?.find(t=>t.name===name&&t.language===language&&t.status==='APPROVED'
      &&t.components?.length===1&&t.components.some(c=>c.type==='BODY'&&/\b(BAJA|STOP)\b/i.test(c.text??''))
      &&t.components.every(c=>!c.text?.includes('{{')&&(!c.format||c.format==='TEXT')&&c.type!=='BUTTONS'));
    const text=template?.components?.find(c=>c.type==='BODY')?.text;if(!text)throw new DeliveryError(false);return text;
  }catch{throw new DeliveryError(false);}
}
export async function sendApprovedTemplate(config:WhatsAppConfig,phone:string,name:string,language:string,fetcher:typeof fetch=fetch,authorizeSend:()=>Promise<boolean>=async()=>true,reviewedHash?:string):Promise<string> {
  if(!config.enabled||!normalPhone(phone))throw new DeliveryError(false);
  const text=await readApprovedTemplate(config,name,language,fetcher);
  if(reviewedHash&&templateHash(text)!==reviewedHash)throw new DeliveryError(false);
  const base=`https://graph.facebook.com/${config.version}`;
  const headers={Authorization:`Bearer ${config.token}`,'Content-Type':'application/json'};
  if(!await authorizeSend())throw new DeliveryError(false);
  // Never retry a POST: a network failure can occur after Meta accepted the message.
  try {
    const result=await fetcher(`${base}/${config.phoneId}/messages`,{method:'POST',headers,body:JSON.stringify({messaging_product:'whatsapp',to:phone.slice(1),type:'template',template:{name,language:{code:language}}}),redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!result.ok)throw new DeliveryError(result.status>=500||result.status===408);
    const body=await result.json() as {messages?:Array<{id?:string}>};
    if(!body.messages?.[0]?.id)throw new DeliveryError(true);
    return body.messages[0].id;
  }catch(error){if(error instanceof DeliveryError)throw error;throw new DeliveryError(true);}
}
