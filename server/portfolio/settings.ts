import type { Hono } from 'hono';
import { z } from 'zod';
import { getRequestDb, isSupabaseEnabled } from '../db/supabase-client.js';
import { queueDbError, resolveWorkScope } from '../crm/repository.js';
import { CareError } from '../care/errors.js';
import type { ClinicSettings } from '../../src/types/communications.js';
const schema=z.object({default_days:z.union([z.literal(7),z.literal(30),z.literal(90)])}).strict();
const demoSettings=new Map<string,ClinicSettings>();
export function registerPortfolioSettings(app:Hono) {
 const scope=async(auth:{userId:string}|{demo:true})=>resolveWorkScope('userId'in auth?auth.userId:null,'userId'in auth&&isSupabaseEnabled());
 app.get('/api/portfolio/settings',async c=>{
  const own=await scope(c.get('auth'));const defaults:ClinicSettings={default_days:30};
  if(!own.persistent)return c.json({mode:'demo',settings:demoSettings.get(own.nutritionistId)??defaults});
  const result=await getRequestDb().from('ops_clinic_settings').select('default_days').eq('nutritionist_id',own.nutritionistId).maybeSingle();queueDbError(result.error);
  return c.json({mode:'persistent',settings:result.data??defaults});
 });
 app.put('/api/portfolio/settings',async c=>{
  const own=await scope(c.get('auth'));const parsed=schema.safeParse(await c.req.json().catch(()=>null));if(!parsed.success)throw new CareError(400,'Elegí 7, 30 o 90 días.');
  if(!own.persistent){demoSettings.set(own.nutritionistId,parsed.data);return c.json({mode:'demo',settings:parsed.data});}
  const result=await getRequestDb().from('ops_clinic_settings').upsert({nutritionist_id:own.nutritionistId,...parsed.data,updated_at:new Date().toISOString()},{onConflict:'nutritionist_id'});queueDbError(result.error);
  return c.json({mode:'persistent',settings:parsed.data});
 });
}
