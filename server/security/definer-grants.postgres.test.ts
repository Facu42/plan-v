import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// Permisos de las funciones con permisos de dueño (security definer), con los
// permisos por defecto que Supabase da en producción: toda función nueva del
// esquema public nace ejecutable por anon y authenticated. Sin ese detalle las
// otras pruebas no veían que 34 funciones internas quedaban abiertas.

// Las únicas que una persona con sesión puede llamar: las que usa la API y las
// que aparecen en reglas de acceso. Sumar una acá exige que valide a quien llama.
const ALLOWED = [
  'accept_org_invite',
  'accept_patient_invite',
  'ack_thread_delivery',
  // Catálogo privado: profesional titular y revisión vigente obligatorios.
  'act_professional_model',
  'add_patient_clinical_note',
  'add_shopping_manual',
  'admin_extend_trial',
  'admin_get_service_board',
  'admin_log_service_event',
  'admin_mark_test_account',
  'admin_record_service_payment',
  'admin_set_service_note',
  'admin_set_service_override',
  'admin_set_service_settings',
  'admin_void_service_payment',
  'apply_ai_job',
  'apply_professional_model',
  'assign_editorial_resource',
  'assign_exercise_routine',
  'assign_recipe',
  'assign_recipe_day',
  'care_can_read',
  'care_consent',
  'care_meal_photo_allowed',
  'claim_ai_job',
  'claim_recipe_cover',
  'complete_privacy_delete',
  'complete_privacy_export',
  'confirm_appointment',
  'create_organization',
  'create_patient_with_invite',
  'delegate_patient_care',
  'delete_care_document',
  'delete_care_photo',
  'delete_patient_activity',
  'delete_shopping_manual',
  'enqueue_ai_job',
  'enqueue_outbox_event',
  'finish_ai_job',
  'finish_recipe_cover',
  'get_ai_job',
  'get_billing_board',
  'get_notification_preferences',
  'get_organization_subscription',
  'get_patient_appointment',
  'get_patient_exercise',
  'get_patient_intake',
  'get_patient_ledger',
  'get_patient_library',
  // Identity must equal my_patient_id; public projection only; full access required.
  'get_patient_meal_logs',
  'get_patient_progress',
  'get_privacy_package',
  'get_shopping_list',
  'invite_org_member',
  'is_assigned_patient',
  'is_assigned_patient_path',
  'is_org_member',
  'is_platform_admin',
  'list_ai_jobs',
  'list_assigned_recipes',
  'list_meal_plan_history',
  'list_my_organizations',
  'list_outbox_mailbox',
  'list_outbox_snapshot',
  'list_patient_care_links',
  'list_privacy_requests',
  'list_professional_meal_plan',
  'list_professional_recipe_favorites',
  'list_professional_recipes',
  'list_published_meal_plan',
  'list_recipe_days',
  'list_thread_messages',
  'log_patient_activity',
  'mark_editorial_resource_read',
  'mark_thread_read',
  'my_nutritionist_id',
  'my_patient_id',
  'open_message_attachment',
  'patient_has_full_access',
  'process_outbox_deliveries',
  'publish_care_replacement',
  'publish_editorial_resource',
  'publish_recipe',
  'publish_reviewed_meal_plan',
  'record_meal_analysis',
  'record_patient_consent',
  'record_patient_payment',
  'record_privacy_access',
  'register_recipe_day',
  'reject_ai_job',
  'report_patient_payment',
  'request_body_data',
  'request_privacy_action',
  'reschedule_appointment',
  // Exige profesional, titularidad del plan y versión publicada vigente.
  'retry_menu_dish_covers',
  'review_care_record',
  'review_meal_log',
  'review_patient_intake',
  'review_patient_payment',
  'revoke_patient_care',
  'save_care_preferences',
  'save_care_record',
  'save_editorial_resource',
  'save_meal_log',
  'save_meal_plan_draft',
  'save_my_body_data',
  'save_notification_preferences',
  'save_patient_intake',
  'save_professional_model',
  'save_recipe_draft',
  'save_routine_feedback',
  'schedule_appointment',
  'send_thread_attachment',
  'send_thread_message',
  'set_organization_subscription_status',
  'set_patient_archived',
  'set_patient_billing',
  'set_patient_charge_waived',
  'set_patient_fee',
  'set_payment_settings',
  'set_professional_recipe_favorite',
  'set_recipe_cover',
  'set_shopping_checked',
  'submit_patient_intake',
  'toggle_favorite',
  'transfer_patient_ownership',
];

