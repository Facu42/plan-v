import {createHash} from 'node:crypto';
export const REMINDER_WHATSAPP_TEXT='Recordatorio de turno: tenés una consulta próxima. Revisá la fecha y confirmá o pedí un cambio en Plan V. Para dejar de recibir avisos por WhatsApp, respondé BAJA.';
export const reminderTemplateHash=createHash('sha256').update(REMINDER_WHATSAPP_TEXT).digest('hex');
export const EMAIL_TEMPLATES=[
 {id:'agenda_notice',subject:'Aviso sobre la agenda de tu consultorio',text:'Tu consultorio tiene un aviso sobre su agenda. Entrá a Plan V y revisá los turnos o escribile a tu profesional.',path:'/app/agenda'},
 {id:'contact_notice',subject:'Un aviso de tu consultorio en Plan V',text:'Tu consultorio tiene un aviso para vos. Entrá a Plan V y revisá los mensajes de tu profesional.',path:'/app/mensajes'},
].map(t=>({...t,hash:createHash('sha256').update(`${t.subject}\n${t.text}\n${t.path}`).digest('hex')}));
export function emailBroadcastContent(id:string,expectedHash:string,site:string,unsubscribeUrl:string){const t=EMAIL_TEMPLATES.find(x=>x.id===id&&x.hash===expectedHash);if(!t)throw new Error('El mensaje revisado cambió.');const url=new URL(t.path,site).href;if(!url.startsWith('https://'))throw new Error('La dirección pública debe usar HTTPS.');const text=`${t.text}\n\n${url}\n\nPara dejar de recibir correos de Plan V: ${unsubscribeUrl}`;return {subject:t.subject,text,html:`<p>${t.text}</p><p><a href="${url}">Abrir Plan V</a></p><p><a href="${unsubscribeUrl}">Dejar de recibir correos</a></p>`};}
