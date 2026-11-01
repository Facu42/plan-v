import type {Hono,Context} from 'hono';
import {z} from 'zod';
import {isSupabaseEnabled,getRequestDb} from '../db/supabase-client.js';
import {sbGetActor,sbGetPatientResource} from '../db/supabase-repo.js';
import {CareError} from '../care/errors.js';
import {requireCareConsent} from '../care/consents.js';
import {parseBioimpedance,bioimpedanceReviewSchema} from './bioimpedance.js';
import {queueDbError} from '../crm/repository.js';
async function access(c:Context){
 if(process.env.BIOIMPEDANCE_ENABLED!=='true')throw new CareError(503,'La lectura de bioimpedancia no está activada.');
 const auth=c.get('auth');if(!('userId'in auth)||!isSupabaseEnabled())throw new CareError(403,'Ingresá con tu cuenta profesional.');
 const actor=await sbGetActor(auth.userId),patient=await sbGetPatientResource(c.req.param('id')!);
 if(actor?.role!=='nutri'||!patient||actor.nutritionistId!==patient.nutritionistId)throw new CareError(403,'La ficha no pertenece a tu consultorio.');
 await requireCareConsent(c.req.param('id')!,true,'care_relationship');await requireCareConsent(c.req.param('id')!,true,'measurement');
 return actor;
}
async function body<T>(c:Context,schema:z.ZodType<T>){const raw=await c.req.text();if(Buffer.byteLength(raw)>60000)throw new CareError(413,'El informe es demasiado largo.');let value;try{value=JSON.parse(raw);}catch{throw new CareError(400,'Revisá el informe.');}const p=schema.safeParse(value);if(!p.success)throw new CareError(400,'Revisá y confirmá las medidas antes de guardar.');return p.data;}
export function registerBioimpedanceRoutes(app:Hono){
 app.post('/api/patients/:id/clinical-workspace/bioimpedance/preview',async c=>{await access(c);const p=await body(c,z.object({text:z.string().trim().min(1).max(20000)}).strict());return c.json({values:parseBioimpedance(p.text),reviewed:false});});
 app.post('/api/patients/:id/clinical-workspace/bioimpedance',async c=>{await access(c);const p=await body(c,bioimpedanceReviewSchema);const r=await getRequestDb().rpc('save_bioimpedance_review',{target:c.req.param('id'),payload:p});if(r.error?.code==='23505')throw new CareError(409,'Ese registro ya contiene otras medidas.');if(r.error?.code==='42501')throw new CareError(403,'Los permisos de la paciente cambiaron.');if(r.error?.code==='22023')throw new CareError(400,'Revisá las medidas.');queueDbError(r.error);return c.json({record:r.data},201);});
 app.get('/api/patients/:id/clinical-workspace/bioimpedance',async c=>{await access(c);const r=await getRequestDb().from('bioimpedance_readings').select('id,recorded_on,values,reviewed_at').eq('patient_id',c.req.param('id')).order('recorded_on',{ascending:false}).limit(100);queueDbError(r.error);return c.json({records:r.data});});
}
