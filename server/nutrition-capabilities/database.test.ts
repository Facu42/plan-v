import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { calculateTarget, defaultsForGoal } from '../../src/lib/nutrition-target.js';
import { defaultNutritionSettings } from '../../src/types/nutrition-capabilities.js';
import { planReviewSnapshot,type PlanVersionView } from '../../src/types/plans.js';
let db:PGlite, ownerId:string, otherOwnerId:string;
const owner='00000000-0000-4000-a000-000000000091', other='00000000-0000-4000-a000-000000000092', patientUser='00000000-0000-4000-a000-000000000093', patient='10000000-0000-4000-a000-000000000091';
const food='f0000000-0000-4000-a000-000000000091', otherFood='f0000000-0000-4000-a000-000000000092', group='e0000000-0000-4000-a000-000000000091';
const input={sex:'femenino' as const,age:35,weight_kg:70,height_cm:165,activity:'moderada' as const,...defaultsForGoal('mantener')};
async function asUser<T>(user:string,sql:string,args:unknown[]=[]) {return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return (await tx.query<T>(sql,args)).rows;});}
const rpc=async<T>(user:string,name:string,args:unknown[])=> (await asUser<{result:T}>(user,`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as result`,args))[0].result;
beforeAll(async()=>{
  db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;grant usage on schema public,auth,storage to anon,authenticated,service_role;alter default privileges in schema public grant all on functions to anon,authenticated,service_role;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const directory=new URL('../../supabase/migrations/',import.meta.url);for(const file of (await readdir(directory)).filter(file=>file.endsWith('.sql')&&file<'20261011180000_nutrition_capabilities.sql').sort())await db.exec(await readFile(new URL(file,directory),'utf8'));
  await db.exec(await readFile(new URL('20261011180000_nutrition_capabilities.sql',directory),'utf8'));
  for(const [id,email] of [[owner,'owner@example.test'],[other,'other@example.test'],[patientUser,'patient@example.test']])await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);
  ownerId=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Primera profesional') as id",[owner])).rows[0].id;otherOwnerId=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Otra profesional') as id",[other])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente ficticia','waived')",[patient,ownerId,patientUser]);
  await rpc(patientUser,'save_patient_intake',[patient,1,'allergies',{preferred_name:'Paciente ficticia',allergies:{state:'none',items:[]},restrictions:{state:'none',items:[]}}]);
},60000);
afterAll(async()=>{await db?.close();});
describe('Persistencia y permisos nutricionales A/B',()=>{
  it('guarda referencias y marca por profesional, con versión y sin acceso ajeno',async()=>{
    const settings={...defaultNutritionSettings(),approvals:[{formula:'harris',citation:'Roza y Shizgal 1984',url:'https://pubmed.ncbi.nlm.nih.gov/6741850/'}],brand:{name:'Consultorio propio',contact:'Contacto propio',logo:''}};
    expect(await rpc(owner,'save_nutrition_settings',[0,settings])).toMatchObject({revision:1,settings});
    expect(await asUser(other,'select * from public.nutrition_settings')).toEqual([]);expect(await asUser(patientUser,'select * from public.nutrition_settings')).toEqual([]);
    await expect(rpc(owner,'save_nutrition_settings',[0,settings])).rejects.toMatchObject({code:'PT409'});
    await expect(rpc(patientUser,'save_nutrition_settings',[0,settings])).rejects.toMatchObject({code:'42501'});
  });
  it('guarda la fórmula aprobada y recalcula en base sin confiar cifras del cliente',async()=>{
    const actual={...input,formula:'harris' as const};const calculated=calculateTarget(actual);
    const workspace=await rpc<{target:{result:unknown}}>(owner,'save_nutrition_target_versioned',[patient,actual,{...calculated,kcal:5000},true,0]);expect(workspace.target.result).toEqual(calculated);
    await expect(rpc(other,'save_nutrition_target_versioned',[patient,actual,calculated,true,1])).rejects.toMatchObject({code:'42501'});
    const unapproved={...input,formula:'fao' as const};await expect(rpc(owner,'save_nutrition_target_versioned',[patient,unapproved,calculateTarget(unapproved),true,1])).rejects.toMatchObject({code:'22023'});
  });
  it('grupos congelan sólo alimentos del consultorio permitido',async()=>{
    const payload={name:'Manzana',brand:'',category:'Frutas',kind:'food',source:'Etiqueta',reference:'Revisada',nutrients:{kcal:50,protein:0,carbs:12,fat:0,fiber:null,sodium:null,calcium:null,iron:null,potassium:null,magnesium:null,vitamin_c:null},portions:[]};
    await rpc(owner,'save_food_catalog_item',[food,0,payload]);await rpc(other,'save_food_catalog_item',[otherFood,0,{...payload,name:'Banana ajena'}]);
    const request={id:group,expected_revision:0,name:'Frutas',reference:'Porciones del consultorio',reviewed:true,items:[{food_id:food,food_revision:1,grams:100},{food_id:otherFood,food_revision:1,grams:100}]};
    await expect(rpc(owner,'save_nutrition_exchange',[request])).rejects.toMatchObject({code:'42501'});
    const second='f0000000-0000-4000-a000-000000000093';await rpc(owner,'save_food_catalog_item',[second,0,{...payload,name:'Banana propia'}]);
    const saved=await rpc<{items:Array<{food:{name:string}}>}>(owner,'save_nutrition_exchange',[{...request,items:[request.items[0],{food_id:second,food_revision:1,grams:150}]}]);expect(saved.items[1].food.name).toBe('Banana propia');
    expect(await asUser(other,'select * from public.nutrition_exchanges')).toEqual([]);expect(await asUser(patientUser,'select * from public.nutrition_exchanges')).toEqual([]);
    await expect(asUser(owner,'insert into public.nutrition_exchanges(id,owner_id,payload) values($1,$2,$3)',[group,otherOwnerId,{}])).rejects.toMatchObject({code:'42501'});
  });
  it('nombres de momentos se publican y quedan inmutables por versión',async()=>{
    const planId='40000000-0000-4000-a000-000000000091';
    const request={id:planId,expected_revision:null,period_start:'2026-10-01',period_end:'2026-10-01',timezone:'America/Argentina/Buenos_Aires',meal_labels:{Desayuno:'Primera comida'},items:[{for_date:'2026-10-01',slot:'Desayuno',free_text:'Indicación revisada',public_note:''}]};
    const saved=await rpc<{current:PlanVersionView}>(owner,'save_meal_plan_draft',[patient,request]);expect(saved.current.meal_labels).toEqual(request.meal_labels);
    await rpc(owner,'publish_reviewed_meal_plan',[planId,1,planReviewSnapshot(saved.current)]);
    expect(await rpc(patientUser,'list_published_meal_plan',[patient])).toMatchObject({meal_labels:request.meal_labels});
    await expect(db.query("update public.meal_plan_versions set meal_labels='{}' where id=$1",[saved.current.id])).rejects.toMatchObject({code:'22023'});
    const next=await rpc<{current:PlanVersionView}>(owner,'save_meal_plan_draft',[patient,{...request,expected_revision:saved.current.revision,meal_labels:undefined}]);expect(next.current.meal_labels).toEqual(request.meal_labels);
    await expect(rpc(owner,'save_meal_plan_draft',[patient,{...request,expected_revision:next.current.revision,meal_labels:{Desayuno:'Almuerzo'}}])).rejects.toMatchObject({code:'22023'});
  });
  it('búsqueda posterior a cinco mil alimentos mantiene total y aislamiento',async()=>{
    const nutrients={kcal:50,protein:null,carbs:null,fat:null,fiber:null,sodium:null,calcium:null,iron:null,potassium:null,magnesium:null,vitamin_c:null};
    await db.query("insert into public.food_catalog(id,owner_id,payload) select gen_random_uuid(),$1,jsonb_build_object('name','Avena '||n,'brand','','category','Cereales','kind','food','source','Fuente ficticia','reference','','nutrients',$2::jsonb,'portions','[]'::jsonb) from generate_series(1,5100) n",[ownerId,nutrients]);
    const result=await rpc<{total:number;foods:unknown[]}>(owner,'search_food_catalog',[{q:'Avena',kind:'food',scope:'own',order:'name-asc'},101,50]);expect(result.total).toBe(5100);expect(result.foods).toHaveLength(50);
    expect(await rpc(other,'search_food_catalog',[{q:'Avena'},0,50])).toMatchObject({total:0,foods:[]});
    await expect(rpc(patientUser,'search_food_catalog',[{},0,50])).rejects.toMatchObject({code:'42501'});
  });
});
