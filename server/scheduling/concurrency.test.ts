import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {accessToken,syncGoogleBooking,beginOAuth,finishOAuth,SchedulingUncertainError} from './providers.js';
import {connections,putConnection,getConnection,disconnect} from './repository.js';
import {schedulingDefaultSettings} from '../../src/types/scheduling.js';
const nid='00000000-0000-4000-a000-000000000020',id='00000000-0000-4000-a000-000000000021';
const fetchMock=vi.fn<typeof fetch>();
const json=(v:unknown)=>new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
const booking={id,nutritionist_id:nid,type_id:id,starts_at:'2026-10-22T12:00:00Z',duration_min:45,status:'confirmed' as const,revision:2};
beforeEach(()=>{connections.clear();fetchMock.mockReset();vi.stubGlobal('fetch',fetchMock);vi.stubEnv('SCHEDULING_TOKEN_KEY',Buffer.alloc(32,7).toString('base64'));vi.stubEnv('SCHEDULING_PUBLIC_BASE_URL','http://localhost:3001');vi.stubEnv('APP_MODE','test');vi.stubEnv('GOOGLE_CALENDAR_CLIENT_ID','test-client');vi.stubEnv('GOOGLE_CALENDAR_CLIENT_SECRET','test-secret');});
afterEach(()=>{connections.clear();vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('agenda conserva desconexión, autorización y revisión frente a concurrencia',()=>{
 for(const mode of ['disconnect','replace'] as const)it(`refresh en vuelo no revierte ${mode}`,async()=>{
  await putConnection(nid,'google',{access_token:'expired',refresh_token:'old-refresh',expires_at:0},'old-account',false);
  let resume!:(r:Response)=>void;let signal!:()=>void;const started=new Promise<void>(resolve=>{signal=resolve;});
  fetchMock.mockImplementationOnce(()=>{signal();return new Promise(r=>{resume=r;});});
  const refreshing=accessToken(nid,'google',false);await started;
  await disconnect(nid,'google',false);
  if(mode==='replace')await putConnection(nid,'google',{access_token:'new-access',expires_at:Date.now()+600000},'new-account',false);
  resume(json({access_token:'stale-access',refresh_token:'rotated-old',expires_in:3600}));
  await expect(refreshing).rejects.toThrow();
  const current=await getConnection(nid,'google',false);expect(current?.account_id??null).toBe(mode==='replace'?'new-account':null);
 });
 it('un trabajo invalidado durante GET no modifica Google',async()=>{
  await putConnection(nid,'google',{access_token:'access',expires_at:Date.now()+600000},'account',false);
  let valid=true;fetchMock.mockImplementationOnce(async()=>{valid=false;return json({etag:'new',extendedProperties:{private:{planv_booking:id}}});}).mockResolvedValue(json({}));
  await expect(syncGoogleBooking(booking,schedulingDefaultSettings(),false,{authorize:async()=>valid})).rejects.toThrow();
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });
 it('no reemplaza una revisión mayor ya publicada en Google',async()=>{
  await putConnection(nid,'google',{access_token:'access',expires_at:Date.now()+600000},'account',false);
  fetchMock.mockResolvedValueOnce(json({etag:'new',extendedProperties:{private:{planv_booking:id,planv_revision:'3'}}})).mockResolvedValue(json({}));
  await expect(syncGoogleBooking(booking,schedulingDefaultSettings(),false)).rejects.toThrow();expect(fetchMock).toHaveBeenCalledTimes(1);
 });
 it('serializa dos renovaciones de la misma credencial rotatoria',async()=>{
  await putConnection(nid,'google',{access_token:'expired',refresh_token:'old-refresh',expires_at:0},'account',false);
  let resume!:(r:Response)=>void;fetchMock.mockImplementationOnce(()=>new Promise(r=>{resume=r;}));
  const one=accessToken(nid,'google',false),two=accessToken(nid,'google',false);await vi.waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));
  resume(json({access_token:'rotated',refresh_token:'new-refresh',expires_in:3600}));expect(await one).toEqual(await two);expect(fetchMock).toHaveBeenCalledTimes(1);
 });
 it('un callback OAuth antiguo no restaura una conexión desconectada',async()=>{
  const start=await beginOAuth(nid,'user','google',false),state=new URL(start.url).searchParams.get('state')!;
  await disconnect(nid,'google',false);
  fetchMock.mockResolvedValueOnce(json({access_token:'stale',refresh_token:'stale-refresh',expires_in:3600})).mockResolvedValueOnce(json({sub:'old-account'}));
  await expect(finishOAuth('google','code',state,start.cookie,false)).rejects.toThrow();expect(await getConnection(nid,'google',false)).toBeNull();
 });
 it('una conexión revocada durante GET no recibe una escritura',async()=>{
  await putConnection(nid,'google',{access_token:'access',expires_at:Date.now()+600000},'account',false);
  fetchMock.mockImplementationOnce(async()=>{await disconnect(nid,'google',false);return json({etag:'new',extendedProperties:{private:{planv_booking:id}}});});
  await expect(syncGoogleBooking(booking,schedulingDefaultSettings(),false)).rejects.toThrow();expect(fetchMock).toHaveBeenCalledTimes(1);
 });
 it('cambio de revisión después del HTTP queda incierto; registra revisión y guard antes de escribir',async()=>{
  await putConnection(nid,'google',{access_token:'access',expires_at:Date.now()+600000},'account',false);
  let valid=true,issued=false;
  fetchMock.mockResolvedValueOnce(json({etag:'new',extendedProperties:{private:{planv_booking:id,planv_revision:'1'}}})).mockImplementationOnce(async(_url,init)=>{expect(issued).toBe(true);expect(JSON.parse(String(init?.body)).extendedProperties.private.planv_revision).toBe('2');valid=false;return json({});});
  await expect(syncGoogleBooking(booking,schedulingDefaultSettings(),false,{authorize:async()=>valid,beforeWrite:async()=>{issued=true;return true;}})).rejects.toBeInstanceOf(SchedulingUncertainError);expect(fetchMock).toHaveBeenCalledTimes(2);
 });
});