let db: PGlite;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientA = '10000000-0000-4000-a000-0000000000a1';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  for (const [id, email] of [[nutriA, 'a@example.test'], [nutriB, 'b@example.test'], [patientAUser, 'pa@example.test']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  await db.query("select public.provision_nutritionist($1,'Nutri B')", [nutriB]);
  await db.query(
    "insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente A','waived')",
    [patientA, nutriAId, patientAUser],
  );
  await db.query(
    "insert into public.messages(nutritionist_id,patient_id,author_id,body,sent_at) values ($1,$2,$3,'Dato privado',now())",
    [nutriAId, patientA, nutriA],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
});

describe('funciones con permisos de dueño (permisos como en Supabase)', () => {
  async function executable(role: string) {
    const rows = await db.query<{ proname: string }>(
      `select distinct p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prosecdef and has_function_privilege($1, p.oid, 'execute')
       order by 1`,
      [role],
    );
    return rows.rows.map((row) => row.proname);
  }

  it('anon no ejecuta ninguna', async () => {
    expect(await executable('anon')).toEqual([]);
  });

  it('authenticated sólo ejecuta las de la lista permitida', async () => {
    expect(await executable('authenticated')).toEqual(ALLOWED);
  });

  it('la reapertura expone un wrapper invoker y un helper privado autorizado con ruta de búsqueda vacía',async()=>{
    const routines = await db.query<{schema:string;prosecdef:boolean;allowed:boolean;anonymous:boolean;proconfig:string[]}>(
      "select n.nspname as schema,p.prosecdef,has_function_privilege('authenticated',p.oid,'execute') as allowed,has_function_privilege('anon',p.oid,'execute') as anonymous,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='reopen_patient_intake' order by n.nspname",
    );
    expect(routines.rows).toEqual([{schema:'private',prosecdef:true,allowed:true,anonymous:false,proconfig:['search_path=""']},{schema:'public',prosecdef:false,allowed:true,anonymous:false,proconfig:['search_path=""']}]);
  });

  it('el guardado antiguo no permite saltar la revisión de la meta', async () => {
    const result = await db.query<{ allowed: boolean }>(
      "select has_function_privilege('authenticated', p.oid, 'execute') as allowed from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_nutrition_target'",
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.every(row => !row.allowed)).toBe(true);
  });

  it('una nutricionista ajena no lee un mensaje por su id', async () => {
    const [{ id }] = (await db.query<{ id: string }>('select id from public.messages limit 1')).rows;
    await expect(asUser(nutriB, 'select public.thread_message_json($1, true)', [id])).rejects.toMatchObject({ code: '42501' });
  });

  it('la dueña sigue leyendo sus mensajes por la función pública', async () => {
    const rows = await asUser<{ r: Array<{ text: string }> | { items?: Array<{ text: string }> } }>(nutriA, 'select public.list_thread_messages($1, false) as r', [patientA]);
    expect(JSON.stringify(rows[0].r)).toContain('Dato privado');
  });

  it('una función nueva nace cerrada', async () => {
    await db.exec("create function public.nueva_prueba() returns int language sql security definer set search_path = '' as 'select 1'");
    const ok = await db.query<{ a: boolean; u: boolean }>(
      "select has_function_privilege('anon','public.nueva_prueba()','execute') a, has_function_privilege('authenticated','public.nueva_prueba()','execute') u",
    );
    expect(ok.rows[0]).toEqual({ a: false, u: false });
    await db.exec('drop function public.nueva_prueba()');
  });
});
