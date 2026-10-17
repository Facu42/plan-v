import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir } from 'node:fs/promises';
import { afterAll,beforeAll,expect,it } from 'vitest';
import { sara2Foods } from './sara2.js';
import { calculateRecipeCatalog } from '../../src/types/recipe-catalog-nutrition.js';
import { planReviewSnapshot,type PlanVersionView } from '../../src/types/plans.js';
const a='00000000-0000-4000-a000-000000000091',b='00000000-0000-4000-a000-000000000092',patientUser='00000000-0000-4000-a000-000000000093';
let db:PGlite;let owner:string;const migration=new URL('../../supabase/migrations/20261014180000_sara2_catalog.sql',import.meta.url);
const patient='10000000-0000-4000-a000-000000000091';
async function rpc<T>(user:string,name:string,args:unknown[]){return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return(await tx.query<{result:T}>(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as result`,args)).rows[0].result;});}
beforeAll(async()=>{
  db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;grant usage on schema public,auth,storage to anon,authenticated,service_role;alter default privileges in schema public grant all on functions to anon,authenticated,service_role;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const dir=new URL('../../supabase/migrations/',import.meta.url);for(const file of(await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<'20261014180000_sara2_catalog.sql').sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
  await db.exec(await readFile(migration,'utf8'));
  for(const[id,email]of[[a,'a@example.test'],[b,'b@example.test'],[patientUser,'patient@example.test']])await db.query('insert into auth.users(id,email,email_confirmed_at)values($1,$2,now())',[id,email]);
  owner=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Profesional A')as id",[a])).rows[0].id;await db.query("select public.provision_nutritionist($1,'Profesional B')",[b]);
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)values($1,$2,$3,'Paciente ficticia','waived')",[patient,owner,patientUser]);
  await rpc(patientUser,'save_patient_intake',[patient,1,'allergies',{preferred_name:'Paciente ficticia',allergies:{state:'none',items:[]},restrictions:{state:'none',items:[]}}]);
},90000);
afterAll(async()=>{await db?.close();});
it('seed completo de sólo lectura, paginado por dos consultorios sin acceso paciente',async()=>{
  expect((await db.query<{n:number}>('select count(*)::int n from public.food_catalog where owner_id is null')).rows[0].n).toBe(930);
  const page=await rpc<{total:number;foods:unknown[]}>(a,'search_food_catalog',[{source:'SARA 2 · Ministerio de Salud · 2022',kind:'food'},18,50]);expect(page).toMatchObject({total:906});expect(page.foods).toHaveLength(6);
  expect(await rpc(b,'search_food_catalog',[{source:'SARA 2 · Ministerio de Salud · 2022',kind:'supplement'},0,50])).toMatchObject({total:24});
  await expect(rpc(patientUser,'search_food_catalog',[{},0,50])).rejects.toMatchObject({code:'42501'});
  const food=sara2Foods()[0];const{id:_,revision:__,owner_id:___,updated_at:____,...payload}=food;
  await expect(rpc(a,'save_food_catalog_item',[food.id,1,payload])).rejects.toMatchObject({code:'42501'});
  await expect(rpc(a,'save_food_catalog_item',['f0000000-0000-4000-a000-000000000099',0,payload])).rejects.toMatchObject({code:'42501'});
});
it('seed repetido no cambia datos; colisión detectada antes de sobrescribir',async()=>{
  const sql=await readFile(migration,'utf8');const seed=sql.split('-- SARA2_SEED_BEGIN')[1].split('-- SARA2_SEED_END')[0];
  await db.exec(seed);expect((await db.query('select id from public.food_catalog')).rows).toHaveLength(930);
  const id=sara2Foods()[0].id;await db.query("update public.food_catalog set revision=2 where id=$1",[id]);
  await expect(db.exec(seed)).rejects.toMatchObject({code:'23505'});
  expect((await db.query<{revision:number}>('select revision from public.food_catalog where id=$1',[id])).rows[0].revision).toBe(2);
  await db.query('update public.food_catalog set revision=1 where id=$1',[id]);
});
it('receta real en base coincide con aritmética compartida de ml y rechaza conversión implícita',async()=>{
  const food=sara2Foods().find(f=>f.name==='Ensure Plus (mililitro)')!;
  const payload={id:'d0000000-0000-4000-a000-000000000091',expected_revision:null,title:'Receta fuente SARA',yield_portions:2,nutrient_source:'catalogo_alimentos.v1',steps:['Servir.'],items:[{name:'Ensure',quantity:50,unit:'ml',catalog_ref:{id:food.id,revision:1,measure:null}}]};
  const saved=await rpc<{current:{catalog_recipe:ReturnType<typeof calculateRecipeCatalog>;ingredients:Array<{unit:string}>}}>(a,'save_recipe_draft',[payload]);
  const expected=calculateRecipeCatalog(payload,[food]);
  expect(saved.current.catalog_recipe).toMatchObject({totals:expected.totals,per_portion:expected.per_portion,per_100g:null,ingredient_weight_g:null});
  expect(saved.current.catalog_recipe.lines[0]).toMatchObject({grams:null,native_quantity:50,food:{id:food.id,composition:food.composition,nutrients:food.nutrients}});
  expect(saved.current.ingredients[0].unit).toBe('ml');
  await expect(rpc(b,'save_recipe_draft',[payload])).rejects.toMatchObject({code:'42501'});
  await expect(rpc(a,'save_recipe_draft',[{...payload,id:'d0000000-0000-4000-a000-000000000092',items:[{...payload.items[0],unit:'g'}]}])).rejects.toMatchObject({code:'22023'});
});
it('plan publicado congela procedencia y mantiene ml en compras al editar un borrador posterior',async()=>{
  const food=sara2Foods().find(f=>f.name==='Ensure Plus (mililitro)')!,id='40000000-0000-4000-a000-000000000091';
  const payload={id,expected_revision:null,period_start:'2026-10-14',period_end:'2026-10-14',timezone:'America/Argentina/Buenos_Aires',items:[{for_date:'2026-10-14',slot:'Desayuno',public_note:'Revisado',components:[{id:'50000000-0000-4000-a000-000000000091',kind:'food',food_id:food.id,food_revision:1,quantity:50,measure:null,public_note:''}]}]};
  const saved=await rpc<{current:PlanVersionView}>(a,'save_meal_plan_draft',[patient,payload]);
  expect(saved.current.items[0].components![0].food_snapshot?.composition).toEqual(food.composition);
  await rpc(a,'publish_reviewed_meal_plan',[id,1,planReviewSnapshot(saved.current)]);
  await rpc(a,'save_meal_plan_draft',[patient,{...payload,expected_revision:saved.current.revision,items:[{...payload.items[0],components:[{...payload.items[0].components[0],quantity:100}]}]}]);
  const visible=await rpc<{items:Array<{components:Array<{quantity:number;food_snapshot:{composition:unknown}}>}>}>(patientUser,'list_published_meal_plan',[patient]);
  expect(visible.items[0].components[0]).toMatchObject({quantity:50,food_snapshot:{composition:food.composition}});
  expect(await rpc(patientUser,'get_shopping_list',[patient])).toMatchObject({items:[{quantity:50,unit:'ml'}]});
  await expect(rpc(b,'save_meal_plan_draft',[patient,payload])).rejects.toMatchObject({code:'42501'});
});
it('grupo congelado usa cantidad y unidad explícitas, sin peso inventado',async()=>{
  const ml=sara2Foods().find(f=>f.name==='Ensure Plus (mililitro)')!,g=sara2Foods().find(f=>f.name==='Ensure polvo (gramo)')!;
  const request={id:'e0000000-0000-4000-a000-000000000091',expected_revision:0,name:'Suplementos revisados',reference:'Referencia del consultorio',reviewed:true,items:[{food_id:ml.id,food_revision:1,quantity:50,unit:'ml'},{food_id:g.id,food_revision:1,quantity:10,unit:'g'}]};
  const group=await rpc<{items:Array<{grams:number|null;quantity:number;unit:string;food:{composition:unknown}}> }>(a,'save_nutrition_exchange',[request]);
  expect(group.items[0]).toMatchObject({grams:null,quantity:50,unit:'ml',food:{composition:ml.composition}});
  await expect(rpc(a,'save_nutrition_exchange',[{...request,id:'e0000000-0000-4000-a000-000000000092',items:[{food_id:ml.id,food_revision:1,grams:50},request.items[1]]}])).rejects.toMatchObject({code:'22023'});
  await expect(rpc(b,'save_nutrition_exchange',[{...request,expected_revision:1}])).rejects.toMatchObject({code:'42501'});
});
it('mezclar definiciones de carbohidratos en receta no fabrica un total completo',async()=>{
  const food=sara2Foods()[0],legacyId='f0000000-0000-4000-a000-000000000098';const{composition:_,id:__,revision:___,owner_id:____,updated_at:_____,...payload}=food;
  await rpc(a,'save_food_catalog_item',[legacyId,0,{...payload,source:'USDA · totales declarados'}]);
  const saved=await rpc<{current:{catalog_recipe:{totals:{carbs:null;kcal:number};carbohydrates:string}}}>(a,'save_recipe_draft',[{id:'d0000000-0000-4000-a000-000000000095',expected_revision:null,title:'Mezcla revisable',yield_portions:1,steps:['Servir.'],items:[{name:'SARA',quantity:100,unit:'g',catalog_ref:{id:food.id,revision:1,measure:null}},{name:'Otra fuente',quantity:100,unit:'g',catalog_ref:{id:legacyId,revision:1,measure:null}}]}]);
  expect(saved.current.catalog_recipe.carbohydrates).toBe('mixed');expect(saved.current.catalog_recipe.totals.carbs).toBeNull();expect(saved.current.catalog_recipe.totals.kcal).toBeGreaterThan(0);
});
