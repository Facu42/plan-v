import {randomUUID} from 'node:crypto';
import {beforeEach,expect,it} from 'vitest';
import {app} from '../index';
import {resetStore,getPatient} from '../store';
const save=(body:unknown)=>app.request('/api/crm/message-settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>resetStore());
it('guarda respuestas y destacadas con una revisión; un cambio anterior no pisa la nueva versión',async()=>{
 const first=await app.request('/api/crm/message-settings');expect(first.status).toBe(200);const previous=await first.json();
 const replies=[{id:randomUUID(),title:'Retomar',body:'Contame cómo venís con tus registros.'}];
 const saved=await save({expected_revision:previous.revision,replies,starred_patient_ids:['pat-sofia']});expect(saved.status).toBe(200);const current=await saved.json();expect(current.replies).toEqual(replies);expect(current.starred_patient_ids).toEqual(['pat-sofia']);
 const stale=await save({expected_revision:previous.revision,replies:[],starred_patient_ids:[]});expect(stale.status).toBe(409);
 const again=await (await app.request('/api/crm/message-settings')).json();expect(again.revision).toBe(current.revision);
});
it('limita el contenido y no permite destacar ajenas ni devolver pacientes archivadas',async()=>{
 const current=await (await app.request('/api/crm/message-settings')).json();
 expect((await save({expected_revision:current.revision,replies:[{id:randomUUID(),title:'',body:'x'}],starred_patient_ids:[]})).status).toBe(400);
 expect((await save({expected_revision:current.revision,replies:[],starred_patient_ids:['other']})).status).toBe(403);
 getPatient('pat-sofia')!.archived_at=new Date().toISOString();
 expect((await (await app.request('/api/crm/message-settings')).json()).starred_patient_ids).not.toContain('pat-sofia');
 expect((await app.request('/api/crm/message-settings?audience=patient')).status).toBe(403);
});
