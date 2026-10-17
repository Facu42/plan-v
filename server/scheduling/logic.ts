import {createHmac,timingSafeEqual} from 'node:crypto';
import type {SchedulingSettings,SchedulingInterval,SchedulingSlot} from '../../src/types/scheduling.js';
export function overlaps(a:SchedulingInterval,b:SchedulingInterval){return Date.parse(a.start)<Date.parse(b.end)&&Date.parse(b.start)<Date.parse(a.end);}
export function availableSlots(settings:SchedulingSettings,typeId:string,date:string,busy:SchedulingInterval[],now=new Date()):SchedulingSlot[]{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||settings.timezone!=='America/Argentina/Buenos_Aires')return [];
 const midnight=new Date(`${date}T00:00:00-03:00`);if(!Number.isFinite(midnight.getTime())||new Intl.DateTimeFormat('en-CA',{timeZone:settings.timezone}).format(midnight)!==date)return [];
 const type=settings.types.find(t=>t.id===typeId);if(!type)return [];const weekday=new Date(`${date}T12:00:00Z`).getUTCDay(),duration=type.duration_min*60000;
 const closed=[...busy,...settings.blocks.filter(b=>b.calendar_id===type.calendar_id)],slots=new Map<string,SchedulingSlot>();
 for(const range of settings.weekly.filter(w=>w.calendar_id===type.calendar_id&&w.weekday===weekday)){let start=Date.parse(`${date}T${range.start}:00-03:00`);const end=Date.parse(`${date}T${range.end}:00-03:00`);for(;start+duration<=end;start+=duration){const interval={start:new Date(start).toISOString(),end:new Date(start+duration).toISOString()};if(start<=now.getTime()+3600000||start>now.getTime()+90*86400000||closed.some(b=>overlaps(interval,b)))continue;slots.set(interval.start,{starts_at:interval.start,ends_at:interval.end,duration_min:type.duration_min,calendar_id:type.calendar_id,type_id:type.id});}}
 return [...slots.values()].sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
}
export function moneyMinor(amount:unknown):number|null{if(typeof amount!=='number'||!Number.isFinite(amount)||amount<0)return null;const value=Math.round(amount*100);return Math.abs(amount*100-value)>0.00001||!Number.isSafeInteger(value)?null:value;}
export function verifyPayment(payment:Record<string,unknown>,expected:{id:string;account_id:string;currency:string;amount_minor:number}){return payment.status==='approved'&&payment.external_reference===expected.id&&String(payment.collector_id)===expected.account_id&&payment.currency_id===expected.currency&&moneyMinor(payment.transaction_amount)===expected.amount_minor;}
export function verifyMpSignature(input:{id:string;requestId:string;signature:string;secret:string;now?:number}){
 if(!/^[a-zA-Z0-9-]{1,100}$/.test(input.id)||!input.requestId||input.requestId.length>200||!input.secret)return false;
 const parts=input.signature.split(',').map(p=>p.trim().split('='));if(parts.length!==2||parts.some(p=>p.length!==2))return false;const map=new Map<string,string>(parts.map(p=>[p[0],p[1]]));const ts=map.get('ts'),signature=map.get('v1');
 if(!ts||!/^\d{10,13}$/.test(ts)||!signature||!/^[a-fA-F0-9]{64}$/.test(signature))return false;
 const when=Number(ts)*(ts.length===10?1000:1);if(Math.abs((input.now??Date.now())-when)>5*60000)return false;
 const expected=createHmac('sha256',input.secret).update(`id:${input.id.toLowerCase()};request-id:${input.requestId};ts:${ts};`).digest();return timingSafeEqual(expected,Buffer.from(signature,'hex'));
}
