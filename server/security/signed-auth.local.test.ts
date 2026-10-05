import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import { app } from '../index.js';
import { calculateTarget, defaultsForGoal, type TargetInput } from '../../src/lib/nutrition-target.js';
import { planReviewSnapshot, type PlanVersionView } from '../../src/types/plans.js';
import { CONSENT_CATALOG } from '../intake/consent.js';

const enabled = process.env.PLANV_LOCAL_SIGNED_AUTH === '1';
const INTERNAL = ['audit_events','notification_deliveries','notification_preferences','nutritionist_subscriptions','outbox_events','patient_invite_events','payment_webhook_events','platform_admins','platform_settings','privacy_access_events','privacy_export_packages','privacy_requests','processing_jobs','recipe_cover_requests','recipe_day_assignments','recipe_version_cards','service_payments'];
const canary = 'NOTA PROFESIONAL FICTICIA: prueba de acceso';
const inputs: TargetInput = { sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera', ...defaultsForGoal('bajar') };
const body = { sex: 'femenino', birth_date: '1990-05-10', height_cm: 165, weight_kg: 65 };
type Actor = { id: string; token: string; client: SupabaseClient };
let pool: pg.Pool;
let anonymous: SupabaseClient;
let ownerA: Actor; let ownerB: Actor; let patientA: Actor; let patientB: Actor;
const pidA = randomUUID(); const pidB = randomUUID();
let nidA: string;
let messageA: string;

function assertLocal(raw: string | undefined, protocols: string[]) {
  if (!raw) throw new Error('Falta el entorno local de sesiones.');
  const url = new URL(raw);
  if (url.search||url.hash||!protocols.includes(url.protocol) || !['127.0.0.1','localhost','[::1]'].includes(url.hostname)) {
    throw new Error('No se permiten proyectos hospedados ni pacientes reales.');
  }
  return raw;
}

async function api(actor: Actor | undefined, path: string, method = 'GET', data?: unknown) {
  return app.request(path, {
    method,
    headers: { ...(actor ? { Authorization: 'Bearer ' + actor.token } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}

describe.skipIf(!enabled)('aislamiento mediante Auth y PostgREST locales con sesiones firmadas', () => {
  beforeAll(async () => {
    const url = assertLocal(process.env.SUPABASE_URL, ['http:']);
    const databaseUrl = assertLocal(process.env.PLANV_LOCAL_AUTH_DB_URL, ['postgres:', 'postgresql:']);
    const key = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key || !serviceKey || process.env.APP_MODE !== 'staging' || process.env.AI_MODE !== 'disabled') {
      throw new Error('Configuración de prueba persistente incompleta.');
    }
    pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });
    expect((await pool.query('select count(*)::int as n from public.patients')).rows[0].n).toBe(0);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    anonymous = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const password = 'Local-' + randomBytes(24).toString('base64url') + '-A1!';
    async function actor(label: string): Promise<Actor> {
      const email = label + '-' + randomUUID() + '@example.test';
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data.user) throw new Error('No se pudo crear la identidad ficticia.');
      const client = createClient(url, key!, { auth: { persistSession: false, autoRefreshToken: false } });
      const signed = await client.auth.signInWithPassword({ email, password });
      if (signed.error || !signed.data.session) throw new Error('No se pudo iniciar la sesión ficticia.');
      expect(signed.data.user?.id).toBe(created.data.user.id);
      const token = signed.data.session.access_token;
      const verified = await admin.auth.getUser(token);
      expect(verified.error).toBeNull();
      expect(verified.data.user?.id).toBe(created.data.user.id);
      return { id: created.data.user.id, token, client };
    }
    ownerA = await actor('nutri-a'); ownerB = await actor('nutri-b');
    patientA = await actor('paciente-a'); patientB = await actor('paciente-b');
    nidA = (await pool.query("select public.provision_nutritionist($1,'Profesional ficticia A') as id", [ownerA.id])).rows[0].id;
    const nidB = (await pool.query("select public.provision_nutritionist($1,'Profesional ficticia B') as id", [ownerB.id])).rows[0].id;
    await pool.query(
      "insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status,adherence_why) values ($1,$2,$3,'Ficticia A','waived',$4),($5,$6,$7,'Ficticia B','waived',$4)",
      [pidA,nidA,patientA.id,canary,pidB,nidB,patientB.id],
    );
    messageA = (await pool.query(
      "insert into public.messages(nutritionist_id,patient_id,author_id,body,sent_at) values($1,$2,$3,'MENSAJE FICTICIO A',now()) returning id",
      [nidA,pidA,ownerA.id],
    )).rows[0].id;
    for (const [actor, id, owner] of [[patientA,pidA,ownerA],[patientB,pidB,ownerB]] as const) {
      const saved = await actor.client.rpc('save_my_body_data', { body });
      expect(saved.error).toBeNull();
      const target = await owner.client.rpc('save_nutrition_target_versioned', { target: id, target_inputs: inputs, target_result: calculateTarget(inputs), publish: true, expected_revision: 0 });
      expect(target.error).toBeNull();
    }
  }, 60000);

  afterAll(async () => {
    // La eliminación de todos los datos/usuarios la hace el runner al quitar SU entorno.
    await pool?.end();
  });

  it('las cuatro sesiones son identidades distintas aceptadas por Auth y PostgreSQL', async () => {
    expect(new Set([ownerA.id,ownerB.id,patientA.id,patientB.id]).size).toBe(4);
    const own = await ownerA.client.rpc('my_nutritionist_id');
    expect(own.error).toBeNull(); expect(own.data).toBe(nidA);
    const patient = await patientA.client.rpc('my_patient_id');
    expect(patient.error).toBeNull(); expect(patient.data).toBe(pidA);
  });

  it('la profesional lee su paciente y no la de otra profesional por acceso directo', async () => {
    const own = await ownerA.client.from('patients').select('id').eq('id',pidA);
    expect(own.error).toBeNull(); expect(own.data).toEqual([{ id: pidA }]);
    const foreign = await ownerB.client.from('patients').select('id').eq('id',pidA);
    expect(foreign.error).toBeNull(); expect(foreign.data).toEqual([]);
  });

  it('otra profesional no modifica la paciente; el dato guardado queda intacto', async () => {
    const forbidden = await ownerB.client.from('patients').update({ goal: 'INTENTO FICTICIO AJENO' }).eq('id',pidA).select('id');
    expect(forbidden.error).toBeNull(); expect(forbidden.data).toEqual([]);
    const verified = await ownerA.client.from('patients').select('goal').eq('id',pidA).single();
    expect(verified.error).toBeNull(); expect(verified.data?.goal).not.toBe('INTENTO FICTICIO AJENO');
  });

  it('la paciente ve su ficha permitida y no la de otra paciente', async () => {
    const own = await patientA.client.from('patients_patient_view').select('id').eq('id',pidA);
    expect(own.error).toBeNull(); expect(own.data).toEqual([{ id: pidA }]);
    const foreign = await patientB.client.from('patients_patient_view').select('id').eq('id',pidA);
    expect(foreign.error).toBeNull(); expect(foreign.data).toEqual([]);
  });

  it('la paciente no lee las notas profesionales de su fila cruda', async () => {
    const professional = await ownerA.client.from('patients').select('adherence_why').eq('id',pidA).single();
    expect(professional.error).toBeNull(); expect(professional.data?.adherence_why).toBe(canary);
    const patient = await patientA.client.from('patients').select('adherence_why').eq('id',pidA);
    expect(patient.error).toBeNull(); expect(patient.data).toEqual([]);
  });

  it('nutricionista y paciente acceden por la API con su sesión real', async () => {
    for (const actor of [ownerA,patientA]) {
      const res = await api(actor,'/api/patients/' + pidA + '/nutrition-target');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.target.patient_id).toBe(pidA);
      expect(json.target.result).toEqual(calculateTarget(inputs));
    }
  });

  it('la ficha de paciente funciona por la API sin devolver notas profesionales', async () => {
    for (const path of ['/api/me/patient','/api/patients/' + pidA]) {
      const response = await api(patientA,path);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.patient.id).toBe(pidA);
      expect(JSON.stringify(json)).not.toContain(canary);
    }
    const professional = await api(ownerA,'/api/patients/' + pidA);
    expect(professional.status).toBe(200);
    expect((await professional.json()).patient.adherence_why).toBe(canary);
    expect((await api(patientB,'/api/patients/' + pidA)).status).toBe(403);
  });

  it('la API bloquea a la profesional y paciente ajenas', async () => {
    for (const actor of [ownerB,patientB]) {
      expect((await api(actor,'/api/patients/' + pidA + '/nutrition-target')).status).toBe(403);
      expect((await api(actor,'/api/patients/' + pidA + '/body-data')).status).toBe(403);
    }
  });

  it('la API rechaza la ausencia de sesión y un token con firma modificada', async () => {
    const path = '/api/patients/' + pidA + '/nutrition-target';
    expect((await api(undefined,path)).status).toBe(401);
    const parts = ownerA.token.split('.');
    parts[2] = (parts[2][0] === 'a' ? 'b' : 'a') + parts[2].slice(1);
    expect((await api({ ...ownerA,token: parts.join('.') },path)).status).toBe(401);
  });

  it('PostgREST no permite leer datos corporales o metas de otro vínculo', async () => {
    for (const actor of [ownerB,patientB]) {
      for (const table of ['patient_body_data','nutrition_targets']) {
        const result = await actor.client.from(table).select('patient_id').eq('patient_id',pidA);
        expect(result.error).toBeNull(); expect(result.data).toEqual([]);
      }
    }
    const positive = await patientA.client.from('patient_body_data').select('weight_kg').eq('patient_id',pidA).single();
    expect(positive.error).toBeNull(); expect(Number(positive.data?.weight_kg)).toBe(65);
  });

  it('la función de metas no permite que otro rol o vínculo guarde', async () => {
    const before = await pool.query('select result,updated_at from public.nutrition_targets where patient_id=$1',[pidA]);
    for (const actor of [ownerB,patientB,patientA]) {
      const result = await actor.client.rpc('save_nutrition_target',{target:pidA,target_inputs:inputs,target_result:calculateTarget(inputs),publish:true});
      expect(result.error?.code).toBe('42501');
    }
    const after = await pool.query('select result,updated_at from public.nutrition_targets where patient_id=$1',[pidA]);
    expect(after.rows).toEqual(before.rows);
  });

  it('el borrador no se filtra a la paciente y la publicación sí llega', async () => {
    const draftInputs={...inputs,weight_kg:66};
    const workspace=await ownerA.client.rpc('get_nutrition_target_workspace',{target:pidA});
    expect(workspace.error).toBeNull();
    const saved=await ownerA.client.rpc('save_nutrition_target_versioned',{target:pidA,target_inputs:draftInputs,target_result:calculateTarget(draftInputs),publish:false,expected_revision:workspace.data.revision});
    expect(saved.error).toBeNull();
    for(const actor of [patientA,patientB,ownerB]){
      const hidden=await actor.client.from('nutrition_target_drafts').select('patient_id').eq('patient_id',pidA);
      expect(hidden.error).toBeNull();expect(hidden.data).toEqual([]);
    }
    const published=await api(patientA,'/api/patients/'+pidA+'/nutrition-target');
    expect(published.status).toBe(200);const json=await published.json();
    expect(json.target.result).toEqual(calculateTarget(inputs));expect(json).not.toHaveProperty('draft');expect(json).not.toHaveProperty('revision');
    expect((await ownerA.client.rpc('save_nutrition_target_versioned',{target:pidA,target_inputs:inputs,target_result:calculateTarget(inputs),publish:true,expected_revision:saved.data.revision})).error).toBeNull();
    const visible = await patientA.client.from('nutrition_targets').select('patient_id').eq('patient_id',pidA);
    expect(visible.error).toBeNull(); expect(visible.data).toEqual([{ patient_id: pidA }]);
  });

  it('dos sesiones con la misma revisión no sobrescriben la meta',async()=>{
    const started=performance.now();
    const url=assertLocal(process.env.SUPABASE_URL,['http:']);
    const clients=[0,1].map(()=>createClient(url,process.env.SUPABASE_ANON_KEY!,{
      accessToken:async()=>ownerA.token,auth:{persistSession:false,autoRefreshToken:false},db:{retry:false},
    }));
    const workspace=await clients[0].rpc('get_nutrition_target_workspace',{target:pidA}).abortSignal(AbortSignal.timeout(12000));
    const workspaceMs=Math.round(performance.now()-started);
    expect(workspace.error).toBeNull();
    const writesStarted=performance.now();
    const probe=setTimeout(()=>{void pool.query("select state,wait_event_type,wait_event,cardinality(pg_blocking_pids(pid)) as blockers from pg_stat_activity where datname=current_database() and application_name ilike '%postgrest%' and state<>'idle'").then(result=>console.info('Diagnóstico local de contención:',JSON.stringify(result.rows))).catch(()=>console.info('Diagnóstico local no disponible.'));},4000);
    const results=await Promise.all([67,68].map((weight_kg,index)=>{
      const proposed={...inputs,weight_kg};
      return clients[index].rpc('save_nutrition_target_versioned',{target:pidA,target_inputs:proposed,target_result:calculateTarget(proposed),publish:false,expected_revision:workspace.data.revision}).abortSignal(AbortSignal.timeout(12000));
    })).finally(()=>clearTimeout(probe));
    console.info('Concurrencia local de metas:',JSON.stringify({workspace_ms:workspaceMs,writes_ms:Math.round(performance.now()-writesStarted),statuses:results.map(result=>result.status),codes:results.map(result=>result.error?.code??null)}));
    expect(results.filter(result=>!result.error)).toHaveLength(1);
    const conflict=results.find(result=>result.error);
    expect(conflict?.error?.code).toBe('PT409');expect(conflict?.status).toBe(409);
    const afterStarted=performance.now();
    const after=await clients[0].rpc('get_nutrition_target_workspace',{target:pidA}).abortSignal(AbortSignal.timeout(12000));
    console.info('Lectura local posterior:',JSON.stringify({elapsed_ms:Math.round(performance.now()-afterStarted),status:after.status,code:after.error?.code??null}));
    expect(after.error).toBeNull();expect(after.data.revision).toBe(workspace.data.revision+1);
    expect([67,68]).toContain(after.data.draft.inputs.weight_kg);
    expect(after.data.published.result).toEqual(calculateTarget(inputs));
    // El mismo conflicto debe responder sin otra escritura simultánea y sin alterar datos.
    const stale=await clients[0].rpc('save_nutrition_target_versioned',{target:pidA,target_inputs:inputs,target_result:calculateTarget(inputs),publish:false,expected_revision:workspace.data.revision}).abortSignal(AbortSignal.timeout(3000));
    expect(stale.status).toBe(409);expect(stale.error?.code).toBe('PT409');
    const staleApi=await api(ownerA,'/api/patients/'+pidA+'/nutrition-target','PUT',{inputs,publish:false,expected_revision:workspace.data.revision});
    expect(staleApi.status).toBe(409);expect(await staleApi.json()).toMatchObject({error:'La meta cambió en otra sesión. Recargala antes de guardar.'});
    const unchanged=await clients[0].rpc('get_nutrition_target_workspace',{target:pidA}).abortSignal(AbortSignal.timeout(3000));
    expect(unchanged.error).toBeNull();expect(unchanged.data).toEqual(after.data);
  },15000);

  it('el mensaje autorizado se lee y la función interna queda cerrada', async () => {
    const own = await ownerA.client.rpc('list_thread_messages',{target_patient:pidA,ack_delivery:false});
    // La firma real debe coincidir: un error de catálogo no cuenta como denegación.
    expect(own.error).toBeNull(); expect(JSON.stringify(own.data)).toContain('MENSAJE FICTICIO A');
    for (const actor of [ownerA,ownerB,patientA,patientB]) {
      expect((await actor.client.rpc('thread_message_json',{mid:messageA,include_ai:true})).error?.code).toBe('42501');
    }
  });

  it('las tablas internas siguen cerradas con todas las sesiones y sin sesión', async () => {
    for (const client of [anonymous,ownerA.client,ownerB.client,patientA.client,patientB.client]) {
      for (const table of INTERNAL) {
        const result = await client.from(table).select('*').limit(1);
        expect(result.error?.code, table).toBe('42501');
      }
    }
  });

  it('una paciente no puede subir su rol ni obtener administración', async () => {
    const changed = await patientA.client.from('profiles').update({role:'nutri'}).eq('id',patientA.id);
    expect(changed.error?.code).toBe('42501');
    const admin = await patientA.client.rpc('admin_get_service_board');
    expect(admin.error?.code).toBe('42501');
    const role = await patientA.client.from('profiles').select('role').eq('id',patientA.id).single();
    expect(role.error).toBeNull(); expect(role.data?.role).toBe('paciente');
  });

  it('el retiro cierra lectura y escritura con la misma sesión emitida antes', async () => {
    const request = await patientA.client.rpc('request_privacy_action',{payload:{patient_id:pidA,kind:'delete'}});
    expect(request.error).toBeNull();
    for (const actor of [ownerA,patientA]) {
      for (const table of ['patient_body_data','nutrition_targets']) {
        const result = await actor.client.from(table).select('patient_id').eq('patient_id',pidA);
        expect(result.error).toBeNull(); expect(result.data).toEqual([]);
      }
      expect((await api(actor,'/api/patients/' + pidA + '/nutrition-target')).status).toBe(403);
    }
    expect((await patientA.client.rpc('save_my_body_data',{body})).error?.code).toBe('42501');
    expect((await ownerA.client.rpc('request_body_data',{target:pidA})).error?.code).toBe('42501');
    const other = await api(patientB,'/api/patients/' + pidB + '/nutrition-target');
    expect(other.status).toBe(200); expect((await other.json()).target.patient_id).toBe(pidB);
  });

  it('reabrir ficha revisada usa CAS, conserva payload/consentimiento e impide leer historial privado', async () => {
    const endpoint = `/api/patients/${pidB}/intake`;
    const initial = await (await api(patientB,endpoint)).json();
    const saved = await api(patientB,endpoint,'PATCH',{expected_revision:initial.intake.revision,step:'review',payload:{preferred_name:'Paciente ficticia',patient_intent:'Corregir información'}});
    expect(saved.status).toBe(200); const draft = await saved.json();
    const care = CONSENT_CATALOG.find(entry => entry.purpose === 'care_relationship')!;
    expect((await api(patientB,`/api/patients/${pidB}/consents`,'POST',{purpose:care.purpose,text_version:care.text_version,text_hash:care.text_hash,decision:'granted'})).status).toBe(201);
    const sent = await api(patientB,endpoint+'/submit','POST',{expected_revision:draft.intake.revision}); expect(sent.status).toBe(200);
    const reviewed = await api(ownerB,endpoint+'/review','POST',{expected_revision:(await sent.json()).intake.revision}); expect(reviewed.status).toBe(200); const closed = await reviewed.json();
    for (const actor of [ownerB,ownerA,patientA]) expect((await api(actor,endpoint+'/reopen','POST',{expected_revision:closed.intake.revision})).status).toBe(403);
    const race = await Promise.all([api(patientB,endpoint+'/reopen','POST',{expected_revision:closed.intake.revision}),api(patientB,endpoint+'/reopen','POST',{expected_revision:closed.intake.revision})]);
    expect(race.map(result=>result.status).sort()).toEqual([200,409]);
    const opened = await (await api(patientB,endpoint)).json(); expect(opened.intake).toMatchObject({status:'draft',revision:closed.intake.revision+1,payload:closed.intake.payload});
    expect(opened.consents.find((c:{purpose:string})=>c.purpose===care.purpose)?.decision).toBe('granted'); expect(opened).not.toHaveProperty('history');
    const history = await pool.query('select snapshot from private.intake_revision_history where patient_id=$1',[pidB]); expect(history.rows).toHaveLength(1); expect(history.rows[0].snapshot.reviewed_by).toBe(ownerB.id);
    for(const actor of [patientB,patientA,ownerB]) expect((await actor.client.schema('private').from('intake_revision_history').select('*')).error).not.toBeNull();
    const edited = await api(patientB,endpoint,'PATCH',{expected_revision:opened.intake.revision,payload:{...opened.intake.payload,preferred_name:'Ficticia corregida'}}); expect(edited.status).toBe(200);
    expect((await (await api(patientB,endpoint)).json()).intake.payload.preferred_name).toBe('Ficticia corregida');
  });

  it('las reservas de portada y el límite IA son atómicos con sesiones independientes', async () => {
    const intake = await (await api(patientB, `/api/patients/${pidB}/intake`)).json();
    expect((await api(patientB, `/api/patients/${pidB}/intake`, 'PATCH', {
      expected_revision: intake.intake.revision, step: 'allergies',
      payload: { allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } },
    })).status).toBe(200);
    const consent = CONSENT_CATALOG.find(entry => entry.purpose === 'ai_menu_draft')!;
    expect((await api(patientB, `/api/patients/${pidB}/consents`, 'POST', {
      purpose: consent.purpose, text_version: consent.text_version, text_hash: consent.text_hash, decision: 'granted',
    })).status).toBe(201);
    const queued = await Promise.all(Array.from({ length: 4 }, () => ownerB.client.rpc('enqueue_ai_job', { payload: {
      patient_id: pidB, job_type: 'recipe_draft', prompt_version: 'recipe_draft.v1', context_hash: 'a'.repeat(64),
      estimated_tokens: 20, model: 'synthetic-only', request: {},
    } })));
    expect(queued.filter(result => !result.error)).toHaveLength(3);
    expect(queued.filter(result => result.error).map(result => result.error!.code)).toEqual(['PT429']);
    const jid = queued.find(result => !result.error)!.data.id;
    const runs = await Promise.all([ownerB.client.rpc('claim_ai_job', { target_job: jid }), ownerB.client.rpc('claim_ai_job', { target_job: jid })]);
    expect(runs.filter(result => !result.error)).toHaveLength(1);
    expect(runs.find(result => result.error)?.error?.code).toBe('PT409');

    const rid = randomUUID();
    const saved = await ownerB.client.rpc('save_recipe_draft', { payload: {
      id: rid, title: 'Arroz de prueba', yield_portions: 1, steps: ['Cocinar.'], nutrient_source: '',
      items: [{ name: 'Arroz', quantity: 80, unit: 'g' }],
    } });
    expect(saved.error).toBeNull();
    expect((await ownerB.client.rpc('publish_recipe', { target_recipe: rid, expected_version: 1, expected_revision: saved.data.current.revision })).error).toBeNull();
    const vid = saved.data.current.id;
    const covers = await Promise.all(Array.from({ length: 4 }, () => ownerB.client.rpc('claim_recipe_cover', { target_version: vid, retry: false })));
    expect(covers.every(result => !result.error)).toBe(true);
    expect(covers.filter(result => result.data)).toHaveLength(1);
    expect((await patientB.client.rpc('claim_recipe_cover', { target_version: vid, retry: true })).error?.code).toBe('42501');
  });

  it('un análisis bloqueado por una revisión no inventa origen y las lecturas conservan privacidad',async()=>{
    const mid=randomUUID();const cid=randomUUID();const macros={kcal:200,protein_g:10,carbs_g:35,fat_g:3};
    await pool.query("insert into public.meal_logs(id,patient_id,client_id,slot_label,description,note_for_nutri) values($1,$2,$3,'Almuerzo','Registro histórico ficticio',$4)",[mid,pidB,cid,canary]);
    const first=await pool.connect();let analysis:Promise<Awaited<ReturnType<typeof patientB.client.rpc>>>|undefined;
    try {
      await first.query('begin');await first.query('set local role authenticated');await first.query("select set_config('request.jwt.claim.sub',$1,true)",[ownerB.id]);
      await first.query('select public.review_meal_log($1)',[{meal_id:mid,status:'confirmed',macros}]);
      analysis=Promise.resolve(patientB.client.rpc('record_meal_analysis',{payload:{meal_id:mid,status:'succeeded',foods:[],macros,confidence:0.5}}));
      // Inicia una conexión real de PostgREST mientras la revisión conserva el lock.
      let blocked=false;
      for(let attempt=0;attempt<60;attempt++) {
        blocked=(await pool.query("select exists(select 1 from pg_locks where locktype='advisory' and not granted) as waiting")).rows[0].waiting;
        if(blocked)break;await new Promise(resolve=>setTimeout(resolve,50));
      }
      expect(blocked).toBe(true);
      await first.query('commit');const result=await analysis;
      expect(result.error).toBeNull();expect(result.data.nutrition_origin).toBeNull();expect(result.data).not.toHaveProperty('note_for_nutri');
      expect((await patientB.client.rpc('save_meal_log',{payload:{patient_id:pidB,client_id:cid,slot:'Almuerzo',description:'Reintento ficticio'}})).data.log).not.toHaveProperty('note_for_nutri');
      expect((await ownerB.client.from('meal_logs').update({nutrition_origin:'declared'}).eq('id',mid)).error?.code).toBe('42501');
      const reread=await api(patientB,`/api/patients/${pidB}`);expect(reread.status).toBe(200);const body=await reread.json();expect(JSON.stringify(body)).not.toContain(canary);
      expect((await pool.query('select nutrition_origin from public.meal_logs where id=$1',[mid])).rows[0].nutrition_origin).toBeNull();
    } finally {await first.query('rollback');first.release();if(analysis)await analysis.catch(()=>undefined);}
  });

  it('dos altas concurrentes con sesiones reales crean una ficha y una invitación recuperables',async()=>{
    const input={name:'Alta concurrente ficticia',email:randomUUID()+'@example.test',goal:'Organizar comidas'};
    const responses=await Promise.all([api(ownerB,'/api/patients','POST',input),api(ownerB,'/api/patients','POST',input)]);
    expect(responses.map(r=>r.status)).toEqual([201,201]);const bodies=await Promise.all(responses.map(r=>r.json()));
    expect(bodies[0].patient.id).toBe(bodies[1].patient.id);expect(bodies[0].invite.id).toBe(bodies[1].invite.id);
    expect((await pool.query('select count(*)::int as n from public.patient_invites where nutritionist_id=$1 and email=$2',[bodies[0].invite.nutritionist_id,input.email])).rows[0].n).toBe(1);
    expect((await api(ownerB,'/api/patients','POST',{...input,goal:'Otro objetivo'})).status).toBe(409);
    expect((await api(patientB,'/api/patients','POST',input)).status).toBe(403);
  });

  it('la publicación revisada retiene el mismo lock que una edición en otra conexión', async () => {
    const id = randomUUID();
    const draft = { id, period_start: '2026-10-02', period_end: '2026-10-03',
      items: [{ for_date: '2026-10-02', slot: 'Almuerzo', free_text: 'Arroz con verduras', portions: 1 }] };
    const saved = await ownerB.client.rpc('save_meal_plan_draft', { target_patient: pidB, payload: draft });
    expect(saved.error).toBeNull();
    const first = await pool.connect(); const second = await pool.connect();
    let editing: Promise<pg.QueryResult> | undefined;
    try {
      for (const client of [first, second]) {
        await client.query('begin'); await client.query('set local role authenticated');
        await client.query("set local statement_timeout='10s'");
        await client.query("select set_config('request.jwt.claim.sub',$1,true)", [ownerB.id]);
      }
      await first.query('select public.publish_reviewed_meal_plan($1,1,$2)', [id, planReviewSnapshot(saved.data.current as PlanVersionView)]);
      const available = await second.query('select pg_try_advisory_xact_lock(hashtextextended($1,1)) as acquired', [pidB]);
      expect(available.rows[0].acquired).toBe(false);
      editing = second.query('select public.save_meal_plan_draft($1,$2)', [pidB, { ...draft, expected_revision: saved.data.current.revision, items: [{ ...draft.items[0], free_text: 'Otra indicación' }] }]);
      await first.query('commit');
      const changed = (await editing).rows[0].save_meal_plan_draft;
      expect(changed.current.version).toBe(2);
      expect(changed.published.items[0].free_text).toBe('Arroz con verduras');
      await second.query('commit');
    } finally {
      await first.query('rollback');
      if (editing) await editing.catch(() => undefined);
      await second.query('rollback'); first.release(); second.release();
    }
  });
  it('publica un plan manual con el snapshot que recibe el navegador y conserva su versión frente a otro borrador',async()=>{
    const path=`/api/patients/${pidB}/plans`;
    const initial=await api(ownerB,path);expect(initial.status).toBe(200);const previous=(await initial.json()).plan;
    const id=previous.id;
    const draft={id,expected_revision:previous.current.revision,period_start:'2026-10-05',period_end:'2026-10-05',items:[{for_date:'2026-10-05',slot:'Almuerzo',free_text:'Arroz con vegetales',portions:1,public_note:'Indicación revisada'}]};
    const saved=await api(ownerB,path,'POST',draft);expect(saved.status).toBe(200);
    const current=(await saved.json()).plan.current as PlanVersionView;
    expect(current.items[0]).not.toHaveProperty('recipe_proposal');
    const published=await api(ownerB,`/api/plans/${id}/publish`,'POST',{expected_version:current.version,expected_snapshot:planReviewSnapshot(current)});expect(published.status).toBe(200);
    const next=await api(ownerB,path,'POST',{...draft,expected_revision:current.revision,items:[{...draft.items[0],public_note:'Nuevo borrador privado'}]});expect(next.status).toBe(200);const nextVersion=(await next.json()).plan.current.version;
    const reread=await api(patientB,path);expect(reread.status).toBe(200);const visible=(await reread.json()).plan;
    expect(visible.version).toBe(current.version);expect(visible.items[0].public_note).toBe('Indicación revisada');expect(JSON.stringify(visible)).not.toContain('Nuevo borrador privado');
    // Repetir la publicación idéntica ya aceptada es válido; la copia antigua no aprueba el nuevo borrador.
    const stale=await api(ownerB,`/api/plans/${id}/publish`,'POST',{expected_version:nextVersion,expected_snapshot:planReviewSnapshot(current)});expect(stale.status).toBe(409);
  });
  it('asignar un recurso devuelve fichas releídas para actualizar el consultorio',async()=>{
    const response=await api(ownerB,`/api/patients/${pidB}/library`);expect(response.status).toBe(200);const library=(await response.json()).library;
    const resource=library.resources[0];expect(resource).toBeTruthy();
    const assigned=await api(ownerB,'/api/resources/assign','POST',{resource_id:resource.slug,patient_ids:[pidB]});expect(assigned.status).toBe(200);const result=await assigned.json();
    expect(result.assigned_count).toBe(1);expect(result.patients).toHaveLength(1);expect(result.patients[0].resource_assignments.some((r:{resource_id:string})=>r.resource_id===resource.slug)).toBe(true);
    const reread=await api(patientB,`/api/patients/${pidB}/library`);expect(reread.status).toBe(200);expect((await reread.json()).library.assignments.some((r:{slug:string})=>r.slug===resource.slug)).toBe(true);
    const saved=await api(patientB,`/api/patients/${pidB}/favorites`,'POST',{item_kind:'resource',item_id:resource.id});expect(saved.status).toBe(200);expect((await saved.json()).library.favorites.some((r:{item_id:string})=>r.item_id===resource.id)).toBe(true);
    const removed=await api(patientB,`/api/patients/${pidB}/favorites`,'POST',{item_kind:'resource',item_id:resource.slug});expect(removed.status).toBe(200);expect((await removed.json()).library.favorites.some((r:{item_id:string})=>r.item_id===resource.id)).toBe(false);
  });
});

