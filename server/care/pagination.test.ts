import { beforeEach, describe, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({rows:[] as unknown[],requested:[] as number[]}));
vi.mock('../db/supabase-client.js',()=>({privilegedDb:()=>({}),getRequestDb:()=>({from:()=>{
  let start=0,end=499;
  const query={select:()=>query,order:()=>query,eq:()=>query,limit:(n:number)=>{end=n-1;return query;},range:(a:number,b:number)=>{start=a;end=b;state.requested.push(a);return query;},then:(done:(x:unknown)=>unknown)=>done({data:state.rows.slice(start,end+1),error:null})};
  return query;
}})}));
import { listCareRecords, listMeasurements } from './repository.js';
beforeEach(()=>{state.rows=[];state.requested=[];});
describe('historial autorizado sin corte de quinientos',()=>{
  it('conserva registros antiguos y páginas posteriores con la misma sesión',async()=>{
    state.rows=Array.from({length:1001},(_,i)=>({id:`r${i}`,patient_id:`p${i}`,recorded_on:'2026-10-01',data:{kind:'mood',value:3},created_at:'2026-10-01T00:00:00Z',reviewed_at:null}));
    const rows=await listCareRecords(null,true);
    expect(rows).toHaveLength(1001);expect(rows.at(-1)?.id).toBe('r1000');expect(state.requested).toEqual([0,500,1000]);
  });
  it('no pierde medidas de un historial extenso',async()=>{
    state.rows=Array.from({length:1001},(_,i)=>({id:`m${i}`,patient_id:'p',kind:'weight',value_numeric:70,unit:'kg',source:'professional',captured_on:'2026-10-01',created_at:'2026-10-01T00:00:00Z'}));
    expect(await listMeasurements('p',true)).toHaveLength(1001);expect(state.requested).toEqual([0,500,1000]);
  });
});
