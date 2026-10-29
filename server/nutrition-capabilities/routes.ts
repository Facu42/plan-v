import { registerExchangeVisibilityRoutes } from './exchange-visibility.js';
import type { Context,Hono } from 'hono';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { CareError } from '../care/errors.js';
import { exchangeSaveSchema,settingsSaveSchema } from '../../src/types/nutrition-capabilities.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { foodInputSchema } from '../../src/types/foods.js';
import { saveFood } from '../foods/repository.js';
import { getFdcFood,searchFdcFoods } from './fdc.js';
import { getNutritionSettings,listNutritionExchanges,saveNutritionExchange,saveNutritionSettings } from './repository.js';
async function professional(c:Context){const auth=c.get('auth');if('demo' in auth)return{owner:DEMO_NUTRITIONIST_ID,persistent:false};if(!isSupabaseEnabled())throw new CareError(503,'El servicio no está disponible.');const actor=await sbGetActor(auth.userId);if(actor?.role!=='nutri')throw new CareError(403,'Sólo la nutricionista puede configurar estas funciones.');return{owner:actor.nutritionistId,persistent:true};}
async function body(c:Context){if(Number(c.req.header('Content-Length'))>900000)throw new CareError(413,'La configuración es demasiado grande.');const raw=await c.req.text();if(raw.length>900000)throw new CareError(413,'La configuración es demasiado grande.');try{return JSON.parse(raw);}catch{throw new CareError(400,'Revisá los datos enviados.');}}
export function registerNutritionCapabilityRoutes(app:Hono){
  registerExchangeVisibilityRoutes(app);
  app.get('/api/nutrition/external-foods',async c=>{await professional(c);const parsed=z.object({q:z.string().trim().min(3).max(160),page:z.coerce.number().int().min(1).max(10000).default(1)}).strict().safeParse(c.req.query());if(!parsed.success)throw new CareError(400,'Buscá un alimento con al menos tres caracteres.');return c.json(await searchFdcFoods(parsed.data.q,parsed.data.page));});
  app.get('/api/nutrition/external-foods/:id',async c=>{await professional(c);const parsed=z.coerce.number().int().positive().safeParse(c.req.param('id'));if(!parsed.success)throw new CareError(400,'Identificador USDA inválido.');return c.json({food:await getFdcFood(parsed.data,randomUUID())});});
  app.post('/api/nutrition/external-foods',async c=>{const actor=await professional(c);const parsed=z.object({fdc_id:z.number().int().positive(),reviewed:z.literal(true),expected_snapshot:foodInputSchema}).strict().safeParse(await body(c));if(!parsed.success||parsed.data.expected_snapshot.expected_revision!==0)throw new CareError(400,'Revisá la composición y confirmá la importación.');const food=await getFdcFood(parsed.data.fdc_id,parsed.data.expected_snapshot.id);if(JSON.stringify(food)!==JSON.stringify(parsed.data.expected_snapshot))throw new CareError(409,'USDA cambió la entrada. Volvé a consultar y revisar sus valores.');return c.json({food:await saveFood(actor.owner,food,actor.persistent)});});
  app.get('/api/nutrition/settings',async c=>{const actor=await professional(c);return c.json(await getNutritionSettings(actor.owner,actor.persistent));});
  app.put('/api/nutrition/settings',async c=>{const actor=await professional(c),parsed=settingsSaveSchema.safeParse(await body(c));if(!parsed.success)throw new CareError(400,'Revisá la marca, los valores y las referencias.');return c.json(await saveNutritionSettings(actor.owner,parsed.data.settings,parsed.data.expected_revision,actor.persistent));});
  app.get('/api/nutrition/exchanges',async c=>{const actor=await professional(c);return c.json({groups:await listNutritionExchanges(actor.owner,actor.persistent)});});
  app.post('/api/nutrition/exchanges',async c=>{const actor=await professional(c),parsed=exchangeSaveSchema.safeParse(await body(c));if(!parsed.success)throw new CareError(400,'Revisá el grupo, sus cantidades y la referencia; confirmá la revisión profesional.');return c.json({group:await saveNutritionExchange(actor.owner,parsed.data,actor.persistent)});});
}
