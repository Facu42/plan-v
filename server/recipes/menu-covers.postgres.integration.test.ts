import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest';
import { productFixtureArgs } from '../testing/product-rpc-fixture';
import { planReviewSnapshot } from '../../src/types/plans.js';
import { unavailableCard } from '../../src/types/recipe-plate.js';
import { CONSENT_CATALOG } from '../intake/consent.js';

let db: PGlite, nid: string, rid: string, vid: string;
const owner='00000000-0000-4000-a000-000000000081',other='00000000-0000-4000-a000-000000000082',patientUser='00000000-0000-4000-a000-000000000083',patient='10000000-0000-4000-a000-000000000081',pid='20000000-0000-4000-a000-000000000081';
const inline={title:'Ensalada de tomate',yield_portions:1,steps:['Cortar el tomate y servir.'],ingredients:[{name:'Tomate',quantity:150,unit:'g'}],nutrition:null};
async function rpc(user:string,name:string,args:unknown[]=[]) {
  args=await productFixtureArgs(db,name,args);
  return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return(await tx.query<{result:any}>(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as result`,args)).rows[0].result;});
}
async function worker(name:string,args:unknown[]=[]) {
  return db.transaction(async tx=>{await tx.exec('set local role service_role');return(await tx.query<{result:any}>(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as result`,args)).rows[0].result;});
}
async function draft(withInline=false) {
  return rpc(owner,'save_meal_plan_draft',[patient,{id:pid,period_start:'2026-10-06',period_end:'2026-10-07',items:[
    ...['2026-10-06','2026-10-07'].map(for_date=>({for_date,slot:'Almuerzo',recipe_id:rid,recipe_version:1,portions:1,public_note:'Indicación pública ficticia que no debe salir al proveedor'})),
    ...(withInline?['2026-10-06','2026-10-07'].map(for_date=>({for_date,slot:'Cena',free_text:inline.title,recipe_proposal:inline,portions:1,public_note:''})):[]),
  ]}]);
}
async function publish(withInline=false) { const saved=await draft(withInline);return rpc(owner,'publish_reviewed_meal_plan',[pid,saved.current.version,planReviewSnapshot(saved.current)]); }
async function objectUrl(job:any) {const path=`${nid}/${job.recipe_version_id??job.id}/${randomUUID()}.jpg`;await db.query("insert into storage.objects(bucket_id,name) values('recipe-covers',$1)",[path]);return `https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/${path}`;}
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
    grant usage on schema public,auth,storage to authenticated,anon,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const root=new URL('../../supabase/migrations/',import.meta.url);for(const file of(await readdir(root)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,root),'utf8'));
  for(const user of[owner,other,patientUser])await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[user,user+'@example.test']);
  nid=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri ficticia') as id",[owner])).rows[0].id;
  await db.query("select public.provision_nutritionist($1,'Otra nutri')",[other]);
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente ficticia','waived')",[patient,nid,patientUser]);
  await rpc(patientUser,'save_patient_intake',[patient,1,'allergies',{preferred_name:'Ficticia',allergies:{state:'none',items:[]},restrictions:{state:'none',items:[]}}]);
  const c=CONSENT_CATALOG.find(c=>c.purpose==='ai_menu_draft')!;await rpc(patientUser,'record_patient_consent',[patient,c.purpose,c.text_version,c.text_hash,'granted']);
},60000);
beforeEach(async()=>{
  await db.exec('delete from public.menu_dish_covers');rid=randomUUID();
  await rpc(owner,'save_recipe_draft',[{id:rid,title:'Arroz con tomate',yield_portions:1,steps:['Cocinar el arroz y añadir tomate.'],nutrient_source:'',items:[{name:'Arroz',quantity:80,unit:'g'},{name:'Tomate',quantity:100,unit:'g'}],card:unavailableCard('Arroz con tomate')}]);
  vid=(await rpc(owner,'publish_recipe',[rid,1])).published.id;
});
afterAll(async()=>{await db?.close();});
describe('cola SQL durable de fotos de menús aprobados',()=>{
  it('el borrador no genera; publicación repetida agrupa recetas e inline sin incluir datos privados',async()=>{
    const saved=await draft(true);expect((await db.query('select * from public.menu_dish_covers')).rows).toHaveLength(0);
    let plan=await rpc(owner,'publish_reviewed_meal_plan',[pid,saved.current.version,planReviewSnapshot(saved.current)]);
    await rpc(owner,'publish_reviewed_meal_plan',[pid,plan.current.version,planReviewSnapshot(plan.current)]);
    const rows=(await db.query<{context:any}>('select * from public.menu_dish_covers')).rows;expect(rows).toHaveLength(2);
    for(const row of rows)expect(Object.keys(row.context).sort()).toEqual(['ingredients','steps','title']);
    expect(JSON.stringify(rows)).not.toContain('Indicación pública');expect(JSON.stringify(rows)).not.toContain(patient);
  });
  it('sólo el worker puede tomar/finalizar y sólo la dueña puede solicitar reintentos',async()=>{
    const saved=await publish();
    for(const actor of[owner,other,patientUser,''])await expect(rpc(actor,'lease_menu_dish_cover')).rejects.toMatchObject({code:'42501'});
    await expect(rpc(other,'retry_menu_dish_covers',[pid,saved.current.version])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(patientUser,'retry_menu_dish_covers',[pid,saved.current.version])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(owner,'retry_menu_dish_covers',[pid,saved.current.version+1])).rejects.toMatchObject({code:'PT409'});
    const view=await rpc(patientUser,'list_published_meal_plan',[patient]);expect(view.items[0].dish_card.cover_generation).toBe('queued');
    for(const role of['anon','authenticated'])expect((await db.query<{allowed:boolean}>("select has_table_privilege($1,'public.menu_dish_covers','select') as allowed",[role])).rows[0].allowed).toBe(false);
  });
  it('lease exclusivo, finalización protegida y foto persistente idéntica desde ambos roles',async()=>{
    await publish(true);const job=await worker('lease_menu_dish_cover');const second=await worker('lease_menu_dish_cover');expect(second.id).not.toBe(job.id);
    expect(await worker('lease_menu_dish_cover')).toBeNull();const url=await objectUrl(job);
    await expect(worker('finish_menu_dish_cover',[job.id,randomUUID(),url,'Ilustración IA',60])).rejects.toMatchObject({code:'PT409'});
    await worker('finish_menu_dish_cover',[job.id,job.run_token,url,'Ilustración IA',60]);
    const visible=await rpc(patientUser,'list_published_meal_plan',[patient]),pro=await rpc(owner,'list_professional_meal_plan',[patient]);
    expect(visible.items).toEqual(pro.published.items);expect(visible.items.some((i:any)=>i.dish_card.cover_url===url)).toBe(true);
    await expect(worker('finish_menu_dish_cover',[job.id,job.run_token,url,'Ilustración IA',60])).rejects.toMatchObject({code:'PT409'});
  });
  it('fallos y cuota agotada conservan el menú y esperan; reintento explícito tras tres fallos',async()=>{
    const published=await publish();
    for(let i=0;i<3;i++){const job=await worker('lease_menu_dish_cover');await worker('finish_menu_dish_cover',[job.id,job.run_token,null,'Arroz',86400]);expect(await worker('lease_menu_dish_cover')).toBeNull();await db.exec("update public.menu_dish_covers set run_after=clock_timestamp()-interval '1 second'");}
    expect((await db.query<{status:string}>('select status from public.menu_dish_covers')).rows[0].status).toBe('failed');
    expect((await rpc(patientUser,'list_published_meal_plan',[patient])).version).toBe(published.current.version);
    await rpc(owner,'retry_menu_dish_covers',[pid,published.current.version]);expect(await worker('lease_menu_dish_cover')).not.toBeNull();
  });
  it('una foto manual cargada durante la generación gana y nunca se sobrescribe',async()=>{
    await publish();const job=await worker('lease_menu_dish_cover'),manual=await objectUrl(job),generated=await objectUrl(job);
    await rpc(owner,'save_manual_recipe_cover',[rid,1,null,manual]);const done=await worker('finish_menu_dish_cover',[job.id,job.run_token,generated,'IA',60]);
    expect(done.cover_url).toBe(manual);expect((await rpc(patientUser,'list_published_meal_plan',[patient])).items[0].recipe.card.cover_url).toBe(manual);
  });
  it('recupera la última reserva vencida como fallo y valida el objeto almacenado',async()=>{
    const published=await publish();const job=await worker('lease_menu_dish_cover');
    await expect(worker('finish_menu_dish_cover',[job.id,job.run_token,'https://example.test/photo.jpg','IA',60])).rejects.toMatchObject({code:'22023'});
    await db.exec("update public.menu_dish_covers set attempts=3,lease_until=clock_timestamp()-interval '1 second'");
    await db.exec("update public.recipe_cover_requests set claimed_at=clock_timestamp()-interval '4 minutes' where finished_at is null");
    expect(await worker('lease_menu_dish_cover')).toBeNull();expect((await rpc(patientUser,'list_published_meal_plan',[patient])).items[0].dish_card.cover_generation).toBe('failed');
    await rpc(owner,'retry_menu_dish_covers',[pid,published.current.version]);expect(await worker('lease_menu_dish_cover')).not.toBeNull();
  });
});
