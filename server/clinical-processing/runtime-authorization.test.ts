import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {authorizeClinicalScope} from './provider.js';
import {resetStore} from '../store.js';
import {appendConsent} from '../intake/memory.js';
import {consentTextByPurpose} from '../intake/consent.js';
import {tasks,sessions,resetConsultationMemory,commandMemory} from '../consultations/memory.js';
const scope={patientId:'pat-sofia',nutritionistId:'demo-nutri',requestedBy:'demo'};
const input={scope,taskId:'task',sessionId:'session',requestKey:'request',runToken:'token',revision:1,consentVersion:'ai_consultation.v1' as const};
function consent(purpose:'care_relationship'|'ai_consultation',decision:'granted'|'withdrawn'){
 const c=consentTextByPurpose(purpose);appendConsent(scope.patientId,{purpose,decision,text_version:c.text_version,text_hash:c.text_hash,actor_id:'demo'});
}
beforeEach(()=>{resetStore();resetConsultationMemory();vi.stubEnv('APP_MODE','demo');vi.stubEnv('SUPABASE_URL','');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','');commandMemory(scope,{action:'start',id:'session',source:'manual'});tasks.set('task',{id:'task',request_key:'request',session_id:'session',patient_id:scope.patientId,nutritionist_id:scope.nutritionistId,requested_by:'demo',kind:'summary',revision:1,index:0,status:'running',audio_path:null,expires_at:null,duration_seconds:0,audio_sha256:null,run_token:'token',lease_until:new Date(Date.now()+60000).toISOString(),attempts:1,text:'',error:null,consent_version:'ai_consultation.v1'});consent('care_relationship','granted');consent('ai_consultation','granted');});
afterEach(()=>vi.unstubAllEnvs());
it('runtime rechecks clinical relationship and job identity immediately around provider calls',async()=>{
 expect(await authorizeClinicalScope(input)).toBe(true);consent('care_relationship','withdrawn');expect(await authorizeClinicalScope(input)).toBe(false);
 consent('care_relationship','granted');expect(await authorizeClinicalScope({...input,runToken:'old-token'})).toBe(false);
 expect(await authorizeClinicalScope({...input,scope:{...scope,patientId:'pat-marina'}})).toBe(false);
 sessions.get('session')!.revision++;expect(await authorizeClinicalScope(input)).toBe(false);
});
