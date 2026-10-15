import {beforeEach,describe,expect,it,vi} from 'vitest';
const fake=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),syncBooking:vi.fn(),syncAppointment:vi.fn()}));
vi.mock('../db/supabase-client.js',()=>({isSupabaseEnabled:()=>true,privilegedDb:()=>({rpc:fake.rpc,from:fake.from})}));
vi.mock('./providers.js',()=>({syncGoogleBooking:fake.syncBooking,syncGoogleAppointment:fake.syncAppointment}));
import {runSchedulingSyncJobs} from './worker.js';
const job={id:'job-test',booking_id:'booking-test',run_token:'lease-token',revision:2};
beforeEach(()=>{
 fake.rpc.mockReset();fake.from.mockReset();fake.syncBooking.mockReset();fake.syncAppointment.mockReset();let claimed=false;
 fake.rpc.mockImplementation(async(name:string)=>({error:null,data:name==='scheduling_claim_sync_job'&&!claimed?(claimed=true,job):name==='scheduling_guard_google_write'?true:name==='scheduling_complete_sync_job'?true:null}));
 fake.from.mockImplementation((table:string)=>{const query={select:()=>query,eq:()=>query,single:async()=>({error:null,data:table==='scheduling_bookings'?{id:job.booking_id,nutritionist_id:'clinic',revision:2}: {config:{google_enabled:true}}})};return query;});
});
describe('worker cercado y recuperación sin repetir solicitudes externas',()=>{
 it('transmite identidad exclusiva, revisión y epoch en cada renovación/prewrite',async()=>{
  fake.syncBooking.mockImplementation(async(_booking,_settings,_persistent,guard)=>{expect(await guard.authorize('connection-epoch')).toBe(true);expect(await guard.beforeWrite('connection-epoch')).toBe(true);expect(await guard.authorize('connection-epoch')).toBe(true);return null;});
  expect(await runSchedulingSyncJobs()).toBe(1);
  const checks=fake.rpc.mock.calls.filter(([name])=>name==='scheduling_guard_google_write');expect(checks).toHaveLength(3);
  expect(checks[1][1]).toMatchObject({kind:'booking',target:job.id,token:job.run_token,expected_revision:2,expected_epoch:'connection-epoch',issue:true});
 });
 it('error después de issued registra uncertain y no finaliza como fallido reintentable',async()=>{
  fake.syncBooking.mockImplementation(async(_booking,_settings,_persistent,guard)=>{await guard.beforeWrite('connection-epoch');throw new Error('connection lost after POST');});
  expect(await runSchedulingSyncJobs()).toBe(0);
  expect(fake.rpc).toHaveBeenCalledWith('scheduling_mark_google_uncertain',{kind:'booking',target:job.id,token:job.run_token});
  expect(fake.rpc.mock.calls.some(([name])=>name==='scheduling_complete_sync_job')).toBe(false);
 });
 it('un error antes de issued conserva la posibilidad de reintentar sin fingir envío',async()=>{
  fake.syncBooking.mockRejectedValue(new Error('GET rejected'));
  expect(await runSchedulingSyncJobs()).toBe(0);
  expect(fake.rpc.mock.calls.some(([name])=>name==='scheduling_mark_google_uncertain')).toBe(false);
  expect(fake.rpc.mock.calls.find(([name])=>name==='scheduling_complete_sync_job')?.[1]).toMatchObject({job:job.id,token:job.run_token,meet:null,failure:expect.any(String)});
 });
});
