/** Fixture ficticia para QA de fase 6. Sólo escucha en loopback y nunca usa Supabase. */
import {serve} from '@hono/node-server';
import {app} from '../server/index.js';
import {seedDemoOnBoot} from '../server/demo/autoseed.js';
import {getPatient} from '../server/store.js';
import {CONSENT_CATALOG} from '../server/intake/consent.js';

if(process.env.APP_MODE!=='demo'||process.env.AI_MODE!=='demo'||[process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.SUPABASE_ANON_KEY].some(Boolean))throw Error('La fixture exige demo local sin conexión a datos reales.');
const seeded=await seedDemoOnBoot((path,init)=>app.request(path,init));
if(seeded.failed.length)throw Error('No se pudo preparar la demo.');
const quiet=getPatient('pat-marina');if(!quiet)throw Error('Fixture ausente.');
quiet.created_at='2026-01-01T12:00:00Z';quiet.meal_logs=[];quiet.habit_logs=[];quiet.activity_logs=[];
const consent=CONSENT_CATALOG.find(row=>row.purpose==='ai_menu_draft')!;
const response=await app.request('/api/patients/pat-sofia/consents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose:consent.purpose,text_version:consent.text_version,text_hash:consent.text_hash,decision:'granted'})});
if(!response.ok)throw Error('Permiso ficticio no preparado.');
serve({fetch:app.fetch,port:3019,hostname:'127.0.0.1'});
console.log('Demostración ficticia de fase 6 disponible en 127.0.0.1:3019.');
