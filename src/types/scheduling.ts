import {z} from 'zod';
import {PUBLIC_SLUG_PATTERN, isReservedPublicSlug} from './public-slug';
const time=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const timestamp=z.iso.datetime({offset:true});
const pct=z.number().int().min(0).max(100);
/** Contenido extra de la página pública (perfil, obras sociales, descuentos, indicaciones por servicio, qué se pide al reservar y avisos). Todo opcional: sin la clave, la página queda como antes. */
export const pageExtrasSchema=z.object({
 license:z.string().trim().max(60).optional(),
 area:z.string().trim().max(80).optional(),
 specialties:z.array(z.string().trim().min(1).max(40)).max(12).optional(),
 insurers:z.array(z.object({name:z.string().trim().min(1).max(60),mode:z.enum(['copago','reintegro','completo','no']),note:z.string().trim().max(60)}).strict()).max(20).optional(),
 discounts:z.object({transfer:pct,cash:pct,card:pct}).strict().optional(),
 service_notes:z.record(z.uuid(),z.object({instructions:z.string().trim().max(400),who:z.enum(['any','patients']),insurer:z.boolean()}).strict()).optional(),
 intake:z.array(z.object({text:z.string().trim().min(1).max(100),on:z.boolean()}).strict()).max(12).optional(),
 notices:z.object({confirm:z.boolean(),unconfirmed:z.boolean(),reopen:z.boolean(),review:z.boolean()}).partial().strict().optional(),
}).strict();
export type PageExtras=z.infer<typeof pageExtrasSchema>;
export const schedulingSettingsSchema=z.object({
 timezone:z.literal('America/Argentina/Buenos_Aires'),
 calendars:z.array(z.object({id:z.uuid(),name:z.string().trim().min(1).max(80)}).strict()).min(1).max(10),
 types:z.array(z.object({id:z.uuid(),name:z.string().trim().min(1).max(80),calendar_id:z.uuid(),duration_min:z.number().int().min(10).max(180),channel:z.enum(['video','presencial']),price_minor:z.number().int().min(0).max(100000000),deposit_minor:z.number().int().min(0).max(100000000)}).strict()).max(30),
 weekly:z.array(z.object({calendar_id:z.uuid(),weekday:z.number().int().min(0).max(6),start:time,end:time}).strict()).max(100),
 blocks:z.array(z.object({id:z.uuid(),calendar_id:z.uuid(),start:timestamp,end:timestamp,label:z.string().trim().max(80)}).strict()).max(300),
 page:z.object({slug:z.string().regex(PUBLIC_SLUG_PATTERN).refine(slug=>!isReservedPublicSlug(slug),'Ese enlace está reservado.'),enabled:z.boolean(),title:z.string().trim().min(1).max(100),bio:z.string().trim().max(1200),location:z.string().trim().max(200),contact:z.string().trim().max(150),logo_url:z.union([z.literal(''),z.url().startsWith('https://')])}).strict(),
 google_calendar_id:z.string().trim().max(200),google_enabled:z.boolean(),create_meet:z.boolean(),transfer_alias:z.string().trim().max(100),
 // Recordatorio de turno 24 h antes (app y mail). Sin la clave está activo.
 reminders_enabled:z.boolean().optional(),
 page_extras:pageExtrasSchema.optional(),
}).strict().superRefine((s,ctx)=>{const ids=new Set(s.calendars.map(c=>c.id));if(ids.size!==s.calendars.length||new Set(s.types.map(t=>t.id)).size!==s.types.length)ctx.addIssue({code:'custom',message:'Identificadores repetidos.'});if(s.types.some(t=>!ids.has(t.calendar_id)||t.deposit_minor>t.price_minor)||s.weekly.some(w=>!ids.has(w.calendar_id)||w.start>=w.end)||s.blocks.some(b=>!ids.has(b.calendar_id)||Date.parse(b.start)>=Date.parse(b.end)))ctx.addIssue({code:'custom',message:'Revisá la agenda, las horas y los importes.'});});
export type SchedulingSettings=z.infer<typeof schedulingSettingsSchema>;
export type SchedulingInterval={start:string;end:string};
export type SchedulingSlot={starts_at:string;ends_at:string;duration_min:number;calendar_id:string;type_id:string};
export type SchedulingBooking={id:string;nutritionist_id:string;type_id:string;calendar_id:string;starts_at:string;duration_min:number;status:'requested'|'confirmed'|'cancelled';revision:number;total_minor:number;deposit_minor:number;paid_minor:number;currency:'ARS';appointment_id:string|null;patient_id:string|null;contact_name:string;contact_email:string;contact_phone:string;google_sync_status:string;meet_url:string|null;created_at:string};
export type PublicBookingReceipt=Pick<SchedulingBooking,'id'|'starts_at'|'duration_min'|'status'|'revision'|'total_minor'|'deposit_minor'|'paid_minor'|'currency'|'meet_url'>;
export type PublicSchedulingPage={page:SchedulingSettings['page'];calendars:SchedulingSettings['calendars'];types:SchedulingSettings['types'];timezone:SchedulingSettings['timezone'];transfer_alias:string;mercado_pago_connected:boolean};
export const publicBookingSchema=z.object({client_id:z.uuid(),type_id:z.uuid(),starts_at:timestamp,name:z.string().trim().min(2).max(120),email:z.email().max(200),phone:z.string().trim().min(5).max(40),accepted_contact:z.literal(true)}).strict();
export type PublicBookingInput=z.infer<typeof publicBookingSchema>;
export const bookingChangeSchema=z.object({action:z.enum(['confirm','cancel','reschedule']),expected_revision:z.number().int().positive(),starts_at:timestamp.optional(),patient_id:z.uuid().optional()}).strict().superRefine((input,ctx)=>{if(input.action==='reschedule'&&!input.starts_at)ctx.addIssue({code:'custom',message:'Elegí el nuevo horario.'});if(input.action!=='reschedule'&&input.starts_at)ctx.addIssue({code:'custom',message:'El horario sólo se cambia al reprogramar.'});if(input.action!=='confirm'&&input.patient_id)ctx.addIssue({code:'custom',message:'La ficha sólo se vincula al confirmar.'});});
export type BookingChange=z.infer<typeof bookingChangeSchema>;
export const schedulingDefaultSettings=():SchedulingSettings=>{
 const id='00000000-0000-4000-a000-000000000001';return {timezone:'America/Argentina/Buenos_Aires',calendars:[{id,name:'Consultorio'}],types:[],weekly:[],blocks:[],page:{slug:'mi-consultorio',enabled:false,title:'Mi consultorio',bio:'',location:'',contact:'',logo_url:''},google_calendar_id:'primary',google_enabled:false,create_meet:false,transfer_alias:''};
};
