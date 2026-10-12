import type { Hono } from 'hono';
import { z } from 'zod';
import { generateText, Output } from 'ai';
import { CareError } from '../care/errors.js';
import { currentCareConsents } from '../care/consents.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { resolveWorkScope } from '../crm/repository.js';
import { loadFeedRows } from '../crm/feed-repository.js';
import { getAiModel } from '../ai/provider.js';
import { resolveAiMode } from '../ai/mode.js';
import { buildPortfolioIndicators, classifyPortfolioQuestion, indicatorsCsv, providerPortfolioContext } from './summary.js';
import type { PortfolioAnswer, PortfolioIndicators } from '../../src/types/portfolio.js';
import { registerCommunicationRoutes } from '../communications/routes.js';
import { registerPortfolioSettings } from './settings.js';

const query=z.object({question:z.string().trim().min(1).max(1000),days:z.union([z.literal(7),z.literal(30),z.literal(90)]),use_ai:z.boolean().default(false)}).strict();
const suggestionSchema=z.object({proposals:z.array(z.object({text:z.string().trim().min(1).max(500)}).strict()).max(3)}).strict();
async function indicators(actorId:string|null,persistent:boolean,days:number) {
  const scope=await resolveWorkScope(actorId,persistent),now=new Date();
  const from=new Date(now.getTime()-days*2*86400000).toISOString().slice(0,10);
  const feed=await loadFeedRows(scope,from);
  return buildPortfolioIndicators(feed.patients.map(p=>({...p,meal_logs:feed.meals.filter(m=>m.patient_id===p.id).map(m=>({id:m.id,logged_at:m.logged_at,status:m.status as 'pending_review'|'confirmed'|'adjusted'}))})),days,now);
}
function localAnswer(data:PortfolioIndicators,intent:ReturnType<typeof classifyPortfolioQuestion>) {
  if(intent==='missing_records')return `${data.without_records} de ${data.patient_count} pacientes no tienen comidas registradas en los últimos ${data.days} días. La ausencia de registros no prueba incumplimiento.`;
  if(intent==='pending_review')return `${data.pending_review} comidas están pendientes de revisión en los últimos ${data.days} días.`;
  if(intent==='hydration')return 'Para ver los vasos de agua por fecha, abrí Seguimiento y filtrá los registros de agua. Este resumen de cartera cuenta comidas; no permite inferir hidratación.';
  return `Cartera activa: ${data.patient_count} pacientes. En los últimos ${data.days} días hay ${data.rows.reduce((n,r)=>n+r.meal_count,0)} comidas registradas, ${data.pending_review} pendientes de revisión y ${data.without_records} pacientes sin registros.`;
}
export function registerPortfolioRoutes(app:Hono) {
  registerCommunicationRoutes(app);
  registerPortfolioSettings(app);
  app.get('/api/portfolio/indicators',async c=>{
    const auth=c.get('auth'),persistent='userId'in auth&&isSupabaseEnabled();
    if(!persistent&&c.req.query('audience')==='patient')throw new CareError(403,'Sólo profesionales.');
    const days=Number(c.req.query('days')??30);if(![7,30,90].includes(days))throw new CareError(400,'Elegí 7, 30 o 90 días.');
    const data=await indicators('userId'in auth?auth.userId:null,persistent,days);
    if(c.req.query('format')==='csv'){c.header('Content-Disposition','attachment; filename="indicadores-cartera.csv"');return c.text(indicatorsCsv(data),200,{'Content-Type':'text/csv; charset=utf-8'});}
    return c.json(data);
  });
  app.post('/api/portfolio/assistant',async c=>{
    const parsed=query.safeParse(await c.req.json().catch(()=>null));if(!parsed.success)throw new CareError(400,'Revisá la pregunta y el período.');
    const auth=c.get('auth'),persistent='userId'in auth&&isSupabaseEnabled();
    if(!persistent&&c.req.query('audience')==='patient')throw new CareError(403,'Sólo profesionales.');
    const actorId='userId'in auth?auth.userId:null;
    const data=await indicators(actorId,persistent,parsed.data.days),intent=classifyPortfolioQuestion(parsed.data.question);
    const sources=intent==='missing_records'?data.rows.filter(r=>!r.meal_count):intent==='pending_review'?data.rows.filter(r=>r.pending_review):data.rows;
    const response:PortfolioAnswer={answer:localAnswer(data,intent),proposals:[],sources,excluded_without_consent:0,mode:'local'};
    if(!parsed.data.use_ai||intent==='hydration')return c.json(response);
    const eligible:PortfolioIndicators['rows']=[];
    // Concurrencia acotada de lectura de consentimientos; cartera completa, sin tope oculto.
    for(let i=0;i<sources.length;i+=10){const batch=sources.slice(i,i+10);const permits=await Promise.all(batch.map(r=>currentCareConsents(r.patient_id,persistent)));for(let j=0;j<batch.length;j++){if(permits[j].consented.includes('ai_followup'))eligible.push(batch[j]);else response.excluded_without_consent++;}}
    if(!eligible.length)throw new CareError(403,'No hay pacientes con permiso vigente de seguimiento con IA. Podés consultar los indicadores sin IA.');
    if(eligible.length<5)throw new CareError(422,'Las propuestas de IA necesitan al menos cinco pacientes con permiso para usar agregados. Las fuentes siguen disponibles sin IA.');
    const context=providerPortfolioContext({...data,patient_count:eligible.length,without_records:eligible.filter(r=>!r.meal_count).length,pending_review:eligible.reduce((n,r)=>n+r.pending_review,0),rows:eligible});
    if(resolveAiMode()!=='live')throw new CareError(503,'La IA de cartera no está disponible. Los indicadores y fuentes siguen accesibles sin IA.');
    const {output}=await generateText({model:getAiModel(),system:'Proponé hasta tres acciones generales revisables para la cartera basadas únicamente en indicadores agregados. No diagnostiques ni inventes registros, personas o causas. No ejecutes herramientas. Marcá falta de datos; no uses ausencia de registros como incumplimiento. Devolvé propuestas breves en español con voseo.',prompt:JSON.stringify({intent,context}),output:Output.object({schema:suggestionSchema}),abortSignal:AbortSignal.timeout(20000)});
    if(!output)throw new CareError(503,'No se pudo preparar una propuesta.');
    const fresh=await indicators(actorId,persistent,parsed.data.days),allowed=new Set(fresh.rows.map(r=>r.patient_id));
    for(const row of eligible){if(!allowed.has(row.patient_id))throw new CareError(409,'La asignación o los indicadores cambiaron. Volvé a consultar.');const consent=await currentCareConsents(row.patient_id,persistent);if(!consent.consented.includes('ai_followup'))throw new CareError(403,'Un permiso cambió durante el procesamiento.');}
    const eligibleIds=new Set(eligible.map(r=>r.patient_id));
    response.sources=fresh.rows.filter(r=>eligibleIds.has(r.patient_id));
    response.general_proposals=output.proposals.map(p=>p.text);
    response.mode='ai';return c.json(response);
  });
}
