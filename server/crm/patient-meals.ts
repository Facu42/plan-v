import { z } from 'zod';
import type { PatientMealPage } from '../../src/types/patient-meals.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { getRequestDb } from '../db/supabase-client.js';
import { mapMealLog } from '../db/supabase-repo.js';
import { mealLogColumns } from '../db/columns.js';
import { signMealPhotos } from '../care/meal-photos.js';
import { previewPermissions } from './patient-permissions.js';
import { queueDbError,type WorkScope } from './repository.js';
export const patientMealQuerySchema=z.object({offset:z.coerce.number().int().min(0).max(100000).default(0),limit:z.coerce.number().int().min(1).max(50).default(50),days:z.coerce.number().refine(n=>n===7||n===30).optional(),status:z.enum(['all','pending_review','reviewed']).default('all')}).strict();
export async function loadPatientMealPage(scope:WorkScope,patientId:string,query:z.infer<typeof patientMealQuerySchema>,now=new Date()):Promise<PatientMealPage>{
  if(!scope.patients.some(p=>p.id===patientId&&!p.archived_at&&!p.deactivated_at&&!p.anonymized_at))throw new CareError(403,'Esa paciente no está disponible en tu consultorio.');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now);
  const from=query.days?new Date(Date.parse(`${today}T12:00:00Z`)-(query.days-1)*86400000).toISOString().slice(0,10):null;
  const bundle=await previewPermissions(patientId,scope.persistent);
  const allowedPhoto=bundle.consented.includes('meal_photo');
  let logs;
  if(!scope.persistent){
    const dates=(date:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(date));
    logs=getPatient(patientId)!.meal_logs.filter(log=>log.patient_id===patientId&&(!from||dates(log.logged_at)>=from)&&dates(log.logged_at)<=today&&(query.status==='all'||(query.status==='reviewed'?log.status!=='pending_review':log.status==='pending_review'))).sort((a,b)=>b.logged_at.localeCompare(a.logged_at)||b.id.localeCompare(a.id)).slice(query.offset,query.offset+query.limit+1).map(log=>({...log,photo_url:allowedPhoto?log.photo_url:null}));
  }else{
    let request=getRequestDb().from('meal_logs').select(mealLogColumns.professional).eq('patient_id',patientId).lte('logged_at',`${today}T23:59:59.999-03:00`);
    if(from)request=request.gte('logged_at',`${from}T00:00:00-03:00`);
    if(query.status==='pending_review')request=request.eq('status','pending_review');
    if(query.status==='reviewed')request=request.in('status',['confirmed','adjusted']);
    const result=await request.order('logged_at',{ascending:false}).order('id',{ascending:false}).range(query.offset,query.offset+query.limit);
    queueDbError(result.error);
    logs=(result.data??[]).map(row=>mapMealLog(row as unknown as Record<string,unknown>)).map(log=>({...log,photo_url:allowedPhoto&&log.photo_url?.startsWith(`patients/${patientId}/`)?log.photo_url:null}));
    logs=await signMealPhotos(patientId,logs);
  }
  const has_more=logs.length>query.limit;
  return {patient_id:patientId,logs:logs.slice(0,query.limit),has_more,next_offset:has_more?query.offset+query.limit:null,source:scope.persistent?'supabase':'memory'};
}
