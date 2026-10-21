import {afterEach,expect,it,vi} from 'vitest';
import {app} from '../index.js';
afterEach(()=>vi.unstubAllEnvs());
it('serves scheduling settings through the real app while refusing unsupported real connections in demo',async()=>{
 vi.stubEnv('APP_MODE','demo');vi.stubEnv('AI_MODE','disabled');vi.stubEnv('SUPABASE_URL','');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','');
 const response=await app.request('/api/scheduling');expect(response.status).toBe(200);
 const result=await response.json();expect(result.profile.config.calendars.length).toBeGreaterThan(0);
 expect((await app.request('/api/scheduling/?offset=0')).status).toBe(200);
 const unavailable=await app.request('/api/scheduling/connections/google/start',{method:'POST'});
 expect(unavailable.status).toBe(501);expect(unavailable.headers.get('Cache-Control')).toBe('no-store');
 const missingConsent=await app.request('/api/patients/pat-sofia/document-organizer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_key:crypto.randomUUID(),items:[{text:'Antecedente ficticio',category:'history',origin:{file:'ejemplo.csv',row:2}}]})});
 expect([400,403]).toContain(missingConsent.status);
});
