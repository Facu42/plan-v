import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import { app } from '../index.js';
import { calculateTarget, defaultsForGoal, type TargetInput } from '../../src/lib/nutrition-target.js';

const enabled = process.env.PLANV_LOCAL_SIGNED_AUTH === '1';
const INTERNAL = ['audit_events','notification_deliveries','notification_preferences','nutritionist_subscriptions','outbox_events','patient_invite_events','payment_webhook_events','platform_admins','platform_settings','privacy_access_events','privacy_export_packages','privacy_requests','processing_jobs','recipe_day_assignments','recipe_version_cards','service_payments'];
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
  if (!protocols.includes(url.protocol) || !['127.0.0.1','localhost','[::1]'].includes(url.hostname)) {
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
      const target = await owner.client.rpc('save_nutrition_target', { target: id, target_inputs: inputs, target_result: calculateTarget(inputs), publish: true });
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
    expect((await ownerA.client.rpc('save_nutrition_target',{target:pidA,target_inputs:inputs,target_result:calculateTarget(inputs),publish:false})).error).toBeNull();
    const hidden = await patientA.client.from('nutrition_targets').select('patient_id').eq('patient_id',pidA);
    expect(hidden.error).toBeNull(); expect(hidden.data).toEqual([]);
    expect((await ownerA.client.rpc('save_nutrition_target',{target:pidA,target_inputs:inputs,target_result:calculateTarget(inputs),publish:true})).error).toBeNull();
    const visible = await patientA.client.from('nutrition_targets').select('patient_id').eq('patient_id',pidA);
    expect(visible.error).toBeNull(); expect(visible.data).toEqual([{ patient_id: pidA }]);
  });

  it('el mensaje autorizado se lee y la función interna queda cerrada', async () => {
    const own = await ownerA.client.rpc('list_thread_messages',{target_patient:pidA,ack_delivery:false});
    // La firma real debe coincidir: un error de catálogo no cuenta como denegación.
    expect(own.error).toBeNull(); expect(JSON.stringify(own.data)).toContain('MENSAJE FICTICIO A');
    for (const actor of [ownerA,ownerB,patientA,patientB]) {
      expect((await actor.client.rpc('thread_message_json',{mid:messageA,include_ai:true})).error?.code).toBe('42501');
    }
  });

  it('las 16 tablas internas siguen cerradas con todas las sesiones y sin sesión', async () => {
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
});

