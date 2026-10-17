import type { Hono } from 'hono';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { portfolioProvider, PortfolioProcessingError } from './provider.js';
import { CareError } from '../care/errors.js';
import { currentCareConsents } from '../care/consents.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { resolveWorkScope } from '../crm/repository.js';
import { loadFeedRows } from '../crm/feed-repository.js';
import { buildPortfolioIndicators, classifyPortfolioQuestion, indicatorsCsv, providerPortfolioContext } from './summary.js';
import type { PortfolioAnswer, PortfolioIndicators } from '../../src/types/portfolio.js';
import { registerCommunicationRoutes } from '../communications/routes.js';
import { registerPortfolioSettings } from './settings.js';

const query=z.object({question:z.string().trim().min(1).max(1000),days:z.union([z.literal(7),z.literal(30),z.literal(90)]),use_ai:z.boolean().default(false),request_id:z.uuid().optional()}).strict();
async function snapshot(actorId:string|null,persistent:boolean,days:number) {
  const scope=await resolveWorkScope(actorId,persistent),now=new Date();
  const from=new Date(now.getTime()-days*2*86400000).toISOString().slice(0,10);
  const feed=await loadFeedRows(scope,from);
  const data=buildPortfolioIndicators(feed.patients.map(p=>({...p,meal_logs:feed.meals.filter(m=>m.patient_id===p.id).map(m=>({id:m.id,logged_at:m.logged_at,status:m.status as 'pending_review'|'confirmed'|'adjusted'}))})),days,now);
  return {scope,data};
}
async function indicators(actorId:string|null,persistent:boolean,days:number){return (await snapshot(actorId,persistent,days)).data;}
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
    const initial=await snapshot(actorId,persistent,parsed.data.days),intent=classifyPortfolioQuestion(parsed.data.question);
    const selected=(data:PortfolioIndicators)=>intent==='missing_records'?data.rows.filter(r=>!r.meal_count):intent==='pending_review'?data.rows.filter(r=>r.pending_review):data.rows;
    const local=(data:PortfolioIndicators):PortfolioAnswer=>({answer:localAnswer(data,intent),proposals:[],sources:selected(data),excluded_without_consent:0,mode:'local'});
    const response=local(initial.data);
    if(!parsed.data.use_ai||intent==='hydration')return c.json(response);
    if(!parsed.data.request_id)return c.json({...response,ai_notice:'Actualizá la pantalla antes de pedir propuestas con IA. Los indicadores siguen disponibles.'});
    async function collect(current:Awaited<ReturnType<typeof snapshot>>){
      const eligible:PortfolioIndicators['rows']=[],proofs:unknown[]=[];let excluded=0;
      const sources=selected(current.data);
      for(let i=0;i<sources.length;i+=10){const batch=sources.slice(i,i+10),permits=await Promise.all(batch.map(r=>currentCareConsents(r.patient_id,persistent)));for(let j=0;j<batch.length;j++){
        if(permits[j].consented.includes('care_relationship')&&permits[j].consented.includes('ai_followup')){eligible.push(batch[j]);proofs.push([batch[j].patient_id,permits[j].consents?.filter(e=>['care_relationship','ai_followup'].includes(e.purpose))??[]]);}else excluded++;
      }}
      const context=providerPortfolioContext({...current.data,patient_count:eligible.length,without_records:eligible.filter(r=>!r.meal_count).length,pending_review:eligible.reduce((n,r)=>n+r.pending_review,0),rows:eligible});
      // Only a digest stays in this request; individual IDs/events never go to Groq or a cache.
      const fingerprint=createHash('sha256').update(JSON.stringify({clinic:current.scope.nutritionistId,actor:current.scope.actorId,intent,context,proofs,rows:eligible.map(({name:_name,...row})=>row)})).digest('hex');
      return {eligible,context,fingerprint,excluded};
    }
    const chosen=await collect(initial);response.excluded_without_consent=chosen.excluded;
    if(chosen.eligible.length<5)return c.json({...response,ai_notice:'Las propuestas con IA requieren al menos cinco pacientes con permisos vigentes. Conservamos los indicadores sin IA.'});
    const input={actorId:initial.scope.actorId,nutritionistId:initial.scope.nutritionistId,requestId:parsed.data.request_id,fingerprint:chosen.fingerprint,intent,context:chosen.context};
    let fresh=initial;
    const authorize=async()=>{fresh=await snapshot(actorId,persistent,parsed.data.days);if(fresh.scope.actorId!==input.actorId||fresh.scope.nutritionistId!==input.nutritionistId)return false;return (await collect(fresh)).fingerprint===input.fingerprint;};
    try{
      const proposals=await portfolioProvider(authorize).propose(input);
      if(!await authorize())throw new PortfolioProcessingError('cancelled','Los permisos o la asignación cambiaron. No publicamos las propuestas.');
      return c.json({...local(fresh.data),excluded_without_consent:chosen.excluded,sources:selected(fresh.data).filter(r=>chosen.eligible.some(e=>e.patient_id===r.patient_id)),general_proposals:proposals,mode:'ai'});
    }catch(error){
      // Rebuild local sources too: a failed/withdrawn operation must not return stale patients after transfer.
      fresh=await snapshot(actorId,persistent,parsed.data.days);
      return c.json({...local(fresh.data),excluded_without_consent:(await collect(fresh)).excluded,ai_notice:error instanceof PortfolioProcessingError?error.message:'No pudimos preparar propuestas con IA. Conservamos los indicadores y las fuentes actuales.'});
    }
  });
}
