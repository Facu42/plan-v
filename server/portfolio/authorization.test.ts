import { beforeEach,describe,expect,it,vi } from 'vitest';
import { Hono } from 'hono';
import { registerPortfolioRoutes } from './routes.js';
import { CareError } from '../care/errors.js';
const state=vi.hoisted(()=>({actor:'pro-a',calls:[] as string[]}));
vi.mock('../db/supabase-client.js',()=>({isSupabaseEnabled:()=>true,getRequestDb:()=>({from:(table:string)=>{
 state.calls.push(table);
 let rows:Record<string,unknown>[] = table==='profiles'?[{id:'pro-a',role:'nutri'},{id:'pro-b',role:'nutri'},{id:'patient',role:'paciente'},{id:'admin',role:'admin'}]
 :table==='nutritionists'?[{id:'clinic-a',user_id:'pro-a'},{id:'clinic-b',user_id:'pro-b'}]
 :table==='patients'?[{id:'patient-a',full_name:'Paciente A',nutritionist_id:'clinic-a'},{id:'patient-b',full_name:'Paciente B',nutritionist_id:'clinic-b'}]
 :table==='meal_logs'?[{id:'meal-a',patient_id:'patient-a',status:'pending_review',logged_at:new Date().toISOString()},{id:'meal-b',patient_id:'patient-b',status:'pending_review',logged_at:new Date().toISOString()}]:[];
 const q={select:()=>q,eq:(key:string,value:unknown)=>{rows=rows.filter(r=>r[key]===value);return q;},in:(key:string,values:unknown[])=>{rows=rows.filter(r=>values.includes(r[key]));return q;},gte:()=>q,order:()=>q,range:(from:number,to:number)=>Promise.resolve({data:rows.slice(from,to+1),error:null}),maybeSingle:()=>Promise.resolve({data:rows[0]??null,error:null})};return q;
 }}),privilegedDb:()=>{throw Error('Unexpected privileged access');}}));
function app(){const a=new Hono();a.use('/api/*',async(c,next)=>{c.set('auth',{userId:state.actor});await next();});a.onError((e,c)=>e instanceof CareError?c.json({error:e.message},e.status):c.json({error:'Unexpected'},500));registerPortfolioRoutes(a);return a;}
beforeEach(()=>{state.actor='pro-a';state.calls=[];});
describe('asistente HTTP conserva el alcance profesional',()=>{
 it('cada profesional sólo recibe los indicadores y fuentes de su cartera',async()=>{
  const a=app();const first=await (await a.request('/api/portfolio/indicators?days=7')).json();
  expect(first.rows.map((r:{patient_id:string})=>r.patient_id)).toEqual(['patient-a']);
  state.actor='pro-b';const second=await (await a.request('/api/portfolio/indicators?days=7')).json();expect(second.rows.map((r:{patient_id:string})=>r.patient_id)).toEqual(['patient-b']);
 });
 it('paciente y administrador del servicio no obtienen acceso clínico global',async()=>{
  for(const actor of ['patient','admin']){state.actor=actor;state.calls=[];expect((await app().request('/api/portfolio/indicators')).status).toBe(403);expect(state.calls).not.toContain('meal_logs');}
 });
 it('rechaza pedidos ambiguos y webhooks sin firma antes de usar servicio privilegiado',async()=>{
  const a=app();expect((await a.request('/api/portfolio/assistant',{method:'POST',body:JSON.stringify({question:'Resumen',days:7,use_ai:false,unexpected:'clinical'})})).status).toBe(400);
  expect((await a.request('/webhooks/whatsapp',{method:'POST',body:'{}'})).status).toBe(403);
  expect((await a.request('/webhooks/whatsapp',{method:'POST',body:'x'.repeat(262145)})).status).toBe(413);
 });
});
