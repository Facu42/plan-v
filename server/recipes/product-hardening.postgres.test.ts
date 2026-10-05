import { randomUUID } from 'node:crypto';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { planReviewSnapshot } from '../../src/types/plans.js';
import { mealLogColumns } from '../db/columns.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let db: PGlite;
let dir: string;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';
let nutriAId = '';
const recipeId = '30000000-0000-4000-a000-0000000000a1';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
async function rpc(user: string, name: string, args: unknown[] = []) {
  const rows = await asUser<{ result: unknown }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args);
  return rows[0].result;
}

const draft = {
  id: recipeId,
  title: 'Ensalada de quinoa',
  yield_portions: 2,
  steps: ['Cocinar la quinoa.', 'Mezclar con vegetales.'],
  nutrient_source: 'Argenfoods',
  items: [{ name: 'Quinoa', quantity: 60, unit: 'g' }, { name: 'Tomate', quantity: 1, unit: 'u' }],
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-recipes-'));
  db = new PGlite(dir);
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant select,insert,delete on storage.objects to authenticated;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(new URL(file, migrations), 'utf8')); }
    catch (error) { console.error(file, JSON.stringify(error)); throw error; }
  }
  for (const [id, email] of [
    [nutriA, 'nutri-a@example.test'],
    [nutriB, 'nutri-b@example.test'],
    [patientAUser, 'paciente-a@example.test'],
    [patientBUser, 'paciente-b@example.test'],
  ] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
     values ($1,$2,$3,'Paciente A','waived'),($4,$5,$6,'Paciente B','waived')`,
    [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser],
  );
  await rpc(patientAUser, 'save_patient_intake', [patientA, 1, 'allergies', {
    preferred_name: 'Ana',
    allergies: { state: 'none', items: [] },
    restrictions: { state: 'none', items: [] },
  }]);
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});


describe('cierre funcional: revisiones, privacidad y reintentos persistentes', () => {
  let recipe: any; let plan: any;
  const title = 'Arroz con vegetales publicado';
  const recipeDraft = { ...draft, title, expected_revision: null };
  const planId = randomUUID();
  const menu = { id: planId, expected_revision: null, period_start: '2026-10-04', period_end: '2026-10-04', timezone: 'America/Argentina/Buenos_Aires', items: [{ for_date: '2026-10-04', slot: 'Almuerzo', recipe_id: recipeId, recipe_version: 1, portions: 1, public_note: 'Indicación publicada' }] };
  it('reintentar un alta devuelve la misma ficha/invitación; otro contenido no sobrescribe y otro rol no crea',async()=>{
    const input={name:'Paciente de alta',email:'alta@example.test',goal:'Organizar comidas'};
    const first=await rpc(nutriA,'create_patient_with_invite',[input]) as any;
    const retry=await rpc(nutriA,'create_patient_with_invite',[input]) as any;
    expect(retry.patient_id).toBe(first.patient_id);expect(retry.invite.id).toBe(first.invite.id);expect(retry.duplicate).toBe(true);
    expect((await db.query<{n:number}>('select count(*)::int as n from public.patient_invite_events where invite_id=$1',[first.invite.id])).rows[0].n).toBe(1);
    await expect(rpc(nutriA,'create_patient_with_invite',[{...input,goal:'Otro contenido'}])).rejects.toMatchObject({code:'PT409'});
    await expect(rpc(patientAUser,'create_patient_with_invite',[input])).rejects.toMatchObject({code:'42501'});
    const other=await rpc(nutriB,'create_patient_with_invite',[input]) as any;expect(other.patient_id).not.toBe(first.patient_id);
  });
  it('si falla crear la invitación, se revierte también la ficha y se permite recuperar el alta',async()=>{
    await db.exec("create function public.fail_trial_invite() returns trigger language plpgsql as $$ begin if new.email='fallo@example.test' then raise exception 'fallo de prueba'; end if; return new; end $$; create trigger fail_trial_invite before insert on public.patient_invites for each row execute function public.fail_trial_invite();");
    const input={name:'Alta con falla',email:'fallo@example.test',goal:'Organizar comidas'};
    try {await expect(rpc(nutriA,'create_patient_with_invite',[input])).rejects.toThrow();expect((await db.query<{n:number}>("select count(*)::int as n from public.patients where full_name='Alta con falla'")).rows[0].n).toBe(0);}
    finally {await db.exec('drop trigger fail_trial_invite on public.patient_invites;drop function public.fail_trial_invite();');}
    expect((await rpc(nutriA,'create_patient_with_invite',[input]) as any).duplicate).toBe(false);
  });
  it('recupera el alta después de aceptar, revocar o vencer su enlace, sin crear otra ficha',async()=>{
    const input={name:'Alta recuperada',email:'recuperada@example.test',goal:'Organizar comidas'};
    const first=await rpc(nutriA,'create_patient_with_invite',[input]) as any;
    const user=randomUUID();
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[user,input.email]);
    await db.query("update public.patient_invites set status='pending',expires_at=now()+interval '1 day' where id=$1",[first.invite.id]);
    expect(await rpc(user,'accept_patient_invite',[first.invite.id])).toBe(first.patient_id);
    for(const status of ['accepted','revoked','expired']){
      await db.query('update public.patient_invites set status=$1 where id=$2',[status,first.invite.id]);
      const retry=await rpc(nutriA,'create_patient_with_invite',[input]) as any;
      expect(retry.patient_id).toBe(first.patient_id);expect(retry.invite.id).toBe(first.invite.id);expect(retry.invite.status).toBe(status);expect(retry.duplicate).toBe(true);
    }
    expect((await db.query<{n:number}>("select count(*)::int as n from public.patients where full_name='Alta recuperada'")).rows[0].n).toBe(1);
  });
  it('rechaza la segunda escritura de un editor desactualizado, incluso en la primera versión', async () => {
    recipe = await rpc(nutriA,'save_recipe_draft',[recipeDraft]);
    const first = recipe.current.revision;
    recipe = await rpc(nutriA,'save_recipe_draft',[{ ...recipeDraft, expected_revision: first, yield_portions: 3 }]);
    await expect(rpc(nutriA,'save_recipe_draft',[{ ...recipeDraft, expected_revision: first, title: 'Edición vieja' }])).rejects.toMatchObject({code:'PT409'});
    await expect(rpc(nutriA,'publish_recipe',[recipeId,1,first])).rejects.toMatchObject({code:'PT409'});
    expect((await rpc(nutriA,'list_professional_recipes') as any[])[0].title).toBe(title);
    recipe = await rpc(nutriA,'publish_recipe',[recipeId,1,recipe.current.revision]);
    await rpc(nutriA,'assign_recipe',[recipeId,patientA,1]);
  });
  it('un título privado no cambia receta asignada, día, búsqueda, favorito ni detalle del plan', async () => {
    plan = await rpc(nutriA,'save_meal_plan_draft',[patientA,menu]);
    const old = plan.current.revision;
    plan = await rpc(nutriA,'save_meal_plan_draft',[patientA,{ ...menu, expected_revision: old, items:[{...menu.items[0], public_note:'Nota revisada'}] }]);
    await expect(rpc(nutriA,'save_meal_plan_draft',[patientA,{ ...menu, expected_revision: old }])).rejects.toMatchObject({code:'PT409'});
    await rpc(nutriA,'publish_reviewed_meal_plan',[planId,1,planReviewSnapshot(plan.current)]);
    const day = await rpc(nutriA,'assign_recipe_day',[{recipe_id:recipeId,patient_id:patientA,expected_version:1,for_date:'2026-10-04',slot:'Almuerzo'}]) as any;
    await rpc(nutriA,'save_recipe_draft',[{ ...recipeDraft, expected_revision: recipe.current.revision, title:'Título exclusivo del borrador' }]);
    expect((await rpc(patientAUser,'list_assigned_recipes',[patientA]) as any[])[0].title).toBe(title);
    expect((await rpc(patientAUser,'get_patient_library',[patientA,'Arroz']) as any).hits.some((hit:any)=>hit.title===title)).toBe(true);
    const favorites=await rpc(patientAUser,'toggle_favorite',[patientA,'recipe',recipeId]) as any;
    expect(favorites.favorites[0].title).toBe(title);
    const published=await rpc(patientAUser,'list_published_meal_plan',[patientA]) as any;
    expect(published.items[0].recipe_title).toBe(title);
    expect(published.items[0].recipe.title).toBe(title);
    const registration=await rpc(patientAUser,'register_recipe_day',[{patient_id:patientA,assignment_id:day.id,client_id:randomUUID()}]) as any;
    expect(registration.assignment.title).toBe(title);
    const meal=await db.query<{description:string}>('select description from public.meal_logs where id=$1',[registration.assignment.registered_meal_id]);
    expect(meal.rows[0].description).toBe(title);
    plan=await rpc(nutriA,'list_professional_meal_plan',[patientA]);
    await rpc(nutriA,'save_meal_plan_draft',[patientA,{ ...menu,expected_revision:plan.current.revision,items:[{ ...menu.items[0],public_note:'Nota privada nueva'}]}]);
    expect((await rpc(patientAUser,'list_published_meal_plan',[patientA]) as any).items[0].public_note).toBe('Nota revisada');
  });
  it('no permite saltar las revisiones escribiendo tablas o la ficha visual directamente',async()=>{
    await expect(asUser(nutriA,'update public.recipes set title=$1 where id=$2',['Atajo',recipeId])).rejects.toMatchObject({code:'42501'});
    await expect(asUser(nutriA,'update public.meal_plan_items set public_note=$1',['Atajo'])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(nutriA,'publish_meal_plan',[planId,2])).rejects.toMatchObject({code:'42501'});
    await expect(asUser(nutriA,"update public.ingredients set name='Maní'")).rejects.toMatchObject({code:'42501'});
    await expect(rpc(nutriA,'set_recipe_card',[recipe.current.id,{}])).rejects.toMatchObject({code:'42501'});
  });
  it('un pago o aviso repetido se guarda una vez y reutilizar su UUID con otro importe informa conflicto',async()=>{
    const cid=randomUUID();const input=[patientA,2500,'2026-10-04','transferencia','Pago ficticio',cid];
    const first=await rpc(nutriA,'record_patient_payment',input) as any;
    const second=await rpc(nutriA,'record_patient_payment',input) as any;
    expect(second.payments).toEqual(first.payments);
    await expect(rpc(nutriA,'record_patient_payment',[patientA,999,'2026-10-04','transferencia','Pago ficticio',cid])).rejects.toMatchObject({code:'PT409'});
    const report=[patientA,1000,'2026-10-04','transferencia','Aviso ficticio',randomUUID()];
    const reported=await rpc(patientAUser,'report_patient_payment',report) as any;
    expect((await rpc(patientAUser,'report_patient_payment',report) as any).payments).toEqual(reported.payments);
    await expect(rpc(patientBUser,'report_patient_payment',report)).rejects.toMatchObject({code:'42501'});
  });
  it('una actividad repetida se guarda una vez, conserva sus datos y rechaza otro consultorio',async()=>{
    const input=[patientA,'Caminata',30,'suave','Prueba',null,null,null,randomUUID()];
    const first=await rpc(patientAUser,'log_patient_activity',input) as any;
    expect((await rpc(patientAUser,'log_patient_activity',input) as any).activities).toEqual(first.activities);
    await expect(rpc(patientAUser,'log_patient_activity',[patientA,'Caminata',40,...input.slice(3)])).rejects.toMatchObject({code:'PT409'});
    await expect(rpc(patientBUser,'log_patient_activity',input)).rejects.toMatchObject({code:'42501'});
    expect((await rpc(nutriA,'get_patient_exercise',[patientA]) as any).activities[0].duration_minutes).toBe(30);
  });
  it('la IA captura su versión al solicitarla; una edición posterior impide aplicarla',async()=>{
    const consent=CONSENT_CATALOG.find(c=>c.purpose==='ai_menu_draft')!;
    await rpc(patientAUser,'record_patient_consent',[patientA,consent.purpose,consent.text_version,consent.text_hash,'granted']);
    const hash='a'.repeat(64);
    const queued=await rpc(nutriA,'enqueue_ai_job',[{patient_id:patientA,job_type:'menu_draft',prompt_version:'menu_draft.v2',context_hash:hash,model:'demo',estimated_tokens:100,request:{period_start:'2026-10-04',period_end:'2026-10-04',slots:['Almuerzo']}}]) as any;
    const claimed=await rpc(nutriA,'claim_ai_job',[queued.id]) as any;
    const finished=await rpc(nutriA,'finish_ai_job',[{id:queued.id,run_token:claimed.run_token,status:'succeeded',current_context_hash:hash,artifact:{kind:'menu_draft',payload:{...menu,id:randomUUID(),expected_revision:randomUUID()}}}]) as any;
    expect(finished.artifact.payload.id).toBe(planId);
    expect(finished.artifact.payload.expected_revision).toBe(queued.request._write_base.revision);
    const current=await rpc(nutriA,'list_professional_meal_plan',[patientA]) as any;
    await rpc(nutriA,'save_meal_plan_draft',[patientA,{...menu,expected_revision:current.current.revision}]);
    await expect(rpc(nutriA,'apply_ai_job',[queued.id])).rejects.toMatchObject({code:'PT409'});
  });
  it('el nombre canónico de un ingrediente publicado no cambia por otro borrador',async()=>{
    const before=(await rpc(patientAUser,'list_assigned_recipes',[patientA]) as any[])[0].ingredients;
    const current=(await rpc(nutriA,'list_professional_recipes') as any[]).find(r=>r.id===recipeId);
    await rpc(nutriA,'save_recipe_draft',[{...recipeDraft,expected_revision:current.current.revision,items:[{name:'QUINOA',quantity:80,unit:'g'}]}]);
    const after=(await rpc(patientAUser,'list_assigned_recipes',[patientA]) as any[])[0].ingredients;
    expect(after).toEqual(before);
  });
  it.each([undefined,''])('finalizar IA con estado omitido o vacío conserva la base privada (%s)',async(status)=>{
    const hash='b'.repeat(64);
    const queued=await rpc(nutriA,'enqueue_ai_job',[{patient_id:patientA,job_type:'menu_draft',prompt_version:'menu_draft.v2',context_hash:hash,model:'demo',estimated_tokens:100,request:{period_start:'2026-10-04',period_end:'2026-10-04',slots:['Almuerzo']}}]) as any;
    const claimed=await rpc(nutriA,'claim_ai_job',[queued.id]) as any;
    const finished=await rpc(nutriA,'finish_ai_job',[{id:queued.id,run_token:claimed.run_token,...(status===undefined?{}:{status}),current_context_hash:hash,artifact:{kind:'menu_draft',payload:{...menu,id:randomUUID(),expected_revision:randomUUID()}}}]) as any;
    expect(finished.artifact.payload.id).toBe(planId);
    expect(finished.artifact.payload.expected_revision).toBe(queued.request._write_base.revision);
    const current=await rpc(nutriA,'list_professional_meal_plan',[patientA]) as any;
    await rpc(nutriA,'save_meal_plan_draft',[patientA,{...menu,expected_revision:current.current.revision}]);
    await expect(rpc(nutriA,'apply_ai_job',[queued.id])).rejects.toMatchObject({code:'PT409'});
  });
  it('registrar una receta estimada conserva procedencia al revisar y releer',async()=>{
    const rid=randomUUID();const per_portion={kcal:300,protein_g:20,carbs_g:35,fat_g:8};
    const created=await rpc(nutriA,'save_recipe_draft',[{...recipeDraft,id:rid,title:'Receta estimada',nutrition:{origin:'ai_estimate',source:'estimacion_ia.v2',per_portion},card:{category:'Almuerzo',prep_minutes:null,macro_status:'declared',macros:per_portion,cover_status:'none',cover_alt:'Receta estimada',cover_url:null}}]) as any;
    await rpc(nutriA,'publish_recipe',[rid,1,created.current.revision]);
    const day=await rpc(nutriA,'assign_recipe_day',[{recipe_id:rid,patient_id:patientA,expected_version:1,for_date:'2026-10-05',slot:'Almuerzo'}]) as any;
    expect(day.nutrition.origin).toBe('ai_estimate');
    const registered=await rpc(patientAUser,'register_recipe_day',[{patient_id:patientA,assignment_id:day.id,client_id:randomUUID()}]) as any;
    await rpc(nutriA,'review_meal_log',[{meal_id:registered.assignment.registered_meal_id,status:'confirmed'}]);
    const stored=(await db.query<{nutrition_origin:string;note_for_nutri:string}>('select nutrition_origin,note_for_nutri from public.meal_logs where id=$1',[registered.assignment.registered_meal_id])).rows[0];
    expect(stored.nutrition_origin).toBe('ai_estimate');expect(stored.note_for_nutri).toContain('estimados por IA');expect(stored.note_for_nutri).not.toContain('no estimados');
    const mid=registered.assignment.registered_meal_id;
    expect((await asUser(patientAUser,`select ${mealLogColumns.patient} from public.meal_logs_patient_view where id=$1`,[mid]))[0]).toMatchObject({nutrition_origin:'ai_estimate'});
    expect((await asUser(nutriA,`select ${mealLogColumns.professional} from public.meal_logs where id=$1`,[mid]))[0]).toMatchObject({nutrition_origin:'ai_estimate'});
    await expect(asUser(nutriA,"update public.meal_logs set nutrition_origin='declared' where id=$1",[mid])).rejects.toMatchObject({code:'42501'});
    await expect(asUser(patientAUser,"insert into public.meal_logs(patient_id,slot_label,description,nutrition_origin) values($1,'Almuerzo','Inventada','declared')",[patientA])).rejects.toMatchObject({code:'42501'});
    expect((await rpc(patientAUser,'list_recipe_days',[patientA,'2026-10-05']) as any[])[0].nutrition.origin).toBe('ai_estimate');
  });
  it.each(['confirmed','pending_review'] as const)('un análisis tardío no inventa procedencia sobre un registro %s ya analizado',async(status)=>{
    const mid=randomUUID();const macros={kcal:200,protein_g:10,carbs_g:35,fat_g:3};
    await db.query("insert into public.meal_logs(id,patient_id,slot_label,description,status,analysis_status,macros,note_for_nutri) values($1,$2,'Almuerzo','Histórica',$3,'succeeded',$4,'Nota privada histórica')",[mid,patientA,status,macros]);
    for(const resultStatus of ['failed','succeeded']) {
      const result=await rpc(patientAUser,'record_meal_analysis',[{meal_id:mid,status:resultStatus,foods:[],macros:resultStatus==='succeeded'?macros:null,confidence:0}]) as any;
      expect(result.nutrition_origin).toBeNull();expect(result).not.toHaveProperty('note_for_nutri');
      expect((await db.query<{nutrition_origin:null}>('select nutrition_origin from public.meal_logs where id=$1',[mid])).rows[0].nutrition_origin).toBeNull();
    }
  });
  it('los RPC repetidos de diario no revelan una nota profesional y un nuevo análisis aceptado conserva su procedencia',async()=>{
    const payload={patient_id:patientA,client_id:randomUUID(),slot:'Almuerzo',description:'Comida de prueba'};
    const saved=await rpc(patientAUser,'save_meal_log',[payload]) as any;
    const analyzed=await rpc(patientAUser,'record_meal_analysis',[{meal_id:saved.log.id,status:'succeeded',foods:[],macros:{kcal:200,protein_g:10,carbs_g:35,fat_g:3},confidence:0.5,note_for_nutri:'Estimación privada'}]) as any;
    expect(analyzed.nutrition_origin).toBe('ai_estimate');expect(analyzed).not.toHaveProperty('note_for_nutri');
    await rpc(nutriA,'review_meal_log',[{meal_id:saved.log.id,status:'confirmed'}]);
    const duplicate=await rpc(patientAUser,'save_meal_log',[payload]) as any;
    expect(duplicate.duplicate).toBe(true);expect(duplicate.log).not.toHaveProperty('note_for_nutri');expect(duplicate.log.nutrition_origin).toBe('ai_estimate');
    const reread=await rpc(nutriA,'record_meal_analysis',[{meal_id:saved.log.id,status:'failed',foods:[],macros:null,confidence:0}]) as any;
    expect(reread.note_for_nutri).toBe('Estimación privada');expect(reread.nutrition_origin).toBe('ai_estimate');
  });
  it('lo publicado y los registros sobreviven al cierre y reapertura de la base',async()=>{
    await db.close();db=new PGlite(dir);
    expect((await rpc(patientAUser,'list_published_meal_plan',[patientA]) as any).items[0].recipe.title).toBe(title);
    expect((await rpc(patientAUser,'get_patient_exercise',[patientA]) as any).activities).toHaveLength(1);
    expect((await rpc(nutriA,'get_patient_ledger',[patientA]) as any).payments).toHaveLength(2);
  });
});
