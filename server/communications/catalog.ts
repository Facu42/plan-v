import {createHash} from 'node:crypto';
const canonicalHash=(value:string)=>createHash('sha256').update(value.replace(/Nutridash/g,'Plan V')).digest('hex');
export const REMINDER_WHATSAPP_TEXT='Recordatorio de turno: tenés una consulta próxima. Revisá la fecha y confirmá o pedí un cambio en Nutridash. Para dejar de recibir avisos por WhatsApp, respondé BAJA.';
export const reminderTemplateHash=canonicalHash(REMINDER_WHATSAPP_TEXT);
export const EMAIL_TEMPLATES=[
 {id:'agenda_notice',subject:'Aviso sobre la agenda de tu consultorio',text:'Tu consultorio tiene un aviso sobre su agenda. Entrá a Nutridash y revisá los turnos o escribile a tu profesional.',path:'/app/agenda'},
 {id:'contact_notice',subject:'Un aviso de tu consultorio en Nutridash',text:'Tu consultorio tiene un aviso para vos. Entrá a Nutridash y revisá los mensajes de tu profesional.',path:'/app/mensajes'},
].map(t=>({...t,hash:canonicalHash(`${t.subject}\n${t.text}\n${t.path}`)}));
export function emailBroadcastContent(id:string,expectedHash:string,site:string,unsubscribeUrl:string){const t=EMAIL_TEMPLATES.find(x=>x.id===id&&x.hash===expectedHash);if(!t)throw new Error('El mensaje revisado cambió.');const url=new URL(t.path,site).href;if(!url.startsWith('https://'))throw new Error('La dirección pública debe usar HTTPS.');const text=`${t.text}\n\n${url}\n\nPara dejar de recibir correos de Nutridash: ${unsubscribeUrl}`;return {subject:t.subject,text,html:`<p>${t.text}</p><p><a href="${url}">Abrir Nutridash</a></p><p><a href="${unsubscribeUrl}">Dejar de recibir correos</a></p>`};}
