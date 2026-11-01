import type {Hono,Context} from 'hono';
import {z} from 'zod';
import {isSupabaseEnabled} from '../db/supabase-client.js';
import {sbGetActor,sbGetPatientResource} from '../db/supabase-repo.js';
import {CareError} from '../care/errors.js';
import {requireCareConsent} from '../care/consents.js';
import {parseLabDraft} from './draft.js';

async function access(c:Context){
  if(process.env.LAB_DRAFT_ENABLED!=='true')throw new CareError(503,'El borrador de laboratorio no está activado.');
  const auth=c.get('auth');
  if(!('userId' in auth)||!isSupabaseEnabled())throw new CareError(403,'Ingresá con tu cuenta profesional.');
  const actor=await sbGetActor(auth.userId),patient=await sbGetPatientResource(c.req.param('id')!);
  if(actor?.role!=='nutri'||!patient||actor.nutritionistId!==patient.nutritionistId)throw new CareError(403,'La ficha no pertenece a tu consultorio.');
  await requireCareConsent(c.req.param('id')!,true,'care_relationship');
  return actor;
}

export function registerLabDraftRoutes(app:Hono){
  app.post('/api/patients/:id/clinical-workspace/lab-reading/draft',async c=>{
    await access(c);
    const raw=await c.req.text();
    if(Buffer.byteLength(raw)>60000)throw new CareError(413,'El informe es demasiado largo.');
    let body:unknown;
    try{body=JSON.parse(raw);}catch{throw new CareError(400,'Revisá el informe.');}
    const parsed=z.object({text:z.string().trim().min(1).max(20000)}).strict().safeParse(body);
    if(!parsed.success)throw new CareError(400,'Revisá el informe.');
    const values=parseLabDraft(parsed.data.text);
    if(!values.length)throw new CareError(400,'No reconocimos valores para revisar. El texto no se guardó.');
    return c.json({values:values.map(value=>({...value,reviewed:false})),reviewed:false});
  });
}
